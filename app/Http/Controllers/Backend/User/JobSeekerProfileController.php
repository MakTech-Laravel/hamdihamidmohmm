<?php

namespace App\Http\Controllers\Backend\User;

use App\Enums\JobSeekerResumeStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\User\UpdateJobSeekerProfileRequest;
use App\Http\Requests\Backend\User\UploadJobSeekerCertificationRequest;
use App\Http\Requests\Backend\User\UploadJobSeekerCoverLetterRequest;
use App\Http\Requests\Backend\User\UploadJobSeekerHighestDegreeRequest;
use App\Http\Requests\Backend\User\UploadJobSeekerOtherDocumentRequest;
use App\Http\Requests\Backend\User\UploadJobSeekerPhotoRequest;
use App\Http\Requests\Backend\User\UploadJobSeekerResumeRequest;
use App\Models\JobSeekerProfile;
use App\Models\User;
use App\Support\JobSeekerCvExtractor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
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
        $hasHighestDegree = filled($user?->highest_degree_path)
            && Storage::disk('local')->exists((string) $user->highest_degree_path);
        $hasOtherDocument = filled($user?->other_document_path)
            && Storage::disk('local')->exists((string) $user->other_document_path);

        $photoUrl = $user?->avatar_url;

        $certifications = collect($profile->certifications ?? [])
            ->values()
            ->map(function (mixed $item, int $index) use ($user) {
                $record = is_array($item) ? $item : ['name' => (string) $item];
                $attachments = $this->certificationAttachmentsForDisplay($record, $index, $user?->id);

                return [
                    'name' => $record['name'] ?? $record['title'] ?? '',
                    'issuer' => $record['issuer'] ?? $record['org'] ?? '',
                    'date' => $record['date'] ?? $record['year'] ?? '',
                    'attachments' => $attachments,
                    'file_path' => $attachments[0]['file_path'] ?? null,
                    'file_name' => $attachments[0]['file_name'] ?? null,
                    'file_url' => $attachments[0]['file_url'] ?? null,
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
                'highest_degree_name' => $hasHighestDegree ? $user?->highest_degree_original_name : null,
                'highest_degree_url' => $hasHighestDegree ? route('job-seeker.profile.highest-degree.download') : null,
                'other_document_name' => $hasOtherDocument ? $user?->other_document_original_name : null,
                'other_document_url' => $hasOtherDocument ? route('job-seeker.profile.other-document.download') : null,
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

        $path = $photo->store('avatars/' . $user->id, 'public');

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
                'attachments' => [],
            ];
        }

        $entry = is_array($certifications[$index]) ? $certifications[$index] : ['name' => (string) $certifications[$index]];
        $attachments = $this->normalizeAttachmentList($entry);

        if (count($attachments) >= 5) {
            return back()->withErrors(['document' => __('job_seeker.profile.certification_attachments_max')]);
        }

        $path = $document->store('certifications/' . $user->id, 'local');

        $attachments[] = [
            'file_path' => $path,
            'file_name' => $document->getClientOriginalName(),
        ];

        $certifications[$index] = [
            'name' => trim((string) ($request->input('name') ?: ($entry['name'] ?? $entry['title'] ?? ''))),
            'issuer' => trim((string) ($request->input('issuer') ?: ($entry['issuer'] ?? $entry['org'] ?? ''))),
            'date' => trim((string) ($request->input('date') ?: ($entry['date'] ?? $entry['year'] ?? ''))),
            'attachments' => $attachments,
        ];

        $profile->forceFill([
            'certifications' => $certifications,
        ])->save();

        return back()->with('success', __('job_seeker.profile.certification_uploaded'));
    }

    public function downloadCertificationDocument(Request $request, int $index, ?int $attachment = null): StreamedResponse
    {
        $user = $request->user();
        abort_unless($user?->isJobSeeker() === true, 403);

        $profile = $user->jobSeekerProfile;
        $certifications = is_array($profile?->certifications) ? array_values($profile->certifications) : [];
        $entry = $certifications[$index] ?? null;

        abort_unless(is_array($entry), 404);

        $attachments = $this->normalizeAttachmentList($entry);
        $attachmentIndex = $attachment ?? (int) $request->integer('attachment', 0);
        $file = $attachments[$attachmentIndex] ?? null;

        abort_unless(
            is_array($file)
                && filled($file['file_path'] ?? null)
                && Storage::disk('local')->exists((string) $file['file_path']),
            404,
        );

        $downloadName = $file['file_name'] ?? basename((string) $file['file_path']);

        return Storage::disk('local')->download((string) $file['file_path'], $downloadName);
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

        $attachments = $this->normalizeAttachmentList($entry);
        $attachmentIndex = (int) $request->integer('attachment', 0);

        if (! array_key_exists($attachmentIndex, $attachments)) {
            abort(404);
        }

        $file = $attachments[$attachmentIndex];

        if (filled($file['file_path'] ?? null)) {
            Storage::disk('local')->delete((string) $file['file_path']);
        }

        unset($attachments[$attachmentIndex]);
        $attachments = array_values($attachments);

        $entry['attachments'] = $attachments;
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

        $path = $resume->store('resumes/' . $user->id, 'local');

        $user->forceFill([
            'resume_path' => $path,
            'resume_original_name' => $resume->getClientOriginalName(),
            'resume_status' => JobSeekerResumeStatus::Active,
        ])->save();

        $extracted = false;

        if ($request->boolean('extract_profile', true)) {
            $extracted = $this->applyExtractedCvData($user->id, $resume);
        }

        return back()->with(
            'success',
            $extracted
                ? __('job_seeker.profile.resume_imported')
                : __('job_seeker.profile.resume_uploaded'),
        );
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

    public function uploadCoverLetter(UploadJobSeekerCoverLetterRequest $request): RedirectResponse
    {
        $user = $request->user();
        $file = $request->file('cover_letter');

        if ($user === null || $file === null) {
            return back()->withErrors(['cover_letter' => __('job_seeker.profile.cover_letter_required')]);
        }

        if (filled($user->cover_letter_path)) {
            Storage::disk('local')->delete($user->cover_letter_path);
        }

        $path = $file->store('cover-letters/' . $user->id, 'local');

        $user->forceFill([
            'cover_letter_path' => $path,
            'cover_letter_original_name' => $file->getClientOriginalName(),
        ])->save();

        return back()->with('success', __('job_seeker.profile.cover_letter_uploaded'));
    }

    public function downloadCoverLetter(Request $request): StreamedResponse
    {
        $user = $request->user();

        abort_unless(
            $user !== null
                && filled($user->cover_letter_path)
                && Storage::disk('local')->exists((string) $user->cover_letter_path),
            404,
        );

        $downloadName = $user->cover_letter_original_name ?: basename((string) $user->cover_letter_path);

        return Storage::disk('local')->download((string) $user->cover_letter_path, $downloadName);
    }

    public function destroyCoverLetter(Request $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user?->isJobSeeker() === true, 403);

        if (filled($user->cover_letter_path)) {
            Storage::disk('local')->delete((string) $user->cover_letter_path);
        }

        $user->forceFill([
            'cover_letter_path' => null,
            'cover_letter_original_name' => null,
        ])->save();

        return back()->with('success', __('job_seeker.profile.cover_letter_removed'));
    }

    public function uploadHighestDegree(UploadJobSeekerHighestDegreeRequest $request): RedirectResponse
    {
        $user = $request->user();
        $file = $request->file('highest_degree');

        if ($user === null || $file === null) {
            return back()->withErrors(['highest_degree' => __('job_seeker.profile.highest_degree_required')]);
        }

        if (filled($user->highest_degree_path)) {
            Storage::disk('local')->delete($user->highest_degree_path);
        }

        $path = $file->store('highest-degrees/' . $user->id, 'local');

        $user->forceFill([
            'highest_degree_path' => $path,
            'highest_degree_original_name' => $file->getClientOriginalName(),
        ])->save();

        return back()->with('success', __('job_seeker.profile.highest_degree_uploaded'));
    }

    public function downloadHighestDegree(Request $request): StreamedResponse
    {
        $user = $request->user();

        abort_unless(
            $user !== null
                && filled($user->highest_degree_path)
                && Storage::disk('local')->exists((string) $user->highest_degree_path),
            404,
        );

        $downloadName = $user->highest_degree_original_name ?: basename((string) $user->highest_degree_path);

        return Storage::disk('local')->download((string) $user->highest_degree_path, $downloadName);
    }

    public function destroyHighestDegree(Request $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user?->isJobSeeker() === true, 403);

        if (filled($user->highest_degree_path)) {
            Storage::disk('local')->delete((string) $user->highest_degree_path);
        }

        $user->forceFill([
            'highest_degree_path' => null,
            'highest_degree_original_name' => null,
        ])->save();

        return back()->with('success', __('job_seeker.profile.highest_degree_removed'));
    }

    public function uploadOtherDocument(UploadJobSeekerOtherDocumentRequest $request): RedirectResponse
    {
        $user = $request->user();
        $file = $request->file('other_document');

        if ($user === null || $file === null) {
            return back()->withErrors(['other_document' => __('job_seeker.profile.other_document_required')]);
        }

        if (filled($user->other_document_path)) {
            Storage::disk('local')->delete($user->other_document_path);
        }

        $path = $file->store('other-documents/' . $user->id, 'local');

        $user->forceFill([
            'other_document_path' => $path,
            'other_document_original_name' => $file->getClientOriginalName(),
        ])->save();

        return back()->with('success', __('job_seeker.profile.other_document_uploaded'));
    }

    public function downloadOtherDocument(Request $request): StreamedResponse
    {
        $user = $request->user();

        abort_unless(
            $user !== null
                && filled($user->other_document_path)
                && Storage::disk('local')->exists((string) $user->other_document_path),
            404,
        );

        $downloadName = $user->other_document_original_name ?: basename((string) $user->other_document_path);

        return Storage::disk('local')->download((string) $user->other_document_path, $downloadName);
    }

    public function destroyOtherDocument(Request $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user?->isJobSeeker() === true, 403);

        if (filled($user->other_document_path)) {
            Storage::disk('local')->delete((string) $user->other_document_path);
        }

        $user->forceFill([
            'other_document_path' => null,
            'other_document_original_name' => null,
        ])->save();

        return back()->with('success', __('job_seeker.profile.other_document_removed'));
    }

    /**
     * @param  array<int, mixed>  $incoming
     * @param  array<int, mixed>  $previous
     * @return list<array{name: string, issuer: string, date: string, attachments?: list<array{file_path: string, file_name: string}>}>
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

                $attachments = collect($this->normalizeAttachmentList($record))
                    ->filter(fn(array $file): bool => filled($file['file_path'] ?? null)
                        && Storage::disk('local')->exists((string) $file['file_path']))
                    ->map(fn(array $file): array => [
                        'file_path' => (string) $file['file_path'],
                        'file_name' => filled($file['file_name'] ?? null)
                            ? (string) $file['file_name']
                            : basename((string) $file['file_path']),
                    ])
                    ->values()
                    ->all();

                if ($attachments !== []) {
                    $normalized['attachments'] = $attachments;
                }

                return $normalized;
            })
            ->filter(fn(array $entry): bool => $entry['name'] !== ''
                || $entry['issuer'] !== ''
                || $entry['date'] !== ''
                || isset($entry['attachments']))
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
            ->flatMap(fn(mixed $item): array => is_array($item) ? $this->normalizeAttachmentList($item) : [])
            ->map(fn(array $file): ?string => $file['file_path'] ?? null)
            ->filter()
            ->values()
            ->all();

        foreach ($previous as $item) {
            if (! is_array($item)) {
                continue;
            }

            foreach ($this->normalizeAttachmentList($item) as $file) {
                if (! filled($file['file_path'] ?? null)) {
                    continue;
                }

                if (! in_array($file['file_path'], $keep, true)) {
                    Storage::disk('local')->delete((string) $file['file_path']);
                }
            }
        }
    }

    /**
     * @param  array<string, mixed>  $record
     * @return list<array{file_path: string|null, file_name: string|null, file_url?: string|null}>
     */
    private function certificationAttachmentsForDisplay(array $record, int $certIndex, ?int $userId): array
    {
        return collect($this->normalizeAttachmentList($record))
            ->values()
            ->map(function (array $file, int $attachmentIndex) use ($certIndex, $userId) {
                $hasFile = filled($file['file_path'] ?? null)
                    && Storage::disk('local')->exists((string) $file['file_path']);

                if (! $hasFile) {
                    return null;
                }

                return [
                    'file_path' => (string) $file['file_path'],
                    'file_name' => $file['file_name'] ?? basename((string) $file['file_path']),
                    'file_url' => $userId !== null
                        ? route('job-seeker.profile.certifications.download', [
                            'index' => $certIndex,
                            'attachment' => $attachmentIndex,
                        ])
                        : null,
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $entry
     * @return list<array{file_path?: string, file_name?: string}>
     */
    private function normalizeAttachmentList(array $entry): array
    {
        $attachments = [];

        if (isset($entry['attachments']) && is_array($entry['attachments'])) {
            foreach ($entry['attachments'] as $attachment) {
                if (! is_array($attachment) || ! filled($attachment['file_path'] ?? null)) {
                    continue;
                }

                $attachments[] = [
                    'file_path' => (string) $attachment['file_path'],
                    'file_name' => filled($attachment['file_name'] ?? null)
                        ? (string) $attachment['file_name']
                        : basename((string) $attachment['file_path']),
                ];
            }
        }

        if ($attachments === [] && filled($entry['file_path'] ?? null)) {
            $attachments[] = [
                'file_path' => (string) $entry['file_path'],
                'file_name' => filled($entry['file_name'] ?? null)
                    ? (string) $entry['file_name']
                    : basename((string) $entry['file_path']),
            ];
        }

        return array_values($attachments);
    }

    private function applyExtractedCvData(int $userId, UploadedFile $resume): bool
    {
        try {
            $extracted = JobSeekerCvExtractor::extract($resume);

            $hasContent = filled($extracted['name'])
                || filled($extracted['phone'])
                || filled($extracted['location'])
                || filled($extracted['headline'])
                || filled($extracted['bio'])
                || filled($extracted['linkedin_url'])
                || filled($extracted['github_url'])
                || $extracted['skills'] !== []
                || $extracted['education'] !== []
                || $extracted['experience'] !== []
                || $extracted['languages'] !== []
                || $extracted['certifications'] !== [];

            if (! $hasContent) {
                return false;
            }

            $user = User::query()->find($userId);

            if ($user === null) {
                return false;
            }

            $userUpdates = [];

            if (filled($extracted['name']) && (! filled($user->name) || $user->name === $user->email)) {
                $userUpdates['name'] = $extracted['name'];
            }

            if (filled($extracted['phone']) && ! filled($user->phone)) {
                $userUpdates['phone'] = $extracted['phone'];
            }

            if (filled($extracted['location']) && ! filled($user->location)) {
                $userUpdates['location'] = $extracted['location'];
            }

            if ($userUpdates !== []) {
                $user->forceFill($userUpdates)->save();
            }

            $profile = JobSeekerProfile::query()->firstOrCreate(
                ['user_id' => $userId],
                [],
            );

            $profileUpdates = [];

            foreach (['headline', 'current_title', 'bio', 'linkedin_url', 'github_url'] as $field) {
                if (filled($extracted[$field]) && ! filled($profile->{$field})) {
                    $profileUpdates[$field] = $extracted[$field];
                }
            }

            foreach (['skills', 'education', 'experience', 'languages'] as $field) {
                $existing = is_array($profile->{$field}) ? $profile->{$field} : [];

                if ($extracted[$field] !== [] && $existing === []) {
                    $profileUpdates[$field] = $extracted[$field];
                }
            }

            $existingCertifications = is_array($profile->certifications) ? $profile->certifications : [];

            if ($extracted['certifications'] !== [] && $existingCertifications === []) {
                $profileUpdates['certifications'] = $extracted['certifications'];
            }

            if ($profileUpdates !== []) {
                $profile->forceFill($profileUpdates)->save();
            }

            return $userUpdates !== [] || $profileUpdates !== [];
        } catch (\Throwable) {
            return false;
        }
    }
}
