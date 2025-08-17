Alright — here’s the full combined requirements doc with everything we discussed plus a visual architecture diagram so you can see how the components connect.

⸻

🍲 Food Inventory & Meal Tracker — Full Build Doc with Diagram

⸻

1. Product Requirements Document (PRD)

Purpose

A mobile-friendly PWA that allows a single user to:
	•	Track inventory of food items
	•	Autofill nutrition facts + images from Open Food Facts API
	•	Batch import from receipt via OCR
	•	Manage recipes linked to inventory
	•	Suggest meals based on in-stock items and past favorites
	•	Provide cost & macro analytics
	•	(Stretch) Generate recipes using Hugging Face models

⸻

Core Features
	1.	Inventory
	•	Add/edit/delete items
	•	Toggle in_stock
	•	Merge by normalized name (update brand + price only)
	•	Autofill nutrition facts & image from Open Food Facts
	2.	Batch Import via Receipt
	•	Upload receipt image
	•	OCR → parse → dedupe → upsert
	•	Fetch missing nutrition/image
	3.	Recipes & Meal Logs
	•	CRUD recipes linked to inventory
	•	Meal logs track cooked recipes, macros, cost, rating
	4.	Shopping List
	•	Out-of-stock items → flagged
	•	Purchased → toggle in-stock
	5.	Analytics
	•	Avg cost/meal
	•	Macro averages
	•	Top items
	6.	PWA
	•	Installable on iOS/Android
	•	Offline shell for inventory

⸻

Stretch Goals
	•	Hugging Face recipe generation
	•	IoT fridge integration
	•	Voice interface

⸻

2. Architecture Diagram

flowchart TD
    subgraph Client["PWA - Next.js + Tailwind + ShadCN"]
        UI[Mobile-optimized UI] --> State[React State/Context]
        State --> SupabaseAPI[Supabase JS Client]
    end

    subgraph Backend["Supabase (PostgreSQL)"]
        DB[(PostgreSQL DB)]
        RPC[Upsert Function]
        Storage[Supabase Storage - optional for images]
        DB <--> RPC
    end

    subgraph ExternalAPIs["External APIs & Models"]
        OFF[Open Food Facts API]
        OCR[Tesseract.js OCR]
        HF[Hugging Face Model API]
    end

    UI -->|Upload receipt| OCR
    OCR -->|Parsed items| SupabaseAPI
    UI -->|Add/Edit item| SupabaseAPI
    SupabaseAPI --> DB
    DB -->|Need nutrition| OFF
    UI -->|Generate recipes| HF
    HF --> UI


⸻

3. Postgres DDL with Extensions

CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE TABLE items (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT,
    category TEXT,
    in_stock BOOLEAN DEFAULT TRUE,
    price NUMERIC(10,2),
    carbs_per_serving NUMERIC(10,2),
    fat_per_serving NUMERIC(10,2),
    protein_per_serving NUMERIC(10,2),
    servings_per_container NUMERIC(10,2),
    unit_of_measure TEXT,
    unit_quantity NUMERIC(10,2),
    image_url TEXT,
    nutrition_source TEXT,
    barcode TEXT,
    last_edited TIMESTAMP DEFAULT NOW(),
    normalized_name TEXT GENERATED ALWAYS AS (
        regexp_replace(lower(unaccent(coalesce(name,''))), '[^a-z0-9]+', '', 'g')
    ) STORED
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_items_normalized_name ON items(normalized_name);
CREATE UNIQUE INDEX IF NOT EXISTS ux_items_barcode ON items(barcode);

CREATE TABLE recipes (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    cuisine_type TEXT,
    meal_type TEXT[],
    difficulty TEXT,
    prep_time INT,
    cook_time INT,
    total_time INT,
    servings INT,
    instructions TEXT,
    nutrition_per_serving JSONB,
    tags TEXT[],
    rating NUMERIC(2,1),
    source_link TEXT,
    cost_per_serving NUMERIC(10,2),
    notes TEXT,
    times_cooked INT DEFAULT 0,
    average_rating NUMERIC(2,1),
    last_cooked TIMESTAMP
);

CREATE TABLE recipe_items (
    recipe_id BIGINT REFERENCES recipes(id) ON DELETE CASCADE,
    item_id BIGINT REFERENCES items(id) ON DELETE CASCADE,
    quantity NUMERIC(10,2),
    unit TEXT,
    PRIMARY KEY (recipe_id, item_id)
);

CREATE TABLE meal_logs (
    id BIGSERIAL PRIMARY KEY,
    recipe_id BIGINT REFERENCES recipes(id) ON DELETE SET NULL,
    cooked_at DATE,
    notes TEXT,
    rating NUMERIC(2,1),
    macros JSONB,
    cost NUMERIC(10,2)
);

CREATE TABLE shopping_list (
    item_id BIGINT PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION upsert_item_by_name(
    p_name TEXT,
    p_brand TEXT,
    p_price NUMERIC,
    p_category TEXT DEFAULT NULL,
    p_in_stock BOOLEAN DEFAULT TRUE
) RETURNS items AS $$
INSERT INTO items (name, brand, price, category, in_stock, last_edited)
VALUES (p_name, p_brand, p_price, p_category, COALESCE(p_in_stock, TRUE), NOW())
ON CONFLICT (normalized_name) DO UPDATE
    SET brand       = EXCLUDED.brand,
        price       = EXCLUDED.price,
        last_edited = NOW()
RETURNING *;
$$ LANGUAGE sql SECURITY DEFINER;


⸻

4. Build Artifacts

A. Open Food Facts Mapper

// src/lib/off/mapper.ts
export function mapOFFToItem(data) {
  return {
    name: data.product_name,
    brand: data.brands?.split(',')[0]?.trim(),
    category: data.categories_tags?.[0]?.replace('en:', '') || undefined,
    image_url: data.image_url,
    carbs_per_serving: data.nutriments?.carbohydrates_100g || undefined,
    fat_per_serving: data.nutriments?.fat_100g || undefined,
    protein_per_serving: data.nutriments?.proteins_100g || undefined,
    nutrition_source: 'openfoodfacts',
    barcode: data.code
  };
}


⸻

B. Receipt Parser

export function parseReceiptLines(text) {
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      const match = line.match(/^(.+?)\s+([\d\.]+)$/);
      return match ? { name: match[1], price: parseFloat(match[2]) } : null;
    })
    .filter(Boolean);
}

