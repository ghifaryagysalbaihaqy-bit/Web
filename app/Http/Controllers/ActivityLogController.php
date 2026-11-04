<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    /**
     * Display a listing of user activity logs.
     */
    public function index(Request $request): JsonResponse
    {
        $logs = ActivityLog::where('user_id', $request->user()->id)
            ->latest('id')
            ->limit(100)
            ->get()
            ->map(function (ActivityLog $log): array {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'item_name' => $log->item_name,
                    'item_type' => $log->item_type,
                    'description' => $log->description,
                    'created_at' => $log->created_at?->format('d M Y, H:i:s'),
                    'time_ago' => $log->created_at?->diffForHumans() ?? '',
                ];
            });

        return response()->json([
            'logs' => $logs,
        ]);
    }

    /**
     * Clear activity logs for the authenticated user.
     */
    public function clear(Request $request): JsonResponse|RedirectResponse
    {
        ActivityLog::where('user_id', $request->user()->id)->delete();

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Semua catatan log aktivitas berhasil dibersihkan.',
            ]);
        }

        return back()->with('success', 'Semua catatan log aktivitas berhasil dibersihkan.');
    }
}
