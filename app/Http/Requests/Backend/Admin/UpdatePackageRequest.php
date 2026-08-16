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
            'price' => ['required', 'integer', 'min:0'],
            'billing_period' => ['required', 'string', 'max:50'],
            'job_credits' => ['required', 'integer', 'min:0'],
            'featured_credits' => ['required', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
