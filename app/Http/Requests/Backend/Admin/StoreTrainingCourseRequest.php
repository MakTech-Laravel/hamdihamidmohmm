<?php

namespace App\Http\Requests\Backend\Admin;

use App\Enums\TrainingQuestionType;
use App\Models\TrainingCourse;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreTrainingCourseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->canManageCms() === true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'is_published' => $this->boolean('is_published'),
            'questions' => $this->preparedQuestions(),
            'ends_on' => $this->filled('ends_on') ? $this->input('ends_on') : null,
        ]);

        if (! $this->hasFile('thumbnail')) {
            $this->merge([
                'thumbnail' => null,
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return $this->courseRules();
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $this->validateQuestionOptions($validator);
        });
    }

    /**
     * @return array<string, mixed>
     */
    protected function courseRules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:10000'],
            'starts_on' => ['required', 'date'],
            'ends_on' => ['nullable', 'date', 'after_or_equal:starts_on'],
            'duration' => ['required', 'string', 'max:255'],
            'location' => ['required', 'string', 'max:255'],
            'trainer' => ['required', 'string', 'max:255'],
            'seats' => ['required', 'integer', 'min:1', 'max:100000'],
            'registration_deadline' => ['required', 'date'],
            'is_published' => ['required', 'boolean'],
            'questions' => ['present', 'array'],
            'questions.*.id' => ['required', 'string', 'max:40', 'distinct'],
            'questions.*.label' => ['required', 'string', 'max:255'],
            'questions.*.type' => ['required', 'string', Rule::enum(TrainingQuestionType::class)],
            'questions.*.required' => ['required', 'boolean'],
            'questions.*.options' => ['present', 'array'],
            'questions.*.options.*' => ['nullable', 'string', 'max:255'],
            'thumbnail' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ];
    }

    protected function validateQuestionOptions(Validator $validator): void
    {
        $questions = $this->input('questions', []);

        if (! is_array($questions)) {
            return;
        }

        foreach ($questions as $index => $question) {
            if (! is_array($question)) {
                continue;
            }

            if (($question['type'] ?? null) !== TrainingQuestionType::SingleChoice->value) {
                continue;
            }

            $options = collect($question['options'] ?? [])
                ->filter(fn (mixed $option): bool => is_string($option) && trim($option) !== '')
                ->count();

            if ($options < 2) {
                $validator->errors()->add(
                    "questions.{$index}.options",
                    __('A single-choice question needs at least two options.'),
                );
            }
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function preparedQuestions(): array
    {
        $questions = $this->input('questions', []);

        if (! is_array($questions)) {
            return [];
        }

        return collect($questions)
            ->filter(fn (mixed $question): bool => is_array($question))
            ->map(function (array $question): array {
                $type = (string) ($question['type'] ?? TrainingQuestionType::ShortText->value);
                $options = $type === TrainingQuestionType::SingleChoice->value
                    ? collect($question['options'] ?? [])
                        ->filter(fn (mixed $option): bool => is_string($option))
                        ->map(fn (string $option): string => trim($option))
                        ->filter(fn (string $option): bool => $option !== '')
                        ->values()
                        ->all()
                    : [];

                return [
                    'id' => substr(trim((string) ($question['id'] ?? '')), 0, 40),
                    'label' => trim((string) ($question['label'] ?? '')),
                    'type' => $type,
                    'required' => filter_var($question['required'] ?? false, FILTER_VALIDATE_BOOLEAN),
                    'options' => $options,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function courseAttributes(): array
    {
        $validated = $this->validated();

        unset($validated['thumbnail']);

        if (! isset($validated['slug']) || ! is_string($validated['slug']) || $validated['slug'] === '') {
            $course = $this->route('trainingCourse');
            $ignoreId = $course instanceof TrainingCourse ? $course->id : null;
            $validated['slug'] = TrainingCourse::uniqueSlug((string) $validated['title'], $ignoreId);
        }

        return $validated;
    }
}
