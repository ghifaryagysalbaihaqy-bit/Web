<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\DriveController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\FileRequestController;
use App\Http\Controllers\FileVersionController;
use App\Http\Controllers\IntegrationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ShareController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('drive.index');
    }

    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return redirect()->route('drive.index');
})->middleware(['auth', 'verified'])->name('dashboard');

// Cloud Storage Authenticated Routes
Route::middleware(['auth', 'verified'])->group(function () {
    // Drive Explorer
    Route::get('/drive', [DriveController::class, 'index'])->name('drive.index');
    Route::post('/drive/batch', [DriveController::class, 'batchAction'])->name('drive.batch');
    Route::post('/drive/batch-download', [DriveController::class, 'batchDownload'])->name('drive.batch-download');

    // Folder Operations
    Route::post('/folders', [DriveController::class, 'createFolder'])->name('folders.store');
    Route::patch('/folders/{folder}', [DriveController::class, 'renameFolder'])->name('folders.update');
    Route::patch('/folders/{folder}/color', [DriveController::class, 'updateFolderColor'])->name('folders.color');
    Route::patch('/folders/{folder}/move', [DriveController::class, 'moveFolder'])->name('folders.move');
    Route::post('/folders/{folder}/star', [DriveController::class, 'toggleStarFolder'])->name('folders.star');
    Route::delete('/folders/{folder}', [DriveController::class, 'trashFolder'])->name('folders.destroy');
    Route::post('/folders/{id}/restore', [DriveController::class, 'restoreFolder'])->name('folders.restore');
    Route::delete('/folders/{id}/force', [DriveController::class, 'forceDeleteFolder'])->name('folders.force-delete');
    Route::get('/folders/{folder}/download', [DriveController::class, 'downloadFolder'])->name('folders.download')->withTrashed();

    // File Operations
    Route::post('/files/upload', [FileController::class, 'upload'])->name('files.upload');
    Route::get('/files/{file}/download', [FileController::class, 'download'])->name('files.download')->withTrashed();
    Route::get('/files/{file}/preview', [FileController::class, 'preview'])->name('files.preview')->withTrashed();
    Route::get('/files/{file}/content', [FileController::class, 'getContent'])->name('files.content')->withTrashed();
    Route::post('/files/{file}/duplicate', [FileController::class, 'duplicate'])->name('files.duplicate');
    Route::patch('/files/{file}/rename', [FileController::class, 'rename'])->name('files.rename');
    Route::patch('/files/{file}/tags', [FileController::class, 'updateTags'])->name('files.tags');
    Route::post('/files/{file}/lock', [FileController::class, 'toggleLock'])->name('files.lock');
    Route::patch('/files/{file}/move', [FileController::class, 'move'])->name('files.move');
    Route::post('/files/{file}/star', [FileController::class, 'toggleStar'])->name('files.star');
    Route::delete('/files/{file}', [FileController::class, 'trash'])->name('files.destroy');
    Route::post('/files/{id}/restore', [FileController::class, 'restore'])->name('files.restore');
    Route::delete('/files/{id}/force', [FileController::class, 'forceDelete'])->name('files.force-delete');
    Route::post('/files/empty-trash', [FileController::class, 'emptyTrash'])->name('files.empty-trash');
    Route::get('/files/duplicates', [FileController::class, 'detectDuplicates'])->name('files.duplicates');

    // File Request Management
    Route::get('/file-requests', [FileRequestController::class, 'index'])->name('file-requests.index');
    Route::post('/file-requests', [FileRequestController::class, 'store'])->name('file-requests.store');
    Route::delete('/file-requests/{fileRequest}', [FileRequestController::class, 'destroy'])->name('file-requests.destroy');

    // Sharing Internal Management
    Route::post('/files/{file}/share', [ShareController::class, 'create'])->name('share.create');
    Route::get('/files/{file}/shares', [ShareController::class, 'listForFile'])->name('share.list');
    Route::delete('/share/{shareLink}', [ShareController::class, 'destroy'])->name('share.destroy');

    // Version History
    Route::get('/files/{file}/versions', [FileVersionController::class, 'index'])->name('files.versions.index');
    Route::post('/files/{file}/versions', [FileVersionController::class, 'store'])->name('files.versions.store');
    Route::post('/files/{file}/versions/{version}/restore', [FileVersionController::class, 'restore'])->name('files.versions.restore');
    Route::get('/files/{file}/versions/{version}/download', [FileVersionController::class, 'download'])->name('files.versions.download');

    // Activity Log
    Route::get('/activity-logs', [ActivityLogController::class, 'index'])->name('activity-logs.index');
    Route::delete('/activity-logs', [ActivityLogController::class, 'clear'])->name('activity-logs.clear');

    // App & WhatsApp Integrations
    Route::get('/integrations/info', [IntegrationController::class, 'getInfo'])->name('integrations.info');
    Route::post('/integrations/regenerate-token', [IntegrationController::class, 'regenerateToken'])->name('integrations.regenerate');
    Route::post('/integrations/simulate-upload', [IntegrationController::class, 'simulateWhatsAppUpload'])->name('integrations.simulate-upload');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Admin User Management Routes (Only Admin can add/manage users)
Route::middleware(['auth', 'verified', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
    Route::post('/users', [AdminUserController::class, 'store'])->name('users.store');
    Route::patch('/users/{user}', [AdminUserController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [AdminUserController::class, 'destroy'])->name('users.destroy');
    Route::post('/users/{user}/cancel-deletion', [AdminUserController::class, 'cancelDeletion'])->name('users.cancel-deletion');
    Route::delete('/users/{user}/force', [AdminUserController::class, 'forceDestroy'])->name('users.force-destroy');
});

// Public Share Routes
Route::get('/s/{token}', [ShareController::class, 'show'])->name('share.show');
Route::post('/s/{token}/unlock', [ShareController::class, 'unlock'])->name('share.unlock')->middleware('throttle:6,1');
Route::get('/s/{token}/download', [ShareController::class, 'download'])->name('share.download');
Route::get('/s/{token}/preview', [ShareController::class, 'preview'])->name('share.preview');
Route::post('/s/{token}/upload', [ShareController::class, 'uploadVersion'])->name('share.upload-version')->middleware('throttle:20,1');

// Public File Request Routes
Route::get('/r/{token}', [FileRequestController::class, 'showPublic'])->name('file-requests.show');
Route::post('/r/{token}/upload', [FileRequestController::class, 'uploadPublic'])->name('file-requests.upload')->middleware('throttle:20,1');

// XML Sitemap for Search Engines
Route::get('/sitemap.xml', function () {
    $xml = '<?xml version="1.0" encoding="UTF-8"?>';
    $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    $xml .= '<url><loc>'.url('/').'</loc><lastmod>'.now()->toAtomString().'</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>';
    $xml .= '<url><loc>'.url('/login').'</loc><lastmod>'.now()->toAtomString().'</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>';
    $xml .= '</urlset>';

    return response($xml, 200, ['Content-Type' => 'application/xml']);
})->name('sitemap');

require __DIR__.'/auth.php';
