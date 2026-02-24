<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreStreamRequest;
use App\Http\Requests\Admin\UpdateStreamRequest;
use App\Models\EducationSystem;
use App\Models\Stream;
use Illuminate\Http\RedirectResponse;

class StreamController extends Controller
{
    public function store(StoreStreamRequest $request, EducationSystem $educationSystem): RedirectResponse
    {
        $data = $request->validated();
        $data['education_system_id'] = $educationSystem->id;

        Stream::create($data);

        return to_route('admin.education-systems.show', $educationSystem)->with('success', 'Stream created.');
    }

    public function update(UpdateStreamRequest $request, Stream $stream): RedirectResponse
    {
        $stream->update($request->validated());

        return to_route('admin.education-systems.show', $stream->education_system_id)->with('success', 'Stream updated.');
    }

    public function destroy(Stream $stream): RedirectResponse
    {
        $systemId = $stream->education_system_id;
        $stream->delete();

        return to_route('admin.education-systems.show', $systemId)->with('success', 'Stream deleted.');
    }
}
