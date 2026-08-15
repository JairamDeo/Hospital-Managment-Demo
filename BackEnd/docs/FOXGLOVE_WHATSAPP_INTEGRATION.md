# Foxglove — WhatsApp integration (Pinbot API)

Hospital backend sends **the same notifications on SMS (MSG91) and WhatsApp (Foxglove)** when both are configured.

| # | Flow | When | SMS (MSG91) | WhatsApp (Foxglove) |
|---|------|------|-------------|---------------------|
| 1 | **OTP** | Forgot password / login OTP | `MSG91_TEMPLATE_ID` | `FOXGLOVE_WA_OTP_TEMPLATE_NAME` |
| 2 | **Appointment reminder** | ~1 hr before visit | `MSG91_APPOINTMENT_TEMPLATE_ID` | `FOXGLOVE_WA_APPOINTMENT_TEMPLATE_NAME` |
| 3 | **Follow-up reminder** | ~1 hr before follow-up | `MSG91_FOLLOWUP_TEMPLATE_ID` | `FOXGLOVE_WA_FOLLOWUP_TEMPLATE_NAME` |
| 4 | **Payment link** | Razorpay collect payment | `MSG91_PAYMENT_LINK_TEMPLATE_ID` | `FOXGLOVE_WA_PAYMENT_LINK_TEMPLATE_NAME` |
| 5 | **Prescription PDF** | Staff clicks WhatsApp on prescription | — | `FOXGLOVE_WA_PRESCRIPTION_TEMPLATE_NAME` |
| 6 | **Invoice / receipt** | Staff sends invoice document | — | `FOXGLOVE_WA_INVOICE_TEMPLATE_NAME` |

Code paths:

- `src/services/sms/msg91.service.js` — SMS only
- `src/services/sms/foxgloveWhatsApp.service.js` — WhatsApp (Meta Cloud API via Pinbot)
- `src/services/sms/notify.service.js` — sends **both** channels (OTP, reminders, payment link)
- `src/admin/services/patientWhatsApp.service.js` — prescription & invoice documents
- `src/utils/patientWhatsApp.util.js` — resolves patient WhatsApp number (no crash if missing)
- `src/jobs/smsReminder.job.js` — appointment / follow-up scheduler

**Patient WhatsApp number:** Uses `whatsappNumber` on the patient record. If empty, falls back to `mobileNumber` unless `FOXGLOVE_WA_USE_MOBILE_FALLBACK=false`.

---

## 1. Foxglove dashboard setup

1. Log in to **Foxgloveconnect** (Pinbot partner panel).
2. Go to **WhatsApp → Whatsapp Templates** and create templates (mirror your MSG91 DLT content).
3. Template names must be **lowercase alphanumeric + underscores** only.
4. Note your **API key** and **Phone Number ID** from the messages URL:
   ```
   https://partnersv1.pinbot.ai/v3/801882889676923/messages
                                    ^^^^^^^^^^^^^^^^
                                    FOXGLOVE_WA_PHONE_NUMBER_ID
   ```

---

## 2. Copy-paste `.env` block

Add this below your MSG91 section in `BackEnd/.env`:

```env
# ═══════════════════════════════════════════════════════════════
# FOXGLOVE — WhatsApp (Pinbot / Meta Cloud API)
# Docs: BackEnd/docs/FOXGLOVE_WHATSAPP_INTEGRATION.md
# ═══════════════════════════════════════════════════════════════
FOXGLOVE_WA_ENABLED=true
FOXGLOVE_WA_API_KEY=your_foxglove_api_key
FOXGLOVE_WA_PHONE_NUMBER_ID=801882889676923
FOXGLOVE_WA_BASE_URL=https://partnersv1.pinbot.ai/v3
FOXGLOVE_WA_LANGUAGE_CODE=en

# 1) OTP — body {{1}} = OTP code
FOXGLOVE_WA_OTP_TEMPLATE_NAME=otp_login

# 2) Appointment — body {{1}} patient, {{2}} doctor, {{3}} date, {{4}} time
FOXGLOVE_WA_APPOINTMENT_TEMPLATE_NAME=appointment_reminder_wa

# 3) Follow-up — body {{1}} patient, {{2}} doctor, {{3}} date, {{4}} time
FOXGLOVE_WA_FOLLOWUP_TEMPLATE_NAME=followup_reminder_wa

# 4) Payment link — body {{1}} patient, {{2}} amount, {{3}} invoice, {{4}} link
FOXGLOVE_WA_PAYMENT_LINK_TEMPLATE_NAME=payment_link_wa

# 5) Prescription — header: document (PDF); body {{1}} patient, {{2}} prescription label
FOXGLOVE_WA_PRESCRIPTION_TEMPLATE_NAME=prescription_document_wa

# 6) Invoice — header: document (PDF) or image (JPG/PNG); body {{1}} patient, {{2}} invoice, {{3}} amount
FOXGLOVE_WA_INVOICE_TEMPLATE_NAME=invoice_document_wa

# Optional: strict WhatsApp-only number (no mobile fallback)
# FOXGLOVE_WA_USE_MOBILE_FALLBACK=false
# FOXGLOVE_WA_TO_FORMAT=intl
```

