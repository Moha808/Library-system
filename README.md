# LibCredit — Automated Books Borrowing Credit Score System
### Federal College of Animal Health and Production Technology (FCAHPT), Vom, Plateau State, Nigeria

![FCAHPT LibCredit](https://img.shields.io/badge/Institution-FCAHPT%20Vom-047857?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20TailwindCSS%20%7C%20Firebase-059669?style=for-the-badge)
![Testing](https://img.shields.io/badge/Tests-Vitest%20Passed-10b981?style=for-the-badge)

**LibCredit** is a transparent, objective, and automated credit scoring web application developed specifically for the academic library at the **Federal College of Animal Health and Production Technology (FCAHPT), Vom**. 

Instead of measuring financial capacity, a patron's **Credit Score (0–100)** measures **borrowing reliability and civic responsibility**:
1. **Punctuality**: Returning borrowed books on or before due date.
2. **Book Condition**: Returning books in good physical condition versus damaged or lost.
3. **Default Frequency**: Punctual resolution of defaults vs. repeated late and damaged returns.

The credit score directly determines borrowing privileges (number of concurrent books allowed and loan duration). Crucially, the system is designed to **assist, not replace, library staff decisions** — librarians retain full discretion to inspect returns, review disputes, issue overrides with logged reasons, and manually calibrate scores with mandatory audit logging.

---

## 🌟 Key Features

### Patron (Student) Features
- **Intuitive Visual Dashboard**: Live animated SVG score gauge, tier badge, current borrowing allowance (quota and loan days), and statistics cards.
- **Score Trajectory & History**: Interactive Recharts timeline tracking every historical score change with exact rule breakdowns and points deltas (`+15`, `-5`, etc.).
- **Live Active Loans**: Due date countdown badges with urgent alerts when books are due or overdue.
- **Searchable Book Catalogue**: Browse specialized animal health and agricultural collections with real-time shelf copy availability badges.
- **Instant Eligibility Verification**: Pre-check borrow eligibility with immediate, human-readable explanations before placing a request.
- **Dispute Resolution Desk**: Students can file formal disputes on overdue flags or condition assessments with real-time status tracking.
- **"How It Works" Transparency**: Patron-facing guide detailing point formulas, classification thresholds, and tips to maintain high scores.

### Librarian (Admin) Features
- **Executive Library Dashboard**: High-level KPI metrics (total books, patrons, active loans, overdue loans, defaulters, average score) and analytical charts (Score Distribution by Tier, Monthly Borrowing Trends).
- **Catalogue & Inventory Management**: Full CRUD for textbooks with real-time shelf copies tracking across 10 specialized FCAHPT departments.
- **Patron Dossier & Scoring Management**: In-depth individual patron view with full borrowing history, comprehensive score audit trail, and account status toggles (Active / Suspended).
- **Interactive Return Processing Desk**: Live preview of score impact *before* committing return (calculates punctuality, condition, repeated default penalty) and executes an atomic Firestore batch update.
- **Direct Book Issue with Admin Override**: Issue books directly with instant eligibility checks and optional administrator override with mandatory justification logging.
- **Overdue Monitoring & Auto-Check**: Automated detection of past-due loans that flags overdue loans and records defaults without duplicating entries.
- **Defaulters Desk**: Track at-risk students sorted by reliability score and default count.
- **Disputes Management & Score Adjustment**: Review student disputes, resolve issues, and optionally issue corrective score adjustments with an audit trail.
- **Institutional Reports & Exports**: Generate Borrowing, Defaulters, and Score Summary reports with date filters, one-click CSV export, and print-ready formal letterhead layouts.
- **Configurable Scoring Engine**: Dynamically adjust scoring points, loan periods, tier thresholds, and reload realistic seed demo data anytime.

---

## 📊 Credit Scoring Engine

The scoring system operates on a transparent additive model clamped between **0 and 100**:

$$\text{Credit Score} = \text{Initial Baseline (50)} + \sum \text{Positive Points} - \sum \text{Negative Points}$$

### Default Point Rules (Admin-Configurable)
| Trigger Event | Points Impact | Description |
|---|:---:|---|
| **Baseline Initial Score** | `50` | Assigned automatically to every newly registered patron |
| **Returned on Time** | `+10` | Returned exactly on the agreed due date |
| **Returned Early** | `+10` | Returned before the agreed due date |
| **Returned Late** | `-5` | Returned after due date (triggers default record) |
| **Good Physical Condition** | `+5` | Returned with clean, undamaged binding/pages |
| **Damaged Book** | `-10` | Returned with torn pages, stains, or water damage |
| **Lost / Non-Returned Book** | `-20` | Book reported lost or permanently unreturned |
| **Repeated Default Penalty** | `-10` | Applied when patron has $\ge 3$ prior defaults and commits a new default |

### Tier Classification & Privileges
| Credit Score | Tier Classification | Borrowing Allowance | Loan Period | System Status |
|:---:|:---:|:---:|:---:|:---:|
| **80 – 100** | **Excellent** | **Up to 5 books** | **21 Days** | Priority Borrowing |
| **60 – 79** | **Good** | **Up to 4 books** | **14 Days** | Standard Borrowing |
| **40 – 59** | **Fair** | **Up to 3 books** | **14 Days** | Monitored Borrowing |
| **20 – 39** | **Poor** | **1 book** | **7 Days** | Restricted Borrowing |
| **0 – 19** | **Very Poor** | **0 books** | **0 Days** | **Borrowing Blocked** (Requires Admin Override) |

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 19, Vite, React Router v7
- **Styling**: Tailwind CSS v4, Lucide React (Icons), Canvas Confetti
- **Charts**: Recharts (Responsive SVG Charts)
- **Forms & Validation**: React Hook Form + Zod v4 validation schemas
- **Dates**: date-fns v4
- **Notifications**: React Hot Toast
- **Testing**: Vitest v5
- **Backend / Database**:
  - **Firebase Auth & Cloud Firestore** (Standard production mode, designed for Firebase Free Spark Plan with zero Cloud Functions required)
  - **Dual-Mode Adapter (`dbAdapter.js`)**: Seamlessly falls back to local memory/browser storage with zero configuration when Firebase credentials are not provided.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js (v18, v20, or v22 recommended)
- npm or yarn

### 1. Clone & Install
```bash
git clone <repository-url>
cd Jauga
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

By default, `VITE_ENABLE_DEMO_MODE=true` is enabled in `.env`. This allows the application to run **immediately out of the box** without creating a Firebase account!

### 3. Launch the Application
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🎭 Demo Mode & Persona Switcher

When running in demo mode or for testing and grading:
- The top navigation bar includes an **instant persona switcher** dropdown.
- Switch seamlessly between:
  - **Dr. Ibrahim Musa** (Librarian Admin)
  - **Zainab Aminu** (Patron, Score 95 — Excellent Tier)
  - **Solomon Gyang** (Patron, Score 75 — Good Tier)
  - **Chinedu Eze** (Patron, Score 55 — Fair Tier)
  - **Yakubu Gowon** (Patron, Score 30 — Poor Tier)
  - **Samuel Lar** (Patron, Score 15 — Very Poor Tier, Blocked)
  - **Tunde Olatunji** (Patron, Score 5 — Suspended Account)
- Or use the one-click quick-fill buttons on the `/login` page.

---

## 🔥 Firebase Setup Guide (Production Mode)

To connect LibCredit to your live Google Firebase project:

### 1. Create a Firebase Project
1. Visit the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and name it (e.g., `fcahpt-libcredit`).
3. Under **Authentication** -> **Sign-in method**, enable **Email/Password**.
4. Under **Firestore Database**, click **Create Database** (start in production or test mode).

### 2. Configure Environment Variables
In your `.env` file, populate the configuration details from your Firebase Console (Project Settings -> General -> Your apps -> Web app):

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=fcahpt-libcredit.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fcahpt-libcredit
VITE_FIREBASE_STORAGE_BUCKET=fcahpt-libcredit.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
VITE_ENABLE_DEMO_MODE=false
```

### 3. Deploy Security Rules & Indexes
Deploy `firestore.rules` and `firestore.indexes.json` using the Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
firebase use --add <your-project-id>
firebase deploy --only firestore:rules,firestore:indexes
```

### 4. Creating the First Admin
There are two ways to create your first administrative librarian account:

#### Method A: In Demo Mode (Instant)
Use the pre-seeded admin account:
- **Email**: `admin@fcahpt.edu.ng`
- **Password**: Any password (in demo mode) or `Admin@123`

#### Method B: In Live Firebase Production
1. Go to the LibCredit web app at `/register` and create an account with your librarian email (e.g. `headlibrarian@fcahpt.edu.ng`).
2. Open your [Firebase Console](https://console.firebase.google.com/) -> **Firestore Database** -> `users` collection.
3. Locate the document matching your new User UID.
4. Edit the `role` field value from `"patron"` to `"admin"`.
5. Refresh the LibCredit application; you will be immediately granted administrative librarian privileges.

### 5. Seeding Initial Demo Data
To populate your newly deployed database with specialized FCAHPT books and student records:
1. Log into an admin account.
2. Navigate to **Library Settings** (`/admin/settings`).
3. Scroll down to **"Demonstration & Benchmark Data"**.
4. Click **"Reset & Reload Demo Data"**.
5. The system will atomically write:
   - 1 Admin account
   - 15 Student Patrons covering all 5 credit score tiers
   - 40 Academic books across Animal Health, Nutrition, Pathology, Poultry, and Veterinary Nursing
   - ~60 Historical and active borrowing records
   - Comprehensive score logs, defaults, and disputes.

---

## 🧪 Automated & Manual Testing

### Running Automated Tests
```bash
npx vitest run
```
Executes unit tests covering score clamping, classification boundaries, point calculations (punctuality, condition, repeated defaults), and eligibility constraints.

### Manual Verification
Refer to [TESTING.md](file:///c:/Users/ACER/Desktop/Jauga/TESTING.md) for a comprehensive 17-point verification matrix covering:
- Admin and Patron authentication
- Catalogue management
- Borrowing eligibility gates
- Live return score previews
- Overdue cron checks
- Dispute resolution
- CSV & letterhead reports generation

---

## 🌐 Deploying to Vercel

1. Push this repository to GitHub or GitLab.
2. Log into [Vercel](https://vercel.com/) and click **Add New Project**.
3. Select your repository.
4. Set Framework Preset to **Vite**.
5. In **Environment Variables**, add:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_ENABLE_DEMO_MODE` (`true` if running demo without Firebase, `false` for live Firestore)
6. Click **Deploy**. Vercel will build and serve your application with global edge caching and instant page loads.

---

## 📂 Project Structure

```
c:\Users\ACER\Desktop\Jauga\
├── firestore.rules               # Production Firestore security rules
├── firestore.indexes.json        # Composite indexes for queries
├── TESTING.md                    # Verification matrix & manual test table
├── README.md                     # Institutional documentation
├── package.json
├── vite.config.js
├── src/
│   ├── firebase/
│   │   ├── config.js             # Firebase SDK client initialization
│   │   └── dbAdapter.js          # Dual-mode adapter (Firestore + Local fallback)
│   ├── context/
│   │   └── AuthContext.jsx       # Authentication state, login, register, switch
│   ├── services/
│   │   ├── scoreService.js       # Core scoring calculations, clamp, classify, processReturn
│   │   ├── eligibilityService.js # Patron eligibility verification rules engine
│   │   ├── bookService.js        # Book catalogue CRUD and search
│   │   ├── borrowService.js      # Borrow request, approval, direct issue, overdue check
│   │   ├── disputeService.js     # Dispute logging, review, and score adjustments
│   │   ├── reportService.js      # Report generation and CSV export
│   │   ├── seedService.js        # Realistic FCAHPT college benchmark dataset
│   │   └── settingsService.js    # Scoring rule parameters and tier configurations
│   ├── routes/
│   │   └── RouteGuards.jsx       # ProtectedRoute and AdminRoute guards
│   ├── components/
│   │   ├── ui/                   # ScoreGauge, ClassificationBadge, StatCard, Modal, Skeleton
│   │   ├── layout/               # Navbar, Sidebar, Footer, Layout
│   │   └── charts/               # ScoreHistoryChart, ScoreDistributionChart, BorrowingActivityChart
│   ├── pages/
│   │   ├── public/               # LandingPage, LoginPage, RegisterPage, ForgotPasswordPage, HowItWorksPage
│   │   ├── patron/               # PatronDashboard, BrowseBooksPage, MyBorrowingsPage, ScoreHistoryPage, MyDisputesPage
│   │   └── admin/                # AdminDashboard, BooksManagementPage, PatronsManagementPage, PatronDetailPage,
│   │                             # BorrowRequestsPage, IssueBookPage, ReturnProcessingPage, OverdueMonitoringPage,
│   │                             # DefaultersPage, ScoreManagementPage, ReportsPage, SettingsPage
│   ├── __tests__/
│   │   └── scoreService.test.js  # Vitest unit test suite
│   ├── App.jsx                   # React Router route registry
│   ├── main.jsx                  # Application root entry
│   └── index.css                 # Tailwind CSS v4 directives & print styles
```

---

## 🏛️ Federal College of Animal Health and Production Technology (FCAHPT), Vom
*Excellence in Animal Health, Production, and Agricultural Education.*
*Plateau State, Nigeria.*
