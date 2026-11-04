<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\FileEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ActivityLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_uploading_file_records_activity_log(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $file = UploadedFile::fake()->create('project.pdf', 200);

        $response = $this->actingAs($user)->post(route('files.upload'), [
            'files' => [$file],
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $user->id,
            'action' => 'upload',
            'item_name' => 'project.pdf',
            'item_type' => 'file',
        ]);
    }

    public function test_trashing_file_records_activity_log(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();

        $fileEntry = FileEntry::create([
            'user_id' => $user->id,
            'name' => 'old_note.txt',
            'path' => 'files/1/test.txt',
            'mime_type' => 'text/plain',
            'extension' => 'txt',
            'size' => 100,
        ]);

        $response = $this->actingAs($user)->delete(route('files.destroy', $fileEntry));

        $response->assertRedirect();

        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $user->id,
            'action' => 'trash',
            'item_name' => 'old_note.txt',
            'item_type' => 'file',
        ]);
    }

    public function test_creating_folder_records_activity_log(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('folders.store'), [
            'name' => 'Laporan Keuangan',
            'color' => '#F2A900',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $user->id,
            'action' => 'folder_create',
            'item_name' => 'Laporan Keuangan',
            'item_type' => 'folder',
        ]);
    }

    public function test_user_can_retrieve_activity_logs(): void
    {
        $user = User::factory()->create();

        ActivityLog::record($user->id, 'upload', 'file1.png', 'file', 'Upload berkas');
        ActivityLog::record($user->id, 'trash', 'file2.png', 'file', 'Pindah ke sampah');

        $response = $this->actingAs($user)->getJson(route('activity-logs.index'));

        $response->assertOk()
            ->assertJsonCount(2, 'logs')
            ->assertJsonStructure([
                'logs' => [
                    '*' => ['id', 'action', 'item_name', 'item_type', 'description', 'created_at', 'time_ago'],
                ],
            ]);
    }

    public function test_user_can_clear_activity_logs(): void
    {
        $user = User::factory()->create();

        ActivityLog::record($user->id, 'upload', 'sample.docx', 'file', 'Upload file');

        $this->assertDatabaseCount('activity_logs', 1);

        $response = $this->actingAs($user)->deleteJson(route('activity-logs.clear'));

        $response->assertOk()->assertJson(['success' => true]);

        $this->assertDatabaseCount('activity_logs', 0);
    }
}
