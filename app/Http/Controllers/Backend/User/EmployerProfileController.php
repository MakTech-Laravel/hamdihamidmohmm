<?php

namespace App\Http\Controllers\Backend\User;

use App\Enums\EmployerVerificationStatus;
use App\Enums\OrganizationType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\User\UpdateEmployerProfileRequest;
use App\Http\Requests\Backend\User\UpdateEmployerPublicAboutRequest;
use App\Http\Requests\Backend\User\UploadEmployerCoverRequest;
use App\Http\Requests\Backend\User\UploadEmployerLogoRequest;
use App\Http\Requests\Backend\User\UploadEmployerPhotoRequest;
use App\Http\Requests\Backend\User\UploadEmployerVerificationDocumentRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EmployerProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        $employer = $request->user();
        abort_unless($employer !== null, 403);

        $hasLogo = $employer->hasCompanyLogo();
        $hasCover = $employer->hasCompanyCover();
        $hasDocument = $employer->hasVerificationDocument();

        $organizationType = $employer->organization_type ?? OrganizationType::PrivateCompany;

        $profile = [
            'company_name' => $employer->company_name,
            'organization_type' => $organizationType->value,
            'organization_type_label' => $organizationType->label(),
            'contact_name' => $employer->contact_name,
            'industry' => $employer->industry,
            'company_size' => $employer->company_size,
            'founded_year' => $employer->founded_year,
            'website' => $employer->website,
            'linkedin_url' => $employer->linkedin_url,
            'x_url' => $employer->x_url,
            'instagram_url' => $employer->instagram_url,
            'about' => $employer->about,
            'address' => $employer->address,
            'phone' => $employer->phone,
            'email' => $employer->email,
            'verification' => $employer->verification_status?->label(),
            'verification_value' => $employer->verification_status?->value,
            'verified_on' => $employer->verified_at?->format('M j, Y'),
            'package' => $employer->package?->label(),
            'initials' => collect(explode(' ', (string) ($employer->company_name ?: $employer->name)))
                ->filter()
                ->take(2)
                ->map(fn (string $part): string => strtoupper(substr($part, 0, 1)))
                ->implode(''),
            'logo_url' => $hasLogo ? $employer->companyLogoUrl() : null,
            'cover_url' => $hasCover ? $employer->companyCoverUrl() : null,
            'verification_document_name' => $hasDocument
                ? $employer->verification_document_original_name
                : null,
            'verification_document_url' => $hasDocument
                ? route('employer.profile.verification-document.download')
                : null,
        ];

        $sections = [
            'company' => filled($profile['company_name'])
                && filled($profile['organization_type'])
                && filled($profile['industry']),
            'logo' => $hasLogo,
            'about' => filled($profile['about']),
            'contact' => filled($profile['contact_name']) && filled($profile['email']) && filled($profile['phone']),
            'social' => filled($profile['linkedin_url']) || filled($profile['x_url']) || filled($profile['instagram_url']),
            'verification' => $hasDocument
                || $employer->verification_status === EmployerVerificationStatus::Approved,
            'cover' => $hasCover,
        ];

        $completed = collect($sections)->filter()->count();

        return Inertia::render('backend/User/EmployerCompanyProfile', [
            'profile' => $profile,
            'organizationTypes' => OrganizationType::options(),
            'completion' => [
                'percent' => (int) round(($completed / max(count($sections), 1)) * 100),
                'completed' => $completed,
                'total' => count($sections),
                'sections' => $sections,
            ],
        ]);
    }

    public function update(UpdateEmployerProfileRequest $request): RedirectResponse
    {
        $request->user()?->forceFill($request->validated())->save();

        return back()->with('success', 'Organization profile updated.');
    }

    public function updatePublicAbout(UpdateEmployerPublicAboutRequest $request): RedirectResponse
    {
        $request->user()?->forceFill($request->validated())->save();

        return back()->with('success', 'Organization overview updated.');
    }

    public function uploadPhoto(UploadEmployerPhotoRequest $request): RedirectResponse
    {
        $employer = $request->user();
        $photo = $request->file('photo');

        if ($employer === null || $photo === null) {
            return back()->withErrors(['photo' => 'Please choose a profile photo.']);
        }

        if (filled($employer->avatar)) {
            Storage::disk('public')->delete((string) $employer->avatar);
        }

        $path = $photo->store('avatars/'.$employer->id, 'public');

        $employer->forceFill([
            'avatar' => $path,
        ])->save();

        return back()->with('success', 'Profile photo updated.');
    }

    public function destroyPhoto(Request $request): RedirectResponse
    {
        $employer = $request->user();
        abort_unless($employer?->isEmployer() === true, 403);

        if (filled($employer->avatar)) {
            Storage::disk('public')->delete((string) $employer->avatar);
        }

        $employer->forceFill([
            'avatar' => null,
        ])->save();

        return back()->with('success', 'Profile photo removed.');
    }

    public function uploadLogo(UploadEmployerLogoRequest $request): RedirectResponse
    {
        $employer = $request->user();
        $logo = $request->file('logo');

        if ($employer === null || $logo === null) {
            return back()->withErrors(['logo' => 'Please choose an organization logo.']);
        }

        if (filled($employer->company_logo_path)) {
            Storage::disk('public')->delete($employer->company_logo_path);
        }

        $path = $logo->store('company-logos/'.$employer->id, 'public');

        $employer->forceFill([
            'company_logo_path' => $path,
        ])->save();

        return back()->with('success', 'Organization logo updated.');
    }

    public function destroyLogo(Request $request): RedirectResponse
    {
        $employer = $request->user();
        abort_unless($employer?->isEmployer() === true, 403);

        if (filled($employer->company_logo_path)) {
            Storage::disk('public')->delete((string) $employer->company_logo_path);
        }

        $employer->forceFill([
            'company_logo_path' => null,
        ])->save();

        return back()->with('success', 'Organization logo removed.');
    }

    public function uploadCover(UploadEmployerCoverRequest $request): RedirectResponse
    {
        $employer = $request->user();
        $cover = $request->file('cover');

        if ($employer === null || $cover === null) {
            return back()->withErrors(['cover' => 'Please choose a cover banner.']);
        }

        if (filled($employer->company_cover_path)) {
            Storage::disk('public')->delete($employer->company_cover_path);
        }

        $path = $cover->store('company-covers/'.$employer->id, 'public');

        $employer->forceFill([
            'company_cover_path' => $path,
        ])->save();

        return back()->with('success', 'Cover banner updated.');
    }

    public function destroyCover(Request $request): RedirectResponse
    {
        $employer = $request->user();
        abort_unless($employer?->isEmployer() === true, 403);

        if (filled($employer->company_cover_path)) {
            Storage::disk('public')->delete((string) $employer->company_cover_path);
        }

        $employer->forceFill([
            'company_cover_path' => null,
        ])->save();

        return back()->with('success', 'Cover banner removed.');
    }

    public function uploadVerificationDocument(UploadEmployerVerificationDocumentRequest $request): RedirectResponse
    {
        $employer = $request->user();
        $document = $request->file('document');

        if ($employer === null || $document === null) {
            return back()->withErrors(['document' => 'Please upload a verification document.']);
        }

        if (filled($employer->verification_document_path)) {
            Storage::disk('local')->delete($employer->verification_document_path);
        }

        $path = $document->store('verification-documents/'.$employer->id, 'local');

        $employer->forceFill([
            'verification_document_path' => $path,
            'verification_document_original_name' => $document->getClientOriginalName(),
        ])->save();

        return back()->with('success', 'Verification document uploaded.');
    }

    public function downloadVerificationDocument(Request $request): StreamedResponse
    {
        $employer = $request->user();
        abort_unless($employer?->isEmployer() === true, 403);
        abort_unless(
            filled($employer->verification_document_path)
                && Storage::disk('local')->exists((string) $employer->verification_document_path),
            404,
        );

        $downloadName = $employer->verification_document_original_name
            ?: basename((string) $employer->verification_document_path);

        return Storage::disk('local')->download(
            (string) $employer->verification_document_path,
            $downloadName,
        );
    }

    public function destroyVerificationDocument(Request $request): RedirectResponse
    {
        $employer = $request->user();
        abort_unless($employer?->isEmployer() === true, 403);

        if (filled($employer->verification_document_path)) {
            Storage::disk('local')->delete((string) $employer->verification_document_path);
        }

        $employer->forceFill([
            'verification_document_path' => null,
            'verification_document_original_name' => null,
        ])->save();

        return back()->with('success', 'Verification document removed.');
    }
}
