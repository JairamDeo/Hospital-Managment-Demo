# Razorpay — Billing online payments

> **Test mode only:** You do **not** need live/production keys. Use **Test Mode** in the Razorpay dashboard and `rzp_test_...` keys in `.env`. Real money is never charged in test mode.

Staff can collect invoice payments online (UPI, card, net banking) from **Billing → Invoice → Collect payment → Online (Razorpay)**.

Offline collection (**Cash / UPI / Card** entered manually) is unchanged.

| Flow | When | Result |
|------|------|--------|
| **Offline** | Staff selects Cash/UPI/Card and confirms | `PATCH /billing/:invoiceCode/collect` |
| **Online** | Staff selects Online (Razorpay) | Razorpay checkout → verify → invoice Paid/Partial |
| **Webhook** | Razorpay server callback (backup) | Same invoice update if browser verify missed |

Code paths:

- `src/services/payment/razorpay.service.js` — SDK, signature verification
- `src/admin/services/hmsBillingRazorpay.service.js` — order create, verify, webhook fulfill
- `src/models/hmsRazorpayPayment.model.js` — order tracking (idempotency)
- `FrontEnd/src/components/billing/CollectPaymentModal.tsx` — staff UI
- `FrontEnd/src/utils/razorpayCheckout.ts` — Razorpay checkout script

---

## Quick start — test keys only (5 minutes)

No production account or live keys required.

### Step 1 — Get test keys

