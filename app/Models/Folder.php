<?php

namespace App\Models;

use Database\Factories\FolderFactory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Folder extends Model
{
    /** @use HasFactory<FolderFactory> */
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'parent_id',
        'name',
        'color',
        'is_starred',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_starred' => 'boolean',
        ];
    }

    /**
     * Get the user that owns the folder.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the parent folder.
     *
     * @return BelongsTo<Folder, $this>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Folder::class, 'parent_id');
    }

    /**
     * Get direct subfolders.
     *
     * @return HasMany<Folder, $this>
     */
    public function subfolders(): HasMany
    {
        return $this->hasMany(Folder::class, 'parent_id');
    }

    /**
     * Get files inside this folder.
     *
     * @return HasMany<FileEntry, $this>
     */
    public function files(): HasMany
    {
        return $this->hasMany(FileEntry::class, 'folder_id');
    }

    /**
     * Get breadcrumb ancestors of this folder from root down to self.
     *
     * @return array<int, array{id: int, name: string}>
     */
    public function getBreadcrumbs(): array
    {
        $breadcrumbs = [];
        $current = $this;

        while ($current !== null) {
            array_unshift($breadcrumbs, [
                'id' => $current->id,
                'name' => $current->name,
            ]);

            $current = $current->parent;
        }

        return $breadcrumbs;
    }

    /**
     * Get all recursive descendant folders.
     *
     * @return Collection<int, Folder>
     */
    public function allDescendants(): Collection
    {
        $descendants = new Collection;
        $toProcess = [$this];

        while (! empty($toProcess)) {
            $folder = array_shift($toProcess);
            $children = Folder::withTrashed()->where('parent_id', $folder->id)->get();
            foreach ($children as $child) {
                $descendants->push($child);
                $toProcess[] = $child;
            }
        }

        return $descendants;
    }

    /**
     * Determine if a target folder is this folder itself or one of its descendants.
     */
    public function isSelfOrDescendant(int $targetFolderId): bool
    {
        if ($this->id === $targetFolderId) {
            return true;
        }

        $descendantIds = $this->allDescendants()->pluck('id')->all();

        return in_array($targetFolderId, $descendantIds, true);
    }
}
