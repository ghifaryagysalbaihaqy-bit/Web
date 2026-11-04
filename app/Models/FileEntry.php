<?php

namespace App\Models;

use Database\Factories\FileEntryFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class FileEntry extends Model
{
    /** @use HasFactory<FileEntryFactory> */
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'folder_id',
        'name',
        'path',
        'mime_type',
        'extension',
        'size',
        'is_starred',
        'tags',
        'is_locked',
        'checksum',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'size' => 'integer',
            'is_starred' => 'boolean',
            'tags' => 'array',
            'is_locked' => 'boolean',
        ];
    }

    /**
     * Get user owner.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get parent folder.
     *
     * @return BelongsTo<Folder, $this>
     */
    public function folder(): BelongsTo
    {
        return $this->belongsTo(Folder::class);
    }

    /**
     * Get share links for this file.
     *
     * @return HasMany<ShareLink, $this>
     */
    public function shareLinks(): HasMany
    {
        return $this->hasMany(ShareLink::class);
    }

    /**
     * Get versions for this file.
     *
     * @return HasMany<FileVersion, $this>
     */
    public function versions(): HasMany
    {
        return $this->hasMany(FileVersion::class)->orderBy('version_number', 'desc');
    }

    /**
     * Check if file has an active (non-expired) share link.
     */
    public function hasActiveShare(): bool
    {
        return $this->shareLinks()
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->exists();
    }

    /**
     * Get human-readable formatted file size.
     */
    public function getFormattedSizeAttribute(): string
    {
        $bytes = $this->size;

        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2).' GB';
        }

        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2).' MB';
        }

        if ($bytes >= 1024) {
            return number_format($bytes / 1024, 2).' KB';
        }

        return $bytes.' B';
    }

    /**
     * Check if file is an image.
     */
    public function isImage(): bool
    {
        return str_starts_with($this->mime_type ?? '', 'image/');
    }

    /**
     * Check if file is a PDF.
     */
    public function isPdf(): bool
    {
        return $this->mime_type === 'application/pdf' || strtolower($this->extension ?? '') === 'pdf';
    }

    /**
     * Check if file is audio.
     */
    public function isAudio(): bool
    {
        return str_starts_with($this->mime_type ?? '', 'audio/');
    }

    /**
     * Check if file is video.
     */
    public function isVideo(): bool
    {
        return str_starts_with($this->mime_type ?? '', 'video/');
    }

    /**
     * Check if file is previewable plain text / code / markup document.
     */
    public function isText(): bool
    {
        $ext = strtolower($this->extension ?? '');
        $textExtensions = [
            'txt', 'md', 'markdown', 'json', 'csv', 'tsv', 'xml', 'yaml', 'yml',
            'js', 'ts', 'jsx', 'tsx', 'css', 'html', 'php', 'py', 'sh', 'sql',
            'log', 'env', 'ini', 'conf', 'tex', 'rtf',
        ];

        return str_starts_with($this->mime_type ?? '', 'text/') || in_array($ext, $textExtensions, true);
    }
}
