<?php

use App\Enums\StencilCategory;
use App\Enums\StencilLicense;
use App\Models\CanvasStencil;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->student = User::factory()->create();
});

// ── catalog (browse) ──────────────────────────────────────────────────────────

test('catalog returns active stencils + category list', function () {
    CanvasStencil::factory()->count(3)->create(['is_active' => true]);
    CanvasStencil::factory()->inactive()->create();

    $response = $this->actingAs($this->admin)
        ->getJson(route('admin.canvas-stencils.catalog'));

    $response->assertOk()
        ->assertJsonCount(3, 'stencils')
        ->assertJsonStructure([
            'categories' => [['value', 'label']],
            'stencils' => [['id', 'name', 'slug', 'category', 'tags', 'svg_url', 'requires_attribution']],
        ]);

    // All 13 categories listed
    expect($response->json('categories'))->toHaveCount(13);
});

// ── store ─────────────────────────────────────────────────────────────────────

test('admin can create a stencil with inline SVG content', function () {
    $svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>';

    $response = $this->actingAs($this->admin)
        ->postJson(route('admin.canvas-stencils.store'), [
            'name' => 'Test Circle',
            'category' => StencilCategory::MathGeometry->value,
            'tags' => ['circle', 'test'],
            'svg_content' => $svg,
            'license' => StencilLicense::Skoolpad->value,
        ]);

    $response->assertCreated()
        ->assertJsonPath('stencil.name', 'Test Circle')
        ->assertJsonPath('stencil.category', 'math_geometry')
        ->assertJsonPath('stencil.license', 'skoolpad');

    $row = CanvasStencil::query()->where('name', 'Test Circle')->first();
    expect($row)->not->toBeNull();
    expect(file_exists(public_path(ltrim($row->svg_path, '/'))))->toBeTrue();
    expect($row->created_by)->toBe($this->admin->id);

    // Cleanup the file we wrote
    @unlink(public_path(ltrim($row->svg_path, '/')));
});

test('store rejects non-SVG content', function () {
    $this->actingAs($this->admin)
        ->postJson(route('admin.canvas-stencils.store'), [
            'name' => 'Bad',
            'category' => StencilCategory::General->value,
            'svg_content' => 'not actually svg',
            'license' => StencilLicense::Skoolpad->value,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['svg_content']);
});

test('store rejects unknown category', function () {
    $this->actingAs($this->admin)
        ->postJson(route('admin.canvas-stencils.store'), [
            'name' => 'Bad',
            'category' => 'fake_category',
            'svg_path' => '/x.svg',
            'license' => StencilLicense::Skoolpad->value,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['category']);
});

test('store requires attribution when license is CC-BY-4.0', function () {
    $this->actingAs($this->admin)
        ->postJson(route('admin.canvas-stencils.store'), [
            'name' => 'Borrowed',
            'category' => StencilCategory::General->value,
            'svg_path' => '/x.svg',
            'license' => StencilLicense::CcBy4->value,
            // no source_attribution
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['source_attribution']);
});

test('store accepts CC-BY-4.0 when attribution is provided', function () {
    $this->actingAs($this->admin)
        ->postJson(route('admin.canvas-stencils.store'), [
            'name' => 'Borrowed',
            'category' => StencilCategory::General->value,
            'svg_path' => '/x.svg',
            'license' => StencilLicense::CcBy4->value,
            'source_attribution' => 'Servier Medical Art',
            'source_url' => 'https://smart.servier.com',
        ])
        ->assertCreated()
        ->assertJsonPath('stencil.license', 'cc_by_4');
});

test('store rejects CC-BY-SA license values at policy level', function () {
    $this->actingAs($this->admin)
        ->postJson(route('admin.canvas-stencils.store'), [
            'name' => 'Bad License',
            'category' => StencilCategory::General->value,
            'svg_path' => '/x.svg',
            'license' => 'cc-by-sa',
            'source_attribution' => 'Wikimedia',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['license']);
});

// ── show + svg ────────────────────────────────────────────────────────────────

test('admin can fetch a stencil', function () {
    $stencil = CanvasStencil::factory()->create();

    $this->actingAs($this->admin)
        ->getJson(route('admin.canvas-stencils.show', $stencil))
        ->assertOk()
        ->assertJsonPath('stencil.id', $stencil->id);
});

test('svg endpoint serves the SVG payload with correct content-type', function () {
    $path = '/stencils/general/test-svg.svg';
    $abs = public_path(ltrim($path, '/'));
    $dir = dirname($abs);
    if (! is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    file_put_contents($abs, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"/>');

    $stencil = CanvasStencil::factory()->create(['svg_path' => $path]);

    $response = $this->actingAs($this->admin)
        ->get(route('admin.canvas-stencils.svg', $stencil));

    $response->assertOk();
    expect($response->headers->get('Content-Type'))->toContain('image/svg+xml');
    expect($response->getContent())->toContain('<svg');

    @unlink($abs);
});

test('svg endpoint 404s when file is missing', function () {
    $stencil = CanvasStencil::factory()->create(['svg_path' => '/stencils/general/nonexistent.svg']);

    $this->actingAs($this->admin)
        ->get(route('admin.canvas-stencils.svg', $stencil))
        ->assertNotFound();
});

// ── update + destroy ──────────────────────────────────────────────────────────

test('admin can update a stencil', function () {
    $stencil = CanvasStencil::factory()->create(['name' => 'Old']);

    $this->actingAs($this->admin)
        ->putJson(route('admin.canvas-stencils.update', $stencil), [
            'name' => 'New',
            'sort_order' => 5,
        ])
        ->assertOk()
        ->assertJsonPath('stencil.name', 'New')
        ->assertJsonPath('stencil.sort_order', 5);
});

test('admin can delete a stencil', function () {
    $stencil = CanvasStencil::factory()->create();

    $this->actingAs($this->admin)
        ->deleteJson(route('admin.canvas-stencils.destroy', $stencil))
        ->assertOk();

    expect(CanvasStencil::query()->find($stencil->id))->toBeNull();
});

// ── auth ──────────────────────────────────────────────────────────────────────

test('non-staff cannot create stencils', function () {
    $this->actingAs($this->student)
        ->postJson(route('admin.canvas-stencils.store'), [
            'name' => 'X',
            'category' => StencilCategory::General->value,
            'svg_path' => '/x.svg',
            'license' => StencilLicense::Skoolpad->value,
        ])
        ->assertForbidden();
});

test('non-staff cannot browse catalog', function () {
    $this->actingAs($this->student)
        ->getJson(route('admin.canvas-stencils.catalog'))
        ->assertForbidden();
});

test('guests cannot fetch SVG', function () {
    $stencil = CanvasStencil::factory()->create();

    $this->get(route('admin.canvas-stencils.svg', $stencil))
        ->assertRedirect(); // auth middleware redirects guests
});
