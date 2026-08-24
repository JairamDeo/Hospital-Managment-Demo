# UAT Findings Sheet — Hospital Management Soft

Full-application UAT audit. **Wiring/config fixes only** — no business logic, content, or structure changes.

**Date:** 2026-08-23  
**Scope:** Admin/staff modules + patient portal + Vercel deploy/env

---

## Legend

| Status | Meaning |
|--------|---------|
| **Pass** | Works when env/data are correct |
| **Fail** | Confirmed bug (wiring) — fixed or listed below |
| **Limitation** | Product/demo behavior — document only, do not rewrite |

| Severity | Meaning |
|----------|---------|
| Blocker | Blocks core UAT flow |
| High | Wrong data / broken feature path |
| Medium | Misleading UX or env-sensitive |
| Low | Edge case / polish |

---

## Module status

### Deploy / environment

| Item | Status | Severity | Notes |
|------|--------|----------|-------|
| Vercel Services FE+BE + SPA refresh | Pass | — | `vercel.json` routes `/api` → backend, else frontend + `index.html` |
| `VITE_BACKEND_URL` on Vercel | Fail if wrong | Blocker | Must be `/api` at build time — not `localhost` |
| FrontEnd Vite proxy port | Fail → Fixed | High | Was `6060`, BE uses `4000` |
| Cloudinary on Vercel | Fail if missing | High | Lab/Rx/staff uploads fail without `CLOUDINARY_*` |
| MSG91 / WA / Mail placeholders | Fail → mitigated | High | Use `STATIC_OTP` or real keys; disable fake providers |
| SMS reminder job on Vercel | Limitation | Medium | Job only starts via `server.js` listen — not on serverless `app.js` |

### Admin auth

| Item | Status | Severity | Notes |
|------|--------|----------|-------|
| Admin login | Pass | — | Email + password; use **DB** credentials (`admin-staff-logins.txt`) |
| Staff login | Pass | — | Same `/admin-login`; emails may differ from seed names |
| Forgot password | Pass (link fixed) | Medium | Settings had wrong `/forgot-password` href |

### Dashboard / Analytics / Settings

| Item | Status | Severity | Notes |
|------|--------|----------|-------|
| Dashboard stats | Pass / soft-fail | Medium | Failed APIs can show zeros (silent catch) |
| Analytics | Limitation | High | Mock data only — not live KPIs |
| Settings save | Limitation | Blocker for “config UAT” | Fake `setTimeout` save — does not persist |

### Patients / Appointments / Prescriptions

| Item | Status | Severity | Notes |
|------|--------|----------|-------|
| Patients list/detail | Pass | — | Live APIs |
| Appointments list/detail/follow-up | Pass | — | Subject to RBAC |
| Appointment reschedule UI | Limitation | Low | “Coming soon” toast |
| Create structured prescription | Limitation | — | **Doctor** role + prescriptions.edit (product rule) |
| Admin “book appt” from patient header | Limitation | Low | “Coming soon” toast |

### Pharmacy / Billing / IPD / Lab / Panchakarma

| Item | Status | Severity | Notes |
|------|--------|----------|-------|
| Pharmacy | Pass | — | Live APIs |
| Billing offline collect | Pass | — | |
| Billing Razorpay | Pass with env | High | Needs keys; webhook raw-body may need modal polling open |
| IPD detail caseNotes | Fail → Fixed | Low | Null-safe `?? []` |
| Lab admin | Pass | — | Needs Cloudinary for uploads |
| Lab/prescription route RBAC | Fail → Fixed | High | Path→module map omitted `lab` / `prescriptions` |
| Panchakarma | Pass | — | Therapist-focused RBAC |

### Staff / Masters / Search

| Item | Status | Severity | Notes |
|------|--------|----------|-------|
| Staff list/detail | Pass | — | Live APIs |
| Global search staff | Fail → Fixed | High | Was mock IDs → 404 |
| Master data | Pass | — | Empty masters = empty dropdowns |

### Patient portal

| Item | Status | Severity | Notes |
|------|--------|----------|-------|
| Register / OTP / login | Pass with env | High | Needs `STATIC_OTP` or working SMS/WA/email |
| Home / appointments / book | Pass | — | |
| Pay (Razorpay) | Pass with env | Medium | |
| Reports upload | Fail → Fixed | Critical | Missing `req.accountType = 'patient'`; FormData Content-Type |
| Axios public OTP paths | Fail → Fixed | Medium | Wrong URL patterns |
| Profile | Pass | — | |

