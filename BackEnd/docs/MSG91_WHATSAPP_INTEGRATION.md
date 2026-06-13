# MSG91 — SMS + WhatsApp integration

Hospital backend sends **the same notifications on SMS and WhatsApp** when both are configured.

| Flow | When | SMS env | WhatsApp env |
|------|------|---------|--------------|
| **OTP** | Forgot password / login OTP | `MSG91_TEMPLATE_ID` | `MSG91_WA_OTP_TEMPLATE_NAME` |
| **Appointment reminder** | ~1 hr before booked visit | `MSG91_APPOINTMENT_TEMPLATE_ID` | `MSG91_WA_APPOINTMENT_TEMPLATE_NAME` |
| **Follow-up reminder** | ~1 hr before follow-up slot | `MSG91_FOLLOWUP_TEMPLATE_ID` | `MSG91_WA_FOLLOWUP_TEMPLATE_NAME` |

Code paths:

- `src/services/sms/msg91.service.js` — SMS (Flow API)
- `src/services/sms/msg91WhatsApp.service.js` — WhatsApp (template bulk API)
- `src/services/sms/notify.service.js` — sends **both** channels
- `src/jobs/smsReminder.job.js` — appointment / follow-up scheduler

---

## 1. Prerequisites (production)

1. [MSG91](https://msg91.com) account with **Auth Key** (`MSG91_AUTH_KEY`).
2. **SMS**: DLT-approved Flow templates for OTP, appointment, follow-up.
3. **WhatsApp**:
   - Meta WhatsApp Business Account (WABA) linked in MSG91.
   - WhatsApp number **integrated** in MSG91 panel.
   - **Three separate WhatsApp templates** approved in Meta (OTP, appointment, follow-up).
   - In MSG91: **WhatsApp → Templates → Sync templates**.

---

## 2. Shared `.env` keys

```env
MSG91_ENABLED=true
MSG91_AUTH_KEY=your_msg91_auth_key

MSG91_WA_ENABLED=true
MSG91_WA_INTEGRATED_NUMBER=919876543210
MSG91_WA_NAMESPACE=338cef55_a0f8_4b2e_97f4_e030XXXX27
MSG91_WA_LANGUAGE_CODE=en
```

- **Integrated number**: MSG91 → WhatsApp → your connected number (country code, no `+`).
- **Namespace**: Open any synced template in MSG91 → copy **namespace** UUID.

---

## 3. OTP (SMS + WhatsApp)

### SMS

```env
MSG91_TEMPLATE_ID=your_dlt_flow_id
MSG91_OTP_VARIABLE=OTP
```

### WhatsApp

Create an **authentication / utility** template in Meta with one body variable for OTP.

```env
MSG91_WA_OTP_TEMPLATE_NAME=otp_login_template
MSG91_WA_OTP_VARIABLE=body_1
# If template has URL button with OTP:
# MSG91_WA_OTP_BUTTON_VARIABLE=button_1
```

**Component slots** (`body_1`, `body_2`, …) must match the **order of variables** in your WhatsApp template body in MSG91 (first `{{1}}` → `body_1`, etc.).

---

## 4. Appointment reminder (SMS + WhatsApp)

Sent **60 minutes** before `appointmentDate` + `timeSlot` (configurable via `SMS_REMINDER_MINUTES_BEFORE`).

### SMS

```env
MSG91_APPOINTMENT_TEMPLATE_ID=your_appointment_dlt_id
MSG91_APPT_VAR_PATIENT=PATIENT
MSG91_APPT_VAR_DOCTOR=DOCTOR
MSG91_APPT_VAR_DATE=DATE
MSG91_APPT_VAR_TIME=TIME
```

### WhatsApp

Separate approved template, e.g. body:  
`Hi {{1}}, reminder: appointment with Dr. {{2}} on {{3}} at {{4}}.`

```env
MSG91_WA_APPOINTMENT_TEMPLATE_NAME=appointment_reminder_wa
MSG91_WA_APPT_VAR_PATIENT=body_1
MSG91_WA_APPT_VAR_DOCTOR=body_2
MSG91_WA_APPT_VAR_DATE=body_3
MSG91_WA_APPT_VAR_TIME=body_4
```

---

## 5. Follow-up reminder (SMS + WhatsApp)

Sent **60 minutes** before `followUpDate` + `followUpTimeSlot` (after doctor sets follow-up).

### SMS

```env
MSG91_FOLLOWUP_TEMPLATE_ID=your_followup_dlt_id
MSG91_FOLLOWUP_VAR_PATIENT=PATIENT
MSG91_FOLLOWUP_VAR_DOCTOR=DOCTOR
MSG91_FOLLOWUP_VAR_DATE=DATE
MSG91_FOLLOWUP_VAR_TIME=TIME
```

### WhatsApp

```env
MSG91_WA_FOLLOWUP_TEMPLATE_NAME=followup_reminder_wa
MSG91_WA_FOLLOWUP_VAR_PATIENT=body_1
MSG91_WA_FOLLOWUP_VAR_DOCTOR=body_2
MSG91_WA_FOLLOWUP_VAR_DATE=body_3
MSG91_WA_FOLLOWUP_VAR_TIME=body_4
```

---

## 6. Reminder scheduler

```env
SMS_REMINDER_ENABLED=true
SMS_REMINDER_MINUTES_BEFORE=60
SMS_REMINDER_WINDOW_MINUTES=2
SMS_REMINDER_POLL_INTERVAL_MS=60000
```

- Backend must stay running (job polls every minute by default).
- Reminder is marked sent if **SMS or WhatsApp** succeeds.
- Patient must have `mobileNumber` on file (used for both channels).

---

## 7. Disable channels

| Goal | Set |
|------|-----|
| Turn off all MSG91 SMS | `MSG91_ENABLED=false` |
| Turn off all WhatsApp | `MSG91_WA_ENABLED=false` |
| OTP SMS only, no WA | Leave `MSG91_WA_OTP_TEMPLATE_NAME` empty |
| OTP WA only, no SMS | Leave `MSG91_TEMPLATE_ID` empty |
| Turn off reminders | `SMS_REMINDER_ENABLED=false` |

---

## 8. API reference (MSG91)

- SMS Flow: `POST https://control.msg91.com/api/v5/flow/`
- WhatsApp bulk: `POST https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/`
- Header: `authkey: <MSG91_AUTH_KEY>`

Official docs: [https://docs.msg91.com/whatsapp](https://docs.msg91.com/whatsapp)

---

## 9. Local development

If **neither** SMS nor WhatsApp OTP is configured, OTP is logged to the server console (dev only).

Copy `BackEnd/.env.example` → `BackEnd/.env` and fill production values before go-live.
