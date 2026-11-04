<?php

namespace Tests\Feature;

use App\Models\FileEntry;
use App\Models\Folder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DriveTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login_from_drive(): void
    {
        $response = $this->get('/drive');

        $response->assertRedirect('/login');
    }

    public function test_authenticated_user_can_view_drive(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/drive');

        $response->assertOk();
    }

    public function test_user_can_create_folder(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('folders.store'), [
            'name' => 'Proyek Rahasia',
            'color' => '#3B82F6',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('folders', [
            'user_id' => $user->id,
            'name' => 'Proyek Rahasia',
            'color' => '#3B82F6',
        ]);
    }

    public function test_user_can_upload_file(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();

        $file = UploadedFile::fake()->create('document.pdf', 250, 'application/pdf');

        $response = $this->actingAs($user)->post(route('files.upload'), [
            'files' => [$file],
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('file_entries', [
            'user_id' => $user->id,
            'name' => 'document.pdf',
            'mime_type' => 'application/pdf',
        ]);

        $entry = FileEntry::first();
        Storage::disk('local')->assertExists($entry->path);
    }

    public function test_user_cannot_upload_beyond_storage_limit(): void
    {
        Storage::fake('local');
        // Storage limit: 500 bytes
        $user = User::factory()->create(['storage_limit' => 500]);

        $file = UploadedFile::fake()->create('huge.zip', 2048); // 2048 KB = ~2MB

        $response = $this->actingAs($user)->post(route('files.upload'), [
            'files' => [$file],
        ]);

        $response->assertSessionHasErrors('files');
        $this->assertDatabaseEmpty('file_entries');
    }

    public function test_user_can_rename_folder_and_file(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $folder = Folder::factory()->create(['user_id' => $user->id, 'name' => 'Nama Lama']);
        $file = FileEntry::factory()->create(['user_id' => $user->id, 'name' => 'lama.txt']);

        $response = $this->actingAs($user)->patch(route('folders.update', $folder), [
            'name' => 'Nama Baru',
        ]);
        $response->assertRedirect();
        $this->assertDatabaseHas('folders', ['id' => $folder->id, 'name' => 'Nama Baru']);

        $response = $this->actingAs($user)->patch(route('files.rename', $file), [
            'name' => 'baru.txt',
        ]);
        $response->assertRedirect();
        $this->assertDatabaseHas('file_entries', ['id' => $file->id, 'name' => 'baru.txt']);
    }

    public function test_user_can_trash_and_restore_file(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $file = FileEntry::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)->delete(route('files.destroy', $file));
        $this->assertSoftDeleted('file_entries', ['id' => $file->id]);

        $this->actingAs($user)->post(route('files.restore', $file->id));
        $this->assertNotSoftDeleted('file_entries', ['id' => $file->id]);
    }

    public function test_user_can_share_file_and_public_can_download(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();

        $path = 'files/'.$user->id.'/sample.pdf';
        Storage::disk('local')->put($path, 'Contoh isi file PDF');

        $file = FileEntry::factory()->create([
            'user_id' => $user->id,
            'name' => 'sample.pdf',
            'path' => $path,
            'size' => 19,
        ]);

        $shareResponse = $this->actingAs($user)->postJson(route('share.create', $file->id), [
            'expires_in_days' => 7,
        ]);

        $shareResponse->assertOk()->assertJsonStructure(['share_url', 'token']);
        $token = $shareResponse->json('token');

        // Public page view
        $this->get(route('share.show', $token))->assertOk();

        // Public download
        $downloadResponse = $this->get(route('share.download', $token));
        $downloadResponse->assertOk();
    }

    public function test_user_can_download_folder_as_zip(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $folder = Folder::factory()->create(['user_id' => $user->id, 'name' => 'ProyekZip']);

        $path = 'files/'.$user->id.'/konten.txt';
        Storage::disk('local')->put($path, 'Hello World dari CloudVault');

        FileEntry::factory()->create([
            'user_id' => $user->id,
            'folder_id' => $folder->id,
            'name' => 'konten.txt',
            'path' => $path,
            'size' => 28,
        ]);

        $response = $this->actingAs($user)->get(route('folders.download', $folder));
        $response->assertOk();
        $response->assertDownload('ProyekZip.zip');
    }

    public function test_user_can_move_folder_and_cannot_move_into_self_or_descendant(): void
    {
        $user = User::factory()->create();
        $parent = Folder::factory()->create(['user_id' => $user->id, 'name' => 'Induk']);
        $child = Folder::factory()->create(['user_id' => $user->id, 'parent_id' => $parent->id, 'name' => 'Anak']);
        $other = Folder::factory()->create(['user_id' => $user->id, 'name' => 'Lain']);

        // Attempt circular move (parent into its child) should fail with session error
        $circularResponse = $this->actingAs($user)->patch(route('folders.move', $parent), [
            'parent_id' => $child->id,
        ]);
        $circularResponse->assertSessionHas('error');

        // Attempt move into itself should fail with session error
        $selfResponse = $this->actingAs($user)->patch(route('folders.move', $parent), [
            'parent_id' => $parent->id,
        ]);
        $selfResponse->assertSessionHas('error');

        // Valid move: move child to other folder
        $response = $this->actingAs($user)->patch(route('folders.move', $child), [
            'parent_id' => $other->id,
        ]);
        $response->assertRedirect();
        $this->assertDatabaseHas('folders', ['id' => $child->id, 'parent_id' => $other->id]);
    }

    public function test_folder_cascading_trash_and_restore_restores_all_subfolders_and_files(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $parent = Folder::factory()->create(['user_id' => $user->id, 'name' => 'Induk']);
        $child = Folder::factory()->create(['user_id' => $user->id, 'parent_id' => $parent->id, 'name' => 'Anak']);
        $file = FileEntry::factory()->create(['user_id' => $user->id, 'folder_id' => $child->id, 'name' => 'child.txt']);

        // Trash parent folder
        $this->actingAs($user)->delete(route('folders.destroy', $parent));
        $this->assertSoftDeleted('folders', ['id' => $parent->id]);
        $this->assertSoftDeleted('folders', ['id' => $child->id]);
        $this->assertSoftDeleted('file_entries', ['id' => $file->id]);

        // Restore parent folder
        $this->actingAs($user)->post(route('folders.restore', $parent->id));
        $this->assertNotSoftDeleted('folders', ['id' => $parent->id]);
        $this->assertNotSoftDeleted('folders', ['id' => $child->id]);
        $this->assertNotSoftDeleted('file_entries', ['id' => $file->id]);
    }

    public function test_user_can_execute_batch_actions(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $folder = Folder::factory()->create(['user_id' => $user->id]);
        $file1 = FileEntry::factory()->create(['user_id' => $user->id]);
        $file2 = FileEntry::factory()->create(['user_id' => $user->id]);

        // Batch trash
        $response = $this->actingAs($user)->post(route('drive.batch'), [
            'action' => 'trash',
            'file_ids' => [$file1->id, $file2->id],
            'folder_ids' => [$folder->id],
        ]);
        $response->assertRedirect();
        $this->assertSoftDeleted('file_entries', ['id' => $file1->id]);
        $this->assertSoftDeleted('file_entries', ['id' => $file2->id]);
        $this->assertSoftDeleted('folders', ['id' => $folder->id]);

        // Batch restore
        $this->actingAs($user)->post(route('drive.batch'), [
            'action' => 'restore',
            'file_ids' => [$file1->id, $file2->id],
            'folder_ids' => [$folder->id],
        ]);
        $this->assertNotSoftDeleted('file_entries', ['id' => $file1->id]);
        $this->assertNotSoftDeleted('file_entries', ['id' => $file2->id]);
        $this->assertNotSoftDeleted('folders', ['id' => $folder->id]);
    }

    public function test_user_can_upload_multiple_files_simultaneously(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();

        $file1 = UploadedFile::fake()->create('doc1.pdf', 100, 'application/pdf');
        $file2 = UploadedFile::fake()->create('img1.png', 200, 'image/png');
        $file3 = UploadedFile::fake()->create('note.txt', 50, 'text/plain');

        $response = $this->actingAs($user)->post(route('files.upload'), [
            'files' => [$file1, $file2, $file3],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseCount('file_entries', 3);
        $this->assertDatabaseHas('file_entries', ['user_id' => $user->id, 'name' => 'doc1.pdf']);
        $this->assertDatabaseHas('file_entries', ['user_id' => $user->id, 'name' => 'img1.png']);
        $this->assertDatabaseHas('file_entries', ['user_id' => $user->id, 'name' => 'note.txt']);

        foreach (FileEntry::all() as $entry) {
            Storage::disk('local')->assertExists($entry->path);
        }
    }

    public function test_user_can_batch_force_delete_items_from_trash(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();

        $path1 = "files/{$user->id}/f1.txt";
        $path2 = "files/{$user->id}/f2.txt";
        Storage::disk('local')->put($path1, 'Item 1');
        Storage::disk('local')->put($path2, 'Item 2');

        $file1 = FileEntry::factory()->create(['user_id' => $user->id, 'name' => 'f1.txt', 'path' => $path1]);
        $file2 = FileEntry::factory()->create(['user_id' => $user->id, 'name' => 'f2.txt', 'path' => $path2]);
        $folder = Folder::factory()->create(['user_id' => $user->id, 'name' => 'TrashFolder']);

        // Soft delete first
        $file1->delete();
        $file2->delete();
        $folder->delete();

        // Batch permanent delete
        $response = $this->actingAs($user)->post(route('drive.batch'), [
            'action' => 'force_delete',
            'file_ids' => [$file1->id, $file2->id],
            'folder_ids' => [$folder->id],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseMissing('file_entries', ['id' => $file1->id]);
        $this->assertDatabaseMissing('file_entries', ['id' => $file2->id]);
        $this->assertDatabaseMissing('folders', ['id' => $folder->id]);

        Storage::disk('local')->assertMissing($path1);
        Storage::disk('local')->assertMissing($path2);
    }

    public function test_user_can_preview_and_download_trashed_file(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();

        $path = "files/{$user->id}/photo.jpg";
        Storage::disk('local')->put($path, 'fake-jpeg-content');

        $file = FileEntry::factory()->create([
            'user_id' => $user->id,
            'name' => 'photo.jpg',
            'mime_type' => 'image/jpeg',
            'extension' => 'jpg',
            'path' => $path,
            'size' => 17,
        ]);

        // Move to trash
        $file->delete();
        $this->assertSoftDeleted('file_entries', ['id' => $file->id]);

        // Can preview trashed image/video
        $previewRes = $this->actingAs($user)->get(route('files.preview', $file));
        $previewRes->assertOk();

        // Can download trashed file
        $downloadRes = $this->actingAs($user)->get(route('files.download', $file));
        $downloadRes->assertOk();
    }

    public function test_user_can_duplicate_file(): void
    {
        Storage::fake('local');
        $user = User::factory()->create(['storage_limit' => 5368709120]);

        $path = "files/{$user->id}/original.txt";
        Storage::disk('local')->put($path, 'Konten original');

        $file = FileEntry::factory()->create([
            'user_id' => $user->id,
            'name' => 'original.txt',
            'path' => $path,
            'size' => 15,
        ]);

        $response = $this->actingAs($user)->post(route('files.duplicate', $file));
        $response->assertRedirect();

        $this->assertDatabaseHas('file_entries', [
            'user_id' => $user->id,
            'name' => 'original (Salinan).txt',
        ]);
    }

    public function test_user_can_get_text_file_content_for_editor(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();

        $path = "files/{$user->id}/readme.md";
        Storage::disk('local')->put($path, '# Hello CloudVault');

        $file = FileEntry::factory()->create([
            'user_id' => $user->id,
            'name' => 'readme.md',
            'extension' => 'md',
            'path' => $path,
            'size' => 18,
        ]);

        $response = $this->actingAs($user)->getJson(route('files.content', $file));
        $response->assertOk();
        $response->assertJsonFragment([
            'content' => '# Hello CloudVault',
            'name' => 'readme.md',
        ]);
    }

    public function test_user_can_list_and_revoke_file_shares(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $file = FileEntry::factory()->create(['user_id' => $user->id]);

        $createRes = $this->actingAs($user)->postJson(route('share.create', $file->id), [
            'expires_in_days' => 3,
        ]);
        $createRes->assertOk();
        $linkId = $createRes->json('id');

        // List shares
        $listRes = $this->actingAs($user)->getJson(route('share.list', $file->id));
        $listRes->assertOk();
        $this->assertCount(1, $listRes->json('links'));

        // Revoke share
        $deleteRes = $this->actingAs($user)->delete(route('share.destroy', $linkId));
        $deleteRes->assertRedirect();
        $this->assertDatabaseMissing('share_links', ['id' => $linkId]);
    }

    public function test_user_can_download_batch_items_as_zip(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();

        $path1 = "files/{$user->id}/f1.txt";
        $path2 = "files/{$user->id}/f2.txt";
        Storage::disk('local')->put($path1, 'Item 1');
        Storage::disk('local')->put($path2, 'Item 2');

        $file1 = FileEntry::factory()->create(['user_id' => $user->id, 'name' => 'f1.txt', 'path' => $path1]);
        $file2 = FileEntry::factory()->create(['user_id' => $user->id, 'name' => 'f2.txt', 'path' => $path2]);
        $folder = Folder::factory()->create(['user_id' => $user->id, 'name' => 'BatchFolder']);

        $response = $this->actingAs($user)->post(route('drive.batch-download'), [
            'file_ids' => [$file1->id, $file2->id],
            'folder_ids' => [$folder->id],
        ]);

        $response->assertOk();
        $this->assertTrue(str_contains($response->headers->get('content-disposition') ?? '', 'CloudVault_Export_'));
    }

    public function test_user_can_upload_various_document_types(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();

        $docs = [
            UploadedFile::fake()->create('laporan.DOCX', 300, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
            UploadedFile::fake()->create('anggaran.XLSX', 150, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
            UploadedFile::fake()->create('presentasi.PPTX', 500, 'application/vnd.openxmlformats-officedocument.presentationml.presentation'),
            UploadedFile::fake()->create('data.CSV', 50, 'text/csv'),
            UploadedFile::fake()->create('buku.EPUB', 800, 'application/epub+zip'),
            UploadedFile::fake()->create('surat.ODT', 120, 'application/vnd.oasis.opendocument.text'),
        ];

        foreach ($docs as $doc) {
            $response = $this->actingAs($user)->post(route('files.upload'), [
                'files' => [$doc],
            ]);
            $response->assertRedirect();
        }

        $this->assertDatabaseHas('file_entries', [
            'user_id' => $user->id,
            'name' => 'laporan.DOCX',
            'extension' => 'docx',
        ]);
        $this->assertDatabaseHas('file_entries', [
            'user_id' => $user->id,
            'name' => 'anggaran.XLSX',
            'extension' => 'xlsx',
        ]);
        $this->assertDatabaseHas('file_entries', [
            'user_id' => $user->id,
            'name' => 'presentasi.PPTX',
            'extension' => 'pptx',
        ]);
        $this->assertDatabaseHas('file_entries', [
            'user_id' => $user->id,
            'name' => 'data.CSV',
            'extension' => 'csv',
        ]);
        $this->assertDatabaseHas('file_entries', [
            'user_id' => $user->id,
            'name' => 'buku.EPUB',
            'extension' => 'epub',
        ]);
        $this->assertDatabaseHas('file_entries', [
            'user_id' => $user->id,
            'name' => 'surat.ODT',
            'extension' => 'odt',
        ]);
    }

    public function test_document_filter_includes_all_document_formats(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();

        FileEntry::factory()->create(['user_id' => $user->id, 'name' => 'test.docx', 'extension' => 'docx', 'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
        FileEntry::factory()->create(['user_id' => $user->id, 'name' => 'test.xlsx', 'extension' => 'xlsx', 'mime_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
        FileEntry::factory()->create(['user_id' => $user->id, 'name' => 'test.pptx', 'extension' => 'pptx', 'mime_type' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation']);
        FileEntry::factory()->create(['user_id' => $user->id, 'name' => 'test.csv', 'extension' => 'csv', 'mime_type' => 'text/csv']);
        FileEntry::factory()->create(['user_id' => $user->id, 'name' => 'test.epub', 'extension' => 'epub', 'mime_type' => 'application/epub+zip']);
        FileEntry::factory()->create(['user_id' => $user->id, 'name' => 'test.pdf', 'extension' => 'pdf', 'mime_type' => 'application/pdf']);
        // Non-document files
        FileEntry::factory()->create(['user_id' => $user->id, 'name' => 'photo.jpg', 'extension' => 'jpg', 'mime_type' => 'image/jpeg']);
        FileEntry::factory()->create(['user_id' => $user->id, 'name' => 'clip.mp4', 'extension' => 'mp4', 'mime_type' => 'video/mp4']);

        $response = $this->actingAs($user)->get('/drive?filter=document');
        $response->assertOk();

        $response->assertInertia(fn ($page) => $page
            ->component('Drive/Index')
            ->has('files', 6)
        );
    }

    public function test_user_can_upload_file_with_ajax_json_response(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();

        $file = UploadedFile::fake()->create('project_data.json', 100, 'application/json');

        $response = $this->actingAs($user)->postJson(route('files.upload'), [
            'files' => [$file],
        ]);

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'action_type' => 'upload',
        ]);
        $this->assertNotEmpty($response->json('timestamp'));

        $this->assertDatabaseHas('file_entries', [
            'user_id' => $user->id,
            'name' => 'project_data.json',
            'extension' => 'json',
        ]);
    }
}
