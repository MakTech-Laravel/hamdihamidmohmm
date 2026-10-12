<?php

namespace App\Ai\Concerns;

use App\Enums\ChatLanguage;

/**
 * @property string $locale
 * @property ChatLanguage $replyLanguage
 */
trait RespondsInChosenLanguage
{
    protected function languageRule(): string
    {
        if ($this->replyLanguage !== ChatLanguage::Auto) {
            $language = $this->replyLanguage->label();

            return "- Always reply in {$language}, even when the question is written in another language (the user chose {$language} answers).";
        }

        $fallback = ChatLanguage::fromLocale($this->locale)->label();

        return "- Reply in the same language as the latest message (English or Arabic). If unclear, reply in {$fallback}.";
    }
}
