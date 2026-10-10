<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name') }}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;">
        <tr>
            <td align="center" style="padding:24px 12px;">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;">
                    <tr>
                        <td style="height:8px;background:#0057c8;font-size:0;line-height:0;">&nbsp;</td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:24px 32px 8px;background:#ffffff;">
                            <img
                                src="{{ asset('images/home/logo.png') }}"
                                alt="{{ config('app.name') }}"
                                width="98"
                                height="65"
                                style="display:block;border:0;height:65px;width:98px;"
                            >
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:8px 32px 32px;color:#050315;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;">
                            @yield('content')
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
