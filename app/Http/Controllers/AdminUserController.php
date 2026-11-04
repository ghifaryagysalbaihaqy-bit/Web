<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class AdminUserController extends Controller
{
    /**
     * Display a listing of all users for the administrator.
     */
    public function index(): Response
    {
        $users = User::withCount(['files', 'folders'])
            ->latest()
            ->get()
            ->map(function (User $user): array {
                $used = $user->usedStorage();
                $limit = (int) ($user->storage_limit ?: 5368709120);

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_admin' => $user->isAdmin(),
                    'storage_limit_bytes' => $limit,
                    'storage_limit_gb' => round($limit / 1073741824, 2),
                    'storage_used_bytes' => $used,
                    'storage_used_formatted' => $this->formatBytes($used),
                    'storage_limit_formatted' => $this->formatBytes($limit),
                    'storage_percentage' => $limit > 0 ? min(100, round(($used / $limit) * 100, 1)) : 0,
                    'files_count' => $user->files_count,
                    'folders_count' => $user->folders_count,
                    'created_at' => $user->created_at?->format('d M Y, H:i'),
                ];
            });

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
        ]);
    }

    /**
     * Store a newly created user (Admin only).
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', Password::defaults()],
            'storage_limit_gb' => ['required', 'numeric', 'min:0.1', 'max:5000'],
            'is_admin' => ['nullable', 'boolean'],
        ]);

        $storageLimitBytes = (int) round($validated['storage_limit_gb'] * 1073741824);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'storage_limit' => $storageLimitBytes,
            'is_admin' => ! empty($validated['is_admin']),
        ]);

        return back()->with('success', 'Pengguna "'.$validated['name'].'" berhasil ditambahkan.');
    }

    /**
     * Update an existing user.
     */
    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => ['nullable', 'string', Password::defaults()],
            'storage_limit_gb' => ['required', 'numeric', 'min:0.1', 'max:5000'],
            'is_admin' => ['nullable', 'boolean'],
        ]);

        $storageLimitBytes = (int) round($validated['storage_limit_gb'] * 1073741824);

        $data = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'storage_limit' => $storageLimitBytes,
            'is_admin' => ! empty($validated['is_admin']),
        ];

        if (! empty($validated['password'])) {
            $data['password'] = Hash::make($validated['password']);
        }

        $user->update($data);

        return back()->with('success', 'Data pengguna "'.$user->name.'" berhasil diperbarui.');
    }

    /**
     * Delete a user and all their stored files.
     */
    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->id === $request->user()->id) {
            return back()->with('error', 'Anda tidak dapat menghapus akun Anda sendiri.');
        }

        // Delete all physical files belonging to this user
        foreach ($user->files as $file) {
            Storage::disk('local')->delete($file->path);
        }

        $userName = $user->name;
        $user->delete();

        return back()->with('success', 'Pengguna "'.$userName.'" dan seluruh berkasnya berhasil dihapus.');
    }

    /**
     * Format bytes to readable string.
     */
    private function formatBytes(int $bytes): string
    {
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
}
