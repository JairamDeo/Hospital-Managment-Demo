# ZKTeco MB30-New (LAN) — Setup & AWS Connection

**Your device:** Model `MB30-New` · ASIN B0FDGKV2H4  
**Network:** TCP/IP (LAN cable) + USB · **No WiFi**  
**Auth:** Face + Fingerprint + Card + Password · Battery backup

---

## 1. ADMS support — YES

| From your Amazon listing | Our HMS use |
|--------------------------|-------------|
| TCP/IP real-time data transmission | Device talks to our server over network |
| Free Cloud-Based Attendance Software | Vendor cloud is **optional** — we use **our AWS server** instead |
| USB manual transfer | Backup only |

**ADMS = YES.** All ZKTeco MB30 series with TCP/IP include **Menu → Comm → Cloud Server Setting**. Device **pushes** attendance to your server address (our EC2). You do **not** need ZKTeco cloud for daily logs.

---

## 2. Log capacity (not unlimited)

| Storage | Limit |
|---------|--------|
| **On device** | ~**50,000 – 100,000** attendance punches (MB30 family standard) |
| **Our HMS on AWS MongoDB** | **Unlimited** — all employees, all days |

Sync every few minutes → device is buffer, AWS is permanent record.

| Item | Capacity |
|------|----------|
| Staff on device | ~1,000 users |
| Faces | ~200 – 500 |
| Fingerprints | ~500 – 1,000 |

---

## 3. Two IPs you must understand

| IP | What it is | Where you set it |
|----|------------|------------------|
| **Device IP** | MB30 address on **hospital LAN** (e.g. `192.168.1.50`) | Device → Comm → **Ethernet** |
| **Server Address** | **Our AWS backend** domain or Elastic IP | Device → Comm → **Cloud Server Setting** |

Device IP ≠ Server IP. They are different things.

---

## 4. Where to add OUR server (AWS EC2)

**Path on MB30:** `Menu` → `Comm` → `Cloud Server Setting`

| Field | What to enter | Example |
|-------|---------------|---------|
| **Enable Cloud Server** | ON | ON |
| **Server Mode** | ADMS (if shown) | ADMS |
| **Enable Domain Name** | ON (if using domain) | ON |
| **Server Address** | Your API domain or Elastic IP | `api.yourhospital.com` |
| **Server Port** | Port our backend listens for ADMS | `8088` (we configure on EC2) |
| **HTTPS** | ON when SSL ready | ON |
| **Enable Proxy** | OFF | OFF |

**On AWS EC2 you must:**
1. Elastic IP attached to EC2
2. Security group → allow inbound **TCP 8088** (or port we choose)
3. Nginx/Node ADMS listener running
4. Domain `api.yourhospital.com` → points to Elastic IP (recommended over raw IP)

**Hospital router:** allow device **outbound** internet to that domain/port. No need to open inbound to device from internet.

---

## 5. Where to add DEVICE IP (hospital LAN)

**Path on MB30:** `Menu` → `Comm` → `Ethernet`

| Field | Setting | Example |
|-------|---------|---------|
| **DHCP** | **OFF** (important) | OFF |
| **IP Address** | Fixed LAN IP | `192.168.1.50` |
| **Subnet Mask** | Per your router | `255.255.255.0` |
| **Gateway** | Router IP | `192.168.1.1` |
| **DNS** | Router or `8.8.8.8` | `8.8.8.8` |
| **TCP Port** | Default (device listens) | `4370` |

Device and router must be same subnet (e.g. all `192.168.1.x`).

---

## 6. Will device IP change if WiFi/router power goes off?

**MB30 uses LAN cable, not WiFi** — but **router/switch can still restart** after electricity cut.

| DHCP = ON (auto IP) | **IP CAN change** after router reboot → bad for local tools |
| **DHCP = OFF + static IP on device** | **IP stays same** — **use this** |
| **DHCP reservation on router** (bind device MAC → always same IP) | **IP stays same** — also good |

**Recommendation for MB30:** Set **DHCP = OFF** and static IP `192.168.1.50` (or any free IP). IP will **not** change when power comes back.

**Server Address (AWS)** uses **domain name** (`api.yourhospital.com`) → Elastic IP on AWS does not change → device always finds our server after power cut.

---

## 7. Full connection flow

```
Staff punches on MB30 (LAN 192.168.1.50)
        ↓
Device pushes via ADMS (outbound internet)
        ↓
api.yourhospital.com:8088  (AWS EC2 Elastic IP)
        ↓
MongoDB → daily log per employee
        ↓
Admin: all staff · Employee: own log only
```

---

## 8. Add new staff on MB30

**HMS (admin):**
1. Add staff → note `staffCode` (e.g. STF-008)
2. Set **Device User ID** = `8` (same number on machine)

**Device:**
1. `Menu` → `User Mgt` → `New User`
2. User ID `8`, name, role = User
3. Enroll fingerprint + face (+ card optional)
4. Save

First punch → syncs to HMS within minutes.

---

## 9. Power cut behaviour

| Component | Behaviour |
|-----------|-----------|
| MB30 battery | Device keeps logging **during short outage** (listing: battery backup) |
| Router off | No push until router + internet back — punches stored on device |
| After power back | Device auto-reconnects → pushes stored logs to AWS |

---

## 10. Quick reference

| Question | Answer |
|----------|--------|
| ADMS supported? | **Yes** — **free** (built-in, no subscription) |
| ZKTeco cloud AMC needed? | **No** — we use our AWS server |
| Device REST API? | **No** — ADMS push to our EC2 |
| Where add AWS server? | Comm → **Cloud Server Setting** |
| Where add device IP? | Comm → **Ethernet** |
| IP changes after power cut? | **No** if static IP (DHCP OFF) |
| Logs unlimited on device? | **No** (~50k–100k) |
| Logs unlimited in HMS? | **Yes** |
| WiFi? | **No** — LAN cable only |

---

*Device: ZKTeco MB30-New · Integration with Hospital HMS on AWS EC2*
