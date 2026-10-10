<?php

namespace App\Http\Requests\Frontend;

use App\Concerns\PasswordValidationRules;
use App\Enums\TrainingQuestionType;
use App\Models\TrainingCourse;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreTrainingRegistrationRequest extends FormRequest
{
    use PasswordValidationRules;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $course = $this->route('trainingCourse');

        abort_unless($course instanceof TrainingCourse && $course->is_published, 404);

        $this->merge([
            'consent' => $this->boolean('consent'),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => $this->passwordRules(),
            'phone' => ['required', 'string', 'max:50'],
            'country_city' => ['required', 'string', 'max:255'],
            'organization' => ['required', 'string', 'max:255'],
            'job_title' => ['required', 'string', 'max:255'],
            'experience' => ['required', 'string', 'max:5000'],
            'reason' => ['required', 'string', 'max:5000'],
            'answers' => ['present', 'array'],
            'answers.*.id' => ['required', 'string', 'max:40'],
            'answers.*.value' => ['nullable', 'string', 'max:5000'],
            'consent' => ['accepted'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $course = $this->route('trainingCourse');

            if (! $course instanceof TrainingCourse) {
                return;
            }

            $submitted = collect($this->input('answers', []))
                ->filter(fn (mixed $answer): bool => is_array($answer))
                ->keyBy(fn (array $answer): string => (string) ($answer['id'] ?? ''));

            $knownIds = [];

            foreach ($course->normalizedQuestions() as $question) {
                $knownIds[] = $question['id'];
                $value = trim((string) ($submitted->get($question['id'])['value'] ?? ''));
                $field = 'answers';

                if ($question['required'] && $value === '') {
                    $validator->errors()->add($field, __('Please answer: :question', ['question' => $question['label']]));

                    continue;
                }

                if ($value === '') {
                    continue;
                }

                if ($question['type'] === TrainingQuestionType::YesNo->value && ! in_array($value, ['yes', 'no'], true)) {
                    $validator->errors()->add($field, __('Choose yes or no for: :question', ['question' => $question['label']]));
                }

                if ($question['type'] === TrainingQuestionType::SingleChoice->value && ! in_array($value, $question['options'], true)) {
                    $validator->errors()->add($field, __('Choose a valid option for: :question', ['question' => $question['label']]));
                }

                if ($question['type'] === TrainingQuestionType::ShortText->value && mb_strlen($value) > 255) {
                    $validator->errors()->add($field, __('The answer is too long for: :question', ['question' => $question['label']]));
                }
            }

            $unknown = $submitted->keys()->reject(fn (string $id): bool => $id === '' || in_array($id, $knownIds, true));

            if ($unknown->isNotEmpty()) {
                $validator->errors()->add('answers', __('One or more answers do not belong to this course.'));
            }
        });
    }

    /**
     * @return list<array{id: string, label: string, type: string, value: string}>
     */
    public function snapshotAnswers(TrainingCourse $course): array
    {
        $submitted = collect($this->validated('answers'))
            ->filter(fn (mixed $answer): bool => is_array($answer))
            ->keyBy(fn (array $answer): string => (string) ($answer['id'] ?? ''));

        return collect($course->normalizedQuestions())
            ->map(function (array $question) use ($submitted): array {
                return [
                    'id' => $question['id'],
                    'label' => $question['label'],
                    'type' => $question['type'],
                    'value' => trim((string) ($submitted->get($question['id'])['value'] ?? '')),
                ];
            })
            ->values()
            ->all();
    }
}
