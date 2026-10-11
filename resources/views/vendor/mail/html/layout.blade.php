<x-email-frame :head="$head ?? ''">
{!! Illuminate\Mail\Markdown::parse($slot) !!}

{!! $subcopy ?? '' !!}
</x-email-frame>
