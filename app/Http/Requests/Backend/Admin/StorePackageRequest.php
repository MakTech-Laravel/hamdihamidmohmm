<?php

namespace App\Http\Requests\Backend\Admin;

use App\Models\Package;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StorePackageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->canManagePackages() === true;
    }

    protected function prepareForValidation(): void
    {
        $name = is_string($this->input('name')) ? trim($this->input('name')) : '';
        $slug = is_string($this->input('slug')) ? trim($this->input('slug')) : '';
        $generatedSlug = $slug === '' && $name !== '';

        if ($generatedSlug) {
            $slug = $this->uniqueSlug(Str::slug($name) ?: 'package');
        } elseif ($slug !== '') {
            $slug = Str::slug($slug);
        }

        $currency = strtoupper(trim((string) $this->input('currency', 'SGD')));

        if (strlen($currency) !== 3) {
            $currency = 'SGD';
        }

        $description = $this->input('description');

        $this->merge([
            'name' => $name,
            'slug' => $slug,
            'description' => is_string($description) && $description !== ''
                ? Package::toStorageKey($description)
                : $description,
            'currency' => $currency,
            'billing_period' => trim((string) $this->input('billing_period', 'month')) ?: 'month',
            'price' => (int) $this->input('price', 0),
            'job_credits' => (int) $this->input('job_credits', 0),
            'featured_credits' => (int) $this->input('featured_credits', 0),
            'sort_order' => (int) $this->input('sort_order', 0),
            'features' => $this->storageLines('features'),
            'excluded_features' => $this->storageLines('excluded_features'),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'slug' => ['required', 'string', 'max:50', 'alpha_dash', Rule::unique('packages', 'slug')],
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

    private function uniqueSlug(string $base): string
    {
        $candidate = $base;
        $suffix = 1;

        while (Package::query()->where('slug', $candidate)->exists()) {
            $candidate = $base.'-'.$suffix;
            $suffix++;
        }

        return $candidate;
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
