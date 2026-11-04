<?php

namespace Tests\Feature;

use App\Models\FileEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminUserTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_registration_is_disabled(): void
    {
        $this->get('/register')->assertNotFound();
        $this->post('/register', [
            'name' => 'Stranger',
            'email' => 'stranger@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertNotFound();
    }

    public function test_non_admin_user_cannot_access_admin_user_management(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $this->actingAs($user)->get('/admin/users')->assertForbidden();
    }

    public function test_admin_can_view_user_management(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $this->actingAs($admin)->get('/admin/users')->assertOk();
    }

    public function test_admin_can_create_new_user_with_custom_storage_limit(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin)->post('/admin/users', [
            'name' => 'Karyawan Baru',
            'email' => 'karyawan@cloudvault.com',
            'password' => 'password123',
            'storage_limit_gb' => 10, // 10 GB
            'is_admin' => false,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'name' => 'Karyawan Baru',
            'email' => 'karyawan@cloudvault.com',
            'storage_limit' => 10 * 1073741824,
            'is_admin' => false,
        ]);
    }

    public function test_admin_can_update_user(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create([
            'name' => 'User Lama',
            'email' => 'lama@example.com',
            'is_admin' => false,
        ]);

        $response = $this->actingAs($admin)->patch("/admin/users/{$user->id}", [
            'name' => 'User Diperbarui',
            'email' => 'diperbarui@example.com',
            'storage_limit_gb' => 15,
            'is_admin' => true,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'User Diperbarui',
            'email' => 'diperbarui@example.com',
            'storage_limit' => 15 * 1073741824,
            'is_admin' => true,
        ]);
    }

    public function test_admin_can_delete_user_and_their_files(): void
    {
        Storage::fake('local');
        $admin = User::factory()->create(['is_admin' => true]);
        $user = User::factory()->create(['is_admin' => false]);

        $path = "files/{$user->id}/testfile.txt";
        Storage::disk('local')->put($path, 'Konten test');

        $file = FileEntry::factory()->create([
            'user_id' => $user->id,
            'path' => $path,
        ]);

        Storage::disk('local')->assertExists($path);

        $response = $this->actingAs($admin)->delete("/admin/users/{$user->id}");

        $response->assertRedirect();
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        Storage::disk('local')->assertMissing($path);
    }

    public function test_admin_cannot_delete_themselves(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin)->delete("/admin/users/{$admin->id}");

        $response->assertRedirect();
        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }
}
