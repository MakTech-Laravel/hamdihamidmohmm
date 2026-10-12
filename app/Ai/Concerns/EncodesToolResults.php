<?php

namespace App\Ai\Concerns;

trait EncodesToolResults
{
    /**
     * @param  array<string, mixed>  $data
     */
    protected function encode(array $data): string
    {
        return json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    }
}
