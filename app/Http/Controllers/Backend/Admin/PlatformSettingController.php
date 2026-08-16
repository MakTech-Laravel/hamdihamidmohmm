<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\UpdatePlatformSettingsRequest;
use App\Models\PlatformSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlatformSettingController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->canManageSettings(), 403);

        return Inertia::render('backend/Admin/PlatformSettings', [
            'settings' => PlatformSetting::grouped(),
        ]);
    }

    public function update(UpdatePlatformSettingsRequest $request): RedirectResponse
    {
        $group = $request->string('group')->toString();
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

        return back()->with('success', 'Settings reset to defaults.');
    }
}
