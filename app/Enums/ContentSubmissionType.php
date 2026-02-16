<?php

namespace App\Enums;

enum ContentSubmissionType: string
{
    case Question = 'question';
    case Correction = 'correction';
    case TopicContent = 'topic_content';
    case PastQuestionUpload = 'past_question_upload';

    public function label(): string
    {
        return match ($this) {
            self::Question => 'Question',
            self::Correction => 'Correction',
            self::TopicContent => 'Topic Content',
            self::PastQuestionUpload => 'Past Question Upload',
        };
    }
}
