<?php

namespace App\Ai\Tools;

use App\Ai\Concerns\EncodesToolResults;
use App\Enums\PaymentStatus;
use App\Models\Payment;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class GetPaymentInsights implements Tool
{
    use EncodesToolResults;

    /**
     * Get the description of the tool's purpose.
     */
    public function description(): Stringable|string
    {
        return 'Get payment and revenue statistics: payment counts and amounts by status, completed revenue '
            .'(all time, this month, last N days) and payments waiting for admin approval.';
    }

    /**
     * Execute the tool.
     */
    public function handle(Request $request): Stringable|string
    {
        $days = max(1, min(365, (int) ($request['days'] ?? 30)));

        $byStatus = Payment::query()
            ->toBase()
            ->selectRaw('status, COUNT(*) as payments, COALESCE(SUM(amount), 0) as amount')
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        $completed = Payment::query()->where('status', PaymentStatus::Completed);

        return $this->encode([
            'currency' => Payment::query()->value('currency') ?? 'SDG',
            'by_status' => collect(PaymentStatus::cases())
                ->mapWithKeys(fn (PaymentStatus $status): array => [$status->label() => [
                    'payments' => (int) ($byStatus[$status->value]->payments ?? 0),
                    'amount' => (int) ($byStatus[$status->value]->amount ?? 0),
                ]])
                ->all(),
            'revenue_all_time' => (int) (clone $completed)->sum('amount'),
            'revenue_this_month' => (int) (clone $completed)->where('paid_at', '>=', now()->startOfMonth())->sum('amount'),
            "revenue_last_{$days}_days" => (int) (clone $completed)->where('paid_at', '>=', now()->subDays($days))->sum('amount'),
            'pending_payments' => Payment::query()
                ->where('status', PaymentStatus::Pending)
                ->with('employer:id,name,company_name', 'package:id,name')
                ->latest()
                ->limit(10)
                ->get()
                ->map(fn (Payment $payment): array => [
                    'employer' => $payment->employer?->company_name ?: $payment->employer?->name,
                    'package' => $payment->package?->name,
                    'amount' => $payment->amount,
                    'currency' => $payment->currency,
                    'method' => $payment->method,
                    'reference' => $payment->reference,
                    'submitted_at' => $payment->created_at?->toDateTimeString(),
                ])
                ->values()
                ->all(),
            'admin_url' => route('admin.payments.index', absolute: false),
        ]);
    }

    /**
     * Get the tool's schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'days' => $schema->integer()->min(1)->max(365)->description('Look-back window in days for the revenue period (default 30).'),
        ];
    }
}
