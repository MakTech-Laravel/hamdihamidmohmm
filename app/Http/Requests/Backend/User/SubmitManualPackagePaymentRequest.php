<?php

namespace App\Http\Requests\Backend\User;

use Illuminate\Foundation\Http\FormRequest;

class SubmitManualPackagePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isEmployer() === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'remarks' => ['required', 'string', 'min:10', 'max:1000'],
            'receipt' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'remarks.required' => 'Please add a short payment description.',
            'remarks.min' => 'Please enter at least 10 characters describing the payment.',
            'receipt.required' => 'Please upload your bank transfer receipt.',
            'receipt.mimes' => 'Receipt must be an image (JPG, PNG, WEBP) or PDF.',
            'receipt.max' => 'Receipt must be 5 MB or smaller.',
        ];
    }
}
