@extends('mail.training.layout')

@section('content')
    <p style="margin:0 0 16px;color:#050315;">{{ $greeting }}</p>
    <p style="margin:0 0 16px;color:#050315;">We received your registration for {{ $courseTitle }}. This training registration is {{ $statusLabel }}.</p>
    @include('mail.training.details', ['details' => $details])
@endsection
