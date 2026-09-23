<?php

use App\Enums\PaymentStatus;
use App\Models\Package;
use App\Models\Payment;
use App\Models\PlatformSetting;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('employers can submit a manual bank transfer with receipt for admin review', function () {
    Storage::fake('public');

    PlatformSetting::query()->updateOrCreate(
        ['key' => 'payments'],
        ['value' => [
            'bank_name' => 'Bank of Khartoum',
            'bank_account_name' => 'RR Job Portal',
            'bank_account_number' => '1234567890',
            'bank_iban' => 'SD123',
            'bank_instructions' => 'Transfer then upload receipt.',
        ]],
    );

    $employer = User::factory()->employer()->create(['package' => null]);
    $package = Package::factory()->create([
        'slug' => 'professional',
        'name' => 'Starter Plus+',
        'price' => 200,
        'currency' => 'SDG',
        'is_active' => true,
        'is_public' => true,
    ]);

    $receipt = UploadedFile::fake()->create('receipt.pdf', 200, 'application/pdf');

    $this->actingAs($employer)
        ->from(route('employer.packages'))
        ->post(route('employer.packages.manual-payment', $package), [
            'remarks' => 'Payment of $200 for starter package subscription',
            'receipt' => $receipt,
        ])
        ->assertRedirect(route('employer.packages'));

    $payment = Payment::query()->first();

    expect($payment)->not->toBeNull()
        ->and($payment?->status)->toBe(PaymentStatus::Pending)
        ->and($payment?->method)->toBe('bank_transfer')
        ->and($payment?->remarks)->toBe('Payment of $200 for starter package subscription')
        ->and($payment?->receipt_path)->not->toBeNull()
        ->and(Storage::disk('public')->exists((string) $payment?->receipt_path))->toBeTrue()
        ->and($employer->fresh()?->package)->toBeNull();

    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.payments.index', ['status' => 'pending']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('backend/Admin/PaymentsRevenue')
            ->where('payments.data.0.remarks', 'Payment of $200 for starter package subscription')
            ->where('payments.data.0.receipt_url', '/storage/'.$payment?->receipt_path));

    $this->actingAs($admin)
        ->post(route('admin.payments.approve', $payment))
        ->assertRedirect();

    expect($payment->fresh()?->status)->toBe(PaymentStatus::Completed)
        ->and($employer->fresh()?->package?->value)->toBe('professional')
        ->and($employer->fresh()?->subscription_status?->value)->toBe('active')
        ->and($employer->fresh()?->subscription_ends_at)->not->toBeNull();
});

test('employers cannot submit a second pending bank transfer for the same package', function () {
    Storage::fake('public');

    $employer = User::factory()->employer()->create();
    $package = Package::factory()->create([
        'price' => 150,
        'currency' => 'SDG',
        'is_active' => true,
        'is_public' => true,
    ]);

    Payment::factory()->create([
        'employer_id' => $employer->id,
        'package_id' => $package->id,
        'method' => 'bank_transfer',
        'status' => PaymentStatus::Pending,
        'paid_at' => null,
    ]);

    $this->actingAs($employer)
        ->from(route('employer.packages'))
        ->post(route('employer.packages.manual-payment', $package), [
            'remarks' => 'Another payment attempt for the same package',
            'receipt' => UploadedFile::fake()->image('receipt.jpg'),
        ])
        ->assertRedirect(route('employer.packages'))
        ->assertSessionHas('error');

    expect(Payment::query()->count())->toBe(1);
});
