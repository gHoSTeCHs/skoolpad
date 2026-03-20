<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ParentExamAlert extends Notification implements ShouldQueue
{
    use Queueable;

    /** @param array<string, mixed> $alertData */
    public function __construct(
        public readonly array $alertData,
    ) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        $channels = ['database'];

        $prefs = $notifiable->parentProfile?->notification_preferences ?? [];
        $alertChannels = $prefs['exam_alert_channels'] ?? ['email'];

        if (in_array('email', $alertChannels)) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $childName = $this->alertData['child_name'];
        $examName = $this->alertData['exam_name'];
        $daysRemaining = $this->alertData['days_remaining'];
        $urgency = $this->alertData['urgency'];
        $readinessScore = $this->alertData['readiness_score'];
        $studyMinutes = $this->alertData['study_time_today_minutes'];
        $questionsToday = $this->alertData['questions_today'];
        $unverifiedCount = $this->alertData['unverified_topic_count'];

        $prefix = match ($urgency) {
            'exam_day' => '[Today] ',
            'critical' => '[URGENT] ',
            'warning' => '[Reminder] ',
            default => '',
        };

        $subject = "{$prefix}{$examName} — {$daysRemaining} days away";

        if ($urgency === 'exam_day') {
            $subject = "{$prefix}{$examName} — Today!";
        }

        $message = (new MailMessage)
            ->subject($subject)
            ->greeting("Hi {$notifiable->name},");

        if ($urgency === 'exam_day') {
            $message->line("Today is {$childName}'s {$examName} exam. Good luck!")
                ->line($readinessScore !== null ? "Final readiness score: {$readinessScore}%" : '');
        } else {
            $message->line("{$childName}'s {$examName} is {$daysRemaining} days away.");

            if ($readinessScore !== null) {
                $message->line("Readiness: {$readinessScore}%");
            }

            if ($studyMinutes > 0) {
                $message->line("Study time today: {$studyMinutes} minutes ({$questionsToday} questions)");
            }

            if ($unverifiedCount > 0) {
                $message->line("{$unverifiedCount} topics not yet verified by you.");
            }
        }

        $message->action('Open Dashboard', url('/parent/dashboard'))
            ->salutation('— Skoolpad');

        return $message;
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'exam_alert',
            'exam_name' => $this->alertData['exam_name'],
            'child_name' => $this->alertData['child_name'],
            'days_remaining' => $this->alertData['days_remaining'],
            'urgency' => $this->alertData['urgency'],
            'readiness_score' => $this->alertData['readiness_score'],
            'unverified_topic_count' => $this->alertData['unverified_topic_count'],
        ];
    }
}
