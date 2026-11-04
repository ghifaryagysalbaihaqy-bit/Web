<?php

namespace Database\Seeders;

use App\Models\FileEntry;
use App\Models\Folder;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'demo@cloudvault.com'],
            [
                'name' => 'Admin CloudVault',
                'password' => Hash::make('password'),
                'storage_limit' => 5368709120, // 5 GB
                'is_admin' => true,
            ]
        );
        $user->update(['is_admin' => true, 'name' => 'Admin CloudVault']);

        $docFolder = Folder::firstOrCreate(
            ['user_id' => $user->id, 'name' => 'Dokumen Kerja'],
            ['color' => '#3B82F6', 'is_starred' => true]
        );

        Folder::firstOrCreate(
            ['user_id' => $user->id, 'name' => 'Foto & Media'],
            ['color' => '#10B981', 'is_starred' => false]
        );

        Folder::firstOrCreate(
            ['user_id' => $user->id, 'name' => 'Arsip & Cadangan'],
            ['color' => '#F59E0B', 'is_starred' => false]
        );

        // Create sample welcome file
        $welcomePath = "files/{$user->id}/Selamat_Datang_di_CloudVault.txt";
        if (! Storage::disk('local')->exists($welcomePath)) {
            Storage::disk('local')->put($welcomePath, "Selamat Datang di CloudVault!\n\nAplikasi penyimpanan cloud mandiri berbasis Laravel 12 & React.\nFitur yang tersedia:\n1. Drag and drop file upload\n2. Pembuatan folder berstruktur & tag warna\n3. Pratinjau langsung untuk Gambar, PDF, Video, Audio, dan Teks\n4. Unduh folder otomatis sebagai arsip ZIP\n5. Pemindahan file antar folder\n6. Berbagi tautan publik dengan proteksi password\n7. Tempat sampah dan pemulihan berkas (Trash & Restore)\n\nSelamat mencoba!");
        }

        FileEntry::firstOrCreate(
            ['user_id' => $user->id, 'name' => 'Selamat_Datang_di_CloudVault.txt'],
            [
                'folder_id' => $docFolder->id,
                'path' => $welcomePath,
                'mime_type' => 'text/plain',
                'extension' => 'txt',
                'size' => (int) Storage::disk('local')->size($welcomePath),
                'is_starred' => true,
            ]
        );
    }
}
