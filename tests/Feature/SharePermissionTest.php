<?php

namespace Tests\Feature;

use App\Models\FileEntry;
use App\Models\ShareLink;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SharePermissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_share_link_with_editor_permission(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();

        $fileEntry = FileEntry::create([
            'user_id' => $user->id,
            'name' => 'presentation.pptx',
            'path' => 'files/1/test.pptx',
            'mime_type' => 'application/vnd.ms-powerpoint',
            'extension' => 'pptx',
            'size' => 1024,
        ]);

        $response = $this->actingAs($user)->postJson(route('share.create', $fileEntry), [
            'permission' => 'editor',
            'expires_in_days' => 14,
        ]);

        $response->assertOk()
            ->assertJson([
                'permission' => 'editor',
            ]);

        $this->assertDatabaseHas('share_links', [
            'file_entry_id' => $fileEntry->id,
            'permission' => 'editor',
        ]);
    }

    public function test_editor_link_can_upload_new_version(): void
    {
        Storage::fake('local');
        $owner = User::factory()->create();

        $originalFile = UploadedFile::fake()->create('doc_v1.txt', 10);
        $originalPath = $originalFile->store("files/{$owner->id}", 'local');

        $fileEntry = FileEntry::create([
            'user_id' => $owner->id,
            'name' => 'doc.txt',
            'path' => $originalPath,
            'mime_type' => 'text/plain',
            'extension' => 'txt',
            'size' => 10240,
        ]);

        $shareLink = ShareLink::create([
            'user_id' => $owner->id,
            'file_entry_id' => $fileEntry->id,
            'token' => 'editor-token-123',
            'permission' => 'editor',
        ]);

        $newRevision = UploadedFile::fake()->create('doc_v2.txt', 15);

        $response = $this->postJson(route('share.upload-version', $shareLink->token), [
            'file' => $newRevision,
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'version_number' => 2,
            ]);

        $fileEntry->refresh();
        $this->assertNotEquals($originalPath, $fileEntry->path);
        $this->assertEquals(15360, $fileEntry->size);
    }

    public function test_viewer_link_cannot_upload_new_version(): void
    {
        Storage::fake('local');
        $owner = User::factory()->create();

        $fileEntry = FileEntry::create([
            'user_id' => $owner->id,
            'name' => 'readonly.pdf',
            'path' => 'files/1/test.pdf',
            'mime_type' => 'application/pdf',
            'extension' => 'pdf',
            'size' => 1000,
        ]);

        $shareLink = ShareLink::create([
            'user_id' => $owner->id,
            'file_entry_id' => $fileEntry->id,
            'token' => 'viewer-token-456',
            'permission' => 'viewer',
        ]);

        $newRevision = UploadedFile::fake()->create('replacement.pdf', 15);

        $response = $this->postJson(route('share.upload-version', $shareLink->token), [
            'file' => $newRevision,
        ]);

        $response->assertStatus(403);
    }
}
