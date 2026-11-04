<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'action',
        'item_name',
        'item_type',
        'description',
    ];

    /**
     * Get the user who performed this action.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Record a new activity entry safely.
     */
    public static function record(
        int $userId,
        string $action,
        string $itemName,
        string $itemType = 'file',
        ?string $description = null
    ): self {
        return self::create([
            'user_id' => $userId,
            'action' => $action,
            'item_name' => $itemName,
            'item_type' => $itemType,
            'description' => $description,
        ]);
    }
}
