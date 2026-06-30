# MSG91 — SMS integration

> **WhatsApp** uses **Foxglove** (Pinbot), not MSG91. See [FOXGLOVE_WHATSAPP_INTEGRATION.md](./FOXGLOVE_WHATSAPP_INTEGRATION.md).

| Flow | SMS env |
|------|---------|
| OTP | `MSG91_TEMPLATE_ID` |
| Appointment reminder | `MSG91_APPOINTMENT_TEMPLATE_ID` |
| Follow-up reminder | `MSG91_FOLLOWUP_TEMPLATE_ID` |

See `BackEnd/.env.example` and [MSG91_DLT_TEMPLATES.md](./MSG91_DLT_TEMPLATES.md).

API: `POST https://control.msg91.com/api/v5/flow/` with header `authkey`.
