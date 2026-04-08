<?php

namespace App\ContentStudio;

use App\DataTransferObjects\ContentPrompt;
use App\DataTransferObjects\ContentResponse;

interface ContentAIProvider
{
    public function generate(ContentPrompt $prompt): ContentResponse;
}
