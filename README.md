# Rule Filter Engine (Internship Assignment)

A full-stack tool for highlighting and labeling text based on custom rules. I built this using a monorepo structure to keep the frontend and backend types in sync.

## The Core Logic: Interval Painting
Instead of simple string replacement, I implemented an **Interval Painting** algorithm in `textProcessorService.ts`. 

The engine:
1. **Extracts Boundaries**: Identifies all start/end points of every rule match.
2. **Slices Segments**: Breaks the text into non-overlapping "intervals."
3. **Applies Rules**: Maps multiple rules to a single segment based on **priority**.

This approach prevents "broken" HTML tags and handles overlapping highlights (e.g., a tooltip rule inside a highlight rule) without corrupting the original string.

## Stack
* **Monorepo**: Shared TypeScript types for the API and Database.
* **Backend**: Node.js/Express, Prisma, PostgreSQL.
* **Frontend**: React, Tailwind CSS, Vite.
* **Safety**: Zod validation (discriminated unions) and Regex escaping for keywords like `C++`.

## Setup

### 1. Database
In `server/.env`, set your PostgreSQL string:
```text
DATABASE_URL="postgresql://user:pass@localhost:5432/db_name"
```
Then run the migrations:
cd server && npx prisma migrate dev

### 2. Run the App

I recommend running these in two separate terminals:
**Server:**
```bash
cd server && npm install && npm run dev
```
Client:
```bash
cd client && npm install && npm run dev
```

