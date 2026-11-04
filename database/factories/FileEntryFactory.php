<?php

namespace Database\Factories;

use App\Models\FileEntry;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FileEntry>
 */
class FileEntryFactory extends Factory
{
    protected $model = FileEntry::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $ext = fake()->randomElement(['pdf', 'jpg', 'png', 'txt', 'docx', 'zip']);
        $mimeMap = [
            'pdf' => 'application/pdf',
            'jpg' => 'image/jpeg',
            'png' => 'image/png',
            'txt' => 'text/plain',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'zip' => 'application/zip',
        ];

        return [
            'user_id' => User::factory(),
            'folder_id' => null,
            'name' => fake()->word().'.'.$ext,
            'path' => 'files/'.fake()->uuid().'.'.$ext,
            'mime_type' => $mimeMap[$ext],
            'extension' => $ext,
            'size' => fake()->numberBetween(1024, 10485760), // 1KB to 10MB
            'is_starred' => fake()->boolean(20),
        ];
    }
}