| Variable | Description |
|----------|-------------|
| `FOXGLOVE_WA_API_KEY` | Sent as HTTP header `apikey` |
| `FOXGLOVE_WA_PHONE_NUMBER_ID` | ID in the POST URL path |
| `FOXGLOVE_WA_TO_FORMAT` | Optional: `intl` for `91XXXXXXXXXX`; default is 10-digit local |

**Cloudinary** (required for prescription PDF & invoice uploads sent on WhatsApp):

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## 3. API request format

```
POST https://partnersv1.pinbot.ai/v3/{PHONE_NUMBER_ID}/messages
Header: apikey: <FOXGLOVE_WA_API_KEY>
Content-Type: application/json
```

### Text template (OTP / reminders / payment link)

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "9850887453",
  "type": "template",
  "template": {
    "name": "payment_link_wa",
    "language": { "code": "en" },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "Ramesh Kumar" },
          { "type": "text", "text": "1500" },
          { "type": "text", "text": "INV-2026-001" },
          { "type": "text", "text": "https://rzp.io/i/abc123" }
        ]
      }
    ]
  }
}
```

### Document template (prescription PDF / invoice PDF)

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "9850887453",
  "type": "template",
  "template": {
    "name": "prescription_document_wa",
    "language": { "code": "en" },
    "components": [
      {
        "type": "header",
        "parameters": [
          {
            "type": "document",
            "document": {
              "link": "https://res.cloudinary.com/.../prescription.pdf",
              "filename": "prescription.pdf"
            }
          }
        ]
      },
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "Ramesh Kumar" },
          { "type": "text", "text": "RX-2026-0042" }
        ]
      }
    ]
  }
}
```

### Image template (invoice JPG/PNG)

Use **header type `image`** instead of `document`:

```json
{
  "type": "header",
  "parameters": [
    { "type": "image", "image": { "link": "https://res.cloudinary.com/.../invoice.jpg" } }
  ]
}
```

---

## 4. Template examples (Foxglove form + sample patient message)

For each template below:

1. Create it in **Foxglove → WhatsApp → Templates** with the exact **template name** and **body text**.
2. Match variable order `{{1}}`, `{{2}}`, … — the backend sends values in that order.
3. Use the **sample message** as a preview of what the patient will see on WhatsApp.

---

### 1) OTP — Login / forgot password

| Field | Value |
|-------|-------|
| **Env** | `FOXGLOVE_WA_OTP_TEMPLATE_NAME=otp_login` |
| **Category** | Utility / Authentication |
| **Body text (Foxglove)** | `Your Ayurveda HMS login OTP is {{1}}. Valid for 2 minutes.` |
| **Variables** | `{{1}}` = OTP code (e.g. `482916`) |
| **Button (optional)** | Copy code — set `FOXGLOVE_WA_OTP_BUTTON_ENABLED=true` |

**Sample message patient sees:**

```
┌─────────────────────────────────────┐
│  Ayurveda Hospital                  │
│                                     │
│  Your Ayurveda HMS login OTP is     │
│  482916. Valid for 2 minutes.       │
│                                     │
│  [ Copy code ]                      │
└─────────────────────────────────────┘
```

*(`[ Copy code ]` appears only if OTP button is enabled in Foxglove + `.env`)*

---

### 2) Appointment reminder — 1 hr before visit

