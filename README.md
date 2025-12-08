# Dopamine Pharma CRM

This repository contains the source code for the Dopamine Pharma CRM, a custom CRM solution for medical and sales representatives.

## Project Structure

This is a monorepo containing the following packages:

- `dopamine-crm-api/`: The main backend REST API built with Node.js, Express, TypeScript, and PostgreSQL. This is the single source of truth for all business logic and data.
- `frontend/`: A React-based frontend application. **Note: This frontend is currently experimental and under development. It may not be fully functional.**
- `backend_legacy/`: A backup of the previous backend implementation (Node.js + Sequelize + SQLite). This is kept for reference and will be removed in the future.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL (running locally or accessible)
- A tool to run PowerShell scripts (for `run-crm2.ps1`)

### 1. Configure the Backend

1.  Navigate to the API directory:
    ```sh
    cd dopamine-crm-api
    ```
2.  Create a `.env` file by copying the example file:
    ```sh
    cp .env.example .env
    ```
3.  Open the `.env` file and update the `DATABASE_URL` and other settings as needed.

### 2. Install Dependencies and Run Migrations

From the **project root**:

```sh
# Install API dependencies
npm run install:api

# Run database migrations
npm run migrate up
```

### 3. Running the Application

You can run the API using one of the following methods:

**Method A: Using the root `package.json` scripts (Recommended)**

From the project root directory:

```sh
# Run the API in development mode
npm run dev:api
```

**Method B: Using the PowerShell script**

From the project root directory, run the helper script:

```powershell
.\run-crm2.ps1
```

The API will be running on the port specified in your `.env` file (default is `5000`).

## API Endpoints Overview

All endpoints are prefixed with `/api`. Authentication is required for all endpoints except `/health` and `/auth/login`.

- **Health Check**
  - `GET /health`: Checks API and database status.
- **Authentication**
  - `POST /auth/login`: Login a user.
- **Users** (`Admin only`)
  - `GET, POST /users`
  - `GET, PUT, DELETE /users/:id`
- **Roles** (`Admin only`)
  - `GET, POST /roles`
  - `GET, PUT, DELETE /roles/:id`
- **Doctors**
  - `GET, POST /doctors`
  - `GET, PUT, DELETE /doctors/:id`
- **Pharmacies**
  - `GET, POST /pharmacies`
  - `GET, PUT, DELETE /pharmacies/:id`
- **Hospitals**
  - `GET, POST /hospitals`
  - `GET, PUT, DELETE /hospitals/:id`
- **Product Lines**
  - `GET, POST /product-lines`
  - `GET, PUT, DELETE /product-lines/:id`
- **Products**
  - `GET, POST /products`
  - `GET, PUT, DELETE /products/:id`
- **Product Materials**
  - `GET, POST /product-materials`
  - `GET, PUT, DELETE /product-materials/:id`
- **Visits**
  - `POST /visit-plans`
  - `GET /reps/:repId/visit-plans`
  - `POST /visit-plan-items`
  - `GET /reps/:id/today-visits`
  - `POST /visits/start`
  - `POST /visits/:visitId/finish`
- **Orders**
  - `GET, POST /orders`
- **Reports** (`Admin only`)
  - `GET /reports/coverage`
  - `GET /reports/rep-performance`
  - `GET /reports/sales-by-product`
