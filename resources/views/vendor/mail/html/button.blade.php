@props([
    'url',
    'color' => 'primary',
    'align' => 'left',
])
@php
    $background = match ($color) {
        'error', 'red' => '#dc2626',
        'success', 'green' => '#16a34a',
        default => '#0067d8',
    };
@endphp
<table class="action" align="{{ $align }}" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:8px 0 24px;">
<tr>
<td align="{{ $align }}">
<table border="0" cellpadding="0" cellspacing="0" role="presentation">
<tr>
<td bgcolor="{{ $background }}" style="border-radius:6px;background:{{ $background }};">
<a href="{{ $url }}" class="button" target="_blank" rel="noopener" style="display:inline-block;padding:12px 26px;border-radius:6px;background:{{ $background }};color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;line-height:20px;text-decoration:none;">{!! $slot !!}</a>
</td>
</tr>
</table>
</td>
</tr>
</table>