| Field | Value |
|-------|-------|
| **Env** | `FOXGLOVE_WA_APPOINTMENT_TEMPLATE_NAME=appointment_reminder_wa` |
| **Category** | Utility |
| **Body text (Foxglove)** | `Hi {{1}}, reminder: appointment with Dr. {{2}} on {{3}} at {{4}}.` |
| **Variables** | `{{1}}` patient name · `{{2}}` doctor name · `{{3}}` date · `{{4}}` time |

**Sample values sent by backend:**

| Variable | Example |
|----------|---------|
| `{{1}}` | Ramesh Kumar |
| `{{2}}` | Dr. Sharma |
| `{{3}}` | 10 Jul 2026 |
| `{{4}}` | 10:30 AM |

**Sample message patient sees:**

```
┌─────────────────────────────────────┐
│  Ayurveda Hospital                  │
│                                     │
│  Hi Ramesh Kumar, reminder:         │
│  appointment with Dr. Sharma on     │
│  10 Jul 2026 at 10:30 AM.           │
└─────────────────────────────────────┘
```

---

### 3) Follow-up reminder — 1 hr before follow-up

| Field | Value |
|-------|-------|
| **Env** | `FOXGLOVE_WA_FOLLOWUP_TEMPLATE_NAME=followup_reminder_wa` |
| **Category** | Utility |
| **Body text (Foxglove)** | `Hi {{1}}, follow-up with Dr. {{2}} on {{3}} at {{4}}.` |
| **Variables** | `{{1}}` patient name · `{{2}}` doctor name · `{{3}}` date · `{{4}}` time |

**Sample values sent by backend:**

| Variable | Example |
|----------|---------|
| `{{1}}` | Priya Desai |
| `{{2}}` | Dr. Mehta |
| `{{3}}` | 15 Jul 2026 |
| `{{4}}` | 04:00 PM |

**Sample message patient sees:**

```
┌─────────────────────────────────────┐
│  Ayurveda Hospital                  │
│                                     │
│  Hi Priya Desai, follow-up with     │
│  Dr. Mehta on 15 Jul 2026 at        │
│  04:00 PM.                          │
└─────────────────────────────────────┘
```

---

### 4) Payment link — Razorpay collect payment

| Field | Value |
|-------|-------|
| **Env** | `FOXGLOVE_WA_PAYMENT_LINK_TEMPLATE_NAME=payment_link_wa` |
| **Category** | Utility |
| **Body text (Foxglove)** | `Hi {{1}}, please pay Rs. {{2}} for invoice {{3}}. Pay here: {{4}}` |
| **Variables** | `{{1}}` patient · `{{2}}` amount (₹) · `{{3}}` invoice code · `{{4}}` Razorpay link |

**Sample values sent by backend:**

| Variable | Example |
|----------|---------|
| `{{1}}` | Ramesh Kumar |
| `{{2}}` | 1500 |
| `{{3}}` | INV-2026-0042 |
| `{{4}}` | https://rzp.io/i/abc123xyz |

**Sample message patient sees:**

```
┌─────────────────────────────────────┐
│  Ayurveda Hospital                  │
│                                     │
│  Hi Ramesh Kumar, please pay        │
│  Rs. 1500 for invoice INV-2026-   │
│  0042. Pay here:                    │
│  https://rzp.io/i/abc123xyz         │
└─────────────────────────────────────┘
```

*Patient taps the link → Razorpay payment page opens → invoice marked paid after success.*

---

### 5) Prescription document — PDF on WhatsApp

| Field | Value |
|-------|-------|
| **Env** | `FOXGLOVE_WA_PRESCRIPTION_TEMPLATE_NAME=prescription_document_wa` |
| **Category** | Utility |
| **Header** | **Document** (required — upload a sample PDF when creating template in Foxglove) |
| **Body text (Foxglove)** | `Dear {{1}}, please find your prescription {{2}} from our hospital.` |
| **Variables** | `{{1}}` patient name · `{{2}}` prescription code / label |

**Sample values sent by backend:**

| Variable | Example |
|----------|---------|
| Header document | `RX-2026-0042.pdf` (PDF from Cloudinary URL) |
| `{{1}}` | Ramesh Kumar |
| `{{2}}` | RX-2026-0042 |

