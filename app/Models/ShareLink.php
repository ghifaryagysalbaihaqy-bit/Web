<?php

namespace App\Models;

use Database\Factories\ShareLinkFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShareLink extends Model
{
    /** @use HasFactory<ShareLinkFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'file_entry_id',
        'token',
        'password',
        'permission',
        'expires_at',
        'downloads_count',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'downloads_count' => 'integer',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the user who shared the link.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the file being shared.
     *
     * @return BelongsTo<FileEntry, $this>
     */
    public function fileEntry(): BelongsTo
    {
        return $this->belongsTo(FileEntry::class);
    }

    /**
     * Check if link is expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    /**
     * Check if link has editor permission.
     */
    public function isEditor(): bool
    {
        return $this->permission === 'editor';
    }

    /**
     * Check if link has viewer-only permission.
     */
    public function isViewer(): bool
    {
        return ! $this->isEditor();
    }
}
