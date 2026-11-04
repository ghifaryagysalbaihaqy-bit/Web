<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'storage_limit',
        'is_admin',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'storage_limit' => 'integer',
            'is_admin' => 'boolean',
        ];
    }

    /**
     * Determine if the user is an administrator.
     */
    public function isAdmin(): bool
    {
        return (bool) $this->is_admin;
    }

    /**
     * Get folders belonging to the user.
     *
     * @return HasMany<Folder, $this>
     */
    public function folders(): HasMany
    {
        return $this->hasMany(Folder::class);
    }

    /**
     * Get files belonging to the user.
     *
     * @return HasMany<FileEntry, $this>
     */
    public function files(): HasMany
    {
        return $this->hasMany(FileEntry::class);
    }

    /**
     * Get activity logs for the user.
     *
     * @return HasMany<ActivityLog, $this>
     */
    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class)->latest();
    }

    /**
     * Get file requests created by the user.
     *
     * @return HasMany<FileRequest, $this>
     */
    public function fileRequests(): HasMany
    {
        return $this->hasMany(FileRequest::class)->latest();
    }

    /**
     * Calculate used storage in bytes.
     */
    public function usedStorage(): int
    {
        return (int) $this->files()->sum('size');
    }

    /**
     * Calculate storage occupied by trashed files in bytes.
     */
    public function trashedStorage(): int
    {
        return (int) FileEntry::onlyTrashed()->where('user_id', $this->id)->sum('size');
    }

    /**
     * Calculate remaining storage in bytes.
     */
    public function availableStorage(): int
    {
        $limit = (int) ($this->storage_limit ?: 5368709120);

        return max(0, $limit - $this->usedStorage());
    }
}
