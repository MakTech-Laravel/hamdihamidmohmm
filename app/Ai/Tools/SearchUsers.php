<?php

namespace App\Ai\Tools;

use App\Ai\Concerns\EncodesToolResults;
use App\Enums\UserRole;
use App\Models\User;
use BackedEnum;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Database\Eloquent\Builder;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class SearchUsers implements Tool
{
    use EncodesToolResults;

    private const ROLE_FILTERS = [
        'employer' => [UserRole::Employer],
        'job_seeker' => [UserRole::JobSeeker],
        'admin' => [UserRole::Admin, UserRole::SuperAdmin],
    ];

    /**
     * Get the description of the tool's purpose.
     */
    public function description(): Stringable|string
    {
        return 'Look up user accounts (employers, job seekers or admins) by name, company name, email or phone. '
            .'Returns role, account / verification status, package and the admin page link. Read only.';
    }

    /**
     * Execute the tool.
     */
    public function handle(Request $request): Stringable|string
    {
        $term = trim((string) ($request['query'] ?? ''));
        $role = (string) ($request['role'] ?? '');

        if (mb_strlen($term) < 2) {
            return $this->encode(['error' => 'Provide at least 2 characters to search for.']);
        }

        $users = User::query()
            ->where(function (Builder $query) use ($term): void {
                $query->where('name', 'like', "%{$term}%")
                    ->orWhere('company_name', 'like', "%{$term}%")
                    ->orWhere('email', 'like', "%{$term}%")
                    ->orWhere('phone', 'like', "%{$term}%");
            })
            ->when(isset(self::ROLE_FILTERS[$role]), fn (Builder $query) => $query->whereIn(
                'role',
                array_map(fn (UserRole $userRole): int => $userRole->value, self::ROLE_FILTERS[$role]),
            ))
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn (User $user): array => [
                'name' => $user->name,
                'company' => $user->company_name,
                'email' => $user->email,
                'role' => $user->role?->label(),
                'account_status' => $this->label($user->account_status),
                'verification_status' => $user->isEmployer() ? $this->label($user->verification_status) : null,
                'package' => $user->isEmployer() ? $this->label($user->package) : null,
                'joined_on' => $user->created_at?->toDateString(),
                'admin_url' => $this->adminUrl($user),
            ])
            ->values()
            ->all();

        return $this->encode([
            'matches' => count($users),
            'users' => $users,
        ]);
    }

    /**
     * Get the tool's schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'query' => $schema->string()->required()->description('Name, company, email or phone fragment to search for.'),
            'role' => $schema->string()->enum(array_keys(self::ROLE_FILTERS))->description('Optionally limit to one account type.'),
        ];
    }

    private function label(mixed $value): ?string
    {
        if ($value instanceof BackedEnum) {
            return method_exists($value, 'label') ? $value->label() : (string) $value->value;
        }

        return filled($value) ? (string) $value : null;
    }

    private function adminUrl(User $user): string
    {
        return match (true) {
            $user->isEmployer() => route('admin.employers.show', $user, absolute: false),
            $user->isJobSeeker() => route('admin.job-seekers.show', $user, absolute: false),
            default => route('admin.users.show', $user, absolute: false),
        };
    }
}
