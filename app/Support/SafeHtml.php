<?php

namespace App\Support;

use DOMDocument;
use DOMElement;
use DOMNode;
use DOMXPath;

final class SafeHtml
{
    /**
     * @var list<string>
     */
    private const ALLOWED_TAGS = [
        'p',
        'br',
        'strong',
        'b',
        'em',
        'i',
        'u',
        'ul',
        'ol',
        'li',
        'h2',
        'h3',
        'h4',
        'span',
        'a',
        'div',
        'iframe',
    ];

    /**
     * @var list<string>
     */
    private const ALLOWED_STYLE_PROPERTIES = [
        'font-size',
        'font-weight',
        'font-style',
        'text-align',
        'text-decoration',
    ];

    /**
     * @var list<string>
     */
    private const ALLOWED_CLASSES = [
        'font-bold',
        'italic',
        'underline',
        'youtube-embed',
        'rich-text-attachment',
        'text-[#0057c8]',
        'underline',
    ];

    public static function clean(?string $html): ?string
    {
        if ($html === null) {
            return null;
        }

        $trimmed = trim($html);

        if ($trimmed === '' || $trimmed === '<p></p>' || $trimmed === '<p><br></p>') {
            return null;
        }

        if (! str_contains($trimmed, '<')) {
            return $trimmed;
        }

        $document = new DOMDocument('1.0', 'UTF-8');
        $previous = libxml_use_internal_errors(true);
        $document->loadHTML(
            '<?xml encoding="UTF-8"><div id="safe-html-root">'.$trimmed.'</div>',
            LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD,
        );
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        $xpath = new DOMXPath($document);
        $root = $document->getElementById('safe-html-root');

        if (! $root instanceof DOMElement) {
            return null;
        }

        /** @var list<DOMElement> $elements */
        $elements = [];

        foreach ($xpath->query('.//*', $root) ?: [] as $node) {
            if ($node instanceof DOMElement) {
                $elements[] = $node;
            }
        }

        foreach ($elements as $element) {
            $tag = strtolower($element->tagName);

            if (! in_array($tag, self::ALLOWED_TAGS, true)) {
                self::unwrap($element);

                continue;
            }

            if ($tag === 'iframe' && ! self::isAllowedYoutubeIframe($element)) {
                $element->parentNode?->removeChild($element);

                continue;
            }

            if ($tag === 'a' && ! self::isAllowedAnchor($element)) {
                self::unwrap($element);

                continue;
            }

            if ($tag === 'div' && ! self::isAllowedDiv($element)) {
                self::unwrap($element);

                continue;
            }

            self::sanitizeAttributes($element);
        }

        $clean = '';

        foreach ($root->childNodes as $child) {
            $clean .= $document->saveHTML($child) ?: '';
        }

        $clean = trim(html_entity_decode($clean, ENT_QUOTES | ENT_HTML5, 'UTF-8'));

        if ($clean === '') {
            return null;
        }

        $textOnly = trim(strip_tags($clean));

        if ($textOnly === '' && ! str_contains($clean, '<iframe')) {
            return null;
        }

        return $clean;
    }

    public static function isEmpty(?string $html): bool
    {
        return self::clean($html) === null;
    }

    private static function isAllowedAnchor(DOMElement $element): bool
    {
        $href = trim((string) $element->getAttribute('href'));

        return self::isSafeHttpUrl($href);
    }

    private static function isAllowedDiv(DOMElement $element): bool
    {
        if ($element->hasAttribute('data-youtube-video')) {
            return true;
        }

        $class = (string) $element->getAttribute('class');

        return str_contains($class, 'youtube-embed')
            || str_contains($class, 'rich-text-attachment');
    }

    private static function isAllowedYoutubeIframe(DOMElement $element): bool
    {
        $src = trim((string) $element->getAttribute('src'));

        return self::isYoutubeEmbedUrl($src);
    }

    private static function isSafeHttpUrl(string $url): bool
    {
        if ($url === '' || str_starts_with(strtolower($url), 'javascript:')) {
            return false;
        }

        if (str_starts_with($url, '/storage/')) {
            return true;
        }

        $parts = parse_url($url);

        if (! is_array($parts) || ! isset($parts['scheme'], $parts['host'])) {
            return false;
        }

        return in_array(strtolower((string) $parts['scheme']), ['http', 'https'], true);
    }

    private static function isYoutubeEmbedUrl(string $url): bool
    {
        $parts = parse_url($url);

        if (! is_array($parts) || ! isset($parts['scheme'], $parts['host'], $parts['path'])) {
            return false;
        }

        if (! in_array(strtolower((string) $parts['scheme']), ['http', 'https'], true)) {
            return false;
        }

        $host = strtolower((string) $parts['host']);
        $path = (string) $parts['path'];

        $allowedHosts = [
            'www.youtube.com',
            'youtube.com',
            'www.youtube-nocookie.com',
            'youtube-nocookie.com',
        ];

        return in_array($host, $allowedHosts, true)
            && str_starts_with($path, '/embed/');
    }

