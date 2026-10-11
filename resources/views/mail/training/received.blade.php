@extends('mail.training.layout')

@section('content')
    <p style="margin:0 0 16px;color:#050315;">{{ $greeting }}</p>
    <p style="margin:0 0 16px;color:#050315;">{{ $participantName }} registered for the training {{ $courseTitle }}. This training registration is {{ $statusLabel }}.</p>
    @include('mail.training.details', ['details' => $details])
    <p style="margin:24px 0 0;">
        <a href="{{ $adminUrl }}" style="display:inline-block;background:#0057c8;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">View registration</a>
    </p>
@endsection
