<?php

namespace App\Http\Controllers\Backend\User;

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

        return Inertia::render('backend/User/EmployerCompanyProfile', [
            'profile' => [
                'company_name' => $employer?->company_name,
                'contact_name' => $employer?->contact_name,
                'industry' => $employer?->industry,
                'website' => $employer?->website,
                'about' => $employer?->about,
                'address' => $employer?->address,
                'phone' => $employer?->phone,
                'email' => $employer?->email,
                'verification' => $employer?->verification_status?->label(),
                'package' => $employer?->package?->label(),
            ],
        ]);
    }

    public function update(UpdateEmployerProfileRequest $request): RedirectResponse
    {
        $request->user()?->forceFill($request->validated())->save();

        return back()->with('success', 'Company profile updated.');
    }
}
