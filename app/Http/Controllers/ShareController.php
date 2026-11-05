<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\FileEntry;
use App\Models\ShareLink;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ShareController extends Controller
{
    /**
     * Create or retrieve a share link for a file.
     */
    public function create(Request $request, FileEntry $file): JsonResponse
    {
        if ($file->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'password' => ['nullable', 'string', 'min:4'],
            'permission' => ['nullable', 'string', 'in:viewer,editor'],
            'expires_in_days' => ['nullable', 'integer', 'min:1', 'max:365'],
        ]);

        $permission = $validated['permission'] ?? 'viewer';

        $expiresAt = null;
        if (! empty($validated['expires_in_days'])) {
            $expiresAt = Carbon::now()->addDays($validated['expires_in_days']);
        }

        $token = Str::random(32);

        $shareLink = ShareLink::create([
            'user_id' => $request->user()->id,
            'file_entry_id' => $file->id,
            'token' => $token,
            'password' => ! empty($validated['password']) ? Hash::make($validated['password']) : null,
            'permission' => $permission,
            'expires_at' => $expiresAt,
            'downloads_count' => 0,
        ]);

        $permLabel = $permission === 'editor' ? 'Editor' : 'Viewer';
        ActivityLog::record(
            $request->user()->id,
            'share_create',
            $file->name,
            'file',
            "Membuat tautan berbagi dengan izin {$permLabel}"
        );

        return response()->json([
            'id' => $shareLink->id,
            'share_url' => route('share.show', ['token' => $token]),
            'token' => $token,
            'permission' => $permission,
            'has_password' => ! empty($validated['password']),
            'expires_at' => $expiresAt?->format('d M Y, H:i') ?? 'Selamanya',
            'created_at' => $shareLink->created_at->format('d M Y, H:i'),
        ]);
    }

    /**
     * Get all share links for a file.
     */
    public function listForFile(Request $request, FileEntry $file): JsonResponse
    {
        if ($file->user_id !== $request->user()->id) {
            abort(403);
        }

        $links = $file->shareLinks()
            ->latest()
            ->get()
            ->map(function (ShareLink $link): array {
                return [
                    'id' => $link->id,
                    'token' => $link->token,
                    'share_url' => route('share.show', ['token' => $link->token]),
                    'permission' => $link->permission ?: 'viewer',
                    'has_password' => $link->password !== null,
                    'is_expired' => $link->isExpired(),
                    'expires_at' => $link->expires_at?->format('d M Y, H:i') ?? 'Selamanya',
                    'downloads_count' => $link->downloads_count,
                    'created_at' => $link->created_at->format('d M Y, H:i'),
                ];
            });

        return response()->json(['links' => $links]);
    }

    /**
     * Display the public file share page.
     */
    public function show(Request $request, string $token): Response
    {
        $shareLink = ShareLink::with(['fileEntry', 'user'])->where('token', $token)->firstOrFail();

        if ($shareLink->isExpired()) {
            return Inertia::render('Share/Expired');
        }

        $file = $shareLink->fileEntry;

        $hasPassword = $shareLink->password !== null;
        $isUnlocked = ! $hasPassword || $request->session()->get('unlocked_share_'.$shareLink->id) === true;

        return Inertia::render('Share/Show', [
            'token' => $token,
            'fileName' => $file->name,
            'formattedSize' => $file->formatted_size,
            'extension' => $file->extension,
            'mimeType' => $file->mime_type,
            'permission' => $shareLink->permission ?: 'viewer',
            'canEdit' => $shareLink->isEditor() && $isUnlocked,
            'isImage' => $file->isImage(),
            'isPdf' => $file->isPdf(),
            'isAudio' => $file->isAudio(),
            'isVideo' => $file->isVideo(),
            'isText' => $file->isText(),
            'sharedBy' => $shareLink->user->name,
            'createdAt' => $shareLink->created_at->format('d M Y'),
            'downloadsCount' => $shareLink->downloads_count,
            'hasPassword' => $hasPassword,
            'isUnlocked' => $isUnlocked,
        ]);
    }

    /**
     * Upload a new version via Editor share link.
     */
    public function uploadVersion(Request $request, string $token): JsonResponse
    {
        $shareLink = ShareLink::with(['fileEntry', 'user'])->where('token', $token)->firstOrFail();

        if ($shareLink->isExpired()) {
            abort(410, 'Link sharing sudah kedaluwarsa.');
        }

        if ($shareLink->password !== null && $request->session()->get('unlocked_share_'.$shareLink->id) !== true) {
            abort(403, 'Akses dibatasi password.');
        }

        if (! $shareLink->isEditor()) {
            abort(403, 'Tautan ini hanya memiliki izin Viewer.');
        }

        if ($shareLink->fileEntry?->is_locked) {
            return response()->json(['error' => 'Berkas ini sedang dikunci dari pengeditan oleh pemilik.'], 403);
        }

        $request->validate([
            'file' => ['required', 'file'],
        ]);

        $owner = $shareLink->user;
        $fileEntry = $shareLink->fileEntry;
        $uploadedFile = $request->file('file');
        $ext = strtolower($uploadedFile->getClientOriginalExtension() ?: (string) pathinfo($uploadedFile->getClientOriginalName(), PATHINFO_EXTENSION));

        if (FileEntry::isDangerousExtension($ext)) {
            return response()->json([
                'message' => "Format berkas '.{$ext}' dilarang demi keamanan server.",
            ], 422);
        }

        // Check owner storage quota
        $usedStorage = $owner->usedStorage();
        $storageLimit = (int) ($owner->storage_limit ?: 5368709120);
        $newSize = $uploadedFile->getSize();
        if ($usedStorage + $newSize > $storageLimit) {
            return response()->json(['message' => 'Kapasitas penyimpanan pemilik berkas tidak mencukupi.'], 422);
        }

        // Initialize v1 in history if none exists
        if ($fileEntry->versions()->count() === 0) {
            $fileEntry->versions()->create([
                'version_number' => 1,
                'path' => $fileEntry->path,
                'size' => $fileEntry->size,
                'mime_type' => $fileEntry->mime_type,
                'created_by' => $owner->id,
                'notes' => 'Versi awal',
            ]);
        }

        $latestVersionNumber = (int) $fileEntry->versions()->max('version_number');
        $newVersionNumber = $latestVersionNumber + 1;

        $newPath = $uploadedFile->store("files/{$owner->id}", 'local');
        $newMime = $uploadedFile->getMimeType() ?: $fileEntry->mime_type;

        $fileEntry->versions()->create([
            'version_number' => $newVersionNumber,
            'path' => $newPath,
            'size' => $newSize,
            'mime_type' => $newMime,
            'created_by' => auth()->id() ?: null,
            'notes' => 'Diperbarui via tautan Editor publik',
        ]);

        $fileEntry->update([
            'path' => $newPath,
            'size' => $newSize,
            'mime_type' => $newMime,
        ]);

        ActivityLog::record(
            $owner->id,
            'version_upload',
            $fileEntry->name,
            'file',
            "Versi {$newVersionNumber} diunggah via tautan Editor publik"
        );

        return response()->json([
            'success' => true,
            'message' => "Versi baru ({$newVersionNumber}) berhasil diunggah.",
            'version_number' => $newVersionNumber,
            'formatted_size' => $fileEntry->formatted_size,
        ]);
    }

    /**
     * Unlock password-protected shared file.
     */
    public function unlock(Request $request, string $token): RedirectResponse
    {
        $shareLink = ShareLink::where('token', $token)->firstOrFail();

        $key = 'share-unlock:'.$shareLink->id.':'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, 6)) {
            $seconds = RateLimiter::availableIn($key);

            return back()->withErrors(['password' => "Terlalu banyak percobaan salah. Silakan coba lagi dalam {$seconds} detik."]);
        }

        $request->validate([
            'password' => ['required', 'string'],
        ]);

        if (! Hash::check($request->input('password'), $shareLink->password)) {
            RateLimiter::hit($key, 60);

            return back()->withErrors(['password' => 'Password salah.']);
        }

        RateLimiter::clear($key);
        $request->session()->put('unlocked_share_'.$shareLink->id, true);

        return back();
    }

    /**
     * Download the shared file.
     */
    public function download(Request $request, string $token): StreamedResponse
    {
        $shareLink = ShareLink::with('fileEntry')->where('token', $token)->firstOrFail();

        if ($shareLink->isExpired()) {
            abort(410, 'Link sharing sudah kedaluwarsa.');
        }

        if ($shareLink->password !== null && $request->session()->get('unlocked_share_'.$shareLink->id) !== true) {
            abort(403, 'Akses dibatasi password.');
        }

        $file = $shareLink->fileEntry;

        if (! Storage::disk('local')->exists($file->path)) {
            abort(404, 'File fisik tidak ditemukan.');
        }

        $shareLink->increment('downloads_count');
        $cleanName = FileEntry::sanitizeFileName($file->name);

        return Storage::disk('local')->download($file->path, $cleanName);
    }

    /**
     * Preview shared file inline.
     */
    public function preview(Request $request, string $token): StreamedResponse
    {
        $shareLink = ShareLink::with('fileEntry')->where('token', $token)->firstOrFail();

        if ($shareLink->isExpired()) {
            abort(410, 'Link sharing sudah kedaluwarsa.');
        }

        if ($shareLink->password !== null && $request->session()->get('unlocked_share_'.$shareLink->id) !== true) {
            abort(403, 'Akses dibatasi password.');
        }

        $file = $shareLink->fileEntry;

        if (! Storage::disk('local')->exists($file->path)) {
            abort(404, 'File fisik tidak ditemukan.');
        }

        $cleanName = FileEntry::sanitizeFileName($file->name);
        $headers = [
            'Content-Disposition' => 'inline; filename="'.$cleanName.'"',
            'X-Content-Type-Options' => 'nosniff',
        ];

        if ($file->extension === 'svg' || $file->mime_type === 'image/svg+xml') {
            $headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
        }

        return Storage::disk('local')->response($file->path, $cleanName, $headers);
    }

    /**
     * Revoke share link.
     */
    public function destroy(Request $request, ShareLink $shareLink): RedirectResponse
    {
        if ($shareLink->user_id !== $request->user()->id) {
            abort(403);
        }

        $fileName = $shareLink->fileEntry?->name ?? 'Berkas';
        $shareLink->delete();

        ActivityLog::record(
            $request->user()->id,
            'share_revoke',
            $fileName,
            'file',
            'Menonaktifkan tautan berbagi'
        );

        return back()->with('success', 'Tautan berbagi berhasil dinonaktifkan.');
    }
}
