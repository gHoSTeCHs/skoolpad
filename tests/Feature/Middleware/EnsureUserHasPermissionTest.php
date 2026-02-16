<?php

use App\Http\Middleware\EnsureUserHasPermission;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

test('super admin with manage_institutions permission passes through', function () {
    $user = User::factory()->admin()->create();

    $middleware = new EnsureUserHasPermission;
    $request = Request::create('/test');
    $request->setUserResolver(fn () => $user);

    $response = $middleware->handle($request, fn () => new Response('OK'), 'manage_institutions');

    expect($response->getContent())->toBe('OK');
});

test('student with manage_institutions permission receives 403', function () {
    $user = User::factory()->create();

    $middleware = new EnsureUserHasPermission;
    $request = Request::create('/test');
    $request->setUserResolver(fn () => $user);

    $middleware->handle($request, fn () => new Response('OK'), 'manage_institutions');
})->throws(\Symfony\Component\HttpKernel\Exception\HttpException::class);

test('content reviewer with review_submissions permission passes through', function () {
    $user = User::factory()->contentReviewer()->create();

    $middleware = new EnsureUserHasPermission;
    $request = Request::create('/test');
    $request->setUserResolver(fn () => $user);

    $response = $middleware->handle($request, fn () => new Response('OK'), 'review_submissions');

    expect($response->getContent())->toBe('OK');
});

test('content reviewer with manage_institutions permission receives 403', function () {
    $user = User::factory()->contentReviewer()->create();

    $middleware = new EnsureUserHasPermission;
    $request = Request::create('/test');
    $request->setUserResolver(fn () => $user);

    $middleware->handle($request, fn () => new Response('OK'), 'manage_institutions');
})->throws(\Symfony\Component\HttpKernel\Exception\HttpException::class);
