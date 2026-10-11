<x-email-frame>
@yield('content')
<p style="margin:24px 0 0;color:#1f2a44;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;">{{ __('Best regards,') }}<br>{{ config('app.name') }}</p>
<p style="margin:20px 0 0;color:#475569;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;">({{ __('Automated Notification - Do Not Reply') }})</p>
</x-email-frame>
