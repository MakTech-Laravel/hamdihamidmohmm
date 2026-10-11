<tr>
<td class="email-footer-cell" bgcolor="#0256ae" style="padding:30px 36px 0;background:#0256ae;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="left" valign="middle" style="padding:0 0 22px;color:#ffffff;font-size:15px;line-height:24px;">&copy; {{ $year }} {{ $brandName }}</td>
<td align="right" valign="middle" style="padding:0 0 22px;font-size:0;line-height:0;white-space:nowrap;">
@foreach ($socialLinks as $social)
<a href="{{ $social['url'] }}" target="_blank" rel="noopener" style="display:inline-block;margin-left:{{ $loop->first ? '0' : '18px' }};text-decoration:none;"><img src="{{ $social['icon'] }}" alt="{{ $social['label'] }}" width="24" height="24" style="display:block;width:24px;height:24px;border:0;"></a>
@endforeach
</td>
</tr>
<tr>
<td colspan="2" style="border-top:1px solid #5d8fcf;font-size:0;line-height:0;height:1px;">&nbsp;</td>
</tr>
<tr>
<td colspan="2" align="left" style="padding:16px 0 4px;color:#ffffff;font-size:14px;line-height:22px;">
<a href="{{ $privacyUrl }}" target="_blank" rel="noopener" style="color:#ffffff;text-decoration:none;">{{ __('Privacy Policy') }}</a>
<span style="color:#9cc0ea;padding:0 12px;">|</span>
<a href="{{ $termsUrl }}" target="_blank" rel="noopener" style="color:#ffffff;text-decoration:none;">{{ __('Terms & Conditions') }}</a>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td bgcolor="#0256ae" style="padding:0;font-size:0;line-height:0;background:#0256ae;">
<img src="{{ $footerWaveUrl }}" alt="" width="600" height="64" style="display:block;width:100%;max-width:600px;height:auto;border:0;">
</td>
</tr>
