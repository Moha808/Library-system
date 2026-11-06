# LibCredit — System Verification & Testing Guide
**Federal College of Animal Health and Production Technology (FCAHPT), Vom**

This document outlines the testing strategy, automated test suites, and comprehensive manual verification scenarios for the LibCredit Automated Credit Score System.

---

## 1. Automated Unit Tests (Vitest)

The project includes unit tests for the core scoring and eligibility engine located in `src/__tests__/scoreService.test.js`.

### Running Automated Tests
```bash
npx vitest run
```

### Coverage
- **`clampScore`**: Clamping scores strictly between 0 and 100, and handling invalid/null/NaN data.
- **`classifyScore`**: Accurate tier classification (Excellent 80–100, Good 60–79, Fair 40–59, Poor 20–39, Very Poor 0–19), allowance limits, and loan periods.
- **`calculatePoints`**: Punctuality bonuses/penalties (+10 on-time/early, -5 late), condition penalties (+5 good, -10 damaged, -20 lost), repeated default surcharge (-10 when prior defaults ≥ 3).
- **`checkEligibility`**: Enforcement of account suspension, overdue book blocks, Very Poor tier restriction, allowance quotas, shelf copy availability, and duplicate book request prevention.

---

## 2. Comprehensive Manual Test Table

| # | Test Scenario | Preconditions / Persona | Step-by-Step Procedure | Expected Result | Verification Status |
|---|---------------|-------------------------|------------------------|-----------------|---------------------|
| **1** | **Admin Login** | Demo mode or seeded admin account | 1. Navigate to `/login`.<br>2. Click **"Demo: Dr. Ibrahim (Admin)"** or enter `admin@fcahpt.edu.ng` / `Admin@123`.<br>3. Submit form. | Successfully logs in, displays success toast `"Welcome back, Dr. Ibrahim Musa!"`, redirects to `/admin` dashboard showing library metrics. | **PASSED** |
| **2** | **Invalid Login** | Unauthenticated user | 1. Navigate to `/login`.<br>2. Enter an un-registered email `unknown@fcahpt.edu.ng` and password `wrongpass`.<br>3. Submit form. | Form validation catches errors; an error notification appears `"No account found matching this email"` or Firebase auth error. User remains on `/login`. | **PASSED** |
| **3** | **Student Patron Self-Registration** | Guest user | 1. Navigate to `/register`.<br>2. Fill in: Full Name, Institutional Email (`newstudent@fcahpt.edu.ng`), Matric No (`FCAHPT/2026/088`), Department (`Veterinary Nursing`), Phone (`08012345678`), Password.<br>3. Submit. | Account created with default `patron` role, status `active`, baseline credit score of **50 (Fair Tier)** initialized in Firestore/storage, redirects to `/patron` dashboard. | **PASSED** |
| **4** | **Add New Book (Librarian)** | Logged in as Admin | 1. Go to `/admin/books`.<br>2. Click **"Add New Book"**.<br>3. Fill title *"Avian Pathology and Diagnostics"*, author *"Dr. J. K. Pam"*, category *"Animal Pathology"*, copies: 4.<br>4. Save book. | New book is appended to catalogue with `availableCopies: 4`, status `available`, and instantly visible in search and patron catalogue. | **PASSED** |
| **5** | **Borrow Available Book (Eligible Patron)** | Logged in as Patron with score ≥ 40 (e.g., Zainab Aminu, Score 95) | 1. Go to `/patron/books`.<br>2. Search for *"Veterinary Clinical Pathology"*.<br>3. Click **"Borrow Book"**.<br>4. Review eligibility modal (shows eligible, 21 days allowed).<br>5. Confirm request. | Request submitted successfully; status set to `requested`. Record appears in patron's `/patron/borrowings` and admin's `/admin/requests` queue. | **PASSED** |
| **6** | **Borrow Unavailable Book (Zero Copies)** | Logged in as Patron | 1. Locate a book with `0 Available` copies.<br>2. Click **"Borrow Book"** or attempt borrow. | System evaluates eligibility: displays code `NO_COPIES_AVAILABLE`, modal shows clear red banner: *"No copies of this book are currently available on the shelf. All copies are on loan."*, submit button is disabled. | **PASSED** |
| **7** | **Low-Score Borrowing Restriction (Very Poor Tier)** | Switch to patron with score < 20 (e.g. Samuel Lar, Score: 15) | 1. Switch persona via demo switcher to Samuel Lar.<br>2. Navigate to `/patron/books`.<br>3. Attempt to borrow any book. | System rejects request with code `SCORE_VERY_POOR`: *"Borrowing blocked: Credit score is in the Very Poor tier (0–19). Please resolve existing defaults with library administration."* Patron dashboard displays blocked status. | **PASSED** |
| **8** | **On-Time Return Processing** | Logged in as Admin | 1. Navigate to `/admin/return`.<br>2. Select active borrowing for a patron whose due date is today or later.<br>3. Leave return date as today, condition as *"Good Condition"*. | Live Score Impact Preview shows: `+10` (On-Time) + `+5` (Good condition) = **`+15 Net Change`**. Upon confirming return, book copy is returned to shelf, borrowing is marked `returned`, score increases by 15, and `scoreLogs` entry is recorded. | **PASSED** |
| **9** | **Late Return Processing** | Logged in as Admin | 1. Navigate to `/admin/return`.<br>2. Select a loan that was due 3 days ago.<br>3. Set condition as *"Good Condition"*. | Live preview computes: `-5` (Late Penalty) + `+5` (Good condition) = **`0 Net Change`**, and flags default event `"late"`. Defaults collection gets new record. | **PASSED** |
| **10** | **Damaged Book Return** | Logged in as Admin | 1. Navigate to `/admin/return`.<br>2. Select an active loan.<br>3. Select condition: *"Damaged Book"*. | Live preview computes: Condition Penalty `-10`. Default event `"damaged"` is flagged. Patron's damagedReturns counter increments and score is deducted by 10 points with an audit log. | **PASSED** |
| **11** | **Repeated Default Penalty** | Logged in as Admin, patron with ≥ 3 prior defaults (e.g. Samuel Lar) | 1. Navigate to `/admin/return`.<br>2. Select loan for Samuel Lar.<br>3. Set condition to *"Damaged"* or date to late. | Rule engine detects `currentDefaultCount >= 3`. In addition to standard late/damaged penalty, adds: `Repeated Default Surcharge: -10`. Explanatory entry written to audit log. | **PASSED** |
| **12** | **Score Update & Audit Ledger Display** | Logged in as Patron | 1. Go to `/patron/score-history`.<br>2. Inspect audit timeline. | Patron sees exact event history: timestamp, rule applied, points delta pill (`+15`, `-10`), before/after score, and exact administrative note. Animated score gauge updates to reflect current score. | **PASSED** |
| **13** | **Overdue Monitoring & Auto-Check** | Logged in as Admin | 1. Navigate to `/admin/overdue`.<br>2. Click **"Run Overdue Check"**. | System checks all `issued` borrowings with `dueDate < today`. Marks them as `overdue`, registers a default entry (deduplicating so it's not created twice), and updates the overdue count badge. | **PASSED** |
| **14** | **Patron Dispute Workflow** | Patron & Admin | 1. Patron goes to `/patron/borrowings` or `/patron/disputes` and files dispute on a late charge.<br>2. Admin opens `/admin/scores` -> Disputes tab.<br>3. Admin enters resolution response with a `+5` score correction.<br>4. Resolves dispute. | Score is atomically restored by +5 with audit log `"Dispute resolved by Admin"`. Dispute status changes to `resolved`. Patron receives feedback in real-time. | **PASSED** |
| **15** | **Report Generation & CSV Export** | Logged in as Admin | 1. Navigate to `/admin/reports`.<br>2. Select tab: *"Borrowing Report"*, *"Defaulters Report"*, or *"Score Summary"*. <br>3. Filter by department or status.<br>4. Click **"Export CSV"** and **"Print Report"**. | Correct dataset is filtered in real-time. CSV file is generated and downloaded immediately. Print modal applies clean FCAHPT institutional letterhead layout hiding web navigation. | **PASSED** |
| **16** | **Settings Configuration & Customization** | Logged in as Admin | 1. Navigate to `/admin/settings`.<br>2. Adjust on-time bonus from 10 to 15, or change Tier thresholds.<br>3. Save Settings. | Changes persist in Firestore `settings/scoring`. Subsequent returns and eligibility checks immediately utilize the newly configured values. | **PASSED** |
| **17** | **Demo Seed Data Reload** | Logged in as Admin | 1. Go to `/admin/settings`.<br>2. Click **"Reset & Reload Demo Data"**. | Creates 1 Admin, 15 Patrons covering every score tier, 40 FCAHPT specialized books, ~60 borrowing records, score logs, defaults, and disputes. Dashboard metrics immediately populate. | **PASSED** |

---

## 3. Security & Role Guards Verification

- **Unauthenticated Users**: Direct navigation to `/patron` or `/admin` routes immediately redirects to `/login` preserving target return URL.
- **Patron Accessing Admin**: A logged-in patron attempting to access `/admin/*` routes is caught by `AdminRoute` and safely redirected to `/patron`.
- **Database Boundary Rules**: Firestore rules (`firestore.rules`) prohibit student patrons from modifying credit score documents, deleting books, or viewing other patrons' dossiers.
