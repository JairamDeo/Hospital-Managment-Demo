# Foxglove — WhatsApp integration (Pinbot API)

Hospital backend sends **the same notifications on SMS (MSG91) and WhatsApp (Foxglove)** when both are configured.

| Flow | When | SMS (MSG91) | WhatsApp (Foxglove) |
|------|------|-------------|---------------------|
| **OTP** | Forgot password / login OTP | `MSG91_TEMPLATE_ID` | `FOXGLOVE_WA_OTP_TEMPLATE_NAME` |
| **Appointment reminder** | ~1 hr before visit | `MSG91_APPOINTMENT_TEMPLATE_ID` | `FOXGLOVE_WA_APPOINTMENT_TEMPLATE_NAME` |
| **Follow-up reminder** | ~1 hr before follow-up | `MSG91_FOLLOWUP_TEMPLATE_ID` | `FOXGLOVE_WA_FOLLOWUP_TEMPLATE_NAME` |

Code paths:

- `src/services/sms/msg91.service.js` — SMS only
- `src/services/sms/foxgloveWhatsApp.service.js` — WhatsApp (Meta Cloud API via Pinbot)
- `src/services/sms/notify.service.js` — sends **both** channels
- `src/jobs/smsReminder.job.js` — appointment / follow-up scheduler

---

## 1. Foxglove dashboard setup

1. Log in to **Foxgloveconnect** (Pinbot partner panel).
2. Go to **WhatsApp → Whatsapp Templates** and create templates (same content as before):
   - OTP (utility / authentication)
   - Appointment reminder
   - Follow-up reminder
3. Template names must be **lowercase alphanumeric + underscores** only.
4. Note your **API key** and **Phone Number ID** from the messages URL:
   ```
   https://partnersv1.pinbot.ai/v3/801882889676923/messages
                                    ^^^^^^^^^^^^^^^^
                                    FOXGLOVE_WA_PHONE_NUMBER_ID
   ```

---

## 2. `.env` configuration

```env
FOXGLOVE_WA_ENABLED=true
FOXGLOVE_WA_API_KEY=your_foxglove_api_key
FOXGLOVE_WA_PHONE_NUMBER_ID=801882889676923
FOXGLOVE_WA_BASE_URL=https://partnersv1.pinbot.ai/v3
FOXGLOVE_WA_LANGUAGE_CODE=en
```

| Variable | Description |
|----------|-------------|
| `FOXGLOVE_WA_API_KEY` | Sent as HTTP header `apikey` |
| `FOXGLOVE_WA_PHONE_NUMBER_ID` | ID in the POST URL path |
| `FOXGLOVE_WA_TO_FORMAT` | Optional: `intl` for `91XXXXXXXXXX`; default is 10-digit local |

---

## 3. API request format

```
POST https://partnersv1.pinbot.ai/v3/{PHONE_NUMBER_ID}/messages
Header: apikey: <FOXGLOVE_WA_API_KEY>
Content-Type: application/json
```

Body (Meta Cloud API format):

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "7709703563",
  "type": "template",
  "template": {
    "name": "appointment_reminder_wa",
    "language": { "code": "en" },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "Ramesh" },
          { "type": "text", "text": "Dr. Sharma" },
          { "type": "text", "text": "30 May 2026" },
          { "type": "text", "text": "10:00 AM" }
        ]
      }
    ]
  }
}
```

---

## 4. Template examples (Foxglove form)

### OTP

- **Name:** `otp_login` (example)
- **Category:** Utility / Authentication
- **Body:** `Your Ayurveda HMS login OTP is {{1}}. Valid for 2 minutes.`
- **Button (optional):** Copy code — set `FOXGLOVE_WA_OTP_BUTTON_ENABLED=true`

```env
FOXGLOVE_WA_OTP_TEMPLATE_NAME=otp_login
```

### Appointment reminder

- **Body:** `Hi {{1}}, reminder: appointment with Dr. {{2}} on {{3}} at {{4}}.`

```env
FOXGLOVE_WA_APPOINTMENT_TEMPLATE_NAME=appointment_reminder_wa
```

Variables are sent in order: patient name, doctor name, date, time.

### Follow-up reminder

- **Body:** `Hi {{1}}, follow-up with Dr. {{2}} on {{3}} at {{4}}.`

```env
FOXGLOVE_WA_FOLLOWUP_TEMPLATE_NAME=followup_reminder_wa
```

---

## 5. SMS still on MSG91

SMS DLT templates are unchanged — see `BackEnd/docs/MSG91_DLT_TEMPLATES.md`.

WhatsApp no longer uses MSG91. Only Foxglove env vars apply for WA.

**Migration:** Legacy `MSG91_WA_*` template name env vars still work as fallback until you rename them to `FOXGLOVE_WA_*`.

---

## 6. Disable WhatsApp

| Goal | Set |
|------|-----|
| Turn off all WhatsApp | `FOXGLOVE_WA_ENABLED=false` |
| OTP WA only, no SMS | Leave `MSG91_TEMPLATE_ID` empty |
| OTP SMS only, no WA | Leave `FOXGLOVE_WA_OTP_TEMPLATE_NAME` empty |

---

## 7. Local development

If neither SMS nor WhatsApp OTP is configured, OTP is logged to the server console (dev only).

Copy `BackEnd/.env.example` → `BackEnd/.env` and fill Foxglove values before go-live.
