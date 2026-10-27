<?php

namespace App\Http\Controllers\Backend\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\User\StoreEmployerJobPanelMemberRequest;
use App\Models\JobPost;
use App\Models\User;
use App\Support\EmployerJobAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmployerJobPanelController extends Controller
{
    public function index(Request $request, JobPost $job): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null && EmployerJobAccess::canManagePanel($user), 403);
        abort_unless((int) $job->employer_id === $user->employerAccountId(), 403);

        $assigned = $job->panelMembers()
            ->orderBy('name')
            ->get(['users.id', 'users.name', 'users.email'])
            ->map(fn (User $member): array => [
                'id' => $member->id,
                'name' => $member->name,
                'email' => $member->email,
            ])
            ->values()
            ->all();

        $assignedIds = collect($assigned)->pluck('id')->all();

        $eligible = User::query()
            ->where('employer_owner_id', $user->id)
            ->when($assignedIds !== [], fn ($query) => $query->whereNotIn('id', $assignedIds))
            ->orderBy('name')
            ->get(['id', 'name', 'email'])
            ->map(fn (User $member): array => [
                'id' => $member->id,
                'name' => $member->name,
                'email' => $member->email,
            ])
            ->values()
            ->all();

        return response()->json([
            'assigned' => $assigned,
            'eligible' => $eligible,
        ]);
    }

    public function store(StoreEmployerJobPanelMemberRequest $request, JobPost $job): RedirectResponse|JsonResponse
    {
        $owner = $request->user();
        abort_unless($owner !== null, 403);

        $member = User::query()->findOrFail($request->integer('user_id'));

        EmployerJobAccess::assignMember($job, $member, $owner);

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return back()->with('success', 'Panel member assigned.');
    }

    public function destroy(Request $request, JobPost $job, User $user): RedirectResponse|JsonResponse
    {
        $owner = $request->user();
        abort_unless($owner !== null && EmployerJobAccess::canManagePanel($owner), 403);
        abort_unless((int) $job->employer_id === $owner->employerAccountId(), 403);
        abort_unless((int) $user->employer_owner_id === (int) $owner->id, 403);

        $job->panelMembers()->detach($user->id);

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return back()->with('success', 'Panel member removed.');
    }
}
