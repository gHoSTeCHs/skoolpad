<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Weekly Study Report</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #EDE8E0; font-family: Georgia, 'Times New Roman', Times, serif;">

    {{-- Preheader text (hidden, shows in email preview) --}}
    <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
        {{ $data['child_name'] }}'s weekly progress on Skoolpad — study time, accuracy, and readiness scores.
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #EDE8E0;">
        <tr>
            <td align="center" style="padding: 32px 16px 40px;">

                {{-- Top accent bar --}}
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
                    <tr>
                        <td style="height: 4px; background: linear-gradient(90deg, #1A6B4F 0%, #2D9B70 50%, #D4A853 100%); border-radius: 4px 4px 0 0; font-size: 0; line-height: 0;">&nbsp;</td>
                    </tr>
                </table>

                {{-- Main card --}}
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #FDFBF7; border-radius: 0 0 12px 12px; border: 1px solid #E0D9CF; border-top: none;">

                    {{-- Header --}}
                    <tr>
                        <td style="padding: 32px 40px 24px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td>
                                        <p style="margin: 0; font-size: 11px; letter-spacing: 2.5px; text-transform: uppercase; color: #1A6B4F; font-family: 'Trebuchet MS', 'Lucida Sans', Arial, sans-serif; font-weight: 700;">Skoolpad</p>
                                    </td>
                                    <td style="text-align: right;">
                                        <p style="margin: 0; font-size: 12px; color: #A09888; font-family: Georgia, serif;">Weekly Report</p>
                                    </td>
                                </tr>
                            </table>
                            <hr style="border: none; border-top: 1px solid #E8E2D8; margin: 16px 0 0;">
                        </td>
                    </tr>

                    {{-- Greeting --}}
                    <tr>
                        <td style="padding: 0 40px 8px;">
                            <p style="margin: 0; font-size: 20px; color: #2C2418; font-family: Georgia, serif; line-height: 1.4;">
                                Here&rsquo;s how <strong style="color: #1A6B4F;">{{ $data['child_name'] }}</strong> did this week.
                            </p>
                        </td>
                    </tr>

                    @if(($data['study_time_minutes'] ?? 0) === 0 && ($data['questions_answered'] ?? 0) === 0)

                        {{-- ═══════════ Zero Activity State ═══════════ --}}
                        <tr>
                            <td style="padding: 20px 40px 28px;">
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFF9EE; border: 1px solid #F0E4C8; border-radius: 8px;">
                                    <tr>
                                        <td style="padding: 24px 28px;">
                                            <p style="margin: 0 0 8px; font-size: 16px; font-weight: 700; color: #8B6914; font-family: 'Trebuchet MS', Arial, sans-serif;">No study activity this week</p>
                                            <p style="margin: 0; font-size: 14px; color: #9E8545; font-family: Georgia, serif; line-height: 1.5;">
                                                A quick 10-minute check-in tonight can make a big difference. Open the dashboard and start a session together.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                    @else

                        {{-- ═══════════ Stats Grid ═══════════ --}}
                        <tr>
                            <td style="padding: 16px 40px 0;">
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                        {{-- Study Time --}}
                                        <td width="48%" valign="top" style="background-color: #F4F0E8; border-radius: 8px; padding: 20px;">
                                            <p style="margin: 0 0 4px; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #8A7F6E; font-family: 'Trebuchet MS', Arial, sans-serif;">Study Time</p>
                                            <p style="margin: 0; font-size: 32px; font-weight: 700; color: #2C2418; font-family: Georgia, serif; line-height: 1.1;">
                                                @if($data['study_time_minutes'] >= 60)
                                                    {{ floor($data['study_time_minutes'] / 60) }}h {{ $data['study_time_minutes'] % 60 }}m
                                                @else
                                                    {{ $data['study_time_minutes'] }}m
                                                @endif
                                            </p>
                                            <p style="margin: 6px 0 0; font-size: 12px; color: #A09888; font-family: Georgia, serif;">{{ $data['questions_answered'] ?? 0 }} questions</p>
                                        </td>
                                        <td width="4%">&nbsp;</td>
                                        {{-- Accuracy --}}
                                        <td width="48%" valign="top" style="background-color: #F4F0E8; border-radius: 8px; padding: 20px;">
                                            @php
                                                $accuracy = $data['accuracy'] ?? 0;
                                                $accuracyColor = $accuracy >= 70 ? '#1A6B4F' : ($accuracy >= 50 ? '#B8860B' : '#C0392B');
                                                $accuracyBg = $accuracy >= 70 ? '#E8F5EE' : ($accuracy >= 50 ? '#FFF8E8' : '#FDE8E8');
                                            @endphp
                                            <p style="margin: 0 0 4px; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #8A7F6E; font-family: 'Trebuchet MS', Arial, sans-serif;">Accuracy</p>
                                            <p style="margin: 0; font-size: 32px; font-weight: 700; color: {{ $accuracyColor }}; font-family: Georgia, serif; line-height: 1.1;">
                                                {{ $accuracy }}%
                                            </p>
                                            <p style="margin: 6px 0 0; font-size: 12px; color: #A09888; font-family: Georgia, serif;">
                                                @if($accuracy >= 70) Strong @elseif($accuracy >= 50) Improving @else Needs focus @endif
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        {{-- Subjects Practiced --}}
                        @if(!empty($data['subjects_practiced']))
                            <tr>
                                <td style="padding: 20px 40px 0;">
                                    <p style="margin: 0 0 10px; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #8A7F6E; font-family: 'Trebuchet MS', Arial, sans-serif;">Subjects Practiced</p>
                                    @foreach($data['subjects_practiced'] as $subject)
                                        <span style="display: inline-block; background-color: #1A6B4F; color: #ffffff; padding: 5px 14px; border-radius: 20px; font-size: 12px; font-family: 'Trebuchet MS', Arial, sans-serif; font-weight: 600; margin: 0 6px 6px 0; letter-spacing: 0.3px;">{{ $subject }}</span>
                                    @endforeach
                                </td>
                            </tr>
                        @endif

                    @endif

                    {{-- Verifications --}}
                    @if(($data['verifications']['total'] ?? 0) > 0)
                        <tr>
                            <td style="padding: 20px 40px 0;">
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F0F7F3; border-radius: 8px; border: 1px solid #D4E8DC;">
                                    <tr>
                                        <td style="padding: 18px 22px;">
                                            <p style="margin: 0 0 2px; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #1A6B4F; font-family: 'Trebuchet MS', Arial, sans-serif;">Parent Verifications</p>
                                            <p style="margin: 0; font-size: 15px; color: #2C2418; font-family: Georgia, serif; line-height: 1.5;">
                                                <strong>{{ $data['verifications']['total'] }} topics verified</strong> &mdash;
                                                <span style="color: #1A6B4F;">{{ $data['verifications']['understood'] ?? 0 }} understood</span>@if(($data['verifications']['needs_review'] ?? 0) > 0), <span style="color: #C0392B;">{{ $data['verifications']['needs_review'] }} need review</span>@endif
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    @endif

                    {{-- Readiness Scores --}}
                    @if(!empty($data['readiness_scores']))
                        <tr>
                            <td style="padding: 20px 40px 0;">
                                <p style="margin: 0 0 12px; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #8A7F6E; font-family: 'Trebuchet MS', Arial, sans-serif;">Exam Readiness</p>
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                    @foreach($data['readiness_scores'] as $score)
                                        @php
                                            $scoreValue = $score['composite_score'] ?? 0;
                                            $scoreColor = $scoreValue >= 70 ? '#1A6B4F' : ($scoreValue >= 50 ? '#B8860B' : '#C0392B');
                                            $barColor = $scoreValue >= 70 ? '#1A6B4F' : ($scoreValue >= 50 ? '#D4A853' : '#C0392B');
                                            $barBg = '#E8E2D8';
                                        @endphp
                                        <tr>
                                            <td style="padding: 10px 0;">
                                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                                    <tr>
                                                        <td style="font-size: 14px; color: #2C2418; font-family: Georgia, serif; padding-bottom: 6px;">
                                                            {{ $score['subject_name'] ?? 'Unknown' }}
                                                        </td>
                                                        <td style="font-size: 16px; font-weight: 700; color: {{ $scoreColor }}; font-family: Georgia, serif; text-align: right; padding-bottom: 6px;">
                                                            {{ $scoreValue }}%
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td colspan="2">
                                                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                                                <tr>
                                                                    <td style="background-color: {{ $barBg }}; border-radius: 4px; height: 6px; font-size: 0; line-height: 0;">
                                                                        <div style="background-color: {{ $barColor }}; width: {{ min(100, $scoreValue) }}%; height: 6px; border-radius: 4px; font-size: 0; line-height: 0;">&nbsp;</div>
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    @endforeach
                                </table>
                            </td>
                        </tr>
                    @endif

                    {{-- CTA Button --}}
                    <tr>
                        <td style="padding: 32px 40px 12px;" align="center">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="background-color: #1A6B4F; border-radius: 8px;">
                                        <!--[if mso]>
                                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{ url('/parent/dashboard') }}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="17%" strokecolor="#1A6B4F" fillcolor="#1A6B4F">
                                        <w:anchorlock/>
                                        <center style="color:#ffffff;font-family:Trebuchet MS,Arial,sans-serif;font-size:15px;font-weight:bold;">Open Dashboard &rarr;</center>
                                        </v:roundrect>
                                        <![endif]-->
                                        <!--[if !mso]><!-->
                                        <a href="{{ url('/parent/dashboard') }}" style="display: inline-block; background-color: #1A6B4F; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 700; font-family: 'Trebuchet MS', Arial, sans-serif; letter-spacing: 0.3px;">
                                            Open Dashboard &rarr;
                                        </a>
                                        <!--<![endif]-->
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Footer --}}
                    <tr>
                        <td style="padding: 20px 40px 32px;">
                            <hr style="border: none; border-top: 1px solid #E8E2D8; margin: 0 0 16px;">
                            <p style="margin: 0; font-size: 12px; color: #A09888; text-align: center; font-family: Georgia, serif; line-height: 1.6;">
                                You&rsquo;re receiving this because you have a Skoolpad Parent account.<br>
                                <a href="{{ url('/parent/settings') }}" style="color: #1A6B4F; text-decoration: none; border-bottom: 1px solid #1A6B4F;">Manage preferences</a>
                            </p>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>
