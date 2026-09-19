<?php

namespace App\Http\Requests\Backend\Admin;

use App\Enums\JobTaxonomyType;
use App\Models\JobTaxonomy;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StoreJobTaxonomyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->canManageJobs() === true;
    }

    protected function prepareForValidation(): void
    {
        $name = is_string($this->input('name')) ? trim($this->input('name')) : '';
        $type = trim((string) $this->input('type'));

        $this->merge([
            'name' => $name,
            'slug' => $this->uniqueSlugForType($type, $name),
            'type' => $type,
            'sort_order' => $this->nextSortOrder($type),
            'is_active' => $this->boolean('is_active', true),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', 'string', Rule::enum(JobTaxonomyType::class)],
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:100',
                'alpha_dash',
                Rule::unique('job_taxonomies', 'slug')->where(
                    fn ($query) => $query->where('type', $this->input('type'))
                ),
            ],
            'sort_order' => ['required', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'type.required' => 'Please select a filter type.',
            'name.required' => 'Please enter a name.',
        ];
    }

    private function uniqueSlugForType(string $type, string $name): string
    {
        $base = Str::slug($name) ?: 'option';
        $slug = $base;
        $suffix = 2;

        while (JobTaxonomy::query()->ofType($type)->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }

    private function nextSortOrder(string $type): int
    {
        if ($type === '') {
            return 1;
        }

        $max = (int) JobTaxonomy::query()->ofType($type)->max('sort_order');

        return $max + 1;
    }
}
