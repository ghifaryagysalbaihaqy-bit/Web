<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\FileEntry;
use App\Models\FileVersion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FileVersionController extends Controller
{
    /**
     * List all versions for a file.
     */
    public function index(Request $request, FileEntry $file): JsonResponse
    {
        if ($file->user_id !== $request->user()->id) {
            abort(403);
        }

        // If no versions exist yet, initialize version 1 from current active file
        if ($file->versions()->count() === 0) {
            $file->versions()->create([
                'version_number' => 1,
                'path' => $file->path,
                'size' => $file->size,
                'mime_type' => $file->mime_type,
                'created_by' => $file->user_id,
                'notes' => 'Versi awal',
            ]);
        }

        $versions = $file->versions()
            ->with('creator:id,name')
            ->orderBy('version_number', 'desc')
            ->get()
            ->map(function (FileVersion $v) use ($file): array {
                return [
                    'id' => $v->id,
                    'version_number' => $v->version_number,
                    'formatted_size' => $v->formatted_size,
                    'size' => $v->size,
                    'notes' => $v->notes ?: "Versi {$v->version_number}",
                    'created_at' => $v->created_at?->format('d M Y, H:i:s'),
                    'creator_name' => $v->creator?->name ?? 'Pemilik',
                    'is_current' => $v->path === $file->path,
                ];
            });

        return response()->json([
            'file_id' => $file->id,
            'file_name' => $file->name,
            'current_size' => $file->formatted_size,
            'versions' => $versions,
        ]);
    }

    /**
     * Upload a new version for a file.
     */
    public function store(Request $request, FileEntry $file): JsonResponse|RedirectResponse
    {
        if ($file->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($file->is_locked) {
            if ($request->wantsJson()) {
                return response()->json(['error' => "Berkas \"{$file->name}\" sedang dikunci dari pengeditan."], 403);
            }

            return back()->with('error', "Berkas \"{$file->name}\" sedang dikunci dari pengeditan.");
        }

        $request->validate([
            'file' => ['required', 'file'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        $uploadedFile = $request->file('file');
        $user = $request->user();

        // Check storage capacity
        $usedStorage = $user->usedStorage();
        $storageLimit = (int) ($user->storage_limit ?: 5368709120);
        $newSize = $uploadedFile->getSize();
        if ($usedStorage + $newSize > $storageLimit) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Kapasitas penyimpanan tidak mencukupi.'], 422);
            }

            return back()->with('error', 'Kapasitas penyimpanan tidak mencukupi.');
        }

        // Initialize v1 if none exists
        if ($file->versions()->count() === 0) {
            $file->versions()->create([
                'version_number' => 1,
                'path' => $file->path,
                'size' => $file->size,
                'mime_type' => $file->mime_type,
                'created_by' => $user->id,
                'notes' => 'Versi awal',
            ]);
        }

        $latestVersionNumber = (int) $file->versions()->max('version_number');
        $newVersionNumber = $latestVersionNumber + 1;

        $newPath = $uploadedFile->store("files/{$user->id}", 'local');
        $newMime = $uploadedFile->getMimeType() ?: $file->mime_type;

        $note = $request->input('notes') ?: "Diperbarui oleh {$user->name}";

        $file->versions()->create([
            'version_number' => $newVersionNumber,
            'path' => $newPath,
            'size' => $newSize,
            'mime_type' => $newMime,
            'created_by' => $user->id,
            'notes' => $note,
        ]);

        $file->update([
            'path' => $newPath,
            'size' => $newSize,
            'mime_type' => $newMime,
        ]);

        ActivityLog::record(
            $user->id,
            'version_upload',
            $file->name,
            'file',
            "Mengunggah Versi {$newVersionNumber} ({$note})"
        );

        $time = now()->format('d M Y, H:i:s');

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => "Versi {$newVersionNumber} berkas \"{$file->name}\" berhasil diunggah.",
                'version_number' => $newVersionNumber,
                'formatted_size' => $file->formatted_size,
                'timestamp' => $time,
            ]);
        }

        return back()
            ->with('success', "Versi {$newVersionNumber} berkas \"{$file->name}\" berhasil diunggah.")
            ->with('timestamp', $time)
            ->with('action_type', 'upload');
    }

    /**
     * Restore a previous version.
     */
    public function restore(Request $request, FileEntry $file, FileVersion $version): JsonResponse|RedirectResponse
    {
        if ($file->user_id !== $request->user()->id || $version->file_entry_id !== $file->id) {
            abort(403);
        }

        if ($file->is_locked) {
            if ($request->expectsJson()) {
                return response()->json(['message' => "Berkas \"{$file->name}\" sedang dikunci dari pengeditan."], 403);
            }

            return back()->with('error', "Berkas \"{$file->name}\" sedang dikunci dari pengeditan.");
        }

        if (! Storage::disk('local')->exists($version->path)) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Berkas versi ini tidak ditemukan di server.'], 404);
            }

            return back()->with('error', 'Berkas versi ini tidak ditemukan di server.');
        }

        $user = $request->user();

        // Copy restored version to a new path to serve as current active file
        $ext = $file->extension ? '.'.$file->extension : '';
        $newActivePath = "files/{$user->id}/".Str::random(40).$ext;
        Storage::disk('local')->copy($version->path, $newActivePath);

        // Record a new version denoting the restore event
        $latestVersionNumber = (int) $file->versions()->max('version_number');
        $restoredVersionNumber = $latestVersionNumber + 1;

        $file->versions()->create([
            'version_number' => $restoredVersionNumber,
            'path' => $newActivePath,
            'size' => $version->size,
            'mime_type' => $version->mime_type,
            'created_by' => $user->id,
            'notes' => "Dipulihkan dari Versi {$version->version_number}",
        ]);

        $file->update([
            'path' => $newActivePath,
            'size' => $version->size,
            'mime_type' => $version->mime_type,
        ]);

        ActivityLog::record(
            $user->id,
            'version_restore',
            $file->name,
            'file',
            "Memulihkan berkas ke Versi {$version->version_number} (menjadi Versi {$restoredVersionNumber})"
        );

        $time = now()->format('d M Y, H:i:s');

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => "Berkas \"{$file->name}\" berhasil dipulihkan ke Versi {$version->version_number}.",
                'restored_version_number' => $version->version_number,
                'new_version_number' => $restoredVersionNumber,
                'timestamp' => $time,
            ]);
        }

        return back()
            ->with('success', "Berkas \"{$file->name}\" berhasil dipulihkan ke Versi {$version->version_number}.")
            ->with('timestamp', $time)
            ->with('action_type', 'restore');
    }

    /**
     * Download a specific historic version.
     */
    public function download(Request $request, FileEntry $file, FileVersion $version): StreamedResponse
    {
        if ($file->user_id !== $request->user()->id || $version->file_entry_id !== $file->id) {
            abort(403);
        }

        if ($file->is_locked) {
            if ($request->expectsJson()) {
                return response()->json(['message' => "Berkas \"{$file->name}\" sedang dikunci dari pengeditan."], 403);
            }

            return back()->with('error', "Berkas \"{$file->name}\" sedang dikunci dari pengeditan.");
        }

        if (! Storage::disk('local')->exists($version->path)) {
            abort(404, 'Berkas fisik versi ini tidak ditemukan.');
        }

        $downloadName = "v{$version->version_number}_{$file->name}";

        return Storage::disk('local')->download($version->path, $downloadName);
    }
}
