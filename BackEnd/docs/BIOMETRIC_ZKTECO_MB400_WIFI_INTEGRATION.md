# ZKTeco MB400 (WiFi) — Setup & AWS Connection

**Your device:** Model `MB400` · ASIN B0GQH6HMQC  
**Network:** **WiFi + TCP/IP** · ZLink Mobile App  
**Auth:** Visible light Face + Fingerprint + Card (125kHz / 13.56MHz) + Password

---

## 1. ADMS support — YES

| From your Amazon listing | Our HMS use |
|--------------------------|-------------|
| TCP/IP and **Wi-Fi** interfaces | Push attendance to AWS over internet |
| ZLink Mobile APP | Phone setup & enroll only — **not** our database |
| Free Cloud | Vendor cloud **optional** — we use **our AWS server** |
| Online firmware upgrade | Keep device updated |

**ADMS = YES.** ZKTeco WiFi terminals (MB400 class) include **Menu → Comm → Cloud Server Setting**. Device pushes punches to our EC2. ZLink does **not** replace this — it only helps configure WiFi and enroll users from phone.

---

## 2. Log capacity (not unlimited)

| Storage | Limit |
|---------|--------|
| **On device** | ~**100,000** attendance punches (MB WiFi series standard) |
| **Our HMS on AWS MongoDB** | **Unlimited** — all employees, all days |

| Item | Capacity |
|------|----------|
| Staff on device | ~1,000 – 3,000 users |
| Faces | ~500 – 3,000 |
| Fingerprints | ~1,000 – 3,000 |

---

## 3. Two IPs you must understand

| IP | What it is | Where you set it |
|----|------------|------------------|
| **Device IP** | MB400 on **hospital WiFi** (e.g. `192.168.10.45`) | Device → Comm → **WiFi / Wireless Network** |
| **Server Address** | **Our AWS backend** | Device → Comm → **Cloud Server Setting** |

---

## 4. Where to add OUR server (AWS EC2)

**Path on MB400:** `Menu` → `Comm` → `Cloud Server Setting`

| Field | What to enter | Example |
|-------|---------------|---------|
| **Enable Cloud Server** | ON | ON |
| **Server Mode** | ADMS | ADMS |
| **Enable Domain Name** | ON | ON |
| **Server Address** | API domain (best) or Elastic IP | `api.yourhospital.com` |
| **Server Port** | Our ADMS port on EC2 | `8088` |
| **HTTPS** | ON (when SSL ready) | ON |

**AWS EC2 setup:**
1. Elastic IP on EC2
2. Security group → inbound TCP **8088**
3. Domain `api.yourhospital.com` → Elastic IP
4. ADMS listener service running (we build on Node)

Device sends data **out** to AWS — hospital does **not** need port-forward to the device.

---

## 5. Where to add DEVICE IP (hospital WiFi)

**Path on MB400:** `Menu` → `Comm` → `Wireless Network` (or `WiFi`)

**Step 1 — Connect WiFi:**
1. Search hospital SSID
2. Enter WiFi password
3. Connect

**Step 2 — Fix IP (important after power cuts):**

Go to WiFi/Ethernet IP settings:

| Field | Setting | Example |
|-------|---------|---------|
| **DHCP** | **OFF** for static OR use router reservation | OFF |
| **IP Address** | Fixed IP on WiFi LAN | `192.168.10.45` |
| **Subnet Mask** | Per router | `255.255.255.0` |
| **Gateway** | Router IP | `192.168.10.1` |
| **DNS** | `8.8.8.8` or router DNS | `8.8.8.8` |

**Also on hospital WiFi router (recommended):**
- **DHCP Reservation** → bind MB400 MAC address → always assign `192.168.10.45`

---

## 6. Will device IP change if router power goes off?

**Yes, it CAN change** if you use WiFi with **DHCP ON** (automatic IP).

| Setup | After electricity cut + router restart |
|-------|----------------------------------------|
| DHCP ON, no reservation | **IP may change** (e.g. `.45` → `.112`) |
| **DHCP OFF + static IP on device** | **Same IP always** ✓ |
| **Router DHCP reservation (MAC bind)** | **Same IP always** ✓ |

**Best for MB400 (WiFi):** Do **both**:
1. Static IP on device (DHCP OFF), AND
2. DHCP reservation on router for device MAC

**Our AWS Server Address** uses **domain name** → does not change when router restarts.

**ADMS push still works after power cut** because:
- Punches saved on device memory during offline
- When WiFi + internet return, device pushes to `api.yourhospital.com`
- Device LAN IP changing does **not** break ADMS push (device calls out to AWS)

Static IP is still needed for **ZLink app** on phone (same WiFi) and **local admin**.

---

## 7. ZLink app — what it does

| Use ZLink for | Do NOT use ZLink for |
|---------------|----------------------|
| Connect device to WiFi | Storing official attendance |
| Add users / enroll face from phone | Payroll / HMS daily register |
| Check device online | Replacing ADMS push to AWS |

**HMS daily logs = MongoDB on AWS only.**

---

## 8. Full connection flow

```
Staff punches on MB400 (WiFi)
        ↓
ADMS push (outbound)
        ↓
api.yourhospital.com:8088 → AWS EC2 Elastic IP
        ↓
MongoDB → employee + admin daily logs
```

---

## 9. Add new staff on MB400

**HMS:**
1. Add staff → `staffCode` e.g. STF-015
2. **Device User ID** = `15`

**Option A — ZLink app (easiest on WiFi):**
1. Phone on same WiFi → open ZLink → connect to MB400
2. Add user ID `15`, name
3. Enroll face + fingerprint

**Option B — On device:**
1. `Menu` → `User Mgt` → `New User` → ID `15`
2. Enroll face + finger

---

## 10. MB30 vs MB400 — network difference

| | MB30-New | MB400 |
|---|----------|--------|
| Connection to router | **LAN cable** | **WiFi** (+ optional LAN) |
| Device IP menu | Comm → **Ethernet** | Comm → **WiFi** |
| IP change risk | Low if static | **Higher** if DHCP — fix with static IP |
| ADMS to AWS | **Yes** | **Yes** |
| Mobile enroll | On device only | **ZLink app** |

---

## 11. Quick reference

| Question | Answer |
|----------|--------|
| ADMS to our AWS? | **Yes** — **free** (no ZKTeco cloud subscription) |
| ZKTeco vendor cloud AMC? | **Not needed** for our HMS |
| Device REST API? | **No** — ADMS push to our server instead |
| Where add AWS server? | Comm → **Cloud Server Setting** |
| Where add device IP? | Comm → **WiFi / Wireless Network** |
| IP changes after power cut? | **Only if DHCP auto** — use **static IP** |
| Logs unlimited on device? | **No** (~100k) |
| Logs unlimited in HMS? | **Yes** |
| ZLink replaces AWS? | **No** — setup only |

---

*Device: ZKTeco MB400 · Integration with Hospital HMS on AWS EC2*
