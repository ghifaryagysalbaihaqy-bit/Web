<?php

namespace Tests\Feature;

use App\Models\FileEntry;
use App\Models\FileRequest;
use App\Models\Folder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdvancedDriveFeaturesTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_update_folder_color(): void
    {
        $user = User::factory()->create();
        $folder = Folder::factory()->create(['user_id' => $user->id, 'color' => '#F2A900']);

        $response = $this->actingAs($user)->patch(route('folders.color', $folder->id), [
            'color' => '#3B82F6',
        ]);

        $response->assertSessionHas('success');
        $this->assertEquals('#3B82F6', $folder->fresh()->color);
    }

    public function test_user_can_update_file_tags(): void
    {
        $user = User::factory()->create();
        $file = FileEntry::factory()->create([
            'user_id' => $user->id,
            'tags' => ['Penting'],
        ]);

        $response = $this->actingAs($user)->patch(route('files.tags', $file->id), [
            'tags' => ['Penting', 'Finansial', '2026'],
        ]);

        $response->assertSessionHas('success');
        $this->assertEquals(['Penting', 'Finansial', '2026'], $file->fresh()->tags);
    }

    public function test_file_lock_prevents_modifications(): void
    {
        $user = User::factory()->create();
        $folder = Folder::factory()->create(['user_id' => $user->id]);
        $targetFolder = Folder::factory()->create(['user_id' => $user->id]);
        $file = FileEntry::factory()->create([
            'user_id' => $user->id,
            'folder_id' => $folder->id,
            'name' => 'original.pdf',
            'is_locked' => true,
        ]);

        // Attempt rename
        $renameResponse = $this->actingAs($user)->patch(route('files.rename', $file->id), [
            'name' => 'hacked.pdf',
        ]);
        $renameResponse->assertSessionHas('error');
        $this->assertEquals('original.pdf', $file->fresh()->name);

        // Attempt move
        $moveResponse = $this->actingAs($user)->patch(route('files.move', $file->id), [
            'target_folder_id' => $targetFolder->id,
        ]);
        $moveResponse->assertSessionHas('error');
        $this->assertEquals($folder->id, $file->fresh()->folder_id);

        // Attempt trash
        $trashResponse = $this->actingAs($user)->delete(route('files.destroy', $file->id));
        $trashResponse->assertSessionHas('error');
        $this->assertNull($file->fresh()->deleted_at);

        // Toggle unlock
        $unlockResponse = $this->actingAs($user)->post(route('files.lock', $file->id));
        $unlockResponse->assertSessionHas('success');
        $this->assertFalse($file->fresh()->is_locked);
    }

    public function test_duplicate_detection_endpoint(): void
    {
        $user = User::factory()->create();
        $checksum = hash('sha256', 'duplicate content sample');

        FileEntry::factory()->create([
            'user_id' => $user->id,
            'name' => 'original.docx',
            'checksum' => $checksum,
            'size' => 2048,
        ]);

        FileEntry::factory()->create([
            'user_id' => $user->id,
            'name' => 'copy.docx',
            'checksum' => $checksum,
            'size' => 2048,
        ]);

        $response = $this->actingAs($user)->getJson(route('files.duplicates'));

        $response->assertOk();
        $response->assertJsonStructure([
            'duplicate_groups',
            'total_groups',
            'formatted_total_wasted',
        ]);
        $this->assertCount(1, $response->json('duplicate_groups'));
        $this->assertEquals(1, $response->json('total_groups'));
    }

    public function test_file_request_creation_and_guest_public_upload(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $destFolder = Folder::factory()->create(['user_id' => $user->id]);

        // 1. Create file request link
        $storeResponse = $this->actingAs($user)->postJson(route('file-requests.store'), [
            'title' => 'Permintaan Berkas KTP & CV',
            'description' => 'Silakan unggah dokumen PDF Anda',
            'folder_id' => $destFolder->id,
            'expires_in_days' => 5,
        ]);

        $storeResponse->assertCreated();
        $fileRequest = FileRequest::where('user_id', $user->id)->first();
        $this->assertNotNull($fileRequest);
        $this->assertEquals('Permintaan Berkas KTP & CV', $fileRequest->title);

        // 2. Guest visits public link
        $publicViewResponse = $this->get(route('file-requests.show', $fileRequest->token));
        $publicViewResponse->assertOk();

        // 3. Guest uploads files via public link
        $uploadFile = UploadedFile::fake()->create('document_submission.pdf', 500, 'application/pdf');

        $uploadResponse = $this->post(route('file-requests.upload', $fileRequest->token), [
            'uploader_name' => 'Ahmad Syarif',
            'files' => [$uploadFile],
        ]);

        $uploadResponse->assertOk();
        $uploadResponse->assertJson(['success' => true]);

        // Check file created in destination folder owned by recipient user
        $uploadedEntry = FileEntry::where('user_id', $user->id)
            ->where('folder_id', $destFolder->id)
            ->where('name', 'document_submission.pdf')
            ->first();

        $this->assertNotNull($uploadedEntry);
        $this->assertEquals(1, $fileRequest->fresh()->uploads_count);
    }
}
