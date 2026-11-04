<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\FileRequest;
use App\Models\Folder;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class FileRequestController extends Controller
{
    /**
     * List all file requests created by the user.
     */
    public function index(Request $request): JsonResponse
    {
        $requests = $request->user()->fileRequests()->with('folder:id,name')->get()->map(function (FileRequest $fr) {
            return [
                'id' => $fr->id,
                'title' => $fr->title,
                'description' => $fr->description,
                'token' => $fr->token,
                'url' => route('file-requests.show', $fr->token),
                'folder_name' => $fr->folder ? $fr->folder->name : 'Root (My Drive)',
                'folder_id' => $fr->folder_id,
                'is_active' => $fr->is_active,
                'is_expired' => $fr->isExpired(),
                'expires_at' => $fr->expires_at?->format('d M Y, H:i'),
                'uploads_count' => $fr->uploads_count,
                'created_at' => $fr->created_at->format('d M Y, H:i'),
            ];
        });

        return response()->json(['fileRequests' => $requests]);
    }

    /**
     * Create a new file request link.
     */
    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'folder_id' => ['nullable', 'exists:folders,id'],
            'expires_in_days' => ['nullable', 'integer', 'min:1', 'max:365'],
        ]);

        $folderId = $validated['folder_id'] ?? null;
        if ($folderId) {
            Folder::where('id', $folderId)
                ->where('user_id', $request->user()->id)
                ->firstOrFail();
        }

        $expiresAt = null;
        if (! empty($validated['expires_in_days'])) {
            $expiresAt = Carbon::now()->addDays($validated['expires_in_days']);
        }

        $fileRequest = $request->user()->fileRequests()->create([
            'folder_id' => $folderId,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'token' => Str::random(32),
            'is_active' => true,
            'expires_at' => $expiresAt,
            'uploads_count' => 0,
        ]);

        ActivityLog::record(
            $request->user()->id,
            'file_request_create',
            $fileRequest->title,
            'share',
            "Membuat tautan permintaan berkas \"{$fileRequest->title}\""
        );

        $url = route('file-requests.show', $fileRequest->token);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Tautan Permintaan Berkas berhasil dibuat.',
                'fileRequest' => [
                    'id' => $fileRequest->id,
                    'title' => $fileRequest->title,
                    'token' => $fileRequest->token,
                    'url' => $url,
                ],
            ], 201);
        }

        return back()->with('success', 'Tautan Permintaan Berkas berhasil dibuat.');
    }

    /**
     * Delete a file request link.
     */
    public function destroy(Request $request, FileRequest $fileRequest): JsonResponse|RedirectResponse
    {
        if ($fileRequest->user_id !== $request->user()->id) {
            abort(403);
        }

        $fileRequest->delete();

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'message' => 'Tautan permintaan berkas dihapus.']);
        }

        return back()->with('success', 'Tautan permintaan berkas dihapus.');
    }

    /**
     * Public page for uploading requested files.
     */
    public function showPublic(string $token): Response
    {
        $fileRequest = FileRequest::where('token', $token)->with('user:id,name', 'folder:id,name')->firstOrFail();

        if (! $fileRequest->is_active || $fileRequest->isExpired()) {
            return Inertia::render('Share/Expired', [
                'title' => 'Permintaan Berkas Ditutup atau Kedaluwarsa',
                'message' => 'Tautan pengunggahan ini sudah tidak aktif atau batas waktunya telah berakhir.',
            ]);
        }

        return Inertia::render('Share/FileRequestPublic', [
            'fileRequest' => [
                'token' => $fileRequest->token,
                'title' => $fileRequest->title,
                'description' => $fileRequest->description,
                'requester_name' => $fileRequest->user->name,
                'folder_name' => $fileRequest->folder?->name,
                'expires_at' => $fileRequest->expires_at?->format('d M Y, H:i'),
            ],
        ]);
    }

    /**
     * Public file upload handling for a file request.
     */
    public function uploadPublic(Request $request, string $token): JsonResponse
    {
        $fileRequest = FileRequest::where('token', $token)->with('user')->firstOrFail();

        if (! $fileRequest->is_active || $fileRequest->isExpired()) {
            return response()->json(['error' => 'Permintaan berkas ini telah ditutup atau kedaluwarsa.'], 403);
        }

        $request->validate([
            'files' => ['required', 'array'],
            'files.*' => ['required', 'file'],
            'uploader_name' => ['nullable', 'string', 'max:100'],
        ]);

        $owner = $fileRequest->user;
        $files = $request->file('files');
        $totalBytes = 0;

        foreach ($files as $file) {
            $totalBytes += $file->getSize();
        }

        $usedStorage = $owner->usedStorage();
        $storageLimit = (int) ($owner->storage_limit ?: 5368709120);

        if ($usedStorage + $totalBytes > $storageLimit) {
            return response()->json(['error' => 'Kapasitas penyimpanan penerima tidak mencukupi untuk menerima berkas ini.'], 422);
        }

        $uploadedCount = 0;
        $uploader = $request->input('uploader_name') ? ' dari '.$request->input('uploader_name') : '';

        foreach ($files as $file) {
            $originalName = $file->getClientOriginalName();
            $extension = strtolower($file->getClientOriginalExtension() ?: (string) pathinfo($originalName, PATHINFO_EXTENSION));
            $mimeType = $file->getMimeType() ?: 'application/octet-stream';
            $size = $file->getSize();
            $checksum = @md5_file($file->getRealPath()) ?: null;

            $path = $file->store("files/{$owner->id}", 'local');

            $createdEntry = $owner->files()->create([
                'folder_id' => $fileRequest->folder_id,
                'name' => $originalName,
                'path' => $path,
                'mime_type' => $mimeType,
                'extension' => $extension,
                'size' => $size,
                'is_starred' => false,
                'tags' => ['File Request'],
                'checksum' => $checksum,
            ]);

            ActivityLog::record(
                $owner->id,
                'file_request_upload',
                $originalName,
                'file',
                "Menerima berkas melalui permintaan \"{$fileRequest->title}\"{$uploader}"
            );

            $uploadedCount++;
        }

        $fileRequest->increment('uploads_count', $uploadedCount);

        return response()->json([
            'success' => true,
            'message' => "{$uploadedCount} berkas berhasil dikirimkan ke {$owner->name}.",
        ]);
    }
}
