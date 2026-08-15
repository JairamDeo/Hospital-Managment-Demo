# Biometric Attendance — Setup Guide (MB30-New + MB400)

**Hospital HMS · AWS EC2 · Elastic IP**

Based on your Amazon listings:
- **MB30-New** (B0FDGKV2H4) — LAN, TCP/IP, battery backup
- **MB400** (B0GQH6HMQC) — WiFi + TCP/IP, ZLink app

---

## ADMS support — both devices: YES

| Device | ADMS | How |
|--------|------|-----|
| **MB30-New** | **Yes** | TCP/IP + Cloud Server push (standard ZKTeco MB firmware) |
| **MB400** | **Yes** | WiFi/TCP/IP + Cloud Server push |

"Free Cloud" on Amazon = ZKTeco **vendor cloud platform** (optional). **We use our own AWS server** in Cloud Server Setting — see FAQ below.

---

## FAQ (from seller + our HMS plan)

### Is ADMS / Cloud Server setting free?

| What | Free? |
|------|--------|
| **ADMS menu on device** (Comm → Cloud Server Setting) | **Yes — always free.** It is a built-in firmware feature. No subscription to turn it on. |
| **Pointing device to OUR AWS server** | **Yes — free.** We host our own listener on EC2. No ZKTeco cloud fee for this. |
| **ZKTeco vendor cloud attendance platform** (their website/app) | **1st year free** with device purchase. **After year 1 → AMC** (Annual Maintenance Contract) if you want their support & their cloud. **We do NOT need this** for our HMS. |

**Short answer:** ADMS setting on the machine is **free**. ZKTeco’s **paid cloud + AMC** is only if you use **their** platform — we skip that and use **our MERN app on AWS**.

---

### Do we need to pay ZKTeco subscription for our hospital HMS?

**No** — if we connect like this:

```
Device → ADMS push → our EC2 API → MongoDB → HMS dashboards
```

We build the receiver on our server. **No yearly AMC to ZKTeco** required for attendance data in our system.

**Optional paid path (we are NOT using):**

```
Device → ZKTeco cloud/software → their API → our HMS
```

That may need ZKTeco software license + AMC after year 1.

---

### Can the device talk directly via API (REST/JSON)?

**No.** Seller FAQ is correct:

> *"The Device does not support API but using ZKTeco Software you can get punch data using API."*

| Method | API? | For our HMS |
|--------|------|-------------|
| Device → direct REST API | **No** | Not available |
| Device → **ADMS push** to our server | Not REST — ZK HTTP/text protocol | **Yes — our plan** |
| Device → LAN pull (port 4370) | Not REST — ZK binary protocol | **Yes — backup plan** |
| Device → ZKTeco software → their API | **Yes** (vendor software) | Optional; may cost AMC |

**Our plan:** Device pushes via **ADMS** to our Node.js service on EC2. We parse punches and save to MongoDB. **No ZKTeco middle software needed.**

---

### What is “free cloud” on Amazon listing?

| Term | Meaning |
|------|---------|
| Free cloud (year 1) | ZKTeco’s **own** online attendance portal + support |
| After year 1 | AMC if you keep using **their** cloud & support |
| Our choice | Use **Cloud Server Setting** → send data to **`api.yourhospital.com`** instead → **our HMS, our data, no ZKTeco AMC** |

---

### Summary table

| Question | Answer |
|----------|--------|
| ADMS setting free on device? | **Yes** |
| Must pay ZKTeco after year 1 for our HMS? | **No** (if we use our AWS ADMS receiver) |
| ZKTeco cloud free year 1? | **Yes** — but **optional**, we don’t depend on it |
| Device has REST API? | **No** |
| How we get punches? | **ADMS push to our EC2** (or LAN sync agent) |
| Daily logs in HMS? | **Unlimited on AWS MongoDB** |

---

## Log capacity

| | Device memory | Our HMS (AWS) |
|---|---------------|---------------|
| Unlimited? | **No** | **Yes** |
| MB30-New | ~50,000 – 100,000 punches | All staff, all days forever |
| MB400 | ~100,000 punches | All staff, all days forever |

---

## Where to add what (simple)

### A) Our AWS server — BOTH devices (same settings)

```
Menu → Comm → Cloud Server Setting
```

| Field | Value |
|-------|-------|
| Enable Cloud Server | **ON** |
| Server Address | `api.yourhospital.com` (your domain → Elastic IP) |
| Server Port | `8088` (we open this on EC2) |
| Enable Domain Name | **ON** |
| HTTPS | **ON** (when SSL ready) |

**You do NOT put device IP here.** This is **only** our backend.

---

### B) Device IP — different menu per device

| Device | Menu path |
|--------|-----------|
| **MB30-New** | `Menu → Comm → Ethernet` |
| **MB400** | `Menu → Comm → WiFi / Wireless Network` |

| Field | MB30 example | MB400 example |
|-------|----------------|---------------|
| DHCP | **OFF** | **OFF** |
| IP Address | `192.168.1.50` | `192.168.10.45` |
| Gateway | `192.168.1.1` | `192.168.10.1` |
| Subnet | `255.255.255.0` | `255.255.255.0` |
| DNS | `8.8.8.8` | `8.8.8.8` |

**Also on WiFi router:** DHCP reservation for device MAC → same IP every time.

---

## Power cut / router off — will IP change?

| IP type | Changes after electricity? |
|---------|----------------------------|
| **Device IP** (DHCP auto) | **YES — can change** |
| **Device IP** (static / DHCP OFF) | **NO — stays same** |
| **AWS Server** (domain + Elastic IP) | **NO — never changes** |

**Rule:** Always set **static device IP**. Use domain for server, not LAN IP.

After power returns:
- Device stores punches offline (MB30 has battery)
- WiFi/LAN reconnects → ADMS pushes all pending logs to AWS

---

## AWS EC2 checklist (our side)

| Step | Action |
|------|--------|
| 1 | Elastic IP attached |
| 2 | Domain `api.yourhospital.com` → Elastic IP |
| 3 | Security group: allow TCP **8088** (ADMS) + **443** (HTTPS API) |
| 4 | Run ADMS listener + sync to MongoDB `StaffActivity` |
| 5 | Map device User ID → HMS `staffCode` |

---

## Add staff (both devices)

1. **HMS** → create staff → Device User ID = e.g. `12`
2. **Device or ZLink (MB400)** → New User ID `12` → enroll face + finger
3. Punch → appears in HMS daily log

---

## Daily logs

| Who | Sees |
|-----|------|
| Employee | Own check-in / check-out per day |
| Admin | All employees — full hospital register |

---

## Device docs

- [MB30-New LAN detail](BIOMETRIC_ZKTECO_MB30_LAN_INTEGRATION.md)
- [MB400 WiFi detail](BIOMETRIC_ZKTECO_MB400_WIFI_INTEGRATION.md)

---

*Planning doc — backend ADMS listener to be built on EC2*
