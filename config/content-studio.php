<?php

return [
    'temperature' => [
        'scheme' => 0.3,
        'blocks' => 0.3,
        'content' => 0.5,
        'questions' => 0.4,
        'explanations' => 0.5,
        'research' => 0.6,
    ],

    'retry' => [
        'max_attempts' => 2,
        'validation_correction' => true,
    ],

    'quality' => [
        'min_score_for_batch_approval' => 85,
        'flag_threshold' => 60,
    ],
];
