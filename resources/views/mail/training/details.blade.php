<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:4px 0 8px;border-top:1px solid #e3e8f0;">
    @foreach ($details as $label => $value)
        <tr>
            <td style="padding:10px 12px 10px 0;border-bottom:1px solid #e3e8f0;color:#0256ae;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;vertical-align:top;width:160px;">{{ $label }}</td>
            <td style="padding:10px 0;border-bottom:1px solid #e3e8f0;color:#1f2a44;font-family:Arial,Helvetica,sans-serif;font-size:14px;vertical-align:top;">{{ $value }}</td>
        </tr>
    @endforeach
</table>
