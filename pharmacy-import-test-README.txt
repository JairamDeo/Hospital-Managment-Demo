PHARMACY BULK IMPORT — TEST FILE
================================

File: pharmacy-import-test.csv (48 data rows)

BEFORE YOU IMPORT
-----------------
1. Restart backend so schema/migration and import routes are active.
2. Optional: Export CSV from Pharmacy page first. If your Item Codes differ
   from seed (e.g. item-001/06-26 instead of /05-26), copy codes from export
   into column "Item Code" for rows 1–6 to force updates by code.

REQUIRED COLUMNS (template match)
---------------------------------
Item Code, Item Name, Company, Category, Pack Quantity, Pack Unit, Stock,
Manufacturing Date, Expiry Date, Best Before Months, Monthly Usage %

Shelf life: provide Manufacturing Date plus either Expiry Date OR Best Before
Months (shelf life counted from manufacturing). Test file mixes both styles.

WHAT THIS FILE CONTAINS
-----------------------

ROWS 1–6 — UPDATE existing seeded items (Item Code left blank)
  Match: Item Name + Company (same as database seed).
  Changes: stock, usage %, and shelf-life dates.
  • Brahmi Oil — Dabur India — stock 145
  • Ashwagandha — Himalaya Wellness — stock 188
  • Triphala — Baidyanath — stock 410
  • Chyawanprash — Dabur India — stock 310
  • Shatavari — Patanjali — stock 75
  • Amla Juice — Patanjali — stock 110

ROWS 7–14 — SAME medicine name, DIFFERENT company (NEW items)
  • Two Ashwagandha brands (Zandu, Organic India)
  • Two Brahmi Oil brands (Patanjali, Himalaya)
  • Triphala / Shatavari / Amla under extra companies

ROWS 15–48 — NEW products only (auto item code on import)

HOW TO TEST
-----------
1. Pharmacy → Import → Download template (optional, to compare columns).
2. Choose pharmacy-import-test.csv
3. Expect summary like: ~34 created, ~6 updated, 0 failed
   (exact numbers depend on your current database).

IF UPDATES DON'T APPLY (duplicates instead)
-----------------------------------------
Your DB rows may have empty Company from before the company field was added.
Fix: Export CSV, paste real Item Codes into rows 1–6, import again.

TIPS
----
• Category and Pack Unit must match Master Data exactly (ml, g, L, tablet…).
• Manufacturing date format: YYYY-MM-DD or DD-MMM-YYYY.
• Only .csv files are accepted for import.