export function dedupeItems(items) {
  const seen = new Map();
  items.forEach(item => {
    const key = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!seen.has(key)) seen.set(key, item);
  });
  return Array.from(seen.values());
}


⸻

C. Seed SQL

INSERT INTO items (name, brand, category, in_stock, price, carbs_per_serving, fat_per_serving, protein_per_serving, servings_per_container, unit_of_measure, unit_quantity, image_url, nutrition_source, barcode)
VALUES
('Organic Coconut Oil', 'Spectrum', 'oils-fats', true, 12.99, 0, 14, 0, 28, 'oz', 14, 'https://example.com/coconut.jpg', 'manual', '1234567890123'),
('Free Range Eggs', 'Vital Farms', 'eggs', true, 5.99, 0, 5, 6, 12, 'count', 1, 'https://example.com/eggs.jpg', 'manual', '2345678901234');


⸻

5. User Stories

Inventory
	•	Add item manually
	•	Toggle in_stock
	•	Scan barcode → autofill details
	•	Merge on normalized name

Batch Import
	•	Upload receipt → OCR → parse → dedupe → upsert
	•	Fetch missing nutrition/image from OFF

Recipes
	•	Save recipe with linked items
	•	See cooked recipes history
	•	Suggest recipes from in-stock items

Analytics
	•	Avg meal cost
	•	Avg macros
	•	Top cooked meals

⸻

6. AI Build Sequence Prompts

Prompt 1 — Schema

Create the Postgres schema for a food inventory + recipe tracker in Supabase using the DDL provided in my PRD. Include extensions, tables, indexes, and upsert function exactly as written.

Prompt 2 — Next.js Setup

Set up a Next.js 14 project with TypeScript, TailwindCSS, and Supabase JS client. Configure environment variables for Supabase URL and anon key. Create a connection utility file in src/lib/supabase.ts.

Prompt 3 — CRUD Inventory

Implement CRUD operations for the items table in Next.js. Use Supabase's from('items') calls. For insert/update, use the upsert_item_by_name RPC. Build a mobile-friendly table with ShadCN UI to list items, show in_stock toggle, and edit brand/price inline.

Prompt 4 — OFF Integration

Implement a helper to map Open Food Facts API responses to my items schema. When adding an item with a barcode, call OFF API, map fields, and upsert.

Prompt 5 — Receipt OCR

Add a file upload form that accepts images of receipts. Send to Tesseract.js in the browser. Parse with parseReceiptLines and dedupeItems. Review before commit to DB.

Prompt 6 — Recipes

Create a recipes table UI with CRUD. Link ingredients to items via recipe_items join table. Add a "suggest meals" API route that selects recipes where all ingredients are in stock.

Prompt 7 — Analytics

Build an analytics dashboard route showing avg meal cost, avg macros, top cooked recipes. Use Supabase SQL queries.

Prompt 8 — Hugging Face (Stretch)

Integrate Hugging Face inference API to generate recipe ideas given in-stock items and a cooking style. Display with a "Save to Recipes" button.
