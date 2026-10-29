<?php

use App\Enums\EmployerVerificationStatus;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

test('verification center lists document flags for pending employers', function () {
    Storage::fake('local');

    $admin = User::factory()->admin()->create();
    $withDoc = User::factory()->pendingEmployer()->create([
        'company_name' => 'Doc Corp',
        'created_at' => now()->subMinute(),
    ]);
    $withoutDoc = User::factory()->pendingEmployer()->create([
        'company_name' => 'No Doc Corp',
        'created_at' => now(),
    ]);

    $path = 'verification-documents/'.$withDoc->id.'/cr.pdf';
    Storage::disk('local')->put($path, '%PDF-1.4 license');
    $withDoc->forceFill([
        'verification_document_path' => $path,
        'verification_document_original_name' => 'cr.pdf',
        'verification_status' => EmployerVerificationStatus::Pending,
    ])->save();

    $this->actingAs($admin)
        ->get(route('admin.verifications.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/Admin/VerificationCenter')
            ->has('pending.data', 2)
            ->where('pending.data.0.company_name', 'No Doc Corp')
            ->where('pending.data.0.has_document', false)
            ->where('pending.data.0.document_name', null)
            ->where('pending.data.1.company_name', 'Doc Corp')
            ->where('pending.data.1.has_document', true)
            ->where('pending.data.1.document_name', 'cr.pdf')
            ->where('pending.data.1.document_url', route('admin.verifications.document', $withDoc)));

    $this->actingAs($admin)
        ->get(route('admin.verifications.document', $withDoc))
        ->assertOk()
        ->assertDownload('cr.pdf');

    $this->actingAs($admin)
        ->get(route('admin.verifications.document', $withoutDoc))
        ->assertNotFound();

    $employer = User::factory()->employer()->create();

    $this->actingAs($employer)
        ->get(route('admin.verifications.document', $withDoc))
        ->assertRedirect();
});
