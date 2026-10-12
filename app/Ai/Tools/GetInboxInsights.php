<?php

namespace App\Ai\Tools;

use App\Ai\Concerns\EncodesToolResults;
use App\Enums\TrainingRegistrationStatus;
use App\Models\ContactMessage;
use App\Models\TrainingCourse;
use App\Models\TrainingRegistration;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Str;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class GetInboxInsights implements Tool
{
    use EncodesToolResults;

    /**
     * Get the description of the tool's purpose.
     */
    public function description(): Stringable|string
    {
        return 'Get the admin inboxes: unread contact form messages, training course registrations by status, '
            .'pending registrations waiting for review and upcoming published courses.';
    }

    /**
     * Execute the tool.
     */
    public function handle(Request $request): Stringable|string
    {
        $registrationsByStatus = TrainingRegistration::query()
            ->toBase()
            ->selectRaw('status, COUNT(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        return $this->encode([
            'contact_messages' => [
                'unread' => ContactMessage::query()->whereNull('read_at')->count(),
                'total' => ContactMessage::query()->count(),
                'latest_unread' => ContactMessage::query()
                    ->whereNull('read_at')
                    ->latest()
                    ->limit(5)
                    ->get()
                    ->map(fn (ContactMessage $message): array => [
                        'from' => $message->name,
                        'email' => $message->email,
                        'excerpt' => Str::limit($message->message, 140),
                        'received_at' => $message->created_at?->toDateTimeString(),
                    ])
                    ->values()
                    ->all(),
                'admin_url' => route('admin.contact-messages.index', absolute: false),
            ],
            'training' => [
                'registrations_by_status' => collect(TrainingRegistrationStatus::cases())
                    ->mapWithKeys(fn (TrainingRegistrationStatus $status): array => [$status->label() => (int) ($registrationsByStatus[$status->value] ?? 0)])
                    ->all(),
                'pending_registrations' => TrainingRegistration::query()
                    ->where('status', TrainingRegistrationStatus::Pending)
                    ->with('course:id,title')
                    ->latest()
                    ->limit(5)
                    ->get()
                    ->map(fn (TrainingRegistration $registration): array => [
                        'registration_number' => $registration->registration_number,
                        'name' => $registration->full_name,
                        'course' => $registration->course?->title,
                        'submitted_at' => $registration->created_at?->toDateTimeString(),
                    ])
                    ->values()
                    ->all(),
                'upcoming_published_courses' => TrainingCourse::query()
                    ->published()
                    ->where(fn ($query) => $query->whereNull('starts_on')->orWhere('starts_on', '>=', today()))
                    ->count(),
                'admin_url' => route('admin.training.registrations.index', absolute: false),
            ],
        ]);
    }

    /**
     * Get the tool's schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        return [];
    }
}
