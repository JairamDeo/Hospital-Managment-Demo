# Email integration — Nodemailer

Hospital backend sends **the same notifications on SMS (MSG91), WhatsApp (Foxglove), and Email (Nodemailer)** when configured.

| # | Flow | Email service | HTML template |
|---|------|---------------|---------------|
| 1 | OTP | `mailOtp.service.js` | `templates/otp.html` |
| 2 | Appointment reminder | `mailReminders.service.js` | `templates/appointment-reminder.html` |
| 3 | Follow-up reminder | `mailReminders.service.js` | `templates/followup-reminder.html` |
| 4 | Payment link | `mailPaymentLink.service.js` | `templates/payment-link.html` |
| 5 | Prescription PDF | `mailPrescription.service.js` | `templates/prescription.html` |
| 6 | Invoice / receipt | `mailInvoice.service.js` | `templates/invoice.html` |

## File structure

```
BackEnd/src/services/email/
├── mail.config.js           # SMTP env, per-type enable flags
├── mail.service.js          # Nodemailer send (with attachments)
├── mailTemplate.service.js  # Handlebars render
├── mailOtp.service.js
├── mailReminders.service.js
├── mailPaymentLink.service.js
├── mailPrescription.service.js
├── mailInvoice.service.js
└── templates/
    ├── otp.html
    ├── appointment-reminder.html
    ├── followup-reminder.html
    ├── payment-link.html
    ├── prescription.html
    └── invoice.html
```

Orchestration: `src/services/sms/notify.service.js` sends SMS + WhatsApp + Email together.

Prescription / invoice manual sends: `src/admin/services/patientMail.service.js` (parallel with WhatsApp).

---

## 1. `.env` configuration

```env
MAIL_ENABLED=true
MAIL_HOST=smtp.zoho.in
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your_email@yourdomain.com
MAIL_PASSWORD=your_app_password
MAIL_FROM_NAME=Ayurveda Hospital
MAIL_FROM_EMAIL=your_email@yourdomain.com
HOSPITAL_NAME=Ayurveda Hospital

# Optional custom subjects
MAIL_OTP_SUBJECT=Your login OTP — Ayurveda HMS
MAIL_APPOINTMENT_SUBJECT=Appointment reminder
MAIL_FOLLOWUP_SUBJECT=Follow-up reminder
MAIL_PAYMENT_LINK_SUBJECT=Payment link for your invoice
MAIL_PRESCRIPTION_SUBJECT=Your prescription
MAIL_INVOICE_SUBJECT=Your invoice
```

| Variable | Description |
|----------|-------------|
| `MAIL_HOST` | SMTP server (Zoho, Gmail, SendGrid SMTP, etc.) |
| `MAIL_USER` / `MAIL_PASSWORD` | SMTP credentials (use app password) |
| `MAIL_FROM_NAME` | Display name in patient's inbox |
| `HOSPITAL_NAME` | Used inside HTML templates |
| `MAIL_*_SUBJECT` | Override default subject per notification type |
| `MAIL_*_ENABLED=false` | Disable one type only (OTP, appointment, etc.) |

**Legacy:** `EMAIL`, `EMAIL_PASSWORD`, `BCC_EMAIL` still work as fallbacks.

---

## 2. Customize HTML templates

Edit files in `BackEnd/src/services/email/templates/`. Each uses **Handlebars** variables.

Shared variables (auto-injected):

| Variable | Source |
|----------|--------|
| `{{hospitalName}}` | `HOSPITAL_NAME` env |
| `{{year}}` | Current year |
| `{{supportEmail}}` | `MAIL_SUPPORT_EMAIL` |
| `{{frontendUrl}}` | `FRONTEND_URL` |

### 1) OTP — `otp.html`

| Variable | Example |
|----------|---------|
| `{{name}}` | Ramesh Kumar |
| `{{otp}}` | 482916 |
| `{{purpose}}` | verify your account |
| `{{expiryMinutes}}` | 2 |

**Sample email patient sees:**

> **Ayurveda Hospital**  
> Hi **Ramesh Kumar**,  
> Use the OTP below to verify your account. Valid for **2 minutes**.  
> **`482916`**

---

### 2) Appointment — `appointment-reminder.html`

| Variable | Example |
|----------|---------|
| `{{patientName}}` | Ramesh Kumar |
| `{{doctorName}}` | Sharma |
| `{{date}}` | 10 Jul 2026 |
| `{{time}}` | 10:30 AM |

**Sample:**

> Hi **Ramesh Kumar**, reminder for your visit at **Ayurveda Hospital**.  
> Doctor: **Dr. Sharma** · Date: **10 Jul 2026** · Time: **10:30 AM**

---

### 3) Follow-up — `followup-reminder.html`

Same variables as appointment.

**Sample:**

> Hi **Priya Desai**, follow-up with **Dr. Mehta** on **15 Jul 2026** at **04:00 PM**.

---

### 4) Payment link — `payment-link.html`

| Variable | Example |
|----------|---------|
| `{{patientName}}` | Ramesh Kumar |
| `{{amount}}` | 1500 |
| `{{invoiceCode}}` | INV-2026-0042 |
| `{{paymentLink}}` | https://rzp.io/i/abc123 |

**Sample:**

> Hi **Ramesh Kumar**, please pay **₹1500** for invoice **INV-2026-0042**.  
> **[Pay now]** button + link URL.

---

### 5) Prescription — `prescription.html` + PDF attachment

| Variable | Example |
|----------|---------|
| `{{patientName}}` | Ramesh Kumar |
| `{{prescriptionLabel}}` | RX-2026-0042 |

**Sample:**

> Dear **Ramesh Kumar**, prescription **RX-2026-0042** is attached.

Attachment: `RX-2026-0042.pdf`

---

### 6) Invoice — `invoice.html` + PDF/JPG/PNG attachment

| Variable | Example |
|----------|---------|
| `{{patientName}}` | Ramesh Kumar |
| `{{invoiceCode}}` | INV-2026-0042 |
| `{{amount}}` | 1500 |

**Sample:**

> Dear **Ramesh Kumar**, invoice **INV-2026-0042** for **₹1500** is attached.

---

## 3. When email is skipped

| Action | Behaviour |
|--------|-----------|
| Payment link | SMS/WA still sent; info toast if no email |
| Prescription button | WhatsApp may still send; info toast if no email |
| Reminders | SMS/WA still sent if mobile exists |

No crash — `emailSkipped: true` in API response.

Patient email comes from `email` field on `HmsPatient`.

---

## 4. Disable email

| Goal | Set |
|------|-----|
| Turn off all email | `MAIL_ENABLED=false` |
| OTP email only off | `MAIL_OTP_ENABLED=false` |
| Keep SMS + WA, no email | `MAIL_ENABLED=false` |

---

## 5. SMTP providers

| Provider | `MAIL_HOST` | Notes |
|----------|-------------|-------|
| Zoho Mail | `smtp.zoho.in` | Port 587, app password |
| Gmail | `smtp.gmail.com` | App password required |
| Outlook | `smtp.office365.com` | Port 587 |

Test after setup: trigger forgot-password OTP for a user with email on file.
