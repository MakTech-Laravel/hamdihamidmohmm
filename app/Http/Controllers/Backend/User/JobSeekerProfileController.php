<?php

namespace App\Http\Controllers\Backend\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\User\UpdateJobSeekerProfileRequest;
use App\Models\JobSeekerProfile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class JobSeekerProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $profile = $user?->jobSeekerProfile ?? new JobSeekerProfile;

        return Inertia::render('backend/User/JobSeekerProfile', [
            'profile' => [
                'name' => $user?->name,
                'email' => $user?->email,
                'phone' => $user?->phone,
                'location' => $user?->location,
                'headline' => $profile->headline,
                'bio' => $profile->bio,
                'skills' => $profile->skills ?? [],
                'education' => $profile->education ?? [],
                'experience' => $profile->experience ?? [],
                'languages' => $profile->languages ?? [],
                'certifications' => $profile->certifications ?? [],
                'resume_status' => $user?->resume_status?->label(),
                'completion' => $profile->exists ? $profile->completionPercent() : 0,
            ],
        ]);
    }

    public function update(UpdateJobSeekerProfileRequest $request): RedirectResponse
    {
        $user = $request->user();

        $user?->forceFill($request->safe()->only(['name', 'phone', 'location']))->save();

        JobSeekerProfile::query()->updateOrCreate(
            ['user_id' => $user?->id],
            $request->safe()->only(['headline', 'bio', 'skills', 'education', 'experience', 'languages', 'certifications']),
        );

        return back()->with('success', 'Profile updated.');
    }
}
