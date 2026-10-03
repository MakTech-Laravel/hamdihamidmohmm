<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\UpdatePlatformSettingsRequest;
use App\Models\EmailTemplate;
use App\Models\PlatformSetting;
use App\Support\ExperienceFilterOptions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlatformSettingController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->canManageSettings(), 403);

        $template = EmailTemplate::ensurePolicyUpdatedExists();

        return Inertia::render('backend/Admin/PlatformSettings', [
            'settings' => PlatformSetting::grouped(),
            'experience_ranges' => ExperienceFilterOptions::all(),
            'email_template' => [
                'id' => $template->id,
                'key' => $template->key,
                'name' => $template->name,
                'subject' => $template->subject,
                'body' => $template->body,
            ],
        ]);
    }

    public function update(UpdatePlatformSettingsRequest $request): RedirectResponse
    {
        $group = $request->string('group')->toString();

        if ($group === 'experience_filters') {
            $ranges = ExperienceFilterOptions::normalizeForStorage(
                $request->input('values.ranges', []),
            );

            PlatformSetting::query()->updateOrCreate(
                ['key' => 'experience_filters'],
                ['value' => ['ranges' => $ranges !== [] ? $ranges : ExperienceFilterOptions::defaults()]],
            );

            return back()->with('success', 'Experience filters saved.');
        }

        if ($group === 'email_templates') {
            $template = EmailTemplate::ensurePolicyUpdatedExists();
            $template->forceFill([
                'subject' => (string) $request->input('values.subject', $template->subject),
                'body' => (string) $request->input('values.body', $template->body),
            ])->save();

            return back()->with('success', 'Email template saved.');
        }

        $defaults = PlatformSetting::defaults()[$group] ?? [];
        $values = array_merge($defaults, $request->input('values', []));

        PlatformSetting::query()->updateOrCreate(
            ['key' => $group],
            ['value' => $values],
        );

        return back()->with('success', 'Settings saved.');
    }

    public function reset(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->canManageSettings(), 403);

        foreach (PlatformSetting::defaults() as $key => $value) {
            PlatformSetting::query()->updateOrCreate(
                ['key' => $key],
                ['value' => $value],
            );
        }

        $defaults = EmailTemplate::policyUpdatedDefaults();
        EmailTemplate::query()->updateOrCreate(
            ['key' => $defaults['key']],
            $defaults,
        );

        return back()->with('success', 'Settings reset to defaults.');
    }
}
