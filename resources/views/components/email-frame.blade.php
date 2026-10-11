@props(['head' => ''])
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>{{ config('app.name') }}</title>
<style>
@media only screen and (max-width: 620px) {
.email-container { width: 100% !important; }
.email-body { padding: 28px 22px !important; }
.email-footer-cell { padding-left: 22px !important; padding-right: 22px !important; }
}
</style>
{!! $head !!}
</head>
<body style="margin:0;padding:0;background:#eef2f7;-webkit-text-size-adjust:100%;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef2f7;">
<tr>
<td align="center" style="padding:24px 12px;">
<table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#ffffff;border:1px solid #e3e8f0;">
@include('mail.partials.header')
<tr>
<td class="email-body" style="padding:32px 36px 36px;background:#ffffff;color:#1f2a44;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;text-align:left;">
{{ $slot }}
</td>
</tr>
@include('mail.partials.footer')
</table>
</td>
</tr>
</table>
</body>
</html>
