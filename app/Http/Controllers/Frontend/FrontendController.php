<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Support\DemoJobs;
use Inertia\Inertia;
use Inertia\Response;

class FrontendController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('frontend/home');
    }

    public function jobs(): Response
    {
        return Inertia::render('frontend/jobs');
    }

    public function jobShow(string $slug): Response
    {
        $job = DemoJobs::find($slug);

        abort_unless($job !== null, 404);

        return Inertia::render('frontend/job-show', [
            'job' => $job,
        ]);
    }

    public function pricing(): Response
    {
        return Inertia::render('frontend/pricing');
    }

    public function about(): Response
    {
        return Inertia::render('frontend/about');
    }

    public function contact(): Response
    {
        return Inertia::render('frontend/contact');
    }
}
