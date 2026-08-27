<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Enums\EmployerVerificationStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class VerificationCenterController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->canManageVerification(), 403);

        $pending = User::query()
            ->where('role', UserRole::Employer)
            ->where('verification_status', EmployerVerificationStatus::Pending)
            ->latest()
            ->get()
            ->map(function (User $employer) {
                $hasDocument = $employer->hasVerificationDocument();

                return [
                    'id' => $employer->id,
                    'company_name' => $employer->company_name ?: $employer->name,
                    'contact' => $employer->contact_name ?: $employer->name,
                    'email' => $employer->email,
                    'industry' => $employer->industry ?: '—',
                    'created_at' => $employer->created_at?->toDateString(),
                    'can_review' => true,
                    'has_document' => $hasDocument,
                    'document_name' => $hasDocument
                        ? $employer->verification_document_original_name
                        : null,
                    'document_url' => $hasDocument
                        ? route('admin.verifications.document', $employer)
                        : null,
                ];
            });

        $base = User::query()->where('role', UserRole::Employer);

        return Inertia::render('backend/Admin/VerificationCenter', [
            'pending' => $pending,
            'stats' => [
                'pending' => (clone $base)->where('verification_status', EmployerVerificationStatus::Pending)->count(),
                'approved' => (clone $base)->where('verification_status', EmployerVerificationStatus::Approved)->count(),
                'rejected' => (clone $base)->where('verification_status', EmployerVerificationStatus::Rejected)->count(),
                'total' => (clone $base)->count(),
            ],
        ]);
    }

    public function downloadDocument(Request $request, User $user): StreamedResponse
    {
        abort_unless($request->user()?->canManageVerification(), 403);
        abort_unless($user->isEmployer(), 404);
        abort_unless($user->hasVerificationDocument(), 404);

        $downloadName = $user->verification_document_original_name
            ?: basename((string) $user->verification_document_path);

        return Storage::disk('local')->download(
            (string) $user->verification_document_path,
            $downloadName,
        );
    }
}
