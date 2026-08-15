PHARMACY BULK IMPORT — TEST FILE
================================

File: pharmacy-import-test.csv (55 data rows)

BEFORE YOU IMPORT
-----------------
1. Backend running (nodemon).
2. Master Data must have categories used in the file (Medicated Oil, Adaptogen,
   Herbal Formula, Rasayana, Health Tonic, Herbal Extract, etc.) and units
   (ml, g, L, tablet, capsule).

REQUIRED COLUMNS
----------------
Item Code, Item Name, Company, Category, Item Type, Units Per Pack, Pack Unit,
Stock, Manufacturing Date, Expiry Date (or Best Before Months), Monthly Usage %,
Sale Price

Item types: Single item | Strip | Powder / Churan
(Old CSVs with only Pack Quantity still work — type is inferred from unit.)

Sale Price: required for billing. If the column is missing, items import with
₹0 price and you can edit them in the app afterward.

HOW TO TEST
-----------
1. Pharmacy → Import → Choose pharmacy-import-test.csv
2. Expect: ~55 created, 0 failed (empty database)
3. If some rows fail on Category/Unit, add those names in Master Data first.

TIPS
----
• Manufacturing date: YYYY-MM-DD
• Stock = pieces / strips / boxes (not total tablets/grams)
• Same medicine + different company = separate items
