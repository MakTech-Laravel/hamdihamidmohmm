<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    @foreach ($details as $label => $value)
        <tr>
            <td style="padding:8px 12px 8px 0;color:#3977a6;font-family:Arial,Helvetica,sans-serif;font-size:14px;vertical-align:top;width:160px;">{{ $label }}</td>
            <td style="padding:8px 0;color:#050315;font-family:Arial,Helvetica,sans-serif;font-size:14px;vertical-align:top;">{{ $value }}</td>
        </tr>
    @endforeach
</table>