**Sample message patient sees:**

```
┌─────────────────────────────────────┐
│  Ayurveda Hospital                  │
│                                     │
│  📄 RX-2026-0042.pdf                │
│     PDF · Tap to open               │
│                                     │
│  Dear Ramesh Kumar, please find     │
│  your prescription RX-2026-0042     │
│  from our hospital.                 │
└─────────────────────────────────────┘
```

*Triggered when staff clicks the WhatsApp icon on a prescription in the patient profile.*

---

### 6) Invoice / receipt — PDF, JPG, or PNG on WhatsApp

| Field | Value |
|-------|-------|
| **Env** | `FOXGLOVE_WA_INVOICE_TEMPLATE_NAME=invoice_document_wa` |
| **Category** | Utility |
| **Header** | **Document** (PDF) **or** **Image** (JPG / PNG) |
| **Body text (Foxglove)** | `Dear {{1}}, invoice {{2}} for Rs. {{3}} is attached.` |
| **Variables** | `{{1}}` patient name · `{{2}}` invoice code · `{{3}}` amount (₹) |

**Sample values sent by backend (PDF):**

| Variable | Example |
|----------|---------|
| Header document | `INV-2026-0042.pdf` |
| `{{1}}` | Ramesh Kumar |
| `{{2}}` | INV-2026-0042 |
| `{{3}}` | 1500 |

**Sample message patient sees (PDF):**

```
┌─────────────────────────────────────┐
│  Ayurveda Hospital                  │
│                                     │
│  📄 INV-2026-0042.pdf               │
│     PDF · Tap to open               │
│                                     │
│  Dear Ramesh Kumar, invoice         │
│  INV-2026-0042 for Rs. 1500 is      │
│  attached.                          │
└─────────────────────────────────────┘
```

**Sample message patient sees (JPG / PNG image):**

```
┌─────────────────────────────────────┐
│  Ayurveda Hospital                  │
│                                     │
│  🖼️  [ Invoice receipt image ]      │
│                                     │
│  Dear Ramesh Kumar, invoice         │
│  INV-2026-0042 for Rs. 1500 is      │
│  attached.                          │
└─────────────────────────────────────┘
```

*Backend auto-picks **document** header for PDF and **image** header for JPG/PNG.*

---

## 5. App behaviour when WhatsApp number is missing

| Action | Behaviour |
|--------|-----------|
| Payment link (SMS + WA) | SMS still sent; WhatsApp skipped; UI shows info toast |
| Prescription WhatsApp button | API returns 400; toast: *Patient does not have a WhatsApp number on file* |
| Invoice WhatsApp API | Same as prescription |

No server crash — errors are handled gracefully.

---

## 6. API endpoints (staff)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/admin/patients/:patientCode/structured-prescriptions/:prescriptionCode/whatsapp` | Send structured prescription PDF |
| `POST` | `/api/admin/patients/:patientCode/prescriptions/:prescriptionId/whatsapp` | Send uploaded prescription PDF |
| `POST` | `/api/admin/billing/:invoiceCode/whatsapp` | Send invoice (multipart `file`: PDF/JPG/PNG) |

---

## 7. SMS still on MSG91

SMS DLT templates are unchanged — see `BackEnd/docs/MSG91_DLT_TEMPLATES.md` (if present) or `.env.example` MSG91 section.

WhatsApp uses **Foxglove only** (not MSG91).

**Migration:** Legacy `MSG91_WA_*` template name env vars still work as fallback until you rename them to `FOXGLOVE_WA_*`.

---

## 8. Disable WhatsApp

| Goal | Set |
|------|-----|
| Turn off all WhatsApp | `FOXGLOVE_WA_ENABLED=false` |
| OTP WA only, no SMS | Leave `MSG91_TEMPLATE_ID` empty |
| OTP SMS only, no WA | Leave `FOXGLOVE_WA_OTP_TEMPLATE_NAME` empty |
| Payment link SMS only | Leave `FOXGLOVE_WA_PAYMENT_LINK_TEMPLATE_NAME` empty |

---

## 9. Local development

If neither SMS nor WhatsApp OTP is configured, OTP is logged to the server console (dev only).

Copy `BackEnd/.env.example` → `BackEnd/.env` and fill Foxglove values before go-live.
