@extends('mail.training.layout')

@section('content')
    <p style="margin:0 0 20px;color:#1f2a44;">{{ $greeting }}</p>
    <p style="margin:0 0 20px;color:#1f2a44;">{{ $participantName }} registered for the training {{ $courseTitle }}. This training registration is {{ $statusLabel }}.</p>
    @include('mail.training.details', ['details' => $details])
    <p style="margin:24px 0 0;">
        <a href="{{ $adminUrl }}" style="display:inline-block;background:#0067d8;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:6px;font-weight:bold;font-size:15px;">View registration</a>
    </p>
@endsection
