# FinTrack — Full-Stack Personal Finance Management System
### Fresh Botanical Finance Design System

FinTrack is a full-stack personal finance and expense tracking web application built with **Angular 20**, **ASP.NET Core 8 Web API**, and **Microsoft SQL Server**. It is designed around the **Fresh Botanical Finance** visual design philosophy — prioritizing natural elegance, calmness, clarity, visual hierarchy, and complete financial accuracy without generic AI templates or unnecessary visual clutter.

---

## 1. System Architecture & Tech Stack

```
   ┌─────────────────────────────────────────────────────────────┐
   │             FinTrack Web Client (Angular 20)                │
   │  • Standalone Components  • Signals & Reactive Interceptors │
   │  • Fresh Botanical Theme  • Interactive Chart.js Visuals    │
   └──────────────────────────────┬──────────────────────────────┘
                                  │ JSON / RESTful HTTPS / JWT
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │            FinTrack API (ASP.NET Core 8 Web API)            │
   │  • ASP.NET Core Identity  • JWT Bearer Auth & Middleware   │
   │  • Claims-based Isolation • High-Precision Decimal Math     │
   │  • Swagger / OpenAPI Docs • Entity Framework Core 8         │
   └──────────────────────────────┬──────────────────────────────┘
                                  │ SQL Provider / Migrations
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │             Database (Microsoft SQL Server)                 │
   │  • Tables: AspNetUsers, Transactions, __EFMigrationsHistory │
   │  • Precision: decimal(18,2)  • Composite Indices            │
   └─────────────────────────────────────────────────────────────┘
```

### Frontend
- **Framework**: Angular 20 (Standalone Components, Signals, Reactive Forms)
- **Language**: TypeScript 5.9
- **HTTP Client**: Functional HTTP interceptors for automatic JWT attachment and 401 redirection
- **Routing**: Angular Router with functional `authGuard` and `guestGuard`
- **Charts**: Chart.js 4.x with botanical color themes (Forest Teal, Muted Green, Muted Coral, Soft Gold)
- **Styling**: CSS custom properties adhering strictly to the Fresh Botanical Finance color system

