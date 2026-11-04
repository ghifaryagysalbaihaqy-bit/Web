<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\FileEntry;
use App\Models\Folder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use ZipArchive;

class DriveController extends Controller
{
    /**
     * Display the cloud storage explorer dashboard.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $section = $request->query('section', 'all'); // 'all', 'recent', 'starred', 'trash'
        $folderId = $request->query('folder_id');
        $search = $request->query('search');
        $searchType = $request->query('search_type', 'all');
        $sizeRange = $request->query('size_range');
        $dateRange = $request->query('date_range');
        $tagFilter = $request->query('tag');
        $filter = $request->query('filter', 'all'); // 'all', 'document', 'image', 'media', 'archive', 'code'
        $sortBy = $request->query('sort_by', 'name'); // 'name', 'updated_at', 'size'
        $sortDirection = $request->query('sort_direction', 'asc');

        if (! in_array($sortDirection, ['asc', 'desc'], true)) {
            $sortDirection = 'asc';
        }

        $currentFolder = null;
        $breadcrumbs = [];

        if ($section === 'all' && $folderId) {
            $currentFolder = Folder::where('user_id', $user->id)
                ->where('id', $folderId)
                ->firstOrFail();

            $breadcrumbs = $currentFolder->getBreadcrumbs();
        }

        // Folder Query
        $foldersQuery = Folder::where('user_id', $user->id);
        // File Query
        $filesQuery = FileEntry::where('user_id', $user->id);

        $hasAdvancedSearch = ($searchType !== 'all') || ! empty($sizeRange) || ! empty($dateRange) || ! empty($tagFilter);

        if ($section === 'trash') {
            $foldersQuery->onlyTrashed();
            $filesQuery->onlyTrashed();
        } else {
            if ($section === 'starred') {
                $foldersQuery->where('is_starred', true);
                $filesQuery->where('is_starred', true);
            } elseif ($section === 'recent') {
                // In recent, files are prioritized, folders are omitted
                $foldersQuery->whereRaw('1 = 0');
                $filesQuery->latest('updated_at')->limit(50);
            } else {
                // Section: 'all' (Directory browsing)
                if ($search || $hasAdvancedSearch) {
                    if ($search) {
                        $filesQuery->where('name', 'like', "%{$search}%");
                        if (! $hasAdvancedSearch) {
                            $foldersQuery->where('name', 'like', "%{$search}%");
                        } else {
                            $foldersQuery->whereRaw('1 = 0');
                        }
                    } else {
                        $foldersQuery->whereRaw('1 = 0');
                    }

                    if ($folderId) {
                        $filesQuery->where('folder_id', $folderId);
                    }
                } else {
                    $foldersQuery->where('parent_id', $currentFolder?->id);
                    $filesQuery->where('folder_id', $currentFolder?->id);
                }
            }
        }

        // Advanced Search: Size Range
        if (! empty($sizeRange)) {
            if ($sizeRange === 'small') {
                $filesQuery->where('size', '<=', 1048576); // <= 1MB
            } elseif ($sizeRange === 'medium') {
                $filesQuery->whereBetween('size', [1048577, 10485760]); // 1MB - 10MB
            } elseif ($sizeRange === 'large') {
                $filesQuery->whereBetween('size', [10485761, 104857600]); // 10MB - 100MB
            } elseif ($sizeRange === 'xlarge') {
                $filesQuery->where('size', '>', 104857600); // > 100MB
            }
        }

        // Advanced Search: Date Range
        if (! empty($dateRange)) {
            if ($dateRange === 'today') {
                $filesQuery->where('updated_at', '>=', now()->startOfDay());
            } elseif ($dateRange === 'last_7_days') {
                $filesQuery->where('updated_at', '>=', now()->subDays(7));
            } elseif ($dateRange === 'last_30_days') {
                $filesQuery->where('updated_at', '>=', now()->subDays(30));
            } elseif ($dateRange === 'this_year') {
                $filesQuery->where('updated_at', '>=', now()->startOfYear());
            }
        }

        // Advanced Search: Tag Filter
        if (! empty($tagFilter)) {
            $filesQuery->whereJsonContains('tags', $tagFilter);
        }

        // Apply File Type Filter (from pill or advanced search)
        $activeTypeFilter = ($searchType !== 'all') ? $searchType : $filter;
        if ($activeTypeFilter !== 'all') {
            $foldersQuery->whereRaw('1 = 0'); // hide folders when specific file category is filtered

            switch ($activeTypeFilter) {
                case 'image':
                    $filesQuery->where('mime_type', 'like', 'image/%');
                    break;
                case 'document':
                    $docMimes = [
                        'application/pdf',
                        'application/msword',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'application/vnd.ms-excel',
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        'application/vnd.ms-powerpoint',
                        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                        'application/vnd.oasis.opendocument.text',
                        'application/vnd.oasis.opendocument.spreadsheet',
                        'application/vnd.oasis.opendocument.presentation',
                        'application/rtf',
                        'text/rtf',
                        'text/plain',
                        'text/csv',
                        'application/epub+zip',
                    ];
                    $docExts = [
                        'pdf', 'doc', 'docx', 'docm', 'dotx', 'dot', 'rtf', 'odt', 'pages', 'wps',
                        'xls', 'xlsx', 'xlsm', 'xltx', 'csv', 'tsv', 'ods', 'numbers', 'et',
                        'ppt', 'pptx', 'pptm', 'potx', 'ppsx', 'odp', 'key', 'dps',
                        'txt', 'epub', 'mobi', 'djvu', 'tex', 'wpd',
                    ];
                    $filesQuery->where(function ($q) use ($docMimes, $docExts) {
                        $q->whereIn('mime_type', $docMimes)
                            ->orWhereIn('extension', $docExts)
                            ->orWhere('mime_type', 'like', 'application/vnd.ms-%')
                            ->orWhere('mime_type', 'like', 'application/vnd.openxmlformats-%')
                            ->orWhere('mime_type', 'like', 'application/vnd.oasis.opendocument%');
                    });
                    break;
                case 'media':
                    $filesQuery->where(function ($q) {
                        $q->where('mime_type', 'like', 'video/%')
                            ->orWhere('mime_type', 'like', 'audio/%')
                            ->orWhereIn('extension', ['mp4', 'mkv', 'avi', 'mov', 'webm', 'mp3', 'wav', 'ogg', 'flac', 'm4a']);
                    });
                    break;
                case 'archive':
                    $archiveExts = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'];
                    $filesQuery->where(function ($q) use ($archiveExts) {
                        $q->whereIn('extension', $archiveExts)
                            ->orWhere('mime_type', 'like', '%zip%')
                            ->orWhere('mime_type', 'like', '%tar%')
                            ->orWhere('mime_type', 'like', '%archive%');
                    });
                    break;
                case 'code':
                    $codeExts = ['txt', 'md', 'json', 'csv', 'js', 'ts', 'jsx', 'tsx', 'css', 'html', 'xml', 'yaml', 'yml', 'php', 'py', 'sh', 'sql', 'log', 'env'];
                    $filesQuery->where(function ($q) use ($codeExts) {
                        $q->where('mime_type', 'like', 'text/%')->orWhereIn('extension', $codeExts);
                    });
                    break;
            }
        }

        if ($section !== 'recent') {
            if ($sortBy === 'size') {
                $filesQuery->orderBy('size', $sortDirection);
                $foldersQuery->orderBy('name', 'asc');
            } else {
                $orderColumn = in_array($sortBy, ['name', 'updated_at', 'created_at'], true) ? $sortBy : 'name';
                $foldersQuery->orderBy($orderColumn, $sortDirection);
                $filesQuery->orderBy($orderColumn, $sortDirection);
            }
        }

        $folders = $foldersQuery->get()->map(function (Folder $folder): array {
            return [
                'id' => $folder->id,
                'parent_id' => $folder->parent_id,
                'name' => $folder->name,
                'color' => $folder->color,
                'is_starred' => (bool) $folder->is_starred,
                'created_at' => $folder->created_at?->format('d M Y, H:i'),
                'updated_at' => $folder->updated_at?->format('d M Y, H:i'),
                'deleted_at' => $folder->deleted_at?->format('d M Y, H:i:s'),
            ];
        });

        $files = $filesQuery->with('shareLinks')->get()->map(function (FileEntry $file): array {
            return [
                'id' => $file->id,
                'name' => $file->name,
                'path' => $file->path,
                'mime_type' => $file->mime_type,
                'extension' => $file->extension,
                'size' => $file->size,
                'formatted_size' => $file->formatted_size,
                'is_starred' => $file->is_starred,
                'is_locked' => (bool) $file->is_locked,
                'tags' => $file->tags ?? [],
                'has_active_share' => $file->hasActiveShare(),
                'folder_id' => $file->folder_id,
                'is_image' => $file->isImage(),
                'is_pdf' => $file->isPdf(),
                'is_audio' => $file->isAudio(),
                'is_video' => $file->isVideo(),
                'is_text' => $file->isText(),
                'created_at' => $file->created_at?->format('d M Y, H:i'),
                'updated_at' => $file->updated_at?->format('d M Y, H:i'),
                'deleted_at' => $file->deleted_at?->format('d M Y, H:i:s'),
            ];
        });

        // Get user's root and all non-deleted folders for move destination selector
        $availableFolders = Folder::where('user_id', $user->id)
            ->select('id', 'name', 'parent_id')
            ->orderBy('name')
            ->get();

        $usedStorage = $user->usedStorage();
        $trashedStorage = $user->trashedStorage();
        $storageLimit = (int) ($user->storage_limit ?: 5368709120);
        $storagePercentage = $storageLimit > 0 ? min(100, round(($usedStorage / $storageLimit) * 100, 1)) : 0;

        // Calculate storage breakdown by file category
        $categoryBreakdown = [
            'image' => ['key' => 'image', 'label' => 'Gambar', 'color' => '#F2A900', 'bytes' => 0],
            'document' => ['key' => 'document', 'label' => 'Dokumen', 'color' => '#3B82F6', 'bytes' => 0],
            'media' => ['key' => 'media', 'label' => 'Video & Audio', 'color' => '#8B5CF6', 'bytes' => 0],
            'archive_code' => ['key' => 'archive_code', 'label' => 'Arsip & Kode', 'color' => '#10B981', 'bytes' => 0],
            'other' => ['key' => 'other', 'label' => 'Lainnya', 'color' => '#94A3B8', 'bytes' => 0],
        ];

        $userFiles = FileEntry::where('user_id', $user->id)
            ->select('id', 'mime_type', 'extension', 'size')
            ->get();

        foreach ($userFiles as $f) {
            $bytes = (int) $f->size;
            $ext = strtolower($f->extension ?? '');
            $docExtensions = [
                'pdf', 'doc', 'docx', 'docm', 'dotx', 'dot', 'rtf', 'odt', 'pages', 'wps',
                'xls', 'xlsx', 'xlsm', 'xltx', 'csv', 'tsv', 'ods', 'numbers', 'et',
                'ppt', 'pptx', 'pptm', 'potx', 'ppsx', 'odp', 'key', 'dps',
                'txt', 'epub', 'mobi', 'djvu', 'tex', 'wpd',
            ];
            if ($f->isImage()) {
                $categoryBreakdown['image']['bytes'] += $bytes;
            } elseif ($f->isPdf() || in_array($ext, $docExtensions, true)) {
                $categoryBreakdown['document']['bytes'] += $bytes;
            } elseif ($f->isVideo() || $f->isAudio()) {
                $categoryBreakdown['media']['bytes'] += $bytes;
            } elseif (in_array($ext, ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'js', 'ts', 'jsx', 'tsx', 'py', 'php', 'html', 'css', 'json', 'sql', 'yaml', 'yml'], true)) {
                $categoryBreakdown['archive_code']['bytes'] += $bytes;
            } else {
                $categoryBreakdown['other']['bytes'] += $bytes;
            }
        }

        // Determine largest category
        $largestCategoryKey = null;
        $maxBytes = 0;
        foreach ($categoryBreakdown as $k => $c) {
            if ($c['bytes'] > $maxBytes) {
                $maxBytes = $c['bytes'];
                $largestCategoryKey = $k;
            }
        }

        $formattedCategories = [];
        foreach ($categoryBreakdown as $k => $c) {
            $catBytes = $c['bytes'];
            $pctOfUsed = $usedStorage > 0 ? round(($catBytes / $usedStorage) * 100, 1) : 0;
            $pctOfLimit = $storageLimit > 0 ? round(($catBytes / $storageLimit) * 100, 2) : 0;

            $formattedCategories[] = [
                'key' => $c['key'],
                'label' => $c['label'],
                'color' => $c['color'],
                'bytes' => $catBytes,
                'formatted' => $this->formatBytes($catBytes),
                'percentage_of_used' => $pctOfUsed,
                'percentage_of_limit' => $pctOfLimit,
                'is_largest' => ($k === $largestCategoryKey && $catBytes > 0),
            ];
        }

        $largestCategory = ($largestCategoryKey !== null && $maxBytes > 0) ? [
            'key' => $categoryBreakdown[$largestCategoryKey]['key'],
            'label' => $categoryBreakdown[$largestCategoryKey]['label'],
            'color' => $categoryBreakdown[$largestCategoryKey]['color'],
            'bytes' => $maxBytes,
            'formatted' => $this->formatBytes($maxBytes),
            'percentage_of_used' => $usedStorage > 0 ? round(($maxBytes / $usedStorage) * 100, 1) : 0,
        ] : null;

        $allTags = FileEntry::where('user_id', $user->id)
            ->whereNotNull('tags')
            ->pluck('tags')
            ->flatten()
            ->filter()
            ->unique()
            ->values()
            ->all();

        $largestFiles = FileEntry::where('user_id', $user->id)
            ->orderByDesc('size')
            ->limit(8)
            ->get()
            ->map(function (FileEntry $lf): array {
                return [
                    'id' => $lf->id,
                    'name' => $lf->name,
                    'size' => $lf->size,
                    'formatted_size' => $lf->formatted_size,
                    'mime_type' => $lf->mime_type,
                    'extension' => $lf->extension,
                    'created_at' => $lf->created_at?->format('d M Y'),
                ];
            });

        return Inertia::render('Drive/Index', [
            'section' => $section,
            'currentFolder' => $currentFolder ? [
                'id' => $currentFolder->id,
                'name' => $currentFolder->name,
                'parent_id' => $currentFolder->parent_id,
                'color' => $currentFolder->color,
                'is_starred' => $currentFolder->is_starred,
            ] : null,
            'breadcrumbs' => $breadcrumbs,
            'folders' => $folders,
            'files' => $files,
            'availableFolders' => $availableFolders,
            'allTags' => $allTags,
            'search' => $search ?? '',
            'advancedSearch' => [
                'search_type' => $searchType,
                'size_range' => $sizeRange ?? '',
                'date_range' => $dateRange ?? '',
                'tag' => $tagFilter ?? '',
            ],
            'filter' => $filter,
            'sortBy' => $sortBy,
            'sortDirection' => $sortDirection,
            'storage' => [
                'used' => $usedStorage,
                'trashed' => $trashedStorage,
                'limit' => $storageLimit,
                'percentage' => $storagePercentage,
                'total_files' => $user->files()->count(),
                'total_folders' => $user->folders()->count(),
                'largest_files' => $largestFiles,
                'formatted_used' => $this->formatBytes($usedStorage),
                'formatted_trashed' => $this->formatBytes($trashedStorage),
                'formatted_limit' => $this->formatBytes($storageLimit),
                'categories' => $formattedCategories,
                'largest_category' => $largestCategory,
            ],
        ]);
    }

    /**
     * Update folder color.
     */
    public function updateFolderColor(Request $request, Folder $folder): RedirectResponse
    {
        if ($folder->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'color' => ['required', 'string', 'max:20'],
        ]);

