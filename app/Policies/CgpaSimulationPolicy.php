<?php

namespace App\Policies;

use App\Models\CgpaSimulation;
use App\Models\User;

class CgpaSimulationPolicy
{
    public function view(User $user, CgpaSimulation $simulation): bool
    {
        return $user->id === $simulation->user_id;
    }

    public function update(User $user, CgpaSimulation $simulation): bool
    {
        return $user->id === $simulation->user_id;
    }

    public function delete(User $user, CgpaSimulation $simulation): bool
    {
        return $user->id === $simulation->user_id;
    }
}
