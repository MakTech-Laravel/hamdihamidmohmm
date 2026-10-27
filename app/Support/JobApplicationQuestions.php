<?php

namespace App\Support;

use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class JobApplicationQuestions
{
    public const TYPES = ['text', 'textarea', 'yes_no'];

    public const MAX = 10;

    /**
     * @return list<array{id: string, prompt: string, type: string, required: bool, sort: int}>
     */
    public static function normalize(mixed $raw): array
    {
        if (! is_array($raw)) {
            return [];
        }

        $questions = [];

        foreach (array_values($raw) as $index => $item) {
            if ($index >= self::MAX) {
                break;
            }

            if (! is_array($item)) {
                continue;
            }

            $prompt = trim((string) ($item['prompt'] ?? ''));

            if ($prompt === '') {
                continue;
            }

            $type = (string) ($item['type'] ?? 'text');

            if (! in_array($type, self::TYPES, true)) {
                $type = 'text';
            }

            $id = trim((string) ($item['id'] ?? ''));

            if ($id === '' || strlen($id) > 64) {
                $id = (string) Str::uuid();
            }

            $questions[] = [
                'id' => $id,
                'prompt' => Str::limit($prompt, 500, ''),
                'type' => $type,
                'required' => filter_var($item['required'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'sort' => (int) ($item['sort'] ?? $index),
            ];
        }

        usort($questions, fn (array $a, array $b): int => $a['sort'] <=> $b['sort']);

        return array_values($questions);
    }

    /**
     * @param  list<array{id: string, prompt: string, type: string, required: bool, sort: int}>  $questions
     * @return array<string, string>
     */
    public static function normalizeAnswers(array $questions, mixed $rawAnswers): array
    {
        $incoming = is_array($rawAnswers) ? $rawAnswers : [];
        $answers = [];
        $errors = [];

        foreach ($questions as $question) {
            $value = $incoming[$question['id']] ?? null;
            $text = is_scalar($value) ? trim((string) $value) : '';

            if ($question['type'] === 'yes_no' && $text !== '' && ! in_array($text, ['yes', 'no'], true)) {
                $errors['question_answers.'.$question['id']] = 'Please answer yes or no.';

                continue;
            }

            if ($question['required'] && $text === '') {
                $errors['question_answers.'.$question['id']] = 'This question is required.';

                continue;
            }

            if ($text !== '') {
                $answers[$question['id']] = Str::limit($text, 5000, '');
            }
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }

        return $answers;
    }

    /**
     * @param  list<array{id: string, prompt: string, type: string, required: bool, sort: int}>  $questions
     * @param  array<string, string>|null  $answers
     * @return list<array{id: string, prompt: string, type: string, required: bool, answer: string|null}>
     */
    public static function paired(array $questions, ?array $answers): array
    {
        $answers ??= [];

        return array_map(fn (array $question): array => [
            'id' => $question['id'],
            'prompt' => $question['prompt'],
            'type' => $question['type'],
            'required' => $question['required'],
            'answer' => isset($answers[$question['id']]) ? (string) $answers[$question['id']] : null,
        ], $questions);
    }

    /**
     * @return array<string, mixed>
     */
    public static function validationRules(): array
    {
        return [
            'application_questions' => ['nullable', 'array', 'max:'.self::MAX],
            'application_questions.*.id' => ['nullable', 'string', 'max:64'],
            'application_questions.*.prompt' => ['required_with:application_questions', 'string', 'max:500'],
            'application_questions.*.type' => ['nullable', 'string', 'in:'.implode(',', self::TYPES)],
            'application_questions.*.required' => ['sometimes', 'boolean'],
            'application_questions.*.sort' => ['nullable', 'integer', 'min:0', 'max:100'],
        ];
    }
}
