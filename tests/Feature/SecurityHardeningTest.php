<?php

namespace Tests\Feature;

use App\Models\FileEntry;
use App\Models\Folder;
use App\Models\ShareLink;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SecurityHardeningTest extends TestCase
{
    use RefreshDatabase;

    public function test_security_headers_are_present_on_responses(): void
    {
        $response = $this->get('/');

        $response->assertOk();
        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-XSS-Protection', '1; mode=block');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader('Permissions-Policy');
    }

    public function test_dangerous_executable_file_uploads_can_be_blocked_when_configured(): void
    {
        config(['cloudvault.allow_all_file_types' => false]);
        Storage::fake('local');
        $user = User::factory()->create();

        $dangerousFiles = [
            UploadedFile::fake()->create('malicious.php', 10, 'application/x-php'),
            UploadedFile::fake()->create('exploit.phtml', 10, 'text/html'),
            UploadedFile::fake()->create('virus.exe', 50, 'application/x-msdownload'),
            UploadedFile::fake()->create('payload.sh', 5, 'application/x-sh'),
        ];

        foreach ($dangerousFiles as $file) {
            $response = $this->actingAs($user)->post(route('files.upload'), [
                'files' => [$file],
            ]);

            $response->assertSessionHasErrors('files');
        }

        $this->assertDatabaseCount('file_entries', 0);
    }

    public function test_all_file_types_can_be_uploaded_by_default(): void
    {
        config(['cloudvault.allow_all_file_types' => true]);
        Storage::fake('local');
        $user = User::factory()->create();

        $variousFiles = [
            UploadedFile::fake()->create('installer.exe', 50, 'application/x-msdownload'),
            UploadedFile::fake()->create('script.sh', 5, 'application/x-sh'),
            UploadedFile::fake()->create('index.php', 10, 'application/x-php'),
            UploadedFile::fake()->create('backup.zip', 100, 'application/zip'),
            UploadedFile::fake()->create('program.bin', 30, 'application/octet-stream'),
        ];

        $response = $this->actingAs($user)->post(route('files.upload'), [
            'files' => $variousFiles,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseCount('file_entries', 5);
        $this->assertDatabaseHas('file_entries', ['name' => 'installer.exe']);
        $this->assertDatabaseHas('file_entries', ['name' => 'script.sh']);
        $this->assertDatabaseHas('file_entries', ['name' => 'index.php']);
    }

    public function test_filename_sanitization_prevents_path_traversal(): void
    {
        $sanitized = FileEntry::sanitizeFileName('../../../secret.txt');
        $this->assertEquals('secret.txt', $sanitized);

        $withNullByte = FileEntry::sanitizeFileName("report\0.pdf");
        $this->assertEquals('report.pdf', $withNullByte);

        $withQuotes = FileEntry::sanitizeFileName('bad"name".docx');
        $this->assertEquals('badname.docx', $withQuotes);
    }

    public function test_rate_limiting_protects_share_unlock_against_brute_force(): void
    {
        RateLimiter::clear('share-unlock:1:127.0.0.1');

        $user = User::factory()->create();
        $file = FileEntry::factory()->create(['user_id' => $user->id]);
        $shareLink = ShareLink::create([
            'id' => 9999,
            'file_entry_id' => $file->id,
            'user_id' => $user->id,
            'token' => 'securetoken123',
            'password' => Hash::make('secretpass123'),
            'permission' => 'viewer',
            'downloads_count' => 0,
        ]);

        // Attempt 6 wrong passwords
        for ($i = 0; $i < 6; $i++) {
            $response = $this->post(route('share.unlock', $shareLink->token), [
                'password' => 'wrongpass_'.$i,
            ]);
            $response->assertSessionHasErrors('password');
        }

        // 7th attempt must be locked out by throttle / RateLimiter
        $lockedResponse = $this->post(route('share.unlock', $shareLink->token), [
            'password' => 'secretpass123',
        ]);
        $lockedResponse->assertStatus(429);
    }

    public function test_svg_preview_includes_sandbox_csp_header(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $fakePath = 'files/'.$user->id.'/vector.svg';
        Storage::disk('local')->put($fakePath, '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>');

        $file = FileEntry::factory()->create([
            'user_id' => $user->id,
            'name' => 'vector.svg',
            'path' => $fakePath,
            'extension' => 'svg',
            'mime_type' => 'image/svg+xml',
        ]);

        $response = $this->actingAs($user)->get(route('files.preview', $file->id));

        $response->assertOk();
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('Content-Security-Policy');
        $this->assertStringContainsString('sandbox', $response->headers->get('Content-Security-Policy'));
    }

    public function test_idor_protection_prevents_access_to_other_users_files(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        $fileA = FileEntry::factory()->create(['user_id' => $userA->id, 'name' => 'private_a.pdf']);
        $folderA = Folder::factory()->create(['user_id' => $userA->id, 'name' => 'Secret Folder A']);

        // User B attempts to download file A
        $this->actingAs($userB)->get(route('files.download', $fileA->id))->assertForbidden();

        // User B attempts to rename file A
        $this->actingAs($userB)->patch(route('files.rename', $fileA->id), ['name' => 'hacked.pdf'])->assertForbidden();

        // User B attempts to trash file A
        $this->actingAs($userB)->delete(route('files.destroy', $fileA->id))->assertForbidden();

        // User B attempts to rename folder A
        $this->actingAs($userB)->patch(route('folders.update', $folderA->id), ['name' => 'hacked folder'])->assertForbidden();

        // User B attempts to trash folder A
        $this->actingAs($userB)->delete(route('folders.destroy', $folderA->id))->assertForbidden();
    }
}