        $folder->update(['color' => $validated['color']]);

        ActivityLog::record(
            $request->user()->id,
            'folder_update',
            $folder->name,
            'folder',
            "Mengubah warna folder menjadi {$validated['color']}"
        );

        return back()->with('success', 'Warna folder berhasil diperbarui.');
    }

    /**
     * Create a new folder.
     */
    public function createFolder(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'parent_id' => ['nullable', 'exists:folders,id'],
            'color' => ['nullable', 'string', 'max:20'],
        ]);

        if (! empty($validated['parent_id'])) {
            Folder::where('id', $validated['parent_id'])
                ->where('user_id', $request->user()->id)
                ->firstOrFail();
        }

        $folder = $request->user()->folders()->create([
            'name' => $validated['name'],
            'parent_id' => $validated['parent_id'] ?? null,
            'color' => $validated['color'] ?? '#F2A900',
            'is_starred' => false,
        ]);

        ActivityLog::record(
            $request->user()->id,
            'folder_create',
            $folder->name,
            'folder',
            'Membuat folder baru'
        );

        return back()->with('success', 'Folder berhasil dibuat.');
    }

    /**
     * Rename an existing folder.
     */
    public function renameFolder(Request $request, Folder $folder): RedirectResponse
    {
        if ($folder->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:20'],
        ]);

        $folder->update($validated);

        ActivityLog::record(
            $request->user()->id,
            'rename',
            $validated['name'],
            'folder',
            "Mengubah nama folder menjadi \"{$validated['name']}\""
        );

        return back()->with('success', 'Folder berhasil diperbarui.');
    }

    /**
     * Move a folder to another parent folder (with circular reference prevention).
     */
    public function moveFolder(Request $request, Folder $folder): RedirectResponse
    {
        if ($folder->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'parent_id' => ['nullable', 'exists:folders,id'],
        ]);

        $targetParentId = ! empty($validated['parent_id']) ? (int) $validated['parent_id'] : null;

        if ($targetParentId !== null) {
            $targetFolder = Folder::where('id', $targetParentId)
                ->where('user_id', $request->user()->id)
                ->firstOrFail();

            if ($folder->isSelfOrDescendant($targetFolder->id)) {
                return back()->with('error', 'Tidak dapat memindahkan folder ke dalam dirinya sendiri atau subfolder miliknya.');
            }
        }

        $folder->update(['parent_id' => $targetParentId]);

        ActivityLog::record(
            $request->user()->id,
            'move',
            $folder->name,
            'folder',
            'Memindahkan folder ke tujuan baru'
        );

        return back()->with('success', 'Folder berhasil dipindahkan.');
    }

    /**
     * Toggle starred status on a folder.
     */
    public function toggleStarFolder(Request $request, Folder $folder): RedirectResponse
    {
        if ($folder->user_id !== $request->user()->id) {
            abort(403);
        }

        $folder->update(['is_starred' => ! $folder->is_starred]);

        return back();
    }

    /**
     * Move a folder to trash (cascading soft delete).
     */
    public function trashFolder(Request $request, Folder $folder): RedirectResponse
    {
        if ($folder->user_id !== $request->user()->id) {
            abort(403);
        }

        $time = now()->format('d M Y, H:i:s');
        $folderName = $folder->name;
        $descendants = $folder->allDescendants();
        $folderIds = $descendants->pluck('id')->push($folder->id);

        FileEntry::whereIn('folder_id', $folderIds)->delete();
        Folder::whereIn('id', $folderIds)->delete();

        ActivityLog::record(
            $request->user()->id,
            'trash',
            $folderName,
            'folder',
            'Memindahkan folder beserta isinya ke tempat sampah'
        );

        return back()
            ->with('success', "Folder \"{$folderName}\" beserta seluruh isinya berhasil dipindahkan ke tempat sampah.")
            ->with('timestamp', $time)
            ->with('action_type', 'trash');
    }

    /**
     * Restore a folder from trash (cascading restore).
     */
    public function restoreFolder(Request $request, int $id): RedirectResponse
    {
        $folder = Folder::onlyTrashed()
            ->where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $time = now()->format('d M Y, H:i:s');
        $folderName = $folder->name;
        $descendants = $folder->allDescendants();
        $folderIds = $descendants->pluck('id')->push($folder->id);

        Folder::onlyTrashed()->whereIn('id', $folderIds)->restore();
        FileEntry::onlyTrashed()->whereIn('folder_id', $folderIds)->restore();

        ActivityLog::record(
            $request->user()->id,
            'restore',
            $folderName,
            'folder',
            'Memulihkan folder beserta isinya dari tempat sampah'
        );

        return back()
            ->with('success', "Folder \"{$folderName}\" berhasil dipulihkan.")
            ->with('timestamp', $time)
            ->with('action_type', 'restore');
    }

    /**
     * Permanently delete a folder and all its contents (recursive cleanup).
     */
    public function forceDeleteFolder(Request $request, int $id): RedirectResponse
    {
        $folder = Folder::onlyTrashed()
            ->where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $time = now()->format('d M Y, H:i:s');
        $folderName = $folder->name;
        $descendants = $folder->allDescendants();
        $folderIds = $descendants->pluck('id')->push($folder->id);

        $files = FileEntry::onlyTrashed()->whereIn('folder_id', $folderIds)->get();
        foreach ($files as $file) {
            Storage::disk('local')->delete($file->path);
            $file->forceDelete();
        }

        Folder::onlyTrashed()->whereIn('id', $folderIds)->forceDelete();

        ActivityLog::record(
            $request->user()->id,
            'delete',
            $folderName,
            'folder',
            'Menghapus folder secara permanen'
        );

        return back()
            ->with('success', "Folder \"{$folderName}\" berhasil dihapus secara permanen dari server.")
            ->with('timestamp', $time)
            ->with('action_type', 'delete');
    }

    /**
     * Execute batch actions on multiple selected files and folders.
     */
    public function batchAction(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'string', 'in:trash,restore,force_delete,move,star,unstar'],
            'file_ids' => ['nullable', 'array'],
            'file_ids.*' => ['integer'],
            'folder_ids' => ['nullable', 'array'],
            'folder_ids.*' => ['integer'],
            'target_folder_id' => ['nullable', 'integer', 'exists:folders,id'],
        ]);

        $user = $request->user();
        $fileIds = $validated['file_ids'] ?? [];
        $folderIds = $validated['folder_ids'] ?? [];

        if (empty($fileIds) && empty($folderIds)) {
            return back()->with('error', 'Tidak ada item yang dipilih.');
        }

        switch ($validated['action']) {
            case 'trash':
                if (! empty($fileIds)) {
                    FileEntry::where('user_id', $user->id)->whereIn('id', $fileIds)->delete();
                }
                foreach ($folderIds as $fid) {
                    $folder = Folder::where('user_id', $user->id)->find($fid);
                    if ($folder) {
                        $descendants = $folder->allDescendants();
                        $allFids = $descendants->pluck('id')->push($folder->id);
                        FileEntry::whereIn('folder_id', $allFids)->delete();
                        Folder::whereIn('id', $allFids)->delete();
                    }
                }

                $time = now()->format('d M Y, H:i:s');
                ActivityLog::record(
                    $user->id,
                    'trash',
                    count($fileIds) + count($folderIds).' item',
                    'batch',
                    'Memindahkan beberapa item sekaligus ke tempat sampah'
                );

                return back()
                    ->with('success', 'Item terpilih berhasil dipindahkan ke tempat sampah.')
                    ->with('timestamp', $time)
                    ->with('action_type', 'trash');

            case 'restore':
                if (! empty($fileIds)) {
                    FileEntry::onlyTrashed()->where('user_id', $user->id)->whereIn('id', $fileIds)->restore();
                }
                foreach ($folderIds as $fid) {
                    $folder = Folder::onlyTrashed()->where('user_id', $user->id)->find($fid);
                    if ($folder) {
                        $descendants = $folder->allDescendants();
                        $allFids = $descendants->pluck('id')->push($folder->id);
                        Folder::onlyTrashed()->whereIn('id', $allFids)->restore();
                        FileEntry::onlyTrashed()->whereIn('folder_id', $allFids)->restore();
                    }
                }

                $time = now()->format('d M Y, H:i:s');
                ActivityLog::record(
                    $user->id,
                    'restore',
                    count($fileIds) + count($folderIds).' item',
                    'batch',
                    'Memulihkan beberapa item sekaligus dari tempat sampah'
                );

                return back()
                    ->with('success', 'Item terpilih berhasil dipulihkan.')
                    ->with('timestamp', $time)
                    ->with('action_type', 'restore');

            case 'force_delete':
                if (! empty($fileIds)) {
                    $files = FileEntry::onlyTrashed()->where('user_id', $user->id)->whereIn('id', $fileIds)->get();
                    foreach ($files as $file) {
                        Storage::disk('local')->delete($file->path);
                        $file->forceDelete();
                    }
                }
                foreach ($folderIds as $fid) {
                    $folder = Folder::onlyTrashed()->where('user_id', $user->id)->find($fid);
                    if ($folder) {
                        $descendants = $folder->allDescendants();
                        $allFids = $descendants->pluck('id')->push($folder->id);
                        $files = FileEntry::onlyTrashed()->whereIn('folder_id', $allFids)->get();
                        foreach ($files as $file) {
                            Storage::disk('local')->delete($file->path);
                            $file->forceDelete();
                        }
                        Folder::onlyTrashed()->whereIn('id', $allFids)->forceDelete();
                    }
                }

                $time = now()->format('d M Y, H:i:s');
                ActivityLog::record(
                    $user->id,
                    'delete',
                    count($fileIds) + count($folderIds).' item',
                    'batch',
                    'Menghapus beberapa item sekaligus secara permanen'
                );

                return back()
                    ->with('success', 'Item terpilih berhasil dihapus secara permanen dari server.')
                    ->with('timestamp', $time)
                    ->with('action_type', 'delete');

            case 'move':
                $targetId = ! empty($validated['target_folder_id']) ? (int) $validated['target_folder_id'] : null;
                if ($targetId !== null) {
                    Folder::where('user_id', $user->id)->where('id', $targetId)->firstOrFail();
                }

                if (! empty($fileIds)) {
                    FileEntry::where('user_id', $user->id)->whereIn('id', $fileIds)->update(['folder_id' => $targetId]);
                }

                foreach ($folderIds as $fid) {
                    $folder = Folder::where('user_id', $user->id)->find($fid);
                    if ($folder && ($targetId === null || ! $folder->isSelfOrDescendant($targetId))) {
                        $folder->update(['parent_id' => $targetId]);
                    }
                }

                return back()->with('success', 'Item terpilih berhasil dipindahkan.');

            case 'star':
                if (! empty($fileIds)) {
                    FileEntry::where('user_id', $user->id)->whereIn('id', $fileIds)->update(['is_starred' => true]);
                }
                if (! empty($folderIds)) {
                    Folder::where('user_id', $user->id)->whereIn('id', $folderIds)->update(['is_starred' => true]);
                }

                return back()->with('success', 'Item ditandai bintang.');

            case 'unstar':
                if (! empty($fileIds)) {
                    FileEntry::where('user_id', $user->id)->whereIn('id', $fileIds)->update(['is_starred' => false]);
                }
                if (! empty($folderIds)) {
                    Folder::where('user_id', $user->id)->whereIn('id', $folderIds)->update(['is_starred' => false]);
                }

                return back()->with('success', 'Tanda bintang dihapus.');
        }

        return back();
    }

    /**
     * Download multiple files and folders consolidated into a single ZIP.
     */
    public function batchDownload(Request $request): BinaryFileResponse
    {
        $validated = $request->validate([
            'file_ids' => ['nullable', 'array'],
            'file_ids.*' => ['integer'],
            'folder_ids' => ['nullable', 'array'],
            'folder_ids.*' => ['integer'],
        ]);

        $user = $request->user();
        $fileIds = $validated['file_ids'] ?? [];
        $folderIds = $validated['folder_ids'] ?? [];

        if (empty($fileIds) && empty($folderIds)) {
            abort(400, 'Tidak ada berkas atau folder yang dipilih.');
        }

        $zipFileName = sys_get_temp_dir().DIRECTORY_SEPARATOR.'cloudvault_batch_'.uniqid().'.zip';
        $zip = new ZipArchive;

        if ($zip->open($zipFileName, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            abort(500, 'Gagal membuat file arsip zip.');
        }

        if (! empty($fileIds)) {
            $files = FileEntry::where('user_id', $user->id)->whereIn('id', $fileIds)->get();
            foreach ($files as $file) {
                if (Storage::disk('local')->exists($file->path)) {
                    $zip->addFromString($file->name, Storage::disk('local')->get($file->path));
                }
            }
        }

        if (! empty($folderIds)) {
            $folders = Folder::where('user_id', $user->id)->whereIn('id', $folderIds)->get();
            foreach ($folders as $folder) {
                $this->addFolderToZip($zip, $folder, $folder->name);
            }
        }

        $zip->close();

        $archiveName = 'CloudVault_Export_'.date('Ymd_His').'.zip';

        return response()->download($zipFileName, $archiveName)->deleteFileAfterSend(true);
    }

    /**
     * Download folder as a ZIP archive.
     */
    public function downloadFolder(Request $request, Folder $folder): BinaryFileResponse
    {
        if ($folder->user_id !== $request->user()->id) {
            abort(403);
        }

        $zipFileName = sys_get_temp_dir().DIRECTORY_SEPARATOR.'folder_'.uniqid().'.zip';
        $zip = new ZipArchive;

        if ($zip->open($zipFileName, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            abort(500, 'Gagal membuat file arsip zip.');
        }

        $this->addFolderToZip($zip, $folder, $folder->name);
        $zip->close();

        return response()->download($zipFileName, $folder->name.'.zip')->deleteFileAfterSend(true);
    }

    /**
     * Recursively add folder and files to zip archive.
     */
    private function addFolderToZip(ZipArchive $zip, Folder $folder, string $currentPath): void
    {
        $zip->addEmptyDir($currentPath);

        $files = FileEntry::where('folder_id', $folder->id)->get();
        foreach ($files as $file) {
            if (Storage::disk('local')->exists($file->path)) {
                $fileContent = Storage::disk('local')->get($file->path);
                $zip->addFromString($currentPath.'/'.$file->name, $fileContent);
            }
        }

        $subfolders = Folder::where('parent_id', $folder->id)->get();
        foreach ($subfolders as $sub) {
            $this->addFolderToZip($zip, $sub, $currentPath.'/'.$sub->name);
        }
    }

    /**
     * Format bytes to readable size string.
     */
    public static function formatBytes(?int $bytes): string
    {
        $bytes = $bytes ?? 0;

        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2).' GB';
        }

        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2).' MB';
        }

        if ($bytes >= 1024) {
            return number_format($bytes / 1024, 2).' KB';
        }

        return $bytes.' B';
    }
}
