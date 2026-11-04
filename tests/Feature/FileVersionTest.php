<?php

namespace Tests\Feature;

use App\Models\FileEntry;
use App\Models\FileVersion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FileVersionTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_view_file_versions(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $file = UploadedFile::fake()->create('document.pdf', 100);
        $path = $file->store("files/{$user->id}", 'local');

        $fileEntry = FileEntry::create([
            'user_id' => $user->id,
            'name' => 'document.pdf',
            'path' => $path,
            'mime_type' => 'application/pdf',
            'extension' => 'pdf',
            'size' => 102400,
        ]);

        $response = $this->actingAs($user)->getJson(route('files.versions.index', $fileEntry));

        $response->assertOk()
            ->assertJsonStructure([
                'file_id',
                'file_name',
                'current_size',
                'versions' => [
                    '*' => ['id', 'version_number', 'formatted_size', 'is_current'],
                ],
            ]);
    }

    public function test_user_can_upload_new_file_version(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $file = UploadedFile::fake()->create('contract.docx', 50);
        $path = $file->store("files/{$user->id}", 'local');

        $fileEntry = FileEntry::create([
            'user_id' => $user->id,
            'name' => 'contract.docx',
            'path' => $path,
            'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'extension' => 'docx',
            'size' => 51200,
        ]);

        $newVersionFile = UploadedFile::fake()->create('contract_v2.docx', 80);

        $response = $this->actingAs($user)->postJson(route('files.versions.store', $fileEntry), [
            'file' => $newVersionFile,
            'notes' => 'Perubahan pasal 2',
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'version_number' => 2,
            ]);

        $this->assertDatabaseHas('file_versions', [
            'file_entry_id' => $fileEntry->id,
            'version_number' => 2,
            'notes' => 'Perubahan pasal 2',
        ]);

        // FileEntry path should have updated
        $fileEntry->refresh();
        $this->assertNotEquals($path, $fileEntry->path);
    }

    public function test_user_can_restore_previous_file_version(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();

        // Create version 1 physical file
        $file1 = UploadedFile::fake()->create('report_v1.txt', 10);
        $path1 = $file1->store("files/{$user->id}", 'local');

        // Create version 2 physical file
        $file2 = UploadedFile::fake()->create('report_v2.txt', 20);
        $path2 = $file2->store("files/{$user->id}", 'local');

        $fileEntry = FileEntry::create([
            'user_id' => $user->id,
            'name' => 'report.txt',
            'path' => $path2,
            'mime_type' => 'text/plain',
            'extension' => 'txt',
            'size' => 20480,
        ]);

        $version1 = FileVersion::create([
            'file_entry_id' => $fileEntry->id,
            'version_number' => 1,
            'path' => $path1,
            'size' => 10240,
            'mime_type' => 'text/plain',
            'created_by' => $user->id,
            'notes' => 'Versi 1',
        ]);

        $version2 = FileVersion::create([
            'file_entry_id' => $fileEntry->id,
            'version_number' => 2,
            'path' => $path2,
            'size' => 20480,
            'mime_type' => 'text/plain',
            'created_by' => $user->id,
            'notes' => 'Versi 2',
        ]);

        // Restore version 1
        $response = $this->actingAs($user)->postJson(route('files.versions.restore', [$fileEntry, $version1]));

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'restored_version_number' => 1,
                'new_version_number' => 3,
            ]);

        $fileEntry->refresh();
        $this->assertEquals(10240, $fileEntry->size);
    }

    public function test_user_can_download_file_version(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();

        $file = UploadedFile::fake()->create('archive.zip', 500);
        $path = $file->store("files/{$user->id}", 'local');

        $fileEntry = FileEntry::create([
            'user_id' => $user->id,
            'name' => 'archive.zip',
            'path' => $path,
            'mime_type' => 'application/zip',
            'extension' => 'zip',
            'size' => 512000,
        ]);

        $version = FileVersion::create([
            'file_entry_id' => $fileEntry->id,
            'version_number' => 1,
            'path' => $path,
            'size' => 512000,
            'mime_type' => 'application/zip',
            'created_by' => $user->id,
            'notes' => 'Versi awal',
        ]);

        $response = $this->actingAs($user)->get(route('files.versions.download', [$fileEntry, $version]));

        $response->assertOk();
    }
}