### Backend
- **Framework**: ASP.NET Core 8 Web API (C# 12)
- **ORM**: Entity Framework Core 8 (SQL Server provider, Code-First migrations)
- **Authentication**: ASP.NET Core Identity with PBKDF2 secure password hashing & JWT Bearer tokens
- **Security & User Isolation**: Absolute server-side user isolation via claims (`ClaimTypes.NameIdentifier`). Client-supplied user IDs are never trusted.
- **API Documentation**: Swagger / OpenAPI with JWT Bearer scheme authorization

### Database
- **Engine**: Microsoft SQL Server
- **Database Name**: `FinTrackDb`
- **Tables**: `Transactions`, `AspNetUsers`, `AspNetRoles`, `AspNetUserClaims`, `AspNetUserRoles`, `__EFMigrationsHistory`

---

## 2. Fresh Botanical Finance Visual Design System

The application strictly implements the required botanical palette:

| Element | Hex Code | Visual Purpose |
| :--- | :--- | :--- |
| **Soft Mint White** | `#F4F8F4` | Main application background |
| **Pure White** | `#FFFFFF` | Cards and content surfaces |
| **Pale Eucalyptus** | `#E7F0E9` | Sidebar and alternative section backgrounds |
| **Forest Teal** | `#2F6B57` | Primary buttons, active navigation, branding |
| **Deep Forest** | `#245443` | Headings, strong text, hover states (no black) |
| **Sage Green** | `#8FAE9B` | Secondary UI elements and chart accents |
| **Muted Green** | `#4F8A68` | Positive values, income badges and inflows |
| **Muted Coral** | `#D98B73` | Expenses, outflows, and secondary highlights |
| **Warm Clay** | `#C87967` | Negative values and warning states |
| **Soft Gold** | `#D8B66A` | Highlights and savings accents (used sparingly) |
| **Soft Gray Green** | `#718078` | Secondary labels, hints, and muted text |
| **Pale Border** | `#DCE7DF` | Dividers and subtle card borders |

---

## 3. Features & Capabilities

### 1. Income & Expense Management
- **Add Transactions**: Modal form with type toggle (Income / Expense), dynamic category selector, positive amount validation, date picker, and optional descriptions.
- **View Transactions**: Paged ledger with real-time text search, type filter (All / Income / Expense), category filter, and custom date range.
- **Edit Transactions**: Populates existing transaction into validated modal, updates database, and immediately recalculates financial summaries.
- **Delete Transactions**: Safe confirmation dialog presenting exact details (type, category, amount, description) prior to permanent deletion.

### 2. Financial Dashboard
- **Key Financial Metrics**:
  - **Net Cash Flow**: Total Income - Total Expenses (clearly calculated for the selected period, not described as a bank balance).
  - **Total Income**: Sum of all positive inflows.
  - **Total Expenses**: Sum of all recorded expenditures.
  - **Net Savings**: Retained surplus in the period.
- **Income vs Expenses Trajectory**: Monthly comparative bar/line chart powered by real backend transaction data.
- **Expense Allocation Doughnut**: Percentage share and total spend per expense category.
- **Recent Transactions Ledger**: Displays the 5 latest records with quick access to the full ledger.
- **Thoughtful Empty State**: When no records exist, displays clean zero figures and an encouraging prompt without fake data.

### 3. Dedicated Financial Reports
- Custom date ranges, monthly period views, and full annual reviews.
- Aggregate KPIs calculated via decimal arithmetic.
- Full category breakdown table with visual progress meters, percentage shares, transaction counts, and totals.
- Zero-value division safety preventing `NaN` or `Infinity`.

### 4. Authentication & Security
- User registration with name, email, password strength, and confirmation match validation.
- Secure login issuing digitally signed JWT tokens.
- Secure route guards protecting financial pages from unauthenticated access.
- User data isolation: Every transaction is tied to the authenticated user's token claims. Attempting to view, edit, or delete another user's transaction returns HTTP 404.

---

## 4. API Endpoints Reference

### Authentication
- `POST /api/auth/register` — Register a new user account and return JWT token.
- `POST /api/auth/login` — Authenticate existing credentials and return JWT token.
- `GET /api/auth/me` — Retrieve the profile of the currently authenticated user (`[Authorize]`).

### Transactions (`[Authorize]`)
- `GET /api/transactions` — Query paged transactions with search, type, category, date filters, and sorting.
- `GET /api/transactions/{id}` — Retrieve a single transaction by ID (user-isolated).
- `GET /api/transactions/recent` — Retrieve the most recent transactions for the dashboard.
- `GET /api/transactions/categories` — Predefined income and expense categories.
- `POST /api/transactions` — Create a new income or expense transaction.
- `PUT /api/transactions/{id}` — Update an existing transaction.
- `DELETE /api/transactions/{id}` — Delete an existing transaction.

### Reports (`[Authorize]`)
- `GET /api/reports/summary` — Aggregate income, expense, net cash flow, and savings for a period or date range.
- `GET /api/reports/expense-breakdown` — Category spending breakdown with percentages.
- `GET /api/reports/monthly-trend` — Monthly income and expense trajectory for the year.

---

## 5. Prerequisites & Local Environment

Ensure you have the following installed:
- **.NET SDK**: 8.0 or later (`dotnet --version`)
- **Node.js**: v18.x or later (recommended v20/v24) & **npm**
- **Angular CLI**: v20 (`npm install -g @angular/cli`)
- **Microsoft SQL Server**: Local instance running on `localhost` (Developer, Express, or Standard Edition)

---

## 6. How to Run the Application

### Step 1: Database Setup & Migrations
The backend is configured to connect to SQL Server on `localhost` (`Server=localhost;Database=FinTrackDb;Trusted_Connection=True;TrustServerCertificate=True;`).

To apply migrations manually:
```bash
dotnet ef database update --project backend
```
*(Note: The backend also automatically runs EF Core migrations upon startup).*

### Step 2: Start the Backend API
```bash
dotnet run --project backend --urls "http://localhost:5053"
```
The API is accessible at:
- **Base API**: `http://localhost:5053/api`
- **Swagger Documentation**: `http://localhost:5053/swagger`

### Step 3: Start the Angular Frontend
```bash
npm start --prefix frontend
```
The web application is accessible at:
- **Web App**: `http://localhost:4200`

---

## 7. Running Tests

### Backend Automated Test Suite (15 Tests)
The backend test suite (`FinTrack.Tests`) tests real database interactions, validation rules, authentication flows, data isolation, and financial calculations:

```bash
dotnet test tests
```

#### Test Suite Breakdown:
1. **Authentication Tests**:
   - Valid user registration & JWT token generation.
   - Rejection of invalid registration (mismatched passwords, short passwords).
   - Duplicate email registration prevention.
   - Successful login with credentials.
   - Rejection of incorrect login credentials.
   - Unauthorized access checks for protected routes without JWT.
2. **Transaction & User Isolation Tests**:
   - Inflows and outflows creation and retrieval.
   - Transaction editing and deletion.
   - Rejection of zero or negative amounts.
   - Rejection of invalid categories.
   - **Cross-user data isolation test**: Verifies that User 2 cannot read, edit, or delete User 1's transaction.
3. **Financial Calculation Tests**:
   - Verification of exact specification figures:
     - Salary: EGP 10,000 + Freelance: EGP 2,000 = **Total Income: EGP 12,000**
     - Food: EGP 1,500 + Transportation: EGP 500 = **Total Expenses: EGP 2,000**
     - **Net Cash Flow: EGP 10,000**
     - Food proportion: **75.00%**, Transportation: **25.00%**.
   - Zero-state calculation without division-by-zero errors.
   - Real-time recalculation upon updates and deletions.

### Frontend Unit & Component Tests (8 Tests)
Runs Karma and headless Chrome for pipe transformations and services:
```bash
npm test --prefix frontend -- --watch=false --browsers=ChromeHeadless
```
