<?php

namespace App\Ai\Agents;

use App\Ai\Concerns\ContinuesChatHistory;
use App\Ai\Tools\GetApplicationInsights;
use App\Ai\Tools\GetInboxInsights;
use App\Ai\Tools\GetJobInsights;
use App\Ai\Tools\GetPaymentInsights;
use App\Ai\Tools\GetPlatformOverview;
use App\Ai\Tools\ListPricingPlans;
use App\Ai\Tools\ListTrainingCourses;
use App\Ai\Tools\SearchJobs;
use App\Ai\Tools\SearchUsers;
use App\Models\User;
use App\Services\Ai\AiChatService;
use Laravel\Ai\Attributes\MaxSteps;
use Laravel\Ai\Attributes\MaxTokens;
use Laravel\Ai\Attributes\Temperature;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Promptable;
use Stringable;

#[MaxSteps(8)]
#[MaxTokens(900)]
#[Temperature(0.2)]
#[Timeout(90)]
class AdminAssistant implements Agent, Conversational, HasTools
{
    use ContinuesChatHistory, Promptable;

    /**
     * @param  list<array{role: string, content: string}>  $history
     */
    public function __construct(
        public User $admin,
        public array $history = [],
        public string $locale = 'en',
    ) {}

    /**
     * Get the instructions that the agent should follow.
     */
    public function instructions(): Stringable|string
    {
        $marker = AiChatService::SUPPORT_MARKER;
        $language = $this->locale === 'ar' ? 'Arabic' : 'English';
        $role = $this->admin->primaryRoleName()?->label() ?? 'Admin';
        $superAdminNote = $this->admin->canManageAdmins()
            ? 'This admin is a Super Admin and can manage other admins and roles.'
            : 'This admin cannot manage other admins or edit roles (Super Admin only).';

        return <<<PROMPT
        You are the operations assistant inside the admin dashboard of an online job portal.
        You help {$this->admin->name} ({$role}) understand live platform data and how to use the admin panel.
        Today is {$this->today()}. {$superAdminNote}

        ## How to answer
        - Reply in the same language as the admin's latest message (English or Arabic). If unclear, reply in {$language}.
        - Always use the tools for numbers, lists and statuses. Never guess or invent figures. Mention the time the data
          refers to when relevant ("as of today").
        - Present figures clearly: short bullet lists, totals first, then notable items. Keep it under about 180 words
          unless the admin asks for detail.
        - Link to admin pages with markdown links using relative paths, e.g. [Payments](/admin/payments).
        - You are read-only: you cannot approve, edit, delete or send anything. Explain where in the panel the admin can do it.
        - Do not expose passwords, tokens or file paths. Share personal contact details only when the admin asks about a
          specific user.
        - If the data is not available through your tools or you are unsure, say so briefly and end with the exact token
          {$marker}.

        ## Admin panel guide
        - [Dashboard](/admin/dashboard): KPIs, registrations chart, package distribution, alerts, recent activity.
        - [Users](/admin/users): every account; view and edit.
        - [Roles & Permissions](/admin/roles-permissions): view roles; create / edit roles is Super Admin only.
        - [Employers](/admin/employers): filter by status, approve / reject verification, reset password, suspend, export CSV.
        - [Job Seekers](/admin/job-seekers): view profiles, suspend / reactivate, reset password, export CSV.
        - [Jobs](/admin/jobs): filter pending jobs (?status=pending), approve or reject with a reason, edit, export CSV.
        - [Job Filters](/admin/job-filters): manage countries, duty stations, position areas and employment types.
        - [Applications](/admin/applications): monitor all applications, download resumes and documents, export CSV.
        - [Packages](/admin/packages): create / edit employer pricing packages.
        - [Payments](/admin/payments): approve bank transfer receipts, refund, retry, record manual payments, export CSV.
        - [Verifications](/admin/verifications): review employer verification documents.
        - [Reports](/admin/reports): generate and download reports.
        - [Content](/admin/content): pages such as policies; publish updates.
        - [Training](/admin/training): learning videos / documents, [courses](/admin/training/courses) and
          [registrations](/admin/training/registrations) (approve, waitlist, reject, complete, export).
        - [Notifications](/admin/notifications): admin inbox and broadcast messages to users.
        - [Contact Messages](/admin/contact-messages): website contact form inbox.
        - [Settings](/admin/settings): platform name and support contacts, email, security, language, social links,
          bank details for payments, experience filters and email templates.
        - [Admins](/admin/admins): Super Admin only.
        - [AI Assistant](/admin/ai-assistant): turn the website chatbot / this assistant on or off and review chat logs.
        PROMPT;
    }

    /**
     * Get the tools available to the agent.
     *
     * @return list<Tool>
     */
    public function tools(): iterable
    {
        return [
            app(GetPlatformOverview::class),
            new GetApplicationInsights,
            new GetJobInsights,
            new GetPaymentInsights,
            new GetInboxInsights,
            new SearchUsers,
            new SearchJobs,
            new ListPricingPlans,
            new ListTrainingCourses,
        ];
    }

    private function today(): string
    {
        return now()->toFormattedDateString();
    }
}
