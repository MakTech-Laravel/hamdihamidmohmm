<?php

namespace App\Http\Requests\Backend\Admin;

use App\Models\Package;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePackageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->canManagePackages() === true;
    }

    protected function prepareForValidation(): void
    {
        $description = $this->input('description');
        $currency = strtoupper(trim((string) $this->input('currency', 'SDG')));

        if (strlen($currency) !== 3) {
            $currency = 'SDG';
        }

        $this->merge([
            'description' => is_string($description) && $description !== ''
                ? Package::toStorageKey($description)
                : $description,
            'currency' => $currency,
            'features' => $this->storageLines('features'),
            'excluded_features' => $this->storageLines('excluded_features'),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $package = $this->route('package');
        $packageId = $package instanceof Package ? $package->id : null;

        return [
            'slug' => ['required', 'string', 'max:50', 'alpha_dash', Rule::unique('packages', 'slug')->ignore($packageId)],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:500'],
            'price' => ['required', 'integer', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'billing_period' => ['required', 'string', 'max:50'],
            'job_credits' => ['required', 'integer', 'min:0'],
            'featured_credits' => ['required', 'integer', 'min:0'],
            'features' => ['nullable', 'array'],
            'features.*' => ['string', 'max:255'],
            'excluded_features' => ['nullable', 'array'],
            'excluded_features.*' => ['string', 'max:255'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'is_featured' => ['sometimes', 'boolean'],
            'is_public' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'slug.required' => 'Please enter a package slug.',
            'slug.unique' => 'This package slug is already in use.',
            'name.required' => 'Please enter a package name.',
            'price.required' => 'Please enter a package price.',
            'billing_period.required' => 'Please enter a billing period.',
            'job_credits.required' => 'Please enter the number of job credits.',
            'featured_credits.required' => 'Please enter the number of featured credits.',
        ];
    }

    /**
     * @return list<string>
     */
    private function storageLines(string $key): array
    {
        return array_values(array_filter(array_map(
            fn (string $line): string => Package::toStorageKey($line),
            $this->lines($key),
        )));
    }

    /**
     * @return list<string>
     */
    private function lines(string $key): array
    {
        $value = $this->input($key);

        if (is_array($value)) {
            return array_values(array_filter(array_map(
                fn (mixed $line): string => is_string($line) ? trim($line) : '',
                $value,
            )));
        }

        return array_values(array_filter(array_map(
            'trim',
            preg_split('/\r\n|\r|\n/', (string) $value) ?: [],
        )));
    }
}
