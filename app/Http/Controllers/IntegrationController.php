<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\FileEntry;
use App\Models\Folder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class IntegrationController extends Controller
{
    /**
     * Get integration status and webhook endpoints.
     */
    public function getInfo(Request $request): JsonResponse
    {
        $user = $request->user();
        $token = $user->ensureWebhookToken();
        $baseUrl = url('/');
        $webhookUrl = "{$baseUrl}/api/v1/inbound/{$token}";
        $whatsappWebhookUrl = "{$baseUrl}/api/v1/integrations/whatsapp/{$token}";

        return response()->json([
            'token' => $token,
            'webhook_url' => $webhookUrl,
            'whatsapp_webhook_url' => $whatsappWebhookUrl,
            'target_folder' => 'WhatsApp Media',
            'examples' => [
                'curl' => "curl -X POST \"{$webhookUrl}\" -F \"image=@foto.jpg\" -F \"sender=6281234567890\" -F \"caption=Foto dari WhatsApp\"",
                'json_url' => "curl -X POST \"{$webhookUrl}\" -H \"Content-Type: application/json\" -d '{\"url\": \"https://example.com/foto.jpg\", \"caption\": \"Dokumentasi proyek\"}'",
            ],
        ]);
    }

    /**
     * Regenerate user integration token.
     */
    public function regenerateToken(Request $request): RedirectResponse|JsonResponse
    {
        $newToken = $request->user()->regenerateWebhookToken();

        if ($request->expectsJson() && ! $request->header('X-Inertia')) {
            return response()->json([
                'success' => true,
                'message' => 'Token integrasi WhatsApp & API berhasil diperbarui.',
                'token' => $newToken,
                'webhook_url' => url("/api/v1/inbound/{$newToken}"),
            ]);
        }

        return back()->with('success', 'Token integrasi WhatsApp & API berhasil diperbarui.');
    }

    /**
     * Simulate an incoming WhatsApp photo upload directly from the UI.
     */
    public function simulateWhatsAppUpload(Request $request): RedirectResponse|JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'image' => ['nullable', 'file', 'image', 'max:20480'], // max 20MB
            'caption' => ['nullable', 'string', 'max:255'],
            'sender' => ['nullable', 'string', 'max:50'],
        ]);

        $folder = Folder::firstOrCreate(
            ['user_id' => $user->id, 'name' => 'WhatsApp Media', 'parent_id' => null],
            ['color' => '#25D366']
        );

        $caption = $request->input('caption') ?: 'Foto kiriman dari WhatsApp';
        $sender = $request->input('sender') ?: '6281234567890';
        $usedStorage = $user->usedStorage();
        $storageLimit = (int) ($user->storage_limit ?: 5368709120);

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $size = $file->getSize();

            if ($usedStorage + $size > $storageLimit) {
                return back()->with('error', 'Kapasitas penyimpanan tidak mencukupi untuk menyimpan foto ini.');
            }

            $originalName = $file->getClientOriginalName();
            $safeName = FileEntry::sanitizeFileName($originalName);
            $extension = strtolower($file->getClientOriginalExtension() ?: 'jpg');
            $path = $file->store("files/{$user->id}", 'local');
            $mimeType = $file->getMimeType() ?: 'image/jpeg';
            $checksum = @md5_file($file->getRealPath()) ?: null;
        } else {
            // Generate a sample dummy WhatsApp photo (SVG rendered as graphic)
            $timeStr = now()->format('d M Y H:i:s');
            $safeName = 'WA_IMG_'.now()->format('Ymd_His').'.svg';
            $svgContent = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="waGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#075E54"/>
      <stop offset="50%" stop-color="#128C7E"/>
      <stop offset="100%" stop-color="#25D366"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#waGrad)"/>
  <circle cx="400" cy="250" r="110" fill="white" opacity="0.15"/>
  <path d="M400,160 C345,160 300,205 300,260 C300,280 306,298 316,314 L304,360 L351,348 C366,356 383,360 400,360 C455,360 500,315 500,260 C500,205 455,160 400,160 Z" fill="#FFFFFF"/>
  <text x="400" y="420" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#FFFFFF" text-anchor="middle">Foto Diterima dari WhatsApp</text>
  <text x="400" y="460" font-family="Arial, sans-serif" font-size="18" fill="#E0F2F1" text-anchor="middle">Tersimpan Otomatis di CloudVault</text>
  <text x="400" y="500" font-family="Arial, sans-serif" font-size="14" fill="#B2DFDB" text-anchor="middle">Pengirim: {$sender} | Waktu: {$timeStr}</text>
</svg>
SVG;
            $size = strlen($svgContent);
            $extension = 'svg';
            $mimeType = 'image/svg+xml';
            $storagePath = "files/{$user->id}/".Str::random(40).'.svg';
            Storage::disk('local')->put($storagePath, $svgContent);
            $path = $storagePath;
            $checksum = md5($svgContent);
        }

        $createdEntry = $user->files()->create([
            'folder_id' => $folder->id,
            'name' => $safeName,
            'path' => $path,
            'mime_type' => $mimeType,
            'extension' => $extension,
            'size' => $size,
            'is_starred' => false,
            'tags' => ['whatsapp', 'from:'.preg_replace('/[^0-9]/', '', $sender)],
            'is_locked' => false,
            'checksum' => $checksum,
        ]);

        ActivityLog::record(
            $user->id,
            'upload',
            $createdEntry->name,
            'file',
            "Diterima dari WhatsApp ({$sender}) - \"{$caption}\""
        );

        session()->flash('success', 'Foto dari WhatsApp berhasil diterima dan disimpan di folder "WhatsApp Media"!');
        session()->flash('timestamp', now()->format('d M Y, H:i:s'));
        session()->flash('action_type', 'upload');
        session()->flash('file_name', $createdEntry->name);

        if ($request->expectsJson() && ! $request->header('X-Inertia')) {
            return response()->json([
                'success' => true,
                'message' => 'Foto dari WhatsApp berhasil diterima dan disimpan di folder "WhatsApp Media".',
                'file' => $createdEntry,
            ]);
        }

        return redirect()->route('drive.index', ['folder' => $folder->id]);
    }
}
