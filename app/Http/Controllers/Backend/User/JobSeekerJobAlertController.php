<?php

namespace App\Http\Controllers\Backend\User;

use App\Enums\JobTaxonomyType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\User\StoreJobAlertRequest;
use App\Http\Requests\Backend\User\UpdateJobAlertRequest;
use App\Models\JobAlert;
use App\Models\JobTaxonomy;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class JobSeekerJobAlertController extends Controller
{
    public function index(Request $request): Response
    {
        $alerts = JobAlert::query()
            ->where('user_id', $request->user()?->id)
            ->latest()
            ->get()
            ->map(fn (JobAlert $alert): array => $this->payload($alert));

        return Inertia::render('backend/User/JobSeekerJobAlerts', [
            'alerts' => $alerts,
            'filterOptions' => JobTaxonomy::filterOptions(),
        ]);
    }

    public function store(StoreJobAlertRequest $request): RedirectResponse
    {
        $alert = JobAlert::query()->create([
            ...$request->safe()->only([
                'name',
                'keyword',
                'country',
                'location',
                'category',
                'employment_type',
                'is_active',
            ]),
            'user_id' => $request->user()?->id,
        ]);

        return to_route('job-seeker.alerts.index')
            ->with('success', __('job_seeker.alerts.flash.created', ['name' => $alert->displayName()]));
    }

    public function update(UpdateJobAlertRequest $request, JobAlert $alert): RedirectResponse
    {
        $this->authorizeAlert($request, $alert);

        $alert->forceFill($request->safe()->only([
            'name',
            'keyword',
            'country',
            'location',
            'category',
            'employment_type',
            'is_active',
        ]))->save();

        return to_route('job-seeker.alerts.index')
            ->with('success', __('job_seeker.alerts.flash.updated', ['name' => $alert->displayName()]));
    }

    public function destroy(Request $request, JobAlert $alert): RedirectResponse
    {
        $this->authorizeAlert($request, $alert);

        $name = $alert->displayName();
        $alert->delete();

        return to_route('job-seeker.alerts.index')
            ->with('success', __('job_seeker.alerts.flash.deleted', ['name' => $name]));
    }

    private function authorizeAlert(Request $request, JobAlert $alert): void
    {
        abort_unless($alert->user_id === $request->user()?->id, 403);
    }

    /**
     * @return array{
     *     id: int,
     *     name: string|null,
     *     display_name: string,
     *     keyword: string|null,
     *     country: string|null,
     *     location: string|null,
     *     category: string|null,
     *     employment_type: string|null,
     *     is_active: bool,
     *     country_label: string|null,
     *     location_label: string|null,
     *     category_label: string|null,
     *     employment_type_label: string|null
     * }
     */
    private function payload(JobAlert $alert): array
    {
        return [
            'id' => $alert->id,
            'name' => $alert->name,
            'display_name' => $alert->displayName(),
            'keyword' => $alert->keyword,
            'country' => $alert->country,
            'location' => $alert->location,
            'category' => $alert->category,
            'employment_type' => $alert->employment_type,
            'is_active' => $alert->is_active,
            'country_label' => JobTaxonomy::labelFor(JobTaxonomyType::Country, $alert->country),
            'location_label' => JobTaxonomy::labelFor(JobTaxonomyType::DutyStation, $alert->location),
            'category_label' => JobTaxonomy::labelFor(JobTaxonomyType::PositionArea, $alert->category),
            'employment_type_label' => JobTaxonomy::labelFor(JobTaxonomyType::EmploymentType, $alert->employment_type),
        ];
    }
}
