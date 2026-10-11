@extends('mail.training.layout')

@section('content')
    <p style="margin:0 0 20px;color:#1f2a44;">{{ $greeting }}</p>
    <p style="margin:0 0 20px;color:#1f2a44;">We received your registration for {{ $courseTitle }}. This training registration is {{ $statusLabel }}.</p>
    @include('mail.training.details', ['details' => $details])
@endsection
