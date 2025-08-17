# Data Flow Documentation

## Overview

This document outlines the end-to-end data flow for the Receipt → OCR → Enrichment → Upsert → UI pipeline, plus the single-item "Autofill before save" flow. Includes notes for retries, batching, and TDD checkpoints.

---

## 🔄 Receipt → Inventory Data Flow (with OCR + Open Food Facts enrichment)

```mermaid
flowchart TD
    U[User: Upload Receipt Image] --> UP[Next.js UI<br/>/import/receipt]
    UP --> SW[Service Worker/PWA Cache<br/>(optional)]
    UP --> OCR[Tesseract.js (client) <br/>extract text lines]
    OCR --> PARSE[Parse Lines → {name, price}]
    PARSE --> DEDUPE[Normalize & Dedupe]
    DEDUPE --> MATCH[Match existing items<br/>by normalized_name]
    MATCH -->|exists| UPD[Prepare updates<br/>(brand/price/in_stock)]
    MATCH -->|new| ENR[Enrich new with OFF<br/>(name→search OR barcode)]
    ENR --> MAP[Map OFF → item fields<br/>(image, macros, etc.)]
    MAP --> REVIEW[Review Table in UI<br/>(edit/override)]
    UPD --> REVIEW
    REVIEW --> UPSERT[Bulk Upsert → Supabase RPC<br/>upsert_item_by_name()]
    UPSERT --> REFRESH[Re-fetch Inventory List]
    REFRESH --> DONE[Success toast & summary]
```

### Key Behaviors

| Component | Behavior |
|-----------|----------|
| **OCR** | Client-side tesseract.js returns raw text; no backend needed |
| **Parsing** | Regex → {name, price}, drop rows like "SUBTOTAL", "TAX", etc. |
| **Deduplicate** | By normalized_name (lowercase, unaccented, alnum) |
| **Match** | Query Supabase for normalized_name hits |
| **Enrich (new only)** | Call Open Food Facts (OFF) (barcode → first; else name search) |
| **Map** | Use OFF→Item mapper to fill image_url, macros per serving, etc. |
| **Review** | User can edit any field before commit |
| **Upsert** | Postgres ON CONFLICT (normalized_name) → update brand + price only, keep everything else |

### Error & Retry Notes

- **OFF API**: Set timeout (e.g., 4–6s), retry once with backoff; on failure show "Couldn't fetch nutrition—save anyway?"
- **Bulk upsert**: Chunk requests (e.g., 50 items) to avoid payload timeouts
- **Optimistic UI**: Show provisional items; roll back on upsert error (toast + inline error row)

### TDD Checkpoints

- **Unit**: `parseReceiptLines`, `normalizeName`, `dedupeItems`
- **Unit**: `mapOpenFoodFactsToItem` (fixtures)
- **Integration**: Mock OCR output → expect deduped preview → bulk upsert called with right payload
- **E2E**: Upload sample → confirm preview → commit → see items in `/inventory`

---

## 🧭 Single-Item "Autofill then Save" Flow (Add Item modal)

```mermaid
sequenceDiagram
    participant User
    participant UI as Add Item Modal (Next.js)
    participant OFF as Open Food Facts API
    participant DB as Supabase (Postgres RPC)

    User->>UI: Type name / scan barcode
    User->>UI: Click "Autofill"
    UI->>OFF: GET product (barcode) OR search (name)
    OFF-->>UI: JSON (product, nutriments, image)
    UI->>UI: Map OFF→Item (image_url, macros, unit, barcode)
    UI->>User: Prefill fields for review
    User->>UI: Click "Save"
    UI->>DB: RPC upsert_item_by_name(name, brand, price, category, in_stock)
    DB-->>UI: Row (inserted or updated)
    UI-->>User: Toast "Saved" + Refresh list
```

**Why this order?** You avoid creating half-baked rows; the user confirms the autofill, and you perform one atomic write.

---

## 🧪 API & Module Boundaries (what to stub in tests)

