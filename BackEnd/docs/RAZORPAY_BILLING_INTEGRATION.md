# Razorpay — Billing online payments

> **Test mode:** Use **Test Mode** in the [Razorpay Dashboard](https://dashboard.razorpay.com) and `rzp_test_...` keys in `.env`. No real money is charged in test mode.

Staff collect payments from patients at the counter — **not** patient self-checkout. All collection happens from **Billing → Invoice → Collect payment**.

---

## Payment methods overview

| Method | UI label | Who pays | When invoice updates | Status while waiting |
|--------|----------|----------|----------------------|----------------------|
| **Offline** | Cash / UPI / Card | Patient at counter | Immediately on confirm | — |
| **UPI QR** | UPI QR (patient scans) | Patient scans QR on staff screen | After Razorpay confirms | Staff screen polls every 3s |
| **Payment link** | Payment link (SMS to patient) | Patient opens link from SMS | After Razorpay confirms | Invoice stays **Pending**; staff screen polls every 4s |
| **Checkout** *(API only)* | Legacy browser checkout | Patient on staff browser | After verify endpoint | Used by older integration; QR/link are preferred |

| Backend route (offline) | `PATCH /api/admin/billing/:invoiceCode/collect` |
| Webhook (all online flows) | `POST /api/admin/billing/razorpay/webhook` |

---

## Code paths

| Area | Path |
|------|------|
| Razorpay SDK + signatures | `BackEnd/src/services/payment/razorpay.service.js` |
| Billing Razorpay logic | `BackEnd/src/admin/services/hmsBillingRazorpay.service.js` |
| Payment tracking model | `BackEnd/src/models/hmsRazorpayPayment.model.js` |
| Billing routes | `BackEnd/src/admin/routes/hmsBilling.routes.js` |
| Webhook mount (raw body) | `BackEnd/src/app.js` |
| Payment link SMS (MSG91) | `BackEnd/src/services/sms/msg91.service.js` |
| Collect payment UI | `FrontEnd/src/components/billing/CollectPaymentModal.tsx` |
| QR image crop | `FrontEnd/src/components/billing/RazorpayQrCrop.tsx` |
| Success popup | `FrontEnd/src/components/billing/PaymentSuccessModal.tsx` |
| Legacy checkout helper | `FrontEnd/src/utils/razorpayCheckout.ts` |
| Unit tests | `BackEnd/src/tests/razorpay.test.js` |
| Env template | `BackEnd/.env.example` |

---

## Step 1 — Razorpay dashboard setup (test mode)

1. Sign up / log in: [https://dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Switch to **Test Mode** (toggle top-left — must show “Test Mode”).
3. Go to **Account & Settings → API Keys → Generate Key**.
4. Copy:
   - **Key ID** → `rzp_test_...`
   - **Key Secret** → keep private (backend only)
5. Go to **Account & Settings → Webhooks → + Add New Webhook**
   - **Local dev (ngrok):**
     ```
     https://YOUR-NGROK-ID.ngrok-free.app/api/admin/billing/razorpay/webhook
     ```
   - **Production:**
     ```
     https://your-api-domain.com/api/admin/billing/razorpay/webhook
     ```
   - **Active events** (enable all of these):
     - `payment.captured`
     - `order.paid`
     - `qr_code.credited`
     - `payment_link.paid`
     - `payment.failed`
   - Save and copy **Webhook Secret**

> Webhook is optional for local QR/link testing (frontend polling works). **Required for production** reliability.

---

## Step 2 — `.env` configuration

### 2a. Razorpay keys

Add to `BackEnd/.env`:

```env
# ═══════════════════════════════════════════════════════════════
# RAZORPAY — Online payments (billing)
# Dashboard: https://dashboard.razorpay.com/app/keys
# Webhook URL: POST {BACKEND_URL}/api/admin/billing/razorpay/webhook
# Webhook events: payment.captured, order.paid, qr_code.credited,
#                 payment_link.paid, payment.failed
# ═══════════════════════════════════════════════════════════════
RAZORPAY_ENABLED=true
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_test_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

| Variable | Required | Description |
|----------|----------|-------------|
| `RAZORPAY_ENABLED` | Yes | `true` to show UPI QR + Payment link in Collect payment modal |
| `RAZORPAY_KEY_ID` | Yes | Public key (`rzp_test_...` or `rzp_live_...`) |
| `RAZORPAY_KEY_SECRET` | Yes | Secret key — **never** put in frontend |
| `RAZORPAY_WEBHOOK_SECRET` | Recommended | From Razorpay webhook settings; empty OK for local polling-only tests |

### 2b. MSG91 — Payment link SMS (required for Payment link method)

Payment link uses **MSG91 Flow API** — same pattern as appointment / follow-up SMS. Add to `BackEnd/.env`:

```env
# ═══════════════════════════════════════════════════════════════
# 4) PAYMENT LINK — Collect payment SMS (Razorpay link to patient)
# DLT example: Dear ##PATIENT##, pay ##AMOUNT## for invoice ##INVOICE##: ##LINK## - Arogya Hospital
# ═══════════════════════════════════════════════════════════════
MSG91_ENABLED=true
MSG91_AUTH_KEY=your_msg91_auth_key
MSG91_PAYMENT_LINK_TEMPLATE_ID=your_payment_link_dlt_template_id
MSG91_PAYLINK_VAR_PATIENT=PATIENT
MSG91_PAYLINK_VAR_AMOUNT=AMOUNT
MSG91_PAYLINK_VAR_INVOICE=INVOICE
MSG91_PAYLINK_VAR_LINK=LINK
```

| Variable | Maps to DLT var | Example value sent |
|----------|-----------------|-------------------|
| `MSG91_PAYLINK_VAR_PATIENT` | `##PATIENT##` | Patient name |
| `MSG91_PAYLINK_VAR_AMOUNT` | `##AMOUNT##` | `600` (rupees, no ₹ symbol) |
| `MSG91_PAYLINK_VAR_INVOICE` | `##INVOICE##` | Invoice code |
| `MSG91_PAYLINK_VAR_LINK` | `##LINK##` | Razorpay `short_url` |

**Requirements for payment link:**
- Patient must have a **mobile number** registered in HMS
- `MSG91_PAYMENT_LINK_TEMPLATE_ID` must be set and approved on DLT
- Razorpay must be enabled (`RAZORPAY_ENABLED=true`)

Restart backend after changing `.env`:

```bash
cd BackEnd
npm run dev
```

---

## Step 3 — Staff UI: how each payment method works

Open: **Billing & Invoices** → pending invoice → **Collect payment**

Modal shows: patient name, invoice #, fee type, doctor, amount, **collected by** (logged-in staff).

### 3a. Cash / UPI / Card (offline)

1. Select **Cash**, **UPI**, or **Card**.
2. Enter amount (full balance or partial if allowed).
3. Click **Confirm collection**.
4. Success popup appears immediately.
5. Invoice → **Paid** or **Partial**.

```
Staff confirms offline payment
    ↓
PATCH /api/admin/billing/:invoiceCode/collect
    ↓
collectInvoicePayment() → invoice Paid/Partial
    ↓
Success popup (patient, fee type, doctor, amount, collected by)
```

### 3b. UPI QR (patient scans at counter)

1. Select **UPI QR (patient scans)**.
2. Enter amount if partial payment.
3. Click **Generate QR**.
4. Show QR on screen — patient scans with any UPI app.
5. Staff screen shows **Waiting for patient payment…** (polls every 3s).
6. On success → success popup → invoice **Paid** / **Partial**.

```
Staff clicks Generate QR
    ↓
POST /api/admin/billing/:invoiceCode/razorpay/qr
    → Creates Razorpay UPI QR (exact amount in paise)
    → Saves HmsRazorpayPayment (collectionType: qr, status: created)
    ↓
Patient scans & pays
    ↓
GET /api/admin/billing/razorpay/status/:qrCodeId  (poll every 3s)
    OR webhook qr_code.credited / payment.captured
    ↓
collectInvoicePayment() → HmsRazorpayPayment status: paid
    ↓
Success popup
```

### 3c. Payment link (SMS to patient mobile)

1. Select **Payment link (SMS to patient)**.
2. Enter amount if partial payment.
3. Click **Send payment link**.
4. Backend creates Razorpay payment link and sends SMS via MSG91 to patient's registered mobile.
5. Invoice stays **Pending** — payment is **not** confirmed on send.
6. Staff screen shows:
   - Masked mobile (e.g. `98****3046`)
   - **Waiting for patient payment…** (polls every 4s)
7. Patient opens link on phone and pays.
8. On success → success popup → invoice **Paid** / **Partial**.
9. On failure → red error + **Retry — send new link** (creates fresh link + new SMS).

```
Staff clicks Send payment link
    ↓
POST /api/admin/billing/:invoiceCode/razorpay/payment-link
    → Creates Razorpay payment link (expire: 24h)
    → MSG91 SMS with PATIENT, AMOUNT, INVOICE, LINK variables
    → Saves HmsRazorpayPayment (collectionType: payment_link, status: created)
    ↓
Invoice remains Pending
    ↓
GET /api/admin/billing/razorpay/payment-link/status/:paymentLinkId  (poll every 4s)
    OR webhook payment_link.paid
    ↓
On paid: collectInvoicePayment() → status: paid → success popup
On failed: status: failed → staff sees Retry button
    ↓
POST /api/admin/billing/:invoiceCode/razorpay/payment-link/retry  (new link + SMS)
```

### 3d. Success popup (all methods)

After any successful collection, popup shows:

- Patient name & code
- Invoice #
- Fee type (Consultation / Medicine / Panchakarma)
- Treatment / description
- Doctor name
- Amount collected
- Payment method
- **Collected by** (staff who initiated)

---

## Step 4 — Backend & webhook flows

### Payment record model (`HmsRazorpayPayment`)

| Field | QR flow | Payment link flow |
|-------|---------|-------------------|
| `collectionType` | `qr` | `payment_link` |
| `razorpayQrCodeId` | `qr_xxx` | — |
| `razorpayPaymentLinkId` | — | `plink_xxx` |
| `paymentLinkUrl` | — | Razorpay short URL |
| `patientMobile` | — | Patient mobile (for SMS) |
| `smsSentAt` | — | When MSG91 queued |
| `status` | `created` → `paid` / `failed` | same |
| `failureReason` | — | Set on `payment.failed` webhook |

Duplicate payments prevented: if `status === 'paid'`, fulfill is skipped.

### Webhook handler

```
Razorpay POST /api/admin/billing/razorpay/webhook
    → Verifies x-razorpay-signature (RAZORPAY_WEBHOOK_SECRET)
    → Routes by event:
        qr_code.credited        → fulfill QR payment
        payment_link.paid       → fulfill payment link
        payment.captured        → fulfill by order_id or payment_link
        order.paid                → fulfill by order_id
        payment.failed            → mark payment_link status: failed
```

Webhook is registered in `app.js` **before** `express.json()` so raw body is available for HMAC verification.

---

## Step 5 — API reference

All routes require staff/admin JWT (`Authorization: Bearer ...`), except webhook.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/admin/billing/razorpay/config` | `{ enabled, keyId }` |
| `POST` | `/api/admin/billing/:invoiceCode/razorpay/qr` | Generate UPI QR |
| `GET` | `/api/admin/billing/razorpay/status/:qrCodeId` | Poll QR payment status |
| `POST` | `/api/admin/billing/:invoiceCode/razorpay/payment-link` | Create link + send SMS |
| `POST` | `/api/admin/billing/:invoiceCode/razorpay/payment-link/retry` | New link + SMS after failure |
| `GET` | `/api/admin/billing/razorpay/payment-link/status/:paymentLinkId` | Poll link status (`pending` / `paid` / `failed`) |
| `POST` | `/api/admin/billing/:invoiceCode/razorpay/order` | Legacy checkout order |
| `POST` | `/api/admin/billing/razorpay/verify` | Legacy checkout verify |
| `POST` | `/api/admin/billing/razorpay/webhook` | Razorpay callback (no JWT) |
| `PATCH` | `/api/admin/billing/:invoiceCode/collect` | Offline Cash/UPI/Card |

**Optional partial amount body** (QR, payment link, order):

```json
{ "amount": 600 }
```

**Payment link status response examples:**

```json
{ "status": "pending", "paymentLinkId": "plink_xxx", "patientMobileMasked": "98****3046", "amount": 600 }
```

```json
{ "status": "paid", "collection": { "invoiceCode": "INV-0012", "amount": 600, "collectedBy": "Admin 1", ... } }
```

```json
{ "status": "failed", "failureReason": "Payment failed", "paymentLinkId": "plink_xxx" }
```

**Legacy verify body:**

```json
{
  "invoiceCode": "INV-0012",
  "razorpayOrderId": "order_xxx",
  "razorpayPaymentId": "pay_xxx",
  "razorpaySignature": "signature_xxx"
}
```

---

## Step 6 — Testing (test mode)

### 6a. Automated unit tests

```bash
cd BackEnd
npm test -- src/tests/razorpay.test.js
```

Expected: signature verification and method mapping tests pass.

### 6b. Check Razorpay config endpoint

```http
GET /api/admin/billing/razorpay/config
Authorization: Bearer <token>
```

Expected: `{ "razorpay": { "enabled": true, "keyId": "rzp_test_..." } }`

If `enabled: false` → check `RAZORPAY_ENABLED`, Key ID, Key Secret, restart server.

### 6c. Test UPI QR flow

1. Ensure a **Pending** invoice exists.
2. Billing → invoice → **Collect payment**.
3. Select **UPI QR (patient scans)** → **Generate QR**.
4. Patient scans QR (or use Razorpay test UPI `success@razorpay` if testing via link inside QR).
5. Staff screen auto-confirms → success popup.
6. Invoice status = **Paid**.

### 6d. Test payment link flow

1. Ensure patient has a **valid mobile number** in patient profile.
2. Set `MSG91_PAYMENT_LINK_TEMPLATE_ID` and related vars in `.env`.
3. Billing → invoice → **Collect payment**.
4. Select **Payment link (SMS to patient)** → **Send payment link**.
5. Confirm:
   - SMS received on patient mobile with correct amount and link
   - Staff screen shows **Waiting for patient payment…**
   - Invoice still **Pending**
6. Open link on phone → pay with test UPI `success@razorpay` or test card `4111 1111 1111 1111`.
7. Staff screen updates → success popup → invoice **Paid**.

**Test failure + retry:**

1. Pay with test UPI `failure@razorpay`.
2. Staff screen shows **Payment failed** with reason.
3. Click **Retry — send new link**.
4. New SMS sent → pay with `success@razorpay` → invoice **Paid**.

### 6e. Razorpay test credentials

| Method | Test value |
|--------|------------|
| Card (success) | `4111 1111 1111 1111` · any future expiry · any CVV |
| UPI (success) | `success@razorpay` |
| UPI (failure) | `failure@razorpay` |

More: [Razorpay Test Cards & UPI](https://razorpay.com/docs/payments/payments/test-card-upi-details/)

### 6f. Webhook test (optional, recommended for production)

1. Run ngrok: `ngrok http 5000` (or your `PORT`)
2. Set webhook URL in Razorpay dashboard.
3. Enable events: `payment_link.paid`, `payment.failed`, `qr_code.credited`, `payment.captured`, `order.paid`
4. Set `RAZORPAY_WEBHOOK_SECRET` in `.env` → restart backend.
5. Complete a QR or payment link payment.
6. Razorpay dashboard → Webhooks → check **200** delivery.
7. Backend logs should not show “invalid webhook signature”.

---

## Step 7 — Checklists

### Local development

- [ ] `RAZORPAY_ENABLED=true`
- [ ] Real `rzp_test_` Key ID and Key Secret (not placeholders)
- [ ] Backend restarted
- [ ] Pending invoice exists
- [ ] **UPI QR** and **Payment link** visible in Collect payment dropdown
- [ ] QR flow: generate → pay → invoice Paid
- [ ] Payment link: `MSG91_PAYMENT_LINK_TEMPLATE_ID` set → SMS received → pay → invoice Paid
- [ ] Patient has mobile number for payment link tests

### Production

- [ ] Razorpay dashboard → **Live Mode**
- [ ] `rzp_live_` keys in production `.env`
- [ ] HTTPS webhook URL on production API
- [ ] `RAZORPAY_WEBHOOK_SECRET` set from live webhook
- [ ] All 5 webhook events enabled
- [ ] MSG91 payment link DLT template approved for live SMS
- [ ] Never commit `.env` or secrets to git

---

## Step 8 — Troubleshooting

| Problem | Fix |
|---------|-----|
| UPI QR / Payment link not in dropdown | `RAZORPAY_ENABLED=true`, valid Key ID + Secret, restart backend |
| QR generation fails | Check Key ID/Secret; minimum amount ₹1 |
| `E11000 duplicate key` on Razorpay payments | Restart backend (index sync runs on DB connect); see `db.js` |
| Payment link: “Patient mobile required” | Add mobile on patient profile |
| Payment link: “SMS template not configured” | Set `MSG91_PAYMENT_LINK_TEMPLATE_ID` in `.env` |
| SMS not received | Check MSG91 dashboard, DLT template approval, `MSG91_AUTH_KEY` |
| Invoice stays Pending after patient paid | Check polling (staff modal open) or webhook secret + events |
| Payment failed on test | Use `success@razorpay`; click **Retry — send new link** |
| Webhook 400 invalid signature | `RAZORPAY_WEBHOOK_SECRET` must match Razorpay dashboard |
| Invoice already paid | Use partial amount or new invoice |
| Payment verification failed (legacy checkout) | Key secret mismatch between order and verify |

---

## Step 9 — Security notes

- **Key Secret** and **Webhook Secret** stay on server only.
- Frontend never receives Key Secret.
- Webhook uses raw body + HMAC (`x-razorpay-signature`) — no JWT.
- Payment link SMS sent server-side only (MSG91 auth key never in frontend).
- `HmsRazorpayPayment.status === 'paid'` prevents double fulfillment.
- Sparse unique indexes on `razorpayOrderId`, `razorpayQrCodeId`, `razorpayPaymentLinkId`.

---

## Step 10 — Related env sections in `.env.example`

| Section | Purpose |
|---------|---------|
| `MSG91_*` (sections 1–3) | OTP, appointment reminder, follow-up reminder SMS |
| `MSG91_PAYMENT_LINK_*` (section 4) | Payment link collect SMS |
| `RAZORPAY_*` | Online QR + payment link |
| `FOXGLOVE_WA_*` | WhatsApp reminders (separate from billing SMS) |
