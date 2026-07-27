# Gemini AI — Consultation summary (medical assist)

Phase 1: generate a **doctor-facing clinical summary + test/medicine suggestions** from a doctor–patient discussion, using the patient’s existing HMS profile (vitals, labs, prescriptions, clinical history).

| Item | Value |
|------|--------|
| Provider | Google **Gemini** |
| Default model | `gemini-3.5-flash` |
| Cost to start | **Free tier** (API key, no card required for free quota) |
| STT / microphone | **Not in this phase** — use sample or pasted discussion text |

> **Disclaimer:** Output is **decision support only**. It is not a prescription. The doctor must review before ordering labs or medicines.

## Languages (English / हिंदी)

- Choose **English**, **हिंदी**, or **Both** when generating.
- Gemini drafts the medical summary in English (discussion may be EN/HI/mixed).
- Hindi text is produced with **`@vitalets/google-translate-api`** (Node library, no extra API key).
- UI toggle switches the displayed summary between English and हिंदी.
- Previous summaries list shows each saved run; open any to re-view.

---

## What 1 token means (characters / words)

LLMs bill in **tokens**, not exact characters.

| Rough conversion | Estimate |
|------------------|----------|
| **1 token** | ~**4 characters** of English text |
| **1 token** | ~**0.75 words** |
| **100 tokens** | ~**75 words** / ~**400 characters** |
| **1,000 tokens** | ~**750 words** / ~**4,000 characters** |
| **1 page of text** | ~**500–700 tokens** |

**Example for this feature**

| Part | Approx size |
|------|-------------|
| Patient EHR context (compact) | 1,000–4,000 tokens |
| Discussion transcript (5–10 min talk) | 800–2,500 tokens |
| AI JSON reply | 400–1,200 tokens |
| **Typical total per summary** | **~2,500–7,000 tokens** |

So one consultation summary is usually **well under** free-tier per-minute token caps.

---

## Free tier limits (Gemini 3.5 Flash — approx. 2026)

> **Note:** New API keys cannot use `gemini-2.5-flash` (“no longer available to new users”). Use **`gemini-3.5-flash`** (default) or **`gemini-3.1-flash-lite`**.

Limits vary by Google account / project. Check live values in [Google AI Studio](https://aistudio.google.com/) → rate limits.

| Limit | Typical free (Flash) | Meaning |
|-------|----------------------|---------|
| **RPM** | ~10–15 requests / minute | How many summaries you can start per minute |
| **TPM** | ~250,000 tokens / minute | Combined input+output budget per minute |
| **RPD** | ~250–1,500 requests / day | Daily cap (model-dependent) |
| **Context window** | ~1,000,000 tokens | Max discussion + EHR you can send in one call |
| **Price** | **$0** within free quota | No charge while under free limits |

**How long is free enough?**

- ~**50–200 summaries/day** is realistic on free Flash (depends on RPD and TPM).
- Fine for **pilot / single clinic testing**.
- For busy multi-doctor production, enable billing (pay-as-you-go).

**Privacy note:** On free tier, Google may use prompts to improve products. For production PHI, enable billing / review Google’s data-use terms.

---

## Paid pricing (after free / when billing enabled)

Pay only for tokens used (USD, approximate):

| Model | Input / 1M tokens | Output / 1M tokens |
|-------|-------------------|--------------------|
| Gemini 3.5 Flash (default) | see [ai.google.dev/pricing](https://ai.google.dev/pricing) | see pricing page |
| Gemini 3.1 Flash-Lite | lower cost / free-tier friendly | see pricing page |

**Cost example (Flash)**  
One summary ≈ 5,000 tokens total (say 4k in + 1k out):

- Input: `4,000 / 1,000,000 × $0.15` ≈ **$0.0006**
- Output: `1,000 / 1,000,000 × $0.60` ≈ **$0.0006**
- **≈ $0.001 per summary** (about **$1 for ~1,000 summaries**)

Official pricing: https://ai.google.dev/pricing  
Rate limits: https://ai.google.dev/gemini-api/docs/rate-limits

---

## How to get an API key (for `.env`)

1. Open **[Google AI Studio](https://aistudio.google.com/apikey)** (sign in with Google).
2. Click **Create API key** → choose or create a Google Cloud project.
3. Copy the key (starts like `AIza...`).
4. In `BackEnd/.env` add:

```env
# Docs: BackEnd/docs/GEMINI_AI_CONSULTATION.md
GEMINI_ENABLED=true
GEMINI_API_KEY=AIzaSy_your_real_key_here
GEMINI_MODEL=gemini-3.5-flash
```

5. Restart the backend (`npm run dev`).
6. Open a patient profile → **AI summary** → pick a sample discussion → **Generate**.

If you see *“gemini-2.5-flash is no longer available to new users”*, set `GEMINI_MODEL=gemini-3.5-flash` and restart.

**Never commit the real key to git.** Keep it only in `.env`.

---

## API endpoints (admin / staff)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/admin/patients/ai-consultation/samples` | Sample discussions for testing |
| `GET` | `/api/admin/patients/:patientCode/ai-consultation/summaries` | Past summaries |
| `POST` | `/api/admin/patients/:patientCode/ai-consultation` | Generate summary |

**POST body (optional):**

```json
{
  "sampleId": "diabetes-followup",
  "discussionText": "optional pasted transcript",
  "appointmentCode": "optional"
}
```

If `discussionText` is empty, a sample script is used (`sampleId` or default diabetes follow-up).

---

## Files

```
BackEnd/src/config/gemini.config.js
BackEnd/src/admin/services/consultationAi.service.js
BackEnd/src/admin/controllers/consultationAi.controller.js
BackEnd/src/models/consultationAiSummary.model.js
BackEnd/src/utils/sampleConsultations.js
BackEnd/docs/GEMINI_AI_CONSULTATION.md   ← this file
```

---

## How to test (no microphone)

1. Set `GEMINI_API_KEY` as above and restart API.
2. Log in as **Doctor** or **Admin**.
3. Open any patient who has some history (Rx / labs help quality).
4. Click **AI summary** on the profile card.
5. Choose a sample (Diabetes / Joint pain / Acidity) or paste your own dialogue.
6. Click **Generate summary** — review clinical summary, suggested tests & medicines.
7. Confirm token usage shown on the result (from Gemini `usageMetadata`).

---

## Later (device / speech-to-text)

When the table microphone is available:

1. Record audio in the doctor room.
2. Transcribe with a free STT (e.g. Groq Whisper / Vosk).
3. Send transcript as `discussionText` to the same `POST .../ai-consultation` endpoint.

No change to the medical summary pipeline.
