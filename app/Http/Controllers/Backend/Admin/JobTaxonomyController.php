<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Enums\JobTaxonomyType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\StoreJobTaxonomyRequest;
use App\Http\Requests\Backend\Admin\UpdateJobTaxonomyRequest;
use App\Models\JobTaxonomy;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class JobTaxonomyController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->canManageJobs(), 403);

        $typeFilter = $request->string('type')->toString();
        $validTypes = collect(JobTaxonomyType::cases())->map->value->all();

        if ($typeFilter !== '' && ! in_array($typeFilter, $validTypes, true)) {
            $typeFilter = '';
        }

        $items = JobTaxonomy::query()
            ->when($typeFilter !== '', fn ($query) => $query->ofType($typeFilter))
            ->orderBy('type')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (JobTaxonomy $item) => [
                'id' => $item->id,
                'type' => $item->type?->value,
                'type_label' => $item->type?->label(),
                'name' => $item->name,
                'slug' => $item->slug,
                'is_active' => $item->is_active,
                'sort_order' => $item->sort_order,
            ]);

        return Inertia::render('backend/Admin/JobTaxonomies', [
            'items' => $items,
            'filters' => [
                'type' => $typeFilter,
            ],
            'types' => collect(JobTaxonomyType::cases())
                ->map(fn (JobTaxonomyType $type) => [
                    'value' => $type->value,
                    'label' => $type->label(),
                ])
                ->values()
                ->all(),
        ]);
    }

    public function store(StoreJobTaxonomyRequest $request): RedirectResponse
    {
        JobTaxonomy::query()->create($request->validated());

        return back()->with('success', 'Filter option created.');
    }

    public function update(UpdateJobTaxonomyRequest $request, JobTaxonomy $jobTaxonomy): RedirectResponse
    {
        $jobTaxonomy->update($request->validated());

        return back()->with('success', 'Filter option updated.');
    }

    public function destroy(Request $request, JobTaxonomy $jobTaxonomy): RedirectResponse
    {
        abort_unless($request->user()?->canManageJobs(), 403);

        $jobTaxonomy->forceFill(['is_active' => false])->save();

        return back()->with('success', 'Filter option deactivated.');
    }
}
