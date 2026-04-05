<?php

namespace App\Enums;

use App\Concerns\HasSelectOptions;

enum PracticeMode: string
{
    use HasSelectOptions;
    case Timed = 'timed';
    case Untimed = 'untimed';
    case Review = 'review';
    case SpeedDrill = 'speed_drill';
    case WeakTopic = 'weak_topic';
    case YearWalk = 'year_walk';
    case RandomMix = 'random_mix';
    case FullMock = 'full_mock';

    public function label(): string
    {
        return match ($this) {
            self::Timed => 'Timed',
            self::Untimed => 'Untimed',
            self::Review => 'Review',
            self::SpeedDrill => 'Speed Drill',
            self::WeakTopic => 'Weak Topic',
            self::YearWalk => 'Year Walk',
            self::RandomMix => 'Random Mix',
            self::FullMock => 'Full Mock',
        };
    }
}
