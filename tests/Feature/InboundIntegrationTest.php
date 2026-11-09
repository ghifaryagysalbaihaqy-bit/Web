<?php

namespace Tests\Feature;

use App\Models\Folder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class InboundIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
    }

    public function test_get_inbound_status_returns_active(): void
    {
        $user = User::factory()->create();
        $token = $user->ensureWebhookToken();

        $response = $this->getJson("/api/v1/inbound/{$token}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'status' => 'active',
                'target_folder' => 'WhatsApp Media',
            ]);
    }

    public function test_meta_whatsapp_cloud_api_webhook_verification_handshake(): void
    {
        $user = User::factory()->create();
        $token = $user->ensureWebhookToken();

        $response = $this->get("/api/v1/inbound/{$token}?hub_mode=subscribe&hub_verify_token={$token}&hub_challenge=987654321");

        $response->assertStatus(200);
        $this->assertEquals('987654321', $response->getContent());
    }

    public function test_inbound_rejects_invalid_token(): void
    {
        $file = UploadedFile::fake()->create('foto_wa.jpg', 50, 'image/jpeg');

        $response = $this->postJson('/api/v1/inbound/invalid_random_token_123', [
            'file' => $file,
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
            ]);
    }

    public function test_inbound_saves_multipart_whatsapp_photo_into_whatsapp_media_folder(): void
    {
        $user = User::factory()->create();
        $token = $user->ensureWebhookToken();
        $file = UploadedFile::fake()->create('struk_pembayaran.jpg', 200, 'image/jpeg');

        $response = $this->post("/api/v1/inbound/{$token}", [
            'file' => $file,
            'sender' => '6281234567890',
            'caption' => 'Ini struk belanja tadi siang',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'struk_pembayaran.jpg',
                    'folder' => 'WhatsApp Media',
                ],
            ]);

        $this->assertDatabaseHas('folders', [
            'user_id' => $user->id,
            'name' => 'WhatsApp Media',
            'color' => '#25D366',
        ]);

        $folder = Folder::where('user_id', $user->id)->where('name', 'WhatsApp Media')->first();
        $this->assertNotNull($folder);

        $this->assertDatabaseHas('file_entries', [
            'user_id' => $user->id,
            'folder_id' => $folder->id,
            'name' => 'struk_pembayaran.jpg',
            'extension' => 'jpg',
        ]);

        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $user->id,
            'action' => 'upload',
        ]);
    }

    public function test_inbound_saves_base64_image_payload(): void
    {
        $user = User::factory()->create();
        $token = $user->ensureWebhookToken();

        // 1x1 transparent PNG base64
        $base64Png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        $response = $this->postJson("/api/v1/inbound/{$token}", [
            'data' => $base64Png,
            'name' => 'tanda_tangan_wa.png',
            'sender' => '628987654321',
            'caption' => 'Tanda tangan dokumen',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'tanda_tangan_wa.png',
                    'folder' => 'WhatsApp Media',
                ],
            ]);

        $this->assertDatabaseHas('file_entries', [
            'user_id' => $user->id,
            'name' => 'tanda_tangan_wa.png',
            'extension' => 'png',
        ]);
    }

    public function test_inbound_blocks_dangerous_extensions(): void
    {
        config(['cloudvault.allow_all_file_types' => false]);
        $user = User::factory()->create();
        $token = $user->ensureWebhookToken();
        $fakePhp = UploadedFile::fake()->create('backdoor.php', 100);

        $response = $this->postJson("/api/v1/inbound/{$token}", [
            'file' => $fakePhp,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);

        $this->assertDatabaseMissing('file_entries', [
            'name' => 'backdoor.php',
        ]);
    }

    public function test_inbound_rejects_when_storage_limit_exceeded(): void
    {
        $user = User::factory()->create([
            'storage_limit' => 1024, // 1 KB limit
        ]);
        $token = $user->ensureWebhookToken();
        $largeFile = UploadedFile::fake()->create('big_photo.jpg', 5000, 'image/jpeg'); // 5MB

        $response = $this->postJson("/api/v1/inbound/{$token}", [
            'file' => $largeFile,
        ]);

        $response->assertStatus(413)
            ->assertJson([
                'success' => false,
            ]);
    }

    public function test_user_can_regenerate_integration_token(): void
    {
        $user = User::factory()->create();
        $oldToken = $user->ensureWebhookToken();

        $response = $this->actingAs($user)->postJson('/integrations/regenerate-token');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $user->refresh();
        $this->assertNotEquals($oldToken, $user->webhook_token);
        $this->assertStringStartsWith('cv_in_', $user->webhook_token);
    }

    public function test_user_can_simulate_whatsapp_upload_from_web(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/integrations/simulate-upload', [
            'sender' => '6281122334455',
            'caption' => 'Uji coba upload WA otomatis',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('folders', [
            'user_id' => $user->id,
            'name' => 'WhatsApp Media',
            'color' => '#25D366',
        ]);

        $this->assertDatabaseHas('file_entries', [
            'user_id' => $user->id,
            'extension' => 'svg',
        ]);
    }

    public function test_inbound_blocks_internal_and_private_urls(): void
    {
        $user = User::factory()->create();
        $token = $user->ensureWebhookToken();

        $response = $this->postJson("/api/v1/inbound/{$token}", [
            'url' => 'http://127.0.0.1:8000/secret.jpg',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);

        $responseLocalhost = $this->postJson("/api/v1/inbound/{$token}", [
            'url' => 'http://localhost/metadata.json',
        ]);

        $responseLocalhost->assertStatus(422);
    }

    public function test_inbound_downloads_image_from_valid_public_url(): void
    {
        Http::fake([
            'https://cdn.example.com/wa_image.jpg' => Http::response('fake-binary-image-content', 200, [
                'Content-Type' => 'image/jpeg',
            ]),
        ]);

        $user = User::factory()->create();
        $token = $user->ensureWebhookToken();

        $response = $this->postJson("/api/v1/inbound/{$token}", [
            'url' => 'https://cdn.example.com/wa_image.jpg',
            'sender' => '6281234567890',
            'caption' => 'Foto dikirim dari CDN WA',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'wa_image.jpg',
                    'folder' => 'WhatsApp Media',
                ],
            ]);

        $this->assertDatabaseHas('file_entries', [
            'user_id' => $user->id,
            'name' => 'wa_image.jpg',
            'extension' => 'jpg',
        ]);
    }

    public function test_inbound_blocks_ssrf_redirect_to_internal_ip(): void
    {
        Http::fake([
            'https://external-service.com/redirect-to-internal' => Http::response('', 302, [
                'Location' => 'http://127.0.0.1:8000/sensitive-data.jpg',
            ]),
        ]);

        $user = User::factory()->create();
        $token = $user->ensureWebhookToken();

        $response = $this->postJson("/api/v1/inbound/{$token}", [
            'url' => 'https://external-service.com/redirect-to-internal',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }

    public function test_inbound_authenticates_via_x_api_key_and_bearer_headers(): void
    {
        $user = User::factory()->create();
        $token = $user->ensureWebhookToken();

        $response = $this->withHeader('X-API-Key', $token)
            ->getJson('/api/v1/inbound');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'status' => 'active',
            ]);

        $responseBearer = $this->withToken($token)
            ->getJson('/api/v1/inbound');

        $responseBearer->assertStatus(200)
            ->assertJson([
                'success' => true,
                'status' => 'active',
            ]);
    }
}
