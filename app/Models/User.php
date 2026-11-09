<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Boot model events.
     */
    protected static function booted(): void
    {
        static::creating(function (User $user): void {
            if (empty($user->webhook_token)) {
                $user->webhook_token = 'cv_in_'.Str::random(32);
            }
        });
    }

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
        'scheduled_deletion_at',
        'webhook_token',
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
            'scheduled_deletion_at' => 'datetime',
        ];
    }

    /**
     * Determine if the user is scheduled for deletion.
     */
    public function isScheduledForDeletion(): bool
    {
        return $this->scheduled_deletion_at !== null;
    }

    /**
     * Schedule this user for deletion with a grace period (defaults to 3 days).
     */
    public function scheduleDeletion(int $days = 3): void
    {
        $this->update([
            'scheduled_deletion_at' => now()->addDays($days),
        ]);
    }

    /**
     * Cancel the scheduled deletion and restore the user to active status.
     */
    public function cancelDeletion(): void
    {
        $this->update([
            'scheduled_deletion_at' => null,
        ]);
    }

    /**
     * Permanently delete this user and all their physical files.
     */
    public function purgeUserAndFiles(): void
    {
        foreach ($this->files as $file) {
            Storage::disk('local')->delete($file->path);
        }

        $this->delete();
    }

    /**
     * Purge all users whose scheduled deletion grace period has elapsed.
     */
    public static function purgeExpiredScheduledDeletions(): int
    {
        $expiredUsers = static::whereNotNull('scheduled_deletion_at')
            ->where('scheduled_deletion_at', '<=', now())
            ->get();

        $count = 0;
        foreach ($expiredUsers as $user) {
            $user->purgeUserAndFiles();
            $count++;
        }

        return $count;
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

    /**
     * Ensure the user has an active webhook integration token.
     */
    public function ensureWebhookToken(): string
    {
        if (empty($this->webhook_token)) {
            $this->webhook_token = 'cv_in_'.Str::random(32);
            $this->saveQuietly();
        }

        return $this->webhook_token;
    }

    /**
     * Regenerate the webhook integration token.
     */
    public function regenerateWebhookToken(): string
    {
        $this->webhook_token = 'cv_in_'.Str::random(32);
        $this->save();

        return $this->webhook_token;
    }
}
