# MSG91 DLT SMS Templates

This project uses [MSG91 Flow API](https://docs.msg91.com/) for SMS. Each use case has its **own DLT template ID** in `.env`. Until keys are ready, SMS is **skipped** and the message payload is logged (same pattern as OTP).

**WhatsApp (same 3 flows):** see [FOXGLOVE_WHATSAPP_INTEGRATION.md](./FOXGLOVE_WHATSAPP_INTEGRATION.md) — Foxglove approved template names in `.env`.

## Quick setup

1. Register templates on MSG91 / DLT portal (content below).
2. Copy template IDs into `BackEnd/.env`.
3. Set `MSG91_AUTH_KEY` and `MSG91_ENABLED=true`.
4. Restart the backend — reminders run automatically while the server is running.

---

## 1. OTP — Forgot password

| Env key | Example |
|---------|---------|
| `MSG91_TEMPLATE_ID` | `67890abcdef1234567890` |
| `MSG91_OTP_VARIABLE` | `OTP` |

**Suggested DLT template name:** `AHMS_OTP_LOGIN`

**Message (160 chars):**
```
Your Ayurveda Health login OTP is ##OTP##. Valid for 2 minutes. Do not share. - AHMS
```

**Variables:** `OTP`

---

## 2. Appointment reminder (~1 hour before visit)

Sent when a patient or admin books an appointment and the visit time is approaching. Works for **Upcoming** appointments only.

| Env key | Example |
|---------|---------|
| `MSG91_APPOINTMENT_TEMPLATE_ID` | `67890abcdef1234567891` |
| `MSG91_APPT_VAR_PATIENT` | `PATIENT` |
| `MSG91_APPT_VAR_DOCTOR` | `DOCTOR` |
| `MSG91_APPT_VAR_DATE` | `DATE` |
| `MSG91_APPT_VAR_TIME` | `TIME` |

**Suggested DLT template name:** `AHMS_APPOINTMENT_REMINDER`

**Message:**
```
Dear ##PATIENT##, reminder: your appointment with ##DOCTOR## is on ##DATE## at ##TIME##. Please visit Ayurveda Health on time. - AHMS
```

**Variables:** `PATIENT`, `DOCTOR`, `DATE`, `TIME`

| Variable | Sample value |
|----------|--------------|
| PATIENT | Rajesh Kumar |
| DOCTOR | Dr. Ananya Sharma |
| DATE | Jun 15, 2026 |
| TIME | 10:30 AM |

---

## 3. Follow-up reminder (~1 hour before follow-up visit)

Sent when admin/doctor sets a **follow-up date + time** after completing a visit.

| Env key | Example |
|---------|---------|
| `MSG91_FOLLOWUP_TEMPLATE_ID` | `67890abcdef1234567892` |
| `MSG91_FOLLOWUP_VAR_PATIENT` | `PATIENT` |
| `MSG91_FOLLOWUP_VAR_DOCTOR` | `DOCTOR` |
| `MSG91_FOLLOWUP_VAR_DATE` | `DATE` |
| `MSG91_FOLLOWUP_VAR_TIME` | `TIME` |

**Suggested DLT template name:** `AHMS_FOLLOWUP_REMINDER`

**Message:**
```
Dear ##PATIENT##, your follow-up with ##DOCTOR## is scheduled on ##DATE## at ##TIME##. Please visit on time. - AHMS
```

**Variables:** `PATIENT`, `DOCTOR`, `DATE`, `TIME`

---

## Reminder timing

| Env key | Default | Description |
|---------|---------|-------------|
| `SMS_REMINDER_ENABLED` | `true` | Set `false` to disable the background job |
| `SMS_REMINDER_MINUTES_BEFORE` | `60` | Send SMS this many minutes before slot |
| `SMS_REMINDER_WINDOW_MINUTES` | `2` | Delivery window (poll every minute) |
| `SMS_REMINDER_POLL_INTERVAL_MS` | `60000` | How often the job checks (ms) |

The job runs inside the Node process (`server.js`). Each appointment / follow-up is sent **once** (`appointmentReminderSentAt` / `followUpReminderSentAt` on the appointment record).

---

## Variable name mismatch?

If your DLT template uses `VAR1`, `VAR2`, etc., set env to match, e.g.:

```env
MSG91_APPT_VAR_PATIENT=VAR1
MSG91_APPT_VAR_DOCTOR=VAR2
MSG91_APPT_VAR_DATE=VAR3
MSG91_APPT_VAR_TIME=VAR4
```

---

## Testing without MSG91 keys

Leave template IDs empty or set `MSG91_ENABLED=false`. The backend logs:

```
MSG91 not configured for appointment reminder — mobile 919876543210: {"PATIENT":"...","DOCTOR":"...","DATE":"...","TIME":"..."}
```

Use this to verify timing and content before going live.
