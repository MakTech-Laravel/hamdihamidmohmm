<?php

namespace App\Http\Requests\Backend\Admin;

use App\Enums\PaymentStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->canManagePayments() === true;
    }

    protected function prepareForValidation(): void
    {
        $currency = strtoupper(trim((string) $this->input('currency', 'SGD')));

        if (strlen($currency) !== 3) {
            $currency = 'SGD';
        }

        $this->merge([
            'currency' => $currency,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'employer_id' => ['required', 'integer', 'exists:users,id'],
            'package_id' => ['nullable', 'integer', 'exists:packages,id'],
            'amount' => ['required', 'integer', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'method' => ['required', 'string', 'max:50'],
            'status' => ['required', 'string', Rule::in(collect(PaymentStatus::cases())->map->value->all())],
            'reference' => ['nullable', 'string', 'max:100'],
        ];
    }
}
