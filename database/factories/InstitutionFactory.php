<?php

namespace Database\Factories;

use App\Enums\InstitutionType;
use App\Enums\OwnershipType;
use App\Models\Country;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Institution>
 */
class InstitutionFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $institutions = [
            ['name' => 'Michael Okpara University of Agriculture', 'abbreviation' => 'MOUAU', 'state' => 'Abia', 'city' => 'Umudike'],
            ['name' => 'University of Lagos', 'abbreviation' => 'UNILAG', 'state' => 'Lagos', 'city' => 'Akoka'],
            ['name' => 'University of Nigeria', 'abbreviation' => 'UNN', 'state' => 'Enugu', 'city' => 'Nsukka'],
            ['name' => 'Lagos State University', 'abbreviation' => 'LASU', 'state' => 'Lagos', 'city' => 'Ojo'],
            ['name' => 'Imo State University', 'abbreviation' => 'IMSU', 'state' => 'Imo', 'city' => 'Owerri'],
            ['name' => 'Federal University of Technology Owerri', 'abbreviation' => 'FUTO', 'state' => 'Imo', 'city' => 'Owerri'],
            ['name' => 'Obafemi Awolowo University', 'abbreviation' => 'OAU', 'state' => 'Osun', 'city' => 'Ile-Ife'],
            ['name' => 'Ahmadu Bello University', 'abbreviation' => 'ABU', 'state' => 'Kaduna', 'city' => 'Zaria'],
        ];

        $pick = fake()->randomElement($institutions);

        return [
            'country_id' => Country::factory(),
            'name' => $pick['name'],
            'abbreviation' => $pick['abbreviation'],
            'institution_type' => InstitutionType::University,
            'ownership_type' => fake()->randomElement(OwnershipType::cases()),
            'state' => $pick['state'],
            'city' => $pick['city'],
            'website' => null,
            'logo_path' => null,
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
