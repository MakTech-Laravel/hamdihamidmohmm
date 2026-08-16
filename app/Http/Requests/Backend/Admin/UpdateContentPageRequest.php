<?php

namespace App\Http\Requests\Backend\Admin;

use App\Enums\ContentPageStatus;
use App\Enums\ContentPageType;
use App\Models\ContentPage;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateContentPageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->canManageCms() === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $page = $this->route('contentPage') ?? $this->route('page');
        $pageId = $page instanceof ContentPage ? $page->id : null;

        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'alpha_dash', Rule::unique('content_pages', 'slug')->ignore($pageId)],
            'type' => ['required', 'string', Rule::in(collect(ContentPageType::cases())->map->value->all())],
            'body' => ['nullable', 'string'],
            'status' => ['required', 'string', Rule::in(collect(ContentPageStatus::cases())->map->value->all())],
        ];
    }
}
