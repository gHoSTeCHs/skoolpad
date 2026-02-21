<?php

use App\Models\CanonicalTopic;
use App\Models\Discipline;
use App\Models\Institution;
use App\Models\InstitutionCourse;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
});

test('topic search returns matching published topics', function () {
    $discipline = Discipline::factory()->create();
    CanonicalTopic::factory()->for($discipline)->create(['title' => 'Binary Search Trees', 'is_published' => true]);
    CanonicalTopic::factory()->for($discipline)->create(['title' => 'Graph Theory', 'is_published' => true]);

    $this->actingAs($this->admin)
        ->get(route('admin.api.topics.search', ['q' => 'Binary']))
        ->assertOk()
        ->assertJsonCount(1)
        ->assertJsonFragment(['title' => 'Binary Search Trees']);
});

test('topic search excludes unpublished topics', function () {
    $discipline = Discipline::factory()->create();
    CanonicalTopic::factory()->for($discipline)->create(['title' => 'Linked Lists', 'is_published' => true]);
    CanonicalTopic::factory()->for($discipline)->create(['title' => 'Linked Stacks', 'is_published' => false]);

    $this->actingAs($this->admin)
        ->get(route('admin.api.topics.search', ['q' => 'Linked']))
        ->assertOk()
        ->assertJsonCount(1)
        ->assertJsonFragment(['title' => 'Linked Lists']);
});

test('institution courses API returns courses for institution', function () {
    $institution = Institution::factory()->create();
    InstitutionCourse::factory()->for($institution)->create(['course_code' => 'CSC101', 'course_title' => 'Intro to CS']);
    InstitutionCourse::factory()->for($institution)->create(['course_code' => 'CSC201', 'course_title' => 'Data Structures']);

    $otherInstitution = Institution::factory()->create();
    InstitutionCourse::factory()->for($otherInstitution)->create(['course_code' => 'PHY101', 'course_title' => 'Physics']);

    $this->actingAs($this->admin)
        ->get(route('admin.api.institution.courses', $institution))
        ->assertOk()
        ->assertJsonCount(2)
        ->assertJsonFragment(['course_code' => 'CSC101'])
        ->assertJsonFragment(['course_code' => 'CSC201']);
});
