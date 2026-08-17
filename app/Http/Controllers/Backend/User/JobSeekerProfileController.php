<?php

namespace App\Http\Controllers\Backend\User;

use App\Enums\JobSeekerResumeStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\User\UpdateJobSeekerProfileRequest;
use App\Http\Requests\Backend\User\UploadJobSeekerResumeRequest;
use App\Models\JobSeekerProfile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class JobSeekerProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $user?->unsetRelation('jobSeekerProfile');
        $profile = $user?->jobSeekerProfile ?? new JobSeekerProfile;
        $profile->setRelation('user', $user);

        $hasResume = filled($user?->resume_path)
            && Storage::disk('local')->exists((string) $user->resume_path);

        return Inertia::render('backend/User/JobSeekerProfile', [
            'profile' => [
                'name' => $user?->name,
                'email' => $user?->email,
                'phone' => $user?->phone,
                'location' => $user?->location,
                'headline' => $profile->headline,
                'current_title' => $profile->current_title,
                'experience_years' => $profile->experience_years,
                'experience_years_label' => $profile->experienceLabel(),
                'bio' => $profile->bio,
                'linkedin_url' => $profile->linkedin_url,
                'github_url' => $profile->github_url,
                'industry' => $profile->industry,
                'expected_salary' => $profile->expected_salary,
                'availability' => $profile->availability ?? [],
                'skills' => $profile->skills ?? [],
                'education' => $profile->education ?? [],
                'experience' => $profile->experience ?? [],
                'languages' => $profile->languages ?? [],
                'certifications' => $profile->certifications ?? [],
                'resume_status' => $hasResume
                    ? ($user?->resume_status?->label() ?? 'Uploaded')
                    : null,
                'resume_name' => $hasResume ? $user?->resume_original_name : null,
                'resume_url' => $hasResume ? route('job-seeker.profile.resume.download') : null,
                'completion' => $profile->exists ? $profile->completionPercent() : 0,
                'checklist' => $profile->checklist($user),
            ],
        ]);
    }

    public function update(UpdateJobSeekerProfileRequest $request): RedirectResponse
    {
        $user = $request->user();

        $user?->forceFill($request->safe()->only(['name', 'phone', 'location']))->save();

        $profileData = $request->safe()->only([
            'headline',
            'current_title',
            'experience_years',
            'bio',
            'linkedin_url',
            'github_url',
            'industry',
            'expected_salary',
            'availability',
            'skills',
            'education',
            'experience',
            'languages',
            'certifications',
        ]);

        JobSeekerProfile::query()->updateOrCreate(
            ['user_id' => $user?->id],
            [
                ...$profileData,
                'availability' => $profileData['availability'] ?? [],
                'skills' => $profileData['skills'] ?? [],
                'education' => $profileData['education'] ?? [],
                'experience' => $profileData['experience'] ?? [],
                'languages' => $profileData['languages'] ?? [],
                'certifications' => $profileData['certifications'] ?? [],
            ],
        );

        return back()->with('success', 'Profile updated.');
    }

    public function uploadResume(UploadJobSeekerResumeRequest $request): RedirectResponse
    {
        $user = $request->user();
        $resume = $request->file('resume');

        if ($user === null || $resume === null) {
            return back()->withErrors(['resume' => 'Please choose a resume file to upload.']);
        }

        if (filled($user->resume_path)) {
            Storage::disk('local')->delete($user->resume_path);
        }

        $path = $resume->store('resumes/'.$user->id, 'local');

        $user->forceFill([
            'resume_path' => $path,
            'resume_original_name' => $resume->getClientOriginalName(),
            'resume_status' => JobSeekerResumeStatus::Active,
        ])->save();

        return back()->with('success', 'Resume uploaded.');
    }

    public function downloadResume(Request $request): StreamedResponse
    {
        $user = $request->user();

        abort_unless(
            $user !== null
            && filled($user->resume_path)
            && Storage::disk('local')->exists((string) $user->resume_path),
            404,
        );

        $downloadName = $user->resume_original_name ?: basename((string) $user->resume_path);

        return Storage::disk('local')->download((string) $user->resume_path, $downloadName);
    }

    public function destroyResume(Request $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user?->isJobSeeker() === true, 403);

        if (filled($user->resume_path)) {
            Storage::disk('local')->delete((string) $user->resume_path);
        }

        $user->forceFill([
            'resume_path' => null,
            'resume_original_name' => null,
            'resume_status' => null,
        ])->save();

        return back()->with('success', 'Resume removed.');
    }
}
