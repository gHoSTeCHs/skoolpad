<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WeeklyParentReport extends Mailable
{
    use Queueable, SerializesModels;

    /** @param array<string, mixed> $reportData */
    public function __construct(
        public readonly array $reportData,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Weekly Study Report for {$this->reportData['child_name']} — Skoolpad",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.parent.weekly-report',
            with: ['data' => $this->reportData],
        );
    }

    /** @return array<int, \Illuminate\Mail\Mailables\Attachment> */
    public function attachments(): array
    {
        return [];
    }
}
