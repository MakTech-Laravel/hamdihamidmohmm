<?php

namespace App\Http\Controllers\Backend\User;

use App\Enums\EmployerVerificationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\User\UpdateEmployerProfileRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployerProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        $employer = $request->user();
        abort_unless($employer !== null, 403);

        $profile = [
            'company_name' => $employer->company_name,
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
        ];

        $sections = [
            'company' => filled($profile['company_name']) && filled($profile['industry']),
            'logo' => true,
            'about' => filled($profile['about']),
            'contact' => filled($profile['contact_name']) && filled($profile['email']) && filled($profile['phone']),
            'social' => filled($profile['linkedin_url']) || filled($profile['x_url']) || filled($profile['instagram_url']),
            'verification' => $employer->verification_status === EmployerVerificationStatus::Approved,
            'cover' => false,
        ];

        $completed = collect($sections)->filter()->count();

        return Inertia::render('backend/User/EmployerCompanyProfile', [
            'profile' => $profile,
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

        return back()->with('success', 'Company profile updated.');
    }
}