---

## Wiring fixes applied (this pass)

1. Patient portal middleware sets `req.accountType = 'patient'`
2. Patient lab upload: remove forced multipart Content-Type
3. Axios public auth paths for `/patient-portal/auth/*`
4. Vite proxy target → `http://localhost:4000`
5. `navPermissions`: lab + prescriptions path mapping + Lab landing
6. Global search: live staff list instead of mocks
7. Settings forgot-password link → `/admin/forgot-password`
8. IPD `caseNotes ?? []`
9. Log real OTP delivery error before SMS_SEND_FAILED wrap
10. Regenerate `admin-staff-logins.txt` from DB
11. Vercel/UAT env checklist in this file (below)

---

## Document-only limitations (do not change product)

- Settings page does not persist (mock save)
- Analytics page is mock (“demo” data)
- Prescription create = Doctor only
- Therapist/Lab sparse menus = RBAC defaults
- Appointment detail reschedule/update = coming soon
- Patient admin header “Book appointment” = coming soon
- Vercel: no background SMS reminder cron unless Cron Job added later

---

## Vercel / UAT environment checklist

Set in **Vercel → Project → Environment Variables** (Production + Preview):

| Variable | Required | Example / note |
|----------|----------|----------------|
| `MONGO_URI` | Yes | Atlas URI; allow network access |
| `JWT_SECRET` | Yes | Strong secret |
| `FRONTEND_URL` | Yes | `https://your-app.vercel.app` |
| `VITE_BACKEND_URL` | Yes (build) | `/api` |
| `STATIC_OTP` | UAT recommended | `1122` if SMS not live |
| `MSG91_ENABLED` | UAT | `false` unless real key |
| `FOXGLOVE_WA_ENABLED` | UAT | `false` unless real key |
| `MAIL_ENABLED` | UAT | `false` unless real SMTP |
| `CLOUDINARY_CLOUD_NAME` | Yes for uploads | |
| `CLOUDINARY_API_KEY` | Yes for uploads | |
| `CLOUDINARY_API_SECRET` | Yes for uploads | |
| `RAZORPAY_ENABLED` | If testing pay | `true` + test keys |
| `RAZORPAY_KEY_ID` | If testing pay | `rzp_test_…` |
| `RAZORPAY_KEY_SECRET` | If testing pay | |
| `RAZORPAY_WEBHOOK_SECRET` | If webhook | Point webhook to `https://…/api/admin/billing/razorpay/webhook` |

Framework preset: **Services**. Root = repo root (`vercel.json`).

---

## Smoke test script (one pass)

### Admin (`/admin-login`)
1. Login as Admin → Dashboard loads  
2. Patients → open one detail  
3. Appointments → open one → follow-up page loads  
4. Pharmacy → list loads  
5. Billing → invoice list; offline collect if possible  
6. Lab → page loads (Lab role or admin)  
7. IPD → list + one admission (case notes section no crash)  
8. Staff → list + one detail  
9. Global search → search a staff name → opens real staff detail (not 404)  
10. Settings / Analytics → open only; expect non-persistent / mock (limitation)

### Doctor staff
1. Login Doctor → create prescription path available  
2. Attend appointment / follow-up if assigned  

### Patient portal (`/login`)
1. Send OTP → verify with `STATIC_OTP` or real SMS  
2. Home loads  
3. Appointments → book if doctors exist  
4. Reports → upload file (Cloudinary required)  
5. Profile → save  

### Deploy
1. Open production URL  
2. Refresh on `/admin/patients` — no 404  
3. `GET /api/health` → healthy  

---

## Repro notes for previously observed bugs

### Patient OTP 502 on Vercel
- **Cause:** MSG91/WA/Mail “enabled” with bad keys → all channels fail → `SMS_SEND_FAILED`  
- **Fix:** Disable fake providers + set `STATIC_OTP`, or use real MSG91  

### Admin login 401 locally
- **Cause:** Password in DB was `Admin@1234` while docs said `Admin@123`  
- **Fix:** Use `admin-staff-logins.txt` regenerated from DB  

### Patient lab upload wrong source
- **Cause:** `accountType` never set on portal auth  
- **Fix:** middleware wiring (applied)
