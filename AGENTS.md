# CRM2 Project Agent — Dopamine Pharma CRM

You are the project engineer for **CRM2**, a CRM for medical and sales reps at Dopamine Pharma (DPM).

## Tech stack & structure

- Monorepo layout:
  - `backend/` — Node.js + Express + Sequelize + SQLite database.
  - `frontend/` — React + Vite SPA.
- Ports:
  - Backend: `http://localhost:5000`
  - Frontend: `http://localhost:5173`

## Core commands

From the project root `D:\projects 2\crm2`:

- Backend:
  - `cd backend`
  - `npm install`
  - `npm run seed:roles`
  - `npm run seed:users`
  - `npm run seed:visits`
  - `npm run dev`  → start API on port 5000

- Frontend:
  - `cd frontend`
  - `npm install`
  - `npm run dev`  → start Vite dev server on port 5173

## Domain concepts

- **Users / Roles**
  - `admin@example.com` → Sales Manager role (full access).
  - `rep@example.com`   → Sales Representative role (limited access; only own visits/accounts).

- **Entities**
  - HCPs (doctors / clinics).
  - Pharmacies (retail).
  - Visits (meetings with HCPs / pharmacies).
  - Territories and sales reps.

## Project-specific rules

- Do **NOT**:
  - Reset or re-initialize the project with a new boilerplate.
  - Delete or rename `backend`, `frontend`, or their `package.json` files.
  - Change port numbers unless explicitly requested.

- When fixing bugs:
  1. Reproduce the bug in the browser.
  2. Check browser **Console** and **Network** tabs.
  3. Identify whether the issue is:
     - backend error (API status not 2xx), or
     - frontend error (React/JS exception).
  4. Propose and implement the minimal code change to fix it.

- For React pages:
  - Keep components small and focused.
  - Keep routes:
    - `/dashboard`
    - `/visits`
    - `/hcps`
    - `/pharmacies`
    - `/reports`
    - `/settings`
  - Handle loading and error states instead of showing a blank page.

## Excel → CRM integration (HCPs + Pharmacies)

Omar already has a master Excel file with:
- HCPs and Pharmacies in one sheet (`Name`).
- Columns: `Name`, `Representative Name`, `Area`, `Tag`, `Client Tag`, `Comment`,
  `Speciality`, `Phone`, `Email`, `Profile Pic`, `Logo`, `Website`,
  `City`, `Region`, `Country`, `Formatted Address`.

Your tasks regarding this data:

1. **Conversion script (safe step):**
   - Create a Node script in `backend/scripts/convertAccountsFromExcel.js`
     that reads `backend/data/accounts.xlsx` and writes
     `backend/db/accounts.fromExcel.json` with:
       - `hcps`: non-pharmacy rows (Client Tag = A/B/C/blank).
       - `pharmacies`: rows where `Client Tag == "Pharmacy"`.

2. **Integration step:**
   - Adapt the backend seed logic to optionally load HCPs/pharmacies
     from `accounts.fromExcel.json` instead of hard-coded sample data.
   - Keep the existing sample data logic working for tests.

3. **No destructive operations:**
   - Never drop tables or wipe the real database without an explicit clear
     instruction from Omar.
   - Prefer upserting sample data (insert-or-update).

## Current known issue

- The `/visits` page in the frontend currently shows a **blank screen** for both admin and rep.
- HAR logs show `/api/visits` returns valid data (status 200/304).
- This means there is a **frontend React error** while rendering the Visits page.

When asked to fix this:
1. Inspect the browser console errors on `/visits`.
2. Patch the React code in `frontend/src/visits/*` or corresponding page file.
3. Ensure that:
   - Visits list loads for admin and rep.
   - Errors are handled with a visible message, not a blank page.

Always summarise changes for Omar in clear, concise bullet points.




--

  ماذا عن Ollama وكلفته؟

بشكل صريح:

- **Codex حاليًا مبني ليستعمل نماذج OpenAI من السحابة.**
- ما في طريقة رسمية/جاهزة تخليه يشتغل مباشرة فوق Ollama بدل OpenAI.
- لكن تقدر تستفيد من Ollama *بشكل منفصل*:
  - تفتحه في Terminal وتستعمل موديل مبرمج محلي (مثل `qwen2.5-coder` أو غيره) لأسئلة سريعة.
  - Codex يبقى الأداة الأساسية المتصلة بالمشروع (مع AGENTS.md + config.toml اللي جهّزناهم).




