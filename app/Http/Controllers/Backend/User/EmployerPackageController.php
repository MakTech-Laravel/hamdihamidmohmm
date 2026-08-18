<?php

namespace App\Http\Controllers\Backend\User;

use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\User\SelectEmployerPackageRequest;
use App\Models\Package;
use App\Models\Payment;
use App\Services\Stripe\StripeSubscriptionService;
use App\Support\EmployerPlanSnapshot;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Stripe\Exception\ApiConnectionException;
use Stripe\Exception\ApiErrorException;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class EmployerPackageController extends Controller
{
    public function __construct(private StripeSubscriptionService $subscriptions) {}

    public function index(Request $request): Response
    {
        $employer = $request->user();
        abort_unless($employer !== null, 403);
        $employer->refresh();

        $plan = EmployerPlanSnapshot::for($employer);

        $packages = Package::query()
            ->publicActive()
            ->get()
            ->map(fn (Package $package) => [
                'id' => $package->id,
                'slug' => $package->slug,
                'name' => Package::localizedLabel($package->name) ?? $package->name,
                'description' => Package::localizedLabel($package->description),
                'price' => $package->price,
                'currency' => $package->currency,
                'billing_period' => $package->billing_period,
                'job_credits' => $package->job_credits,
                'featured_credits' => $package->featured_credits,
                'is_featured' => $package->is_featured,
                'current' => $employer->package?->value === $package->slug,
                'features' => collect($package->displayFeatures())
                    ->map(fn (array $feature): array => [
                        'key' => $feature['key'],
                        'label' => Package::localizedLabel($feature['key']) ?? $feature['key'],
                        'included' => $feature['included'],
                    ])
                    ->values()
                    ->all(),
            ]);

        $invoices = Payment::query()
            ->where('employer_id', $employer->id)
            ->with('package:id,name,currency')
            ->latest()
            ->get()
            ->map(fn (Payment $payment) => [
                'id' => $payment->id,
                'reference' => $payment->reference,
                'package' => $payment->package?->name ?? '—',
                'amount' => $payment->amount,
                'currency' => $payment->package?->currency ?? $payment->currency,
                'status' => $payment->status === PaymentStatus::Completed ? 'Paid' : ($payment->status?->label() ?? '—'),
                'status_value' => $payment->status?->value,
                'date' => $payment->paid_at?->toFormattedDateString() ?? $payment->created_at?->toFormattedDateString(),
                'invoice_url' => $payment->invoice_url,
            ]);

        if ($request->string('checkout')->toString() === 'canceled') {
            session()->now('error', 'Checkout was canceled. No payment was taken.');
        }

        return Inertia::render('backend/User/EmployerPackages', [
            'plan' => $plan,
            'packages' => $packages,
            'invoices' => $invoices,
            'billing' => [
                'enabled' => $this->subscriptions->enabled(),
                'can_manage' => filled($employer->stripe_customer_id),
            ],
        ]);
    }

    public function select(SelectEmployerPackageRequest $request, Package $package): RedirectResponse|HttpResponse
    {
        $employer = $request->user();
        abort_unless($employer !== null, 403);
        $employer->refresh();

        try {
            $result = $this->subscriptions->startCheckout($employer, $package);
        } catch (RuntimeException|ApiErrorException $exception) {
            return back()->with('error', $this->billingErrorMessage($exception));
        }

        if (($result['status'] ?? null) === 'redirect' && is_string($result['url'] ?? null)) {
            return Inertia::location($result['url']);
        }

        return back()->with('success', $result['message']);
    }

    public function checkoutSuccess(Request $request): RedirectResponse
    {
        $employer = $request->user();
        abort_unless($employer !== null, 403);
        $employer->refresh();

        $sessionId = $request->string('session_id')->toString();

        if ($sessionId === '') {
            return redirect()->route('employer.packages')->with('error', 'Missing Stripe Checkout session.');
        }

        try {
            $this->subscriptions->fulfillSessionId($sessionId);
        } catch (RuntimeException|ApiErrorException $exception) {
            return redirect()->route('employer.packages')->with('error', $this->billingErrorMessage($exception));
        }

        return redirect()->route('employer.packages')->with('success', 'Payment received. Your subscription is now active.');
    }

    public function portal(Request $request): RedirectResponse|HttpResponse
    {
        $employer = $request->user();
        abort_unless($employer !== null, 403);
        $employer->refresh();

        try {
            return Inertia::location($this->subscriptions->billingPortalUrl($employer));
        } catch (RuntimeException|ApiErrorException $exception) {
            return back()->with('error', $this->billingErrorMessage($exception));
        }
    }

    private function billingErrorMessage(RuntimeException|ApiErrorException $exception): string
    {
        if ($exception instanceof ApiConnectionException || $exception->getPrevious() instanceof ApiConnectionException) {
            return 'Could not reach Stripe. Check your internet connection, firewall, or VPN, then try again.';
        }

        return $exception->getMessage();
    }
}
