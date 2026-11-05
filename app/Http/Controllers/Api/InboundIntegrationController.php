<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\FileEntry;
use App\Models\Folder;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class InboundIntegrationController extends Controller
{
    /**
     * Handle incoming webhooks and uploads from WhatsApp and external applications.
     */
    public function handle(Request $request, ?string $token = null): JsonResponse|Response
    {
        $resolvedToken = $this->resolveToken($request, $token);

        if (! $resolvedToken) {
            return response()->json([
                'success' => false,
                'message' => 'Token integrasi tidak ditemukan. Sertakan token di URL, header X-API-Key, atau Bearer token.',
            ], 401);
        }

        $user = User::where('webhook_token', $resolvedToken)->first();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Token integrasi tidak valid atau sudah kedaluwarsa.',
            ], 401);
        }

        // Meta WhatsApp Cloud API Webhook Verification Handshake
        if ($request->isMethod('GET')) {
            $hubMode = $request->input('hub_mode') ?: $request->input('hub.mode');
            $hubVerifyToken = $request->input('hub_verify_token') ?: $request->input('hub.verify_token');
            $hubChallenge = $request->input('hub_challenge') ?: $request->input('hub.challenge');

            if ($hubMode === 'subscribe' && $hubChallenge) {
                if ($hubVerifyToken === $resolvedToken || empty($hubVerifyToken)) {
                    return response($hubChallenge, 200, ['Content-Type' => 'text/plain']);
                }

                return response('Verify token mismatch', 403, ['Content-Type' => 'text/plain']);
            }

            return response()->json([
                'success' => true,
                'status' => 'active',
                'service' => 'CloudVault WhatsApp & Inbound Integration',
                'user' => $user->name,
                'target_folder' => 'WhatsApp Media',
                'supported_formats' => [
                    'multipart_file' => 'Form field: file, image, photo, media',
                    'direct_url' => 'JSON: {"url": "https://...", "name": "foto.jpg"}',
                    'base64' => 'JSON: {"data": "base64...", "name": "foto.jpg"}',
                    'whatsapp_webhooks' => 'Meta Cloud API, Fonnte, Wablas, Twilio',
                ],
            ]);
        }

        // Target Folder: Automatically organize into "WhatsApp Media"
        $folderName = $request->input('folder') ?: $request->input('folder_name') ?: 'WhatsApp Media';
        $folderId = $request->input('folder_id');

        $folder = null;
        if ($folderId) {
            $folder = Folder::where('id', $folderId)->where('user_id', $user->id)->first();
        }
        if (! $folder) {
            $folder = Folder::firstOrCreate(
                ['user_id' => $user->id, 'name' => $folderName, 'parent_id' => null],
                ['color' => '#25D366'] // WhatsApp Signature Green
            );
        }

        // Storage limit verification
        $usedStorage = $user->usedStorage();
        $storageLimit = (int) ($user->storage_limit ?: 5368709120);

        // Process File Data from various sources
        $extractedFile = $this->extractFileFromPayload($request, $user, $storageLimit - $usedStorage);

        if ($extractedFile instanceof JsonResponse) {
            return $extractedFile;
        }

        if (! $extractedFile) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada file, gambar, atau media yang terdeteksi dalam kiriman request.',
            ], 422);
        }

        $safeName = FileEntry::sanitizeFileName($extractedFile['name']);
        $extension = strtolower((string) pathinfo($safeName, PATHINFO_EXTENSION));

        if (FileEntry::isDangerousExtension($extension)) {
            return response()->json([
                'success' => false,
                'message' => "Ekstensi file .{$extension} dilarang demi keamanan server.",
            ], 422);
        }

        if ($usedStorage + $extractedFile['size'] > $storageLimit) {
            // Delete temp storage file if already stored
            if (isset($extractedFile['path'])) {
                Storage::disk('local')->delete($extractedFile['path']);
            }

            return response()->json([
                'success' => false,
                'message' => 'Kapasitas penyimpanan CloudVault pengguna telah penuh.',
            ], 413);
        }

        // Extract sender and caption info from WhatsApp payload
        $sender = $request->input('sender') ?: $request->input('from') ?: $request->input('phone') ?: $request->input('WaId');
        $caption = $request->input('caption') ?: $request->input('message') ?: $request->input('Body');

        $tags = ['whatsapp'];
        if ($sender) {
            $tags[] = 'from:'.preg_replace('/[^0-9]/', '', (string) $sender);
        }

        $fileEntry = DB::transaction(function () use ($user, $folder, $safeName, $extractedFile, $extension, $tags, $sender, $caption) {
            $entry = $user->files()->create([
                'folder_id' => $folder->id,
                'name' => $safeName,
                'path' => $extractedFile['path'],
                'mime_type' => $extractedFile['mime_type'],
                'extension' => $extension ?: 'jpg',
                'size' => $extractedFile['size'],
                'is_starred' => false,
                'tags' => $tags,
                'is_locked' => false,
                'checksum' => $extractedFile['checksum'] ?? null,
            ]);

            $sourceLabel = $sender ? "WhatsApp ({$sender})" : 'WhatsApp / Integrasi Eksternal';
            if ($caption) {
                $sourceLabel .= " - \"{$caption}\"";
            }

            ActivityLog::record(
                $user->id,
                'upload',
                $entry->name,
                'file',
                "Diterima dari {$sourceLabel} ({$entry->formatted_size})"
            );

            return $entry;
        });

        return response()->json([
            'success' => true,
            'message' => 'Foto/berkas berhasil diterima dan disimpan di CloudVault.',
            'data' => [
                'id' => $fileEntry->id,
                'name' => $fileEntry->name,
                'folder' => $folder->name,
                'size' => $fileEntry->size,
                'formatted_size' => $fileEntry->formatted_size,
                'mime_type' => $fileEntry->mime_type,
                'tags' => $fileEntry->tags,
                'created_at' => $fileEntry->created_at->toIso8601String(),
            ],
        ], 201);
    }

    /**
     * Resolve authentication token from multiple request locations.
     */
    protected function resolveToken(Request $request, ?string $routeToken = null): ?string
    {
        if (! empty($routeToken)) {
            return $routeToken;
        }

        if ($request->hasHeader('X-API-Key')) {
            return $request->header('X-API-Key');
        }

        if ($request->hasHeader('X-Webhook-Token')) {
            return $request->header('X-Webhook-Token');
        }

        $bearer = $request->bearerToken();
        if ($bearer) {
            return $bearer;
        }

        return $request->query('token') ?: $request->query('api_key') ?: $request->input('token');
    }

    /**
     * Extract file binary/path from multipart, URL, Base64, or WhatsApp webhook payloads.
     *
     * @return array{name: string, path: string, mime_type: string, size: int, checksum: ?string}|JsonResponse|null
     */
    protected function extractFileFromPayload(Request $request, User $user, int $availableBytes): array|JsonResponse|null
    {
        // 1. Direct Multipart Form File
        $uploadedFile = $request->file('file')
            ?: $request->file('image')
            ?: $request->file('photo')
            ?: $request->file('media')
            ?: ($request->allFiles() ? reset($request->allFiles()) : null);

        if ($uploadedFile) {
            if ($uploadedFile->getSize() > $availableBytes) {
                return response()->json(['success' => false, 'message' => 'Ukuran file melebihi sisa kapasitas akun.'], 413);
            }

            $originalName = $uploadedFile->getClientOriginalName() ?: 'whatsapp_image_'.time().'.jpg';
            $mimeType = $uploadedFile->getMimeType() ?: 'image/jpeg';
            $path = $uploadedFile->store("files/{$user->id}", 'local');
            $checksum = @md5_file($uploadedFile->getRealPath()) ?: null;

            return [
                'name' => $originalName,
                'path' => $path,
                'mime_type' => $mimeType,
                'size' => $uploadedFile->getSize(),
                'checksum' => $checksum,
            ];
        }

        // 2. Direct Media URL (Used by Fonnte, Wablas, Twilio MediaUrl0, Zapier, etc.)
        $mediaUrl = $request->input('url')
            ?: $request->input('image_url')
            ?: $request->input('media_url')
            ?: $request->input('file_url')
            ?: $request->input('MediaUrl0');

        if ($mediaUrl && filter_var($mediaUrl, FILTER_VALIDATE_URL)) {
            $currentUrl = (string) $mediaUrl;
            $maxRedirects = 3;
            $response = null;

            for ($i = 0; $i <= $maxRedirects; $i++) {
                $scheme = strtolower((string) parse_url($currentUrl, PHP_URL_SCHEME));
                if (! in_array($scheme, ['http', 'https'], true)) {
                    return response()->json(['success' => false, 'message' => 'Hanya skema tautan http dan https yang diizinkan.'], 422);
                }

                $host = (string) parse_url($currentUrl, PHP_URL_HOST);
                if (! $host || $this->isInternalHost($host)) {
                    return response()->json(['success' => false, 'message' => 'Tautan ke alamat jaringan lokal atau privat diblokir demi keamanan (SSRF Protection).'], 422);
                }

                try {
                    $resp = Http::withoutRedirecting()->timeout(15)->get($currentUrl);

                    if ($resp->status() >= 300 && $resp->status() < 400) {
                        $location = $resp->header('Location');
                        if (! $location) {
                            return response()->json(['success' => false, 'message' => 'Redirect tidak memiliki target lokasi yang valid.'], 422);
                        }

                        // Handle relative redirect URL
                        if (str_starts_with($location, '/')) {
                            $parsed = parse_url($currentUrl);
                            $location = ($parsed['scheme'] ?? 'http').'://'.($parsed['host'] ?? '').$location;
                        }

                        $currentUrl = $location;

                        continue;
                    }

                    $response = $resp;
                    break;
                } catch (\Throwable $e) {
                    return response()->json(['success' => false, 'message' => 'Terjadi kesalahan saat mengunduh berkas dari tautan: '.$e->getMessage()], 422);
                }
            }

            if (! $response || ! $response->successful()) {
                return response()->json(['success' => false, 'message' => 'Gagal mengunduh foto dari URL yang diberikan WhatsApp/aplikasi eksternal.'], 422);
            }

            $content = $response->body();
            $size = strlen($content);

            if ($size > $availableBytes) {
                return response()->json(['success' => false, 'message' => 'Ukuran file dari URL melebihi kapasitas penyimpanan.'], 413);
            }

            $contentType = $response->header('Content-Type') ?: 'image/jpeg';
            $mimeType = explode(';', $contentType)[0];
            $extension = $this->guessExtensionFromMime($mimeType);

            $urlName = $request->input('name')
                ?: $request->input('filename')
                ?: pathinfo(parse_url($currentUrl, PHP_URL_PATH) ?: '', PATHINFO_BASENAME)
                ?: ('whatsapp_img_'.time().'.'.$extension);

            if (! str_contains($urlName, '.')) {
                $urlName .= '.'.$extension;
            }

            $storedName = Str::random(40).'.'.$extension;
            $storagePath = "files/{$user->id}/{$storedName}";
            Storage::disk('local')->put($storagePath, $content);

            return [
                'name' => $urlName,
                'path' => $storagePath,
                'mime_type' => $mimeType,
                'size' => $size,
                'checksum' => md5($content),
            ];
        }

        // 3. Base64 Encoded Image/Data
        $base64Data = $request->input('data')
            ?: $request->input('base64')
            ?: $request->input('image_base64');

        if ($base64Data && is_string($base64Data)) {
            // Strip data URL prefix if exists: e.g. "data:image/jpeg;base64,"
            if (preg_match('/^data:([^;]+);base64,(.+)$/', $base64Data, $matches)) {
                $declaredMime = $matches[1];
                $rawBase64 = $matches[2];
            } else {
                $declaredMime = 'image/jpeg';
                $rawBase64 = $base64Data;
            }

            $binary = base64_decode($rawBase64, true);

            if ($binary !== false && strlen($binary) > 0) {
                $size = strlen($binary);

                if ($size > $availableBytes) {
                    return response()->json(['success' => false, 'message' => 'Ukuran base64 melebihi sisa kapasitas.'], 413);
                }

                $finfo = new \finfo(FILEINFO_MIME_TYPE);
                $mimeType = $finfo->buffer($binary) ?: $declaredMime;
                $extension = $this->guessExtensionFromMime($mimeType);

                $fileName = $request->input('name')
                    ?: $request->input('filename')
                    ?: ('whatsapp_snap_'.time().'.'.$extension);

                if (! str_contains($fileName, '.')) {
                    $fileName .= '.'.$extension;
                }

                $storedName = Str::random(40).'.'.$extension;
                $storagePath = "files/{$user->id}/{$storedName}";
                Storage::disk('local')->put($storagePath, $binary);

                return [
                    'name' => $fileName,
                    'path' => $storagePath,
                    'mime_type' => $mimeType,
                    'size' => $size,
                    'checksum' => md5($binary),
                ];
            }
        }

        return null;
    }

    /**
     * Guess standard file extension from mime type.
     */
    protected function guessExtensionFromMime(string $mime): string
    {
        return match (strtolower(trim($mime))) {
            'image/jpeg', 'image/jpg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
            'image/svg+xml' => 'svg',
            'application/pdf' => 'pdf',
            'video/mp4' => 'mp4',
            'audio/mpeg', 'audio/mp3' => 'mp3',
            'application/zip' => 'zip',
            default => 'bin',
        };
    }

    /**
     * Determine if a hostname points to a loopback, private, or link-local IP (SSRF protection).
     */
    protected function isInternalHost(string $host): bool
    {
        $clean = strtolower(trim($host));

        if (in_array($clean, ['localhost', '127.0.0.1', '::1', '0.0.0.0'], true) || str_ends_with($clean, '.local') || str_ends_with($clean, '.internal')) {
            return true;
        }

        $ips = @gethostbynamel($clean);
        if ($ips) {
            foreach ($ips as $ip) {
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
                    return true;
                }
            }
        }

        return false;
    }
}