```mermaid
flowchart LR
    subgraph Modules
      P1[parseReceiptLines()]
      P2[normalizeName()]
      P3[dedupeItems()]
      M1[mapOpenFoodFactsToItem()]
      RPC[upsert_item_by_name()]
    end
    EXT1([Tesseract.js OCR])
    EXT2([OFF HTTP API])
    EXT3([Supabase RPC])

    EXT1 --> P1 --> P2 --> P3 --> M1 --> EXT3
    M1 <-- EXT2
```

- Stub EXT1 with fixture text; stub EXT2 with MSW; run EXT3 against a test DB (or MSW if you prefer)

---

## ⚙️ Suggested Endpoints & Contracts

### `/api/off/search` (server route; optional proxy)
```typescript
// POST { query?: string, barcode?: string }
// 200 { product: OFFProduct | null }
```
**Why**: Keep OFF keyless calls server-side if you ever add rate-limit logic; easier to MSW mock

### `/api/receipt/preview` (server or client)
```typescript
// POST { ocrText: string } → returns { items: {name:string, price:number}[] }
```
You can do this client-side; server helps centralize logic and logging

### `/api/inventory/bulk-upsert`
```typescript
// POST { items: Partial<Item>[] } → calls Supabase RPC in chunks
// Return summary { inserted: number, updated: number, errors: [] }
```

---

## 🧩 Upsert Rules (recap)

- **Conflict target**: `normalized_name` (generated column)
- **On conflict**: Update only brand, price, last_edited; do not overwrite macros/image unless intentionally requested
- **Prefer barcode uniqueness** when available; use name collision only as fallback

### SQL (already in your DDL)

```sql
ON CONFLICT (normalized_name) DO UPDATE
  SET brand = EXCLUDED.brand,
      price = EXCLUDED.price,
      last_edited = NOW()
```

---

## 🚦 Concurrency, Rate Limits, Performance

- **Batch OFF calls**: `Promise.allSettled` with a pool (e.g., 4–6 concurrent)
- **Debounce name searches** in Add Item modal (300–400ms)
- **Chunk DB writes**: ~50 rows per upsert call for large receipts
- **Cache OFF responses** client-side (session cache) to avoid repeat lookups during one import

---

## 🧰 Minimal Pseudocode (receipt import, client)

```typescript
const lines = await tesseract(imageFile);
const parsed = parseReceiptLines(lines);
const deduped = dedupeItems(parsed);

// Split into existing vs new by checking Supabase
const names = deduped.map(d => d.name);
const { data: existing } = await supabase
  .from('items')
  .select('name')
  .in('normalized_name', names.map(normalizeName));

const existingSet = new Set(existing.map(e => normalizeName(e.name)));
const toUpdate = deduped.filter(d => existingSet.has(normalizeName(d.name)));
const toCreate = deduped.filter(d => !existingSet.has(normalizeName(d.name)));

// Enrich new ones (pool concurrency)
const enriched = await withPool(toCreate, 6, async (row) => {
  const off = await fetchOFF(row.name, row.barcode);
  const mapped = mapOpenFoodFactsToItem(off?.product ?? {});
  return { ...row, ...mapped };
});

// Show Review → user edits → commit
const finalPayload = [...toUpdate, ...enrichedEditedByUser];

// Chunk upserts
for (const chunk of chunks(finalPayload, 50)) {
  await Promise.all(chunk.map(item =>
    supabase.rpc('upsert_item_by_name', {
      p_name: item.name,
      p_brand: item.brand ?? null,
      p_price: item.price ?? null,
      p_category: item.category ?? null,
      p_in_stock: true
    })
  ));
}
```

---

## ✅ TDD Checklist (fast feedback)

### Unit Tests
- [ ] `parseReceiptLines` handles money formats; ignores subtotal/tax lines
- [ ] `normalizeName` stable across punctuation/accents
- [ ] `dedupeItems` collapses duplicates and aggregates price when wanted
- [ ] `mapOpenFoodFactsToItem` derives per-serving macros correctly

### Integration Tests
- [ ] Given mocked OCR text → preview table renders correct rows
- [ ] Given OFF fixtures → enrichment fills image/macro fields
- [ ] Upsert collision updates only brand/price

### E2E Tests
- [ ] Upload → preview → commit → inventory reflects new/updated items