1. Open [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Turn **Test Mode ON** (toggle at top — must show “Test Mode”)
3. **Account & Settings → API Keys → Generate Key**
4. Copy **Key ID** (`rzp_test_...`) and **Key Secret**

### Step 2 — Paste in `BackEnd/.env`

```env
RAZORPAY_ENABLED=true
RAZORPAY_KEY_ID=rzp_test_PASTE_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=PASTE_YOUR_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET=
```

- `RAZORPAY_WEBHOOK_SECRET` can stay **empty** for now — webhook is optional for local UI testing.
- Restart backend: `cd BackEnd && npm run dev`

### Step 3 — Pay a pending invoice

1. Login as admin/receptionist → **Billing**
2. Open a **Pending** invoice → **Collect payment**
3. Choose **Online (Razorpay)** → **Pay online**
4. Use Razorpay test payment:

| Method | Test value |
|--------|------------|
| Card | `4111 1111 1111 1111` · any future expiry · any CVV |
| UPI | `success@razorpay` |

5. Invoice should become **Paid**

### Step 4 — Confirm it worked

- Billing list shows invoice **Paid**
- Payment method shows Card / UPI / Net Banking (from Razorpay)
- No real money deducted (test mode)

---

## 1. Razorpay dashboard setup (test mode)

1. Sign up / log in: [https://dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Switch to **Test Mode** (toggle top-left).
3. Go to **Account & Settings → API Keys → Generate Key**.
4. Copy:
   - **Key ID** → `rzp_test_...`
   - **Key Secret** → keep private (backend only)
5. Go to **Account & Settings → Webhooks → + Add New Webhook**
   - **Webhook URL** (local dev with ngrok):
     ```
     https://YOUR-NGROK-ID.ngrok-free.app/api/admin/billing/razorpay/webhook
     ```
   - **Production URL**:
     ```
     https://your-api-domain.com/api/admin/billing/razorpay/webhook
     ```
   - **Active events:** `payment.captured`, `order.paid`, `qr_code.credited`
   - Save and copy **Webhook Secret**

> Webhook is optional for basic UI testing (frontend verify works after checkout). Use webhook for production reliability.

---

## 2. `.env` configuration

Add to `BackEnd/.env`:

```env
# ═══════════════════════════════════════════════════════════════
# RAZORPAY — Online payments (billing)
# ═══════════════════════════════════════════════════════════════
RAZORPAY_ENABLED=true
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_test_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

| Variable | Required | Description |
|----------|----------|-------------|
| `RAZORPAY_ENABLED` | Yes | `true` to show Online option in billing UI |
| `RAZORPAY_KEY_ID` | Yes | Public key (`rzp_test_...` or `rzp_live_...`) |
| `RAZORPAY_KEY_SECRET` | Yes | Secret key — **never** put in frontend |
| `RAZORPAY_WEBHOOK_SECRET` | Recommended | From Razorpay webhook settings |

Restart backend after changing `.env`:

```bash
cd BackEnd
npm run dev
```

---

## 3. How payment works (step by step)

### Staff UI flow (correct — staff collects, patient pays)

1. Login as **Admin** or **Receptionist** (billing permission).
2. Open **Billing & Invoices** → pending invoice → **Collect payment**.
3. Modal shows **patient name**, **fee type** (Consultation / Medicine / Panchakarma), **doctor**, and **exact amount**.
4. Choose payment method:

**Cash / UPI / Card (offline)**  
Staff received payment at counter → **Confirm collection** → success popup with full details → invoice marked Paid/Partial.

**UPI QR (patient scans)**  
Staff clicks **Generate QR** → QR shows **exact amount** → patient scans with phone → staff screen waits → auto-confirms → success popup.

5. Success popup shows: patient, invoice #, fee type, treatment, doctor, amount, payment method, **collected by** (staff name).
6. Invoice and patient billing tab update in database.

### Backend flow

```
Staff clicks Pay online
    ↓
POST /api/admin/billing/:invoiceCode/razorpay/order
    → Creates Razorpay order (amount in paise)
    → Saves HmsRazorpayPayment (status: created)
    ↓
Razorpay checkout (browser)
    ↓
POST /api/admin/billing/razorpay/verify
    → Verifies HMAC signature
    → collectInvoicePayment() (existing billing logic)
    → Marks HmsRazorpayPayment paid
    ↓
Invoice synced to patient care profile
```

### Webhook flow (backup)

```
Razorpay POST /api/admin/billing/razorpay/webhook
    → Verifies x-razorpay-signature
    → On payment.captured / order.paid / qr_code.credited
    → Same fulfill logic (skips if already paid)
```

---

## 4. API reference

All billing routes require staff/admin JWT (`Authorization: Bearer ...`), except webhook.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/api/admin/billing/razorpay/config` | Yes | `{ enabled, keyId }` |
| `POST` | `/api/admin/billing/:invoiceCode/razorpay/qr` | Yes | Generate UPI QR for patient |
| `GET` | `/api/admin/billing/razorpay/status/:qrCodeId` | Yes | Poll QR payment status |
| `POST` | `/api/admin/billing/razorpay/verify` | Yes | Verify after checkout |
| `POST` | `/api/admin/billing/razorpay/webhook` | No | Razorpay callback |
| `PATCH` | `/api/admin/billing/:invoiceCode/collect` | Yes | Offline collect (unchanged) |

**Create order body (optional partial):**

```json
{ "amount": 600 }
```

**Verify body:**

```json
{
  "invoiceCode": "INV-0012",
  "razorpayOrderId": "order_xxx",
  "razorpayPaymentId": "pay_xxx",
  "razorpaySignature": "signature_xxx"
}
```

---

## 5. Testing (test mode)

### Step 1 — Run automated unit tests

```bash
cd BackEnd
npm test -- src/tests/razorpay.test.js
```

Expected: all signature / mapping tests pass.

### Step 2 — Check config endpoint

After login, call:

```http
GET /api/admin/billing/razorpay/config
Authorization: Bearer <token>
```

Expected:

```json
{
  "status_code": 200,
  "res": {
    "razorpay": {
      "enabled": true,
      "keyId": "rzp_test_..."
    }
  }
}
```

If `enabled: false` → check `.env` and restart server.

### Step 3 — End-to-end UI test

1. Ensure at least one invoice is **Pending** (complete a consultation visit without collecting payment).
2. Billing → open invoice → **Collect payment**.
3. Select **Online (Razorpay)** → **Pay online**.

### Step 4 — Razorpay test credentials

**Test card (success):**

| Field | Value |
|-------|-------|
| Card number | `4111 1111 1111 1111` |
| Expiry | Any future date |
| CVV | Any 3 digits |
| Name | Any |

**Test UPI (success):**

- UPI ID: `success@razorpay`

**Test failure:**

- UPI ID: `failure@razorpay`

More: [Razorpay Test Cards](https://razorpay.com/docs/payments/payments/test-card-upi-details/)

### Step 5 — Verify invoice updated

- Invoice status = **Paid**
- `paymentMethod` = Card / UPI / Net Banking
- Billing stats → payment method chart updates
- Patient profile → Billing tab shows paid invoice

### Step 6 — Webhook test (optional)

1. Install ngrok: `ngrok http 6060`
2. Set webhook URL in Razorpay dashboard to ngrok URL + `/api/admin/billing/razorpay/webhook`
3. Complete a payment
4. Razorpay dashboard → Webhooks → check **200** delivery
5. Backend logs should not show “invalid webhook signature”

---

## 6. Local development checklist

- [ ] `RAZORPAY_ENABLED=true`
- [ ] Real `rzp_test_` Key ID and Key Secret in `.env` (not placeholders)
- [ ] Backend restarted
- [ ] Frontend `VITE_BACKEND_URL` points to backend `/api`
- [ ] Pending invoice exists
- [ ] “Online (Razorpay)” visible in Collect payment modal
- [ ] Test payment completes and invoice becomes Paid

---

## 7. Production checklist

- [ ] Switch Razorpay dashboard to **Live Mode**
- [ ] Use `rzp_live_` keys in production `.env`
- [ ] HTTPS webhook URL on production API
- [ ] `RAZORPAY_WEBHOOK_SECRET` set from live webhook
- [ ] Never commit `.env` or key secret to git

---

## 8. Troubleshooting

| Problem | Fix |
|---------|-----|
| “Online (Razorpay)” not shown | Set `RAZORPAY_ENABLED=true`, valid Key ID + Secret, restart backend |
| Order creation fails | Check Key ID/Secret are real test keys (not placeholders) |
| Payment verification failed | Key secret mismatch; ensure same keys used for order + verify |
| Webhook 400 invalid signature | `RAZORPAY_WEBHOOK_SECRET` must match Razorpay dashboard webhook secret |
| Invoice already paid | Create new pending invoice or use partial on partial invoice |
| Razorpay popup blocked | Allow popups for localhost |
| CORS / network error | Check `VITE_BACKEND_URL` and backend `FRONTEND_URL` |

---

## 9. Security notes

- **Key Secret** and **Webhook Secret** stay on server only.
- Frontend receives only `keyId` and `orderId` from backend.
- Webhook route uses raw body + HMAC verification (no JWT).
- Duplicate payments prevented via `HmsRazorpayPayment.status === 'paid'` check.

---

## 10. Related files

| Area | Path |
|------|------|
| Razorpay service | `BackEnd/src/services/payment/razorpay.service.js` |
| Billing Razorpay logic | `BackEnd/src/admin/services/hmsBillingRazorpay.service.js` |
| Payment order model | `BackEnd/src/models/hmsRazorpayPayment.model.js` |
| Billing routes | `BackEnd/src/admin/routes/hmsBilling.routes.js` |
| Webhook mount | `BackEnd/src/app.js` |
| Collect payment UI | `FrontEnd/src/components/billing/CollectPaymentModal.tsx` |
| Checkout helper | `FrontEnd/src/utils/razorpayCheckout.ts` |
| Unit tests | `BackEnd/src/tests/razorpay.test.js` |
| Env template | `BackEnd/.env.example` |
