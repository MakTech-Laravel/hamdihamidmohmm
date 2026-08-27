<?php

namespace App\Http\Controllers\Backend\User;

use App\Enums\JobSeekerResumeStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\User\UpdateJobSeekerProfileRequest;
use App\Http\Requests\Backend\User\UploadJobSeekerCertificationRequest;
use App\Http\Requests\Backend\User\UploadJobSeekerPhotoRequest;
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

        $photoUrl = $user?->avatar_url;

        $certifications = collect($profile->certifications ?? [])
            ->values()
            ->map(function (mixed $item, int $index) use ($user) {
                $record = is_array($item) ? $item : ['name' => (string) $item];
                $hasFile = filled($record['file_path'] ?? null)
                    && Storage::disk('local')->exists((string) $record['file_path']);

                return [
                    'name' => $record['name'] ?? $record['title'] ?? '',
                    'issuer' => $record['issuer'] ?? $record['org'] ?? '',
                    'date' => $record['date'] ?? $record['year'] ?? '',
                    'file_path' => $hasFile ? (string) $record['file_path'] : null,
                    'file_name' => $hasFile ? ($record['file_name'] ?? basename((string) $record['file_path'])) : null,
                    'file_url' => $hasFile && $user !== null
                        ? route('job-seeker.profile.certifications.download', ['index' => $index])
                        : null,
                ];
            })
            ->all();

        return Inertia::render('backend/User/JobSeekerProfile', [
            'profile' => [
                'name' => $user?->name,
                'email' => $user?->email,
                'phone' => $user?->phone,
                'location' => $user?->location,
                'photo_url' => $photoUrl,
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
                'certifications' => $certifications,
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

        $existingProfile = $user?->jobSeekerProfile;
        $previousCertifications = is_array($existingProfile?->certifications)
            ? $existingProfile->certifications
            : [];

        $certifications = $this->normalizeCertificationsForStorage(
            $profileData['certifications'] ?? [],
            $previousCertifications,
        );

        JobSeekerProfile::query()->updateOrCreate(
            ['user_id' => $user?->id],
            [
                ...$profileData,
                'availability' => $profileData['availability'] ?? [],
                'skills' => $profileData['skills'] ?? [],
                'education' => $profileData['education'] ?? [],
                'experience' => $profileData['experience'] ?? [],
                'languages' => $profileData['languages'] ?? [],
                'certifications' => $certifications,
            ],
        );

        $this->deleteOrphanedCertificationFiles($previousCertifications, $certifications);

        return back()->with('success', __('job_seeker.profile.updated'));
    }

    public function uploadPhoto(UploadJobSeekerPhotoRequest $request): RedirectResponse
    {
        $user = $request->user();
        $photo = $request->file('photo');

        if ($user === null || $photo === null) {
            return back()->withErrors(['photo' => __('job_seeker.profile.photo_required')]);
        }

        if (filled($user->avatar)) {
            Storage::disk('public')->delete((string) $user->avatar);
        }

        $path = $photo->store('avatars/'.$user->id, 'public');

        $user->forceFill([
            'avatar' => $path,
        ])->save();

        return back()->with('success', __('job_seeker.profile.photo_uploaded'));
    }

    public function destroyPhoto(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user?->isJobSeeker() === true, 403);

        if (filled($user->avatar)) {
            Storage::disk('public')->delete((string) $user->avatar);
        }

        $user->forceFill([
            'avatar' => null,
        ])->save();

        return back()->with('success', __('job_seeker.profile.photo_removed'));
    }

    public function uploadCertificationDocument(UploadJobSeekerCertificationRequest $request): RedirectResponse
    {
        $user = $request->user();
        $document = $request->file('document');
        $index = (int) $request->integer('index');

        if ($user === null || $document === null) {
            return back()->withErrors(['document' => __('job_seeker.profile.certification_file_required')]);
        }

        $profile = JobSeekerProfile::query()->firstOrCreate(
            ['user_id' => $user->id],
            ['certifications' => []],
        );

        $certifications = is_array($profile->certifications) ? array_values($profile->certifications) : [];

        while (count($certifications) <= $index) {
            $certifications[] = [
                'name' => '',
                'issuer' => '',
                'date' => '',
            ];
        }

        $entry = is_array($certifications[$index]) ? $certifications[$index] : ['name' => (string) $certifications[$index]];

        if (filled($entry['file_path'] ?? null)) {
            Storage::disk('local')->delete((string) $entry['file_path']);
        }

        $path = $document->store('certifications/'.$user->id, 'local');

        $certifications[$index] = [
            'name' => trim((string) ($request->input('name') ?: ($entry['name'] ?? $entry['title'] ?? ''))),
            'issuer' => trim((string) ($request->input('issuer') ?: ($entry['issuer'] ?? $entry['org'] ?? ''))),
            'date' => trim((string) ($request->input('date') ?: ($entry['date'] ?? $entry['year'] ?? ''))),
            'file_path' => $path,
            'file_name' => $document->getClientOriginalName(),
        ];

        $profile->forceFill([
            'certifications' => $certifications,
        ])->save();

        return back()->with('success', __('job_seeker.profile.certification_uploaded'));
    }

    public function downloadCertificationDocument(Request $request, int $index): StreamedResponse
    {
        $user = $request->user();
        abort_unless($user?->isJobSeeker() === true, 403);

        $profile = $user->jobSeekerProfile;
        $certifications = is_array($profile?->certifications) ? array_values($profile->certifications) : [];
        $entry = $certifications[$index] ?? null;

        abort_unless(is_array($entry), 404);
        abort_unless(
            filled($entry['file_path'] ?? null)
                && Storage::disk('local')->exists((string) $entry['file_path']),
            404,
        );

        $downloadName = $entry['file_name'] ?? basename((string) $entry['file_path']);

        return Storage::disk('local')->download((string) $entry['file_path'], $downloadName);
    }

    public function destroyCertificationDocument(Request $request, int $index): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user?->isJobSeeker() === true, 403);

        $profile = $user->jobSeekerProfile;
        abort_unless($profile !== null, 404);

        $certifications = is_array($profile->certifications) ? array_values($profile->certifications) : [];
        $entry = $certifications[$index] ?? null;
        abort_unless(is_array($entry), 404);

        if (filled($entry['file_path'] ?? null)) {
            Storage::disk('local')->delete((string) $entry['file_path']);
        }

        unset($entry['file_path'], $entry['file_name']);
        $certifications[$index] = $entry;

        $profile->forceFill([
            'certifications' => $certifications,
        ])->save();

        return back()->with('success', __('job_seeker.profile.certification_file_removed'));
    }

    public function uploadResume(UploadJobSeekerResumeRequest $request): RedirectResponse
    {
        $user = $request->user();
        $resume = $request->file('resume');

        if ($user === null || $resume === null) {
            return back()->withErrors(['resume' => __('job_seeker.profile.resume_required')]);
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

        return back()->with('success', __('job_seeker.profile.resume_uploaded'));
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

        return back()->with('success', __('job_seeker.profile.resume_removed'));
    }

    /**
     * @param  array<int, mixed>  $incoming
     * @param  array<int, mixed>  $previous
     * @return list<array{name: string, issuer: string, date: string, file_path?: string, file_name?: string}>
     */
    private function normalizeCertificationsForStorage(array $incoming, array $previous): array
    {
        $previous = array_values($previous);

        return collect($incoming)
            ->values()
            ->map(function (mixed $item) {
                $record = is_array($item) ? $item : ['name' => (string) $item];

                $normalized = [
                    'name' => trim((string) ($record['name'] ?? $record['title'] ?? '')),
                    'issuer' => trim((string) ($record['issuer'] ?? $record['org'] ?? '')),
                    'date' => trim((string) ($record['date'] ?? $record['year'] ?? '')),
                ];

                $filePath = $record['file_path'] ?? null;
                $fileName = $record['file_name'] ?? null;

                if (filled($filePath) && Storage::disk('local')->exists((string) $filePath)) {
                    $normalized['file_path'] = (string) $filePath;
                    $normalized['file_name'] = filled($fileName)
                        ? (string) $fileName
                        : basename((string) $filePath);
                }

                return $normalized;
            })
            ->filter(fn (array $entry): bool => $entry['name'] !== ''
                || $entry['issuer'] !== ''
                || $entry['date'] !== ''
                || isset($entry['file_path']))
            ->values()
            ->all();
    }

    /**
     * @param  array<int, mixed>  $previous
     * @param  array<int, mixed>  $current
     */
    private function deleteOrphanedCertificationFiles(array $previous, array $current): void
    {
        $keep = collect($current)
            ->map(fn (mixed $item): ?string => is_array($item) ? ($item['file_path'] ?? null) : null)
            ->filter()
            ->values()
            ->all();

        foreach ($previous as $item) {
            if (! is_array($item) || ! filled($item['file_path'] ?? null)) {
                continue;
            }

            if (! in_array($item['file_path'], $keep, true)) {
                Storage::disk('local')->delete((string) $item['file_path']);
            }
        }
    }
}
