<?php

namespace Database\Factories;

use App\Models\FileEntry;
use App\Models\ShareLink;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<ShareLink>
 */
class ShareLinkFactory extends Factory
{
    protected $model = ShareLink::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'file_entry_id' => FileEntry::factory(),
            'token' => Str::random(32),
            'password' => null,
            'expires_at' => null,
            'downloads_count' => 0,
        ];
    }
}
