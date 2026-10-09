<?php

namespace App\Http\Requests\Backend\Admin;

class UpdateTrainingCourseRequest extends StoreTrainingCourseRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return $this->courseRules();
    }
}
