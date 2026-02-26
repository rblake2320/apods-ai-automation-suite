# APODS Financial Model Generator

## Files

- **`APODS_Financial_Model.xlsx`** — The compiled 15-sheet workbook (777 formulas)
- **`generate_base_model.py`** — Creates the base 10-sheet model (original 4 revenue streams)
- **`generate_expansion_streams.py`** — Adds 4 expansion stream sheets + updated P&L

## Usage

```bash
pip install openpyxl

# Step 1: Generate base model
python generate_base_model.py
# Output: APODS_Financial_Model.xlsx (10 sheets)

# Step 2: Add expansion streams
python generate_expansion_streams.py
# Output: Updated APODS_Financial_Model.xlsx (15 sheets, 777 formulas)
```

## Model Design

- **Blue cells** = editable assumptions (change any input, formulas cascade)
- **Black cells** = calculated formulas (do not edit)
- **Green cells** = cross-sheet references
- All monetary values in USD
- 5-year projection window (Year 1 = launch year)

## Sheet Dependencies

```
Market Sizing → Consumer Subscriptions → Per-Card Revenue
                                       → Gift Card Marketplace
                Enterprise B2B ────────→ P&L (4 Streams)
                                       → Executive Summary
Advertising ──→ Bank Licensing ──→ Badge/ID ──→ Crypto
                                              → Full P&L (8 Streams)
                Unit Economics ──→ Scenarios  → Investment Plan
```
