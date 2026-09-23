<?php

namespace App\Models;

use App\Casts\AccountStatusCast;
use App\Enums\EmployerAccountStatus;
use App\Enums\EmployerPackage;
use App\Enums\EmployerVerificationStatus;
use App\Enums\JobSeekerResumeStatus;
use App\Enums\PermissionName;
use App\Enums\RoleName;
use App\Enums\SubscriptionStatus;
use App\Enums\UserRole;
use App\Support\PortalPreferences;
use App\Support\RoleAssigner;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'company_name',
        'industry',
        'company_size',
        'founded_year',
        'website',
        'linkedin_url',
        'x_url',
        'instagram_url',
        'about',
        'address',
        'contact_name',
        'email',
        'phone',
        'location',
        'resume_status',
        'resume_path',
        'resume_original_name',
        'cover_letter_path',
        'cover_letter_original_name',
        'highest_degree_path',
        'highest_degree_original_name',
        'other_document_path',
        'other_document_original_name',
        'avatar',
        'company_logo_path',
        'company_cover_path',
        'verification_document_path',
        'verification_document_original_name',
        'timezone',
        'portal_preferences',
        'password',
        'role',
        'verification_status',
        'account_status',
        'package',
        'subscription_status',
        'subscription_ends_at',
        'pending_package',
        'pending_package_at',
        'rejection_reason',
        'verified_at',
        'created_at',
        'updated_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<string, mixed>
     */
    protected $appends = [
        'avatar_url',
        'role_label',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'role' => UserRole::class,
            'verification_status' => EmployerVerificationStatus::class,
            'account_status' => AccountStatusCast::class,
            'resume_status' => JobSeekerResumeStatus::class,
            'package' => EmployerPackage::class,
            'subscription_status' => SubscriptionStatus::class,
            'subscription_ends_at' => 'datetime',
            'pending_package' => EmployerPackage::class,
            'pending_package_at' => 'datetime',
            'verified_at' => 'datetime',
            'founded_year' => 'integer',
            'portal_preferences' => 'array',
        ];
    }

    /**
     * @return array{
     *     notifications: array{
     *         new_applications: bool,
     *         job_expiry: bool,
     *         billing_alerts: bool,
     *         system_updates: bool,
     *         weekly_report: bool
     *     },
     *     privacy: array{
     *         profile_visibility: string,
     *         show_salary: bool,
     *         show_contact_email: bool
     *     },
     *     email_preferences: array{
     *         application_status: bool,
     *         interview_invitations: bool,
     *         job_recommendations: bool,
     *         platform_announcements: bool
     *     }
     * }
     */
    public function portalPreferences(): array
    {
        return PortalPreferences::for($this);
    }

    public function companyLogoUrl(): ?string
    {
        if (! $this->hasCompanyLogo()) {
            return null;
        }

        return '/storage/'.$this->company_logo_path;
    }

    public function companyCoverUrl(): ?string
    {
        if (! $this->hasCompanyCover()) {
            return null;
        }

        return '/storage/'.$this->company_cover_path;
    }

    public function hasVerificationDocument(): bool
    {
        return filled($this->verification_document_path)
            && Storage::disk('local')->exists((string) $this->verification_document_path);
    }

    public function hasCompanyLogo(): bool
    {
        return filled($this->company_logo_path)
            && Storage::disk('public')->exists((string) $this->company_logo_path);
    }

    public function hasCompanyCover(): bool
    {
        return filled($this->company_cover_path)
            && Storage::disk('public')->exists((string) $this->company_cover_path);
    }

    protected function name(): Attribute
    {
        return Attribute::make(
            get: function ($value, array $attributes) {
                $storedName = $attributes['name'] ?? $value;

                if (! empty($storedName)) {
                    return $storedName;
                }

                $composed = trim(($attributes['first_name'] ?? '').' '.($attributes['last_name'] ?? ''));

                return $composed !== '' ? $composed : ($attributes['email'] ?? '');
            },
        );
    }

    public function getFullNameAttribute(): string
    {
        return $this->name;
    }

    public function getRoleLabelAttribute(): string
    {
        $spatieRole = $this->roles->first();

        if ($spatieRole instanceof Role) {
            return $spatieRole->displayLabel();
        }

        return $this->primaryRoleName()?->label()
            ?? $this->role?->label()
            ?? 'Unknown';
    }

    public function assignedRoleName(): ?string
    {
        return $this->getRoleNames()->first();
    }

    public function primaryRoleName(): ?RoleName
    {
        $spatieRole = $this->getRoleNames()->first();

        if (is_string($spatieRole) && RoleName::tryFrom($spatieRole) instanceof RoleName) {
            return RoleName::from($spatieRole);
        }

        return $this->role?->toRoleName();
    }

    public function assignAppRole(UserRole|RoleName|string $role): self
    {
        return RoleAssigner::assign($this, $role);
    }

    public function isSuperAdmin(): bool
    {
        return $this->hasRole(RoleName::SuperAdmin->value)
            || $this->role === UserRole::SuperAdmin;
    }

    public function isAdmin(): bool
    {
        return $this->hasAnyRole(RoleName::adminPanelValues())
            || $this->can(PermissionName::AccessAdminPanel->value);
    }

    public function isJobSeeker(): bool
    {
        return $this->hasRole(RoleName::JobSeeker->value)
            || $this->role === UserRole::JobSeeker;
    }

    public function isEmployer(): bool
    {
        return $this->hasRole(RoleName::Employer->value)
            || $this->role === UserRole::Employer;
    }

    public function employerAccountAllowsLogin(): bool
    {
        if (! $this->isEmployer()) {
            return true;
        }

        return $this->account_status === EmployerAccountStatus::Active
            && $this->verification_status === EmployerVerificationStatus::Approved;
    }

    public function employerLoginDenialReason(): ?string
    {
        if (! $this->isEmployer() || $this->employerAccountAllowsLogin()) {
            return null;
        }

        return match ($this->account_status?->value) {
            'rejected' => 'Your employer account was rejected. Please contact support for help.',
            'suspended' => 'Your employer account has been suspended. Please contact support for help.',
            default => 'Your employer account is awaiting admin approval before you can sign in.',
        };
    }

    public function isUser(): bool
    {
        return $this->isJobSeeker();
    }

    public function canManageUsers(): bool
    {
        return $this->can(PermissionName::ManageUsers->value)
            || $this->isSuperAdmin();
    }

    public function canManageEmployers(): bool
    {
        return $this->can(PermissionName::ManageEmployers->value)
            || $this->isSuperAdmin();
    }

    public function canManageJobSeekers(): bool
    {
        return $this->can(PermissionName::ManageJobSeekers->value)
            || $this->isSuperAdmin();
    }

    public function canManageJobs(): bool
    {
        return $this->can(PermissionName::ManageJobs->value)
            || $this->isSuperAdmin();
    }

    public function canManagePackages(): bool
    {
        return $this->can(PermissionName::ManagePackages->value)
            || $this->isSuperAdmin();
    }

    public function canManagePayments(): bool
    {
        return $this->can(PermissionName::ManagePayments->value)
            || $this->isSuperAdmin();
    }

    public function canManageVerification(): bool
    {
        return $this->can(PermissionName::ManageVerification->value)
            || $this->isSuperAdmin();
    }

    public function canViewAnalytics(): bool
    {
        return $this->can(PermissionName::ViewAnalytics->value)
            || $this->isSuperAdmin();
    }

    public function canManageCms(): bool
    {
        return $this->can(PermissionName::ManageCms->value)
            || $this->isSuperAdmin();
    }

    public function canManageSettings(): bool
    {
        return $this->can(PermissionName::ManageSettings->value)
            || $this->isSuperAdmin();
    }

    public function canManageAdmins(): bool
    {
        return $this->isSuperAdmin();
    }

    public function canApproveEmployer(): bool
    {
        return $this->isEmployer()
            && $this->verification_status === EmployerVerificationStatus::Pending;
    }

    public function getCanManageUsersAttribute(): bool
    {
        return $this->canManageUsers();
    }

    public function getCanManageAdminsAttribute(): bool
    {
        return $this->canManageAdmins();
    }

    /**
     * @return HasMany<ActivityLog, $this>
     */
    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class)->latest();
    }

    /**
     * @return HasMany<JobPost, $this>
     */
    public function jobPosts(): HasMany
    {
        return $this->hasMany(JobPost::class, 'employer_id');
    }

    /**
     * @return HasMany<JobApplication, $this>
     */
    public function jobApplications(): HasMany
    {
        return $this->hasMany(JobApplication::class, 'job_seeker_id');
    }

    /**
     * @return HasMany<Payment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'employer_id');
    }

    /**
     * @return HasOne<JobSeekerProfile, $this>
     */
    public function jobSeekerProfile(): HasOne
    {
        return $this->hasOne(JobSeekerProfile::class);
    }

    public function canAccessPayroll(): bool
    {
        return $this->isAdmin();
    }

    public function dashboardRoute(): string
    {
        return $this->primaryRoleName()?->dashboardRoute()
            ?? $this->role?->dashboardRoute()
            ?? 'job-seeker.dashboard';
    }

    public function getAvatarUrlAttribute(): ?string
    {
        if ($this->avatar_urls && isset($this->avatar_urls['url'])) {
            return str_replace('%s', 'medium', $this->avatar_urls['url']);
        }

        if (! filled($this->avatar)) {
            return null;
        }

        if (! Storage::disk('public')->exists((string) $this->avatar)) {
            return null;
        }

        // Relative URL avoids APP_URL host mismatches (localhost vs 127.0.0.1).
        return '/storage/'.$this->avatar;
    }
}