    private static function sanitizeAttributes(DOMElement $element): void
    {
        $tag = strtolower($element->tagName);
        $allowed = [];

        if ($element->hasAttribute('style')) {
            $style = self::sanitizeStyle((string) $element->getAttribute('style'));

            if ($style !== null) {
                $allowed['style'] = $style;
            }
        }

        if ($element->hasAttribute('class')) {
            $class = self::sanitizeClass((string) $element->getAttribute('class'));

            if ($class !== null) {
                $allowed['class'] = $class;
            }
        }

        if ($tag === 'a') {
            $href = trim((string) $element->getAttribute('href'));

            if (self::isSafeHttpUrl($href)) {
                $allowed['href'] = $href;
                $allowed['target'] = '_blank';
                $allowed['rel'] = 'noopener noreferrer';
            }
        }

        if ($tag === 'div' && $element->hasAttribute('data-youtube-video')) {
            $allowed['data-youtube-video'] = '';
        }

        if ($tag === 'iframe') {
            $src = trim((string) $element->getAttribute('src'));

            if (self::isYoutubeEmbedUrl($src)) {
                $allowed['src'] = $src;
                $allowed['width'] = '560';
                $allowed['height'] = '315';
                $allowed['frameborder'] = '0';
                $allowed['allowfullscreen'] = 'allowfullscreen';
                $allowed['allow'] = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                $allowed['loading'] = 'lazy';
                $allowed['referrerpolicy'] = 'strict-origin-when-cross-origin';
                $allowed['title'] = 'YouTube video';
            }
        }

        while ($element->attributes->length > 0) {
            $element->removeAttribute($element->attributes->item(0)?->name ?? '');
        }

        foreach ($allowed as $name => $value) {
            $element->setAttribute($name, $value);
        }
    }

    private static function sanitizeClass(string $class): ?string
    {
        $kept = collect(preg_split('/\s+/', trim($class)) ?: [])
            ->filter(fn (string $token): bool => in_array($token, self::ALLOWED_CLASSES, true)
                || str_starts_with($token, 'aspect-')
                || str_starts_with($token, 'w-')
                || str_starts_with($token, 'my-')
                || str_starts_with($token, 'rounded')
                || str_starts_with($token, 'overflow-')
                || str_starts_with($token, 'border')
                || str_starts_with($token, 'bg-')
                || str_starts_with($token, 'text-')
                || str_starts_with($token, 'inline-')
                || str_starts_with($token, 'font-')
                || str_starts_with($token, 'gap-')
                || str_starts_with($token, 'px-')
                || str_starts_with($token, 'py-')
                || str_starts_with($token, 'items-')
                || $token === 'youtube-embed'
                || $token === 'rich-text-attachment')
            ->unique()
            ->values()
            ->all();

        return $kept === [] ? null : implode(' ', $kept);
    }

    private static function sanitizeStyle(string $style): ?string
    {
        $parts = [];

        foreach (explode(';', $style) as $declaration) {
            if (! str_contains($declaration, ':')) {
                continue;
            }

            [$property, $value] = array_map('trim', explode(':', $declaration, 2));
            $property = strtolower($property);

            if (! in_array($property, self::ALLOWED_STYLE_PROPERTIES, true) || $value === '') {
                continue;
            }

            if ($property === 'font-size' && ! preg_match('/^\d{1,3}(\.\d{1,2})?(px|rem|em)$/i', $value)) {
                continue;
            }

            if ($property === 'font-weight' && ! preg_match('/^(bold|bolder|normal|[1-9]00)$/i', $value)) {
                continue;
            }

            if ($property === 'font-style' && ! in_array(strtolower($value), ['italic', 'normal'], true)) {
                continue;
            }

            if ($property === 'text-decoration' && ! in_array(strtolower($value), ['underline', 'none', 'line-through'], true)) {
                continue;
            }

            if ($property === 'text-align' && ! in_array(strtolower($value), ['left', 'center', 'right', 'justify'], true)) {
                continue;
            }

            $parts[] = $property.': '.$value;
        }

        return $parts === [] ? null : implode('; ', $parts);
    }

    private static function unwrap(DOMElement $element): void
    {
        $parent = $element->parentNode;

        if (! $parent instanceof DOMNode) {
            return;
        }

        while ($element->firstChild instanceof DOMNode) {
            $parent->insertBefore($element->firstChild, $element);
        }

        $parent->removeChild($element);
    }
}
