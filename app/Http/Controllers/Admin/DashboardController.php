<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AnalyticsService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(AnalyticsService $analytics): Response
    {
        return Inertia::render('admin/dashboard', [
            'user_metrics' => $analytics->getUserMetrics(),
            'content_metrics' => $analytics->getContentMetrics(),
            'active_users' => $analytics->getActiveUserMetrics(),
            'practice_metrics' => $analytics->getPracticeMetrics(),
        ]);
    }
}
