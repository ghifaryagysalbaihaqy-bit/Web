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
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FileController extends Controller
{
    /**
     * Handle file uploads (supports single and multiple files).
     */
    public function upload(Request $request): RedirectResponse|JsonResponse
    {
        // Support 'file' single parameter alias
        if (! $request->hasFile('files') && $request->hasFile('file')) {
            $request->files->set('files', [$request->file('file')]);
        } elseif ($request->hasFile('files') && ! is_array($request->file('files'))) {
            $request->files->set('files', [$request->file('files')]);
        }

        $request->validate([
            'files' => ['required', 'array'],
            'files.*' => ['required', 'file'],
            'folder_id' => ['nullable', 'exists:folders,id'],
        ], [
            'files.required' => 'Pilih setidaknya satu berkas untuk diunggah.',
            'files.*.required' => 'Berkas tidak boleh kosong.',
            'files.*.file' => 'Berkas gagal diunggah atau melebihi konfigurasi server.',
        ]);

        $user = $request->user();
        $folderId = $request->input('folder_id');

        if ($folderId) {
            Folder::where('id', $folderId)
                ->where('user_id', $user->id)
                ->firstOrFail();
        }

        $files = $request->file('files');
        $totalBytes = 0;

        foreach ($files as $file) {
            $totalBytes += $file->getSize();
        }

        $usedStorage = $user->usedStorage();
        $storageLimit = (int) ($user->storage_limit ?: 5368709120);
        if ($usedStorage + $totalBytes > $storageLimit) {
            $remainingFormatted = FileEntry::formatBytes(max(0, $storageLimit - $usedStorage));
            throw ValidationException::withMessages([
                'files' => "Kapasitas penyimpanan tidak mencukupi untuk mengunggah file ini. Sisa kuota Anda adalah {$remainingFormatted}.",
            ]);
        }

        foreach ($files as $file) {
            $originalName = $file->getClientOriginalName();
            $extension = strtolower($file->getClientOriginalExtension() ?: (string) pathinfo($originalName, PATHINFO_EXTENSION));

            if (FileEntry::isDangerousExtension($extension)) {
                throw ValidationException::withMessages([
                    'files' => "Ekstensi berkas '.{$extension}' dilarang demi keamanan server.",
                ]);
            }

            $safeOriginalName = FileEntry::sanitizeFileName($originalName);
            $mimeType = $file->getMimeType() ?: 'application/octet-stream';
            $size = $file->getSize();
            $checksum = @md5_file($file->getRealPath()) ?: null;

            // Store in secure private storage under files/{user_id}/
            $path = $file->store("files/{$user->id}", 'local');

            $createdEntry = $user->files()->create([
                'folder_id' => $folderId,
                'name' => $safeOriginalName,
                'path' => $path,
                'mime_type' => $mimeType,
                'extension' => $extension,
                'size' => $size,
                'is_starred' => false,
                'tags' => [],
                'is_locked' => false,
                'checksum' => $checksum,
            ]);

            ActivityLog::record(
                $user->id,
                'upload',
                $safeOriginalName,
                'file',
                "Mengunggah berkas ({$createdEntry->formatted_size})"
            );
        }

        $count = count($files);
        $time = now()->format('d M Y, H:i:s');
        $nameSample = $count === 1 ? "\"{$files[0]->getClientOriginalName()}\"" : "{$count} berkas";

        if ($request->expectsJson() && ! $request->header('X-Inertia')) {
            session()->flash('success', "Berkas {$nameSample} berhasil diunggah.");
            session()->flash('timestamp', $time);
            session()->flash('action_type', 'upload');

            return response()->json([
                'success' => true,
                'message' => "Berkas {$nameSample} berhasil diunggah.",
                'timestamp' => $time,
                'action_type' => 'upload',
            ]);
        }

        return back()
            ->with('success', "Berkas {$nameSample} berhasil diunggah.")
            ->with('timestamp', $time)
            ->with('action_type', 'upload');
    }

    /**
     * Download the specified file.
     */
    public function download(Request $request, FileEntry $file): StreamedResponse
    {
        if ($file->user_id !== $request->user()->id) {
            abort(403);
        }

        if (! Storage::disk('local')->exists($file->path)) {
            abort(404, 'File fisik tidak ditemukan pada server.');
        }

        $cleanName = FileEntry::sanitizeFileName($file->name);

        return Storage::disk('local')->download($file->path, $cleanName);
    }

    /**
     * Preview the specified file in browser (inline).
     */
    public function preview(Request $request, FileEntry $file): StreamedResponse
    {
        if ($file->user_id !== $request->user()->id) {
            abort(403);
        }

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
     * Rename an existing file.
     */
    public function rename(Request $request, FileEntry $file): RedirectResponse
    {
        if ($file->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($file->is_locked) {
            return back()->with('error', "Berkas \"{$file->name}\" sedang dikunci dari pengeditan.");
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $cleanName = FileEntry::sanitizeFileName($validated['name']);
        $newExt = strtolower((string) pathinfo($cleanName, PATHINFO_EXTENSION));
        if ($newExt && FileEntry::isDangerousExtension($newExt)) {
            return back()->with('error', "Ekstensi berkas '.{$newExt}' dilarang demi keamanan server.");
        }

        $oldName = $file->name;
        $file->update([
            'name' => $cleanName,
            'extension' => $newExt ?: $file->extension,
        ]);

        ActivityLog::record(
            $request->user()->id,
            'rename',
            $cleanName,
            'file',
            "Mengubah nama berkas dari \"{$oldName}\" menjadi \"{$cleanName}\""
        );

        return back()->with('success', 'Nama file berhasil diperbarui.');
    }

    /**
     * Update file tags/labels.
     */
    public function updateTags(Request $request, FileEntry $file): RedirectResponse|JsonResponse
    {
        if ($file->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($file->is_locked) {
            if ($request->wantsJson()) {
                return response()->json(['error' => "Berkas \"{$file->name}\" sedang dikunci."], 403);
            }

            return back()->with('error', "Berkas \"{$file->name}\" sedang dikunci.");
        }

        $validated = $request->validate([
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
        ]);

        $tags = array_values(array_unique(array_filter(array_map('trim', $validated['tags'] ?? []))));
        $file->update(['tags' => $tags]);

        $tagsSummary = ! empty($tags) ? implode(', ', $tags) : 'dihapus';
        ActivityLog::record(
            $request->user()->id,
            'tag_update',
            $file->name,
            'file',
            "Memperbarui label berkas: {$tagsSummary}"
        );

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'tags' => $tags]);
        }

        return back()->with('success', 'Label berkas berhasil diperbarui.');
    }

    /**
     * Toggle lock status on a file.
     */
    public function toggleLock(Request $request, FileEntry $file): RedirectResponse|JsonResponse
    {
        if ($file->user_id !== $request->user()->id) {
            abort(403);
        }

        $file->is_locked = ! $file->is_locked;
        $file->save();

        $actionText = $file->is_locked ? 'Mengunci berkas' : 'Membuka kunci berkas';
        ActivityLog::record(
            $request->user()->id,
            $file->is_locked ? 'file_lock' : 'file_unlock',
            $file->name,
            'file',
            $actionText
        );

        $msg = $file->is_locked
            ? "Berkas \"{$file->name}\" berhasil dikunci dari pengeditan."
            : "Kunci berkas \"{$file->name}\" berhasil dibuka.";

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'is_locked' => $file->is_locked, 'message' => $msg]);
        }

        return back()->with('success', $msg);
    }

    /**
     * Move a file to another folder (or root).
     */
    public function move(Request $request, FileEntry $file): RedirectResponse
    {
        if ($file->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($file->is_locked) {
            return back()->with('error', "Berkas \"{$file->name}\" sedang dikunci dari pemindahan.");
        }

        $validated = $request->validate([
            'folder_id' => ['nullable', 'exists:folders,id'],
        ]);

        if (! empty($validated['folder_id'])) {
            Folder::where('id', $validated['folder_id'])
                ->where('user_id', $request->user()->id)
                ->firstOrFail();
        }

        $file->update(['folder_id' => $validated['folder_id'] ?? null]);

        ActivityLog::record(
            $request->user()->id,
            'move',
            $file->name,
            'file',
            'Memindahkan berkas ke folder tujuan'
        );

        return back()->with('success', 'File berhasil dipindahkan.');
    }

    /**
     * Toggle starred status on a file.
     */
    public function toggleStar(Request $request, FileEntry $file): RedirectResponse
    {
        if ($file->user_id !== $request->user()->id) {
            abort(403);
        }

        $file->update(['is_starred' => ! $file->is_starred]);

        return back();
    }

    /**
     * Duplicate an existing file.
     */
    public function duplicate(Request $request, FileEntry $file): RedirectResponse
    {
        if ($file->user_id !== $request->user()->id) {
            abort(403);
        }

        $user = $request->user();

        // Check storage quota
        $usedStorage = $user->usedStorage();
        $storageLimit = (int) ($user->storage_limit ?: 5368709120);
        if ($usedStorage + $file->size > $storageLimit) {
            return back()->with('error', 'Kapasitas penyimpanan tidak mencukupi untuk menduplikasi berkas.');
        }

        if (! Storage::disk('local')->exists($file->path)) {
            return back()->with('error', 'Berkas fisik tidak ditemukan di server.');
        }

        $nameInfo = pathinfo($file->name);
        $basename = $nameInfo['filename'];
        $ext = isset($nameInfo['extension']) && $nameInfo['extension'] !== '' ? '.'.$nameInfo['extension'] : '';
        $newName = $basename.' (Salinan)'.$ext;

        $newStorageName = Str::random(40).($file->extension ? '.'.$file->extension : '');
        $newPath = "files/{$user->id}/{$newStorageName}";

        Storage::disk('local')->copy($file->path, $newPath);

        $user->files()->create([
            'folder_id' => $file->folder_id,
            'name' => $newName,
            'path' => $newPath,
            'mime_type' => $file->mime_type,
            'extension' => $file->extension,
            'size' => $file->size,
            'is_starred' => false,
            'tags' => $file->tags ?? [],
            'is_locked' => false,
            'checksum' => $file->checksum,
        ]);

        ActivityLog::record(
            $user->id,
            'duplicate',
            $newName,
            'file',
            "Menduplikasi berkas dari \"{$file->name}\""
        );

        return back()->with('success', "Berkas \"{$file->name}\" berhasil diduplikasi.");
    }

    /**
     * Get file text/code content for in-browser viewer.
     */
    public function getContent(Request $request, FileEntry $file): JsonResponse
    {
        if ($file->user_id !== $request->user()->id) {
            abort(403);
        }

        if (! Storage::disk('local')->exists($file->path)) {
            return response()->json(['error' => 'Berkas fisik tidak ditemukan di server.'], 404);
        }

        if ($file->size > 2 * 1024 * 1024) {
            return response()->json([
                'content' => null,
                'truncated' => true,
                'message' => 'Ukuran berkas melebihi 2 MB, tidak dapat ditampilkan di editor langsung. Silakan unduh berkas untuk membukanya.',
            ]);
        }

        $content = Storage::disk('local')->get($file->path);

        return response()->json([
            'name' => $file->name,
            'size' => $file->formatted_size,
            'extension' => $file->extension,
            'content' => $content,
        ]);
    }

    /**
     * Move a file to trash (soft delete).
     */
    public function trash(Request $request, FileEntry $file): RedirectResponse
    {
        if ($file->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($file->is_locked) {
            return back()->with('error', "Berkas \"{$file->name}\" sedang dikunci dari penghapusan.");
        }

        $time = now()->format('d M Y, H:i:s');
        $fileName = $file->name;
        $file->delete();

        ActivityLog::record(
            $request->user()->id,
            'trash',
            $fileName,
            'file',
            'Memindahkan berkas ke tempat sampah'
        );

        return back()
            ->with('success', "Berkas \"{$fileName}\" berhasil dipindahkan ke tempat sampah.")
            ->with('timestamp', $time)
            ->with('action_type', 'trash');
    }

    /**
     * Restore a file from trash.
     */
    public function restore(Request $request, int $id): RedirectResponse
    {
        $file = FileEntry::onlyTrashed()
            ->where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $time = now()->format('d M Y, H:i:s');
        $fileName = $file->name;
        $file->restore();

        ActivityLog::record(
            $request->user()->id,
            'restore',
            $fileName,
            'file',
            'Memulihkan berkas dari tempat sampah'
        );

        return back()
            ->with('success', "Berkas \"{$fileName}\" berhasil dipulihkan.")
            ->with('timestamp', $time)
            ->with('action_type', 'restore');
    }

    /**
     * Permanently delete a file from disk and database.
     */
    public function forceDelete(Request $request, int $id): RedirectResponse
    {
        $file = FileEntry::onlyTrashed()
            ->where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $time = now()->format('d M Y, H:i:s');
        $fileName = $file->name;
        Storage::disk('local')->delete($file->path);
        $file->forceDelete();

        ActivityLog::record(
            $request->user()->id,
            'delete',
            $fileName,
            'file',
            'Menghapus berkas secara permanen'
        );

        return back()
            ->with('success', "Berkas \"{$fileName}\" berhasil dihapus secara permanen dari server.")
            ->with('timestamp', $time)
            ->with('action_type', 'delete');
    }

    /**
     * Empty entire trash (permanently remove all trashed files & folders).
     */
    public function emptyTrash(Request $request): RedirectResponse
    {
        $user = $request->user();
        $time = now()->format('d M Y, H:i:s');

        $trashedFiles = FileEntry::onlyTrashed()->where('user_id', $user->id)->get();
        foreach ($trashedFiles as $file) {
            Storage::disk('local')->delete($file->path);
            $file->forceDelete();
        }

        Folder::onlyTrashed()->where('user_id', $user->id)->forceDelete();

        ActivityLog::record(
            $user->id,
            'empty_trash',
            'Tempat Sampah',
            'system',
            'Mengosongkan seluruh berkas dan folder di tempat sampah'
        );

        return back()
            ->with('success', 'Semua berkas dan folder di tempat sampah telah dikosongkan secara permanen.')
            ->with('timestamp', $time)
            ->with('action_type', 'delete');
    }

    /**
     * Detect duplicate files based on checksum or identical name + size.
     */
    public function detectDuplicates(Request $request): JsonResponse
    {
        $user = $request->user();
        $files = FileEntry::where('user_id', $user->id)
            ->whereNull('deleted_at')
            ->with('folder:id,name')
            ->get();

        // Populate checksum for existing files if missing
        foreach ($files as $f) {
            if (empty($f->checksum) && Storage::disk('local')->exists($f->path)) {
                $f->checksum = @md5_file(Storage::disk('local')->path($f->path)) ?: null;
                $f->saveQuietly();
            }
        }

        // Group files by checksum (if available) or by name + size
        $groups = [];
        foreach ($files as $file) {
            $key = $file->checksum ? 'hash_'.$file->checksum : 'namesize_'.strtolower($file->name).'_'.$file->size;
            $groups[$key][] = [
                'id' => $file->id,
                'name' => $file->name,
                'size' => $file->size,
                'formatted_size' => $file->formatted_size,
                'folder_id' => $file->folder_id,
                'folder_name' => $file->folder ? $file->folder->name : 'Root (My Drive)',
                'created_at' => $file->created_at?->format('d M Y, H:i'),
                'is_locked' => (bool) $file->is_locked,
            ];
        }

        $duplicateGroups = [];
        $totalWastedBytes = 0;

        foreach ($groups as $key => $groupFiles) {
            if (count($groupFiles) > 1) {
                $original = $groupFiles[0];
                $duplicates = array_slice($groupFiles, 1);
                $wastedInGroup = array_sum(array_column($duplicates, 'size'));
                $totalWastedBytes += $wastedInGroup;

                $duplicateGroups[] = [
                    'group_key' => $key,
                    'file_name' => $original['name'],
                    'size' => $original['size'],
                    'formatted_size' => $original['formatted_size'],
                    'original' => $original,
                    'duplicates' => $duplicates,
                    'wasted_bytes' => $wastedInGroup,
                    'formatted_wasted' => DriveController::formatBytes($wastedInGroup),
                ];
            }
        }

        return response()->json([
            'duplicate_groups' => $duplicateGroups,
            'total_groups' => count($duplicateGroups),
            'total_wasted_bytes' => $totalWastedBytes,
            'formatted_total_wasted' => DriveController::formatBytes($totalWastedBytes),
        ]);
    }
}
