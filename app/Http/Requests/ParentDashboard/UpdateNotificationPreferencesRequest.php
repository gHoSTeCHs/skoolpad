<?php

namespace App\Http\Requests\ParentDashboard;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNotificationPreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'alert_channels' => ['nullable', 'array'],
            'alert_channels.*' => ['string', 'in:email,in_app,sms'],
        ];
    }
}
