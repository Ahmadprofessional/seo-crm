# SEO Keyword CRM — YourHealthFirst

A production-quality MVP SEO Keyword CRM built for **YourHealthFirst** (a premier aesthetic medicine clinic in London).

The application uses **Google Sheets as its single serverless database** with zero external SQL/NoSQL databases, offering non-technical clinic staff an intuitive, high-performance interface with real-time bidirectional synchronization, optimistic updates, drag-and-drop workflow management, and audit logging.

---

## 🌟 Key Features

1. **Executive Dashboard (`/`)**
   - Live KPI cards: Total Keywords, Total Monthly Google UK Search Volume, Keywords Published (with % portfolio progress), and Pipeline in Research.
   - Breakdown bar distributions by Workflow Status and Treatment Category.
   - Top 10 high-traffic keywords leaderboard with direct drawer access.

2. **Full Keywords Table (`/keywords`)**
   - Instant search and multi-criteria filters (Category, Status, Priority).
   - Multi-column sorting (default: Monthly Volume descending).
   - Inline editing for Volume, Category, Status, Priority, and Assigned Team Member with optimistic cache updates and automatic rollback on network failure.
   - Bulk selection with floating toolbar: Bulk Status change, Bulk Category change, Bulk Assign, and Bulk Delete.
   - Virtualized pagination (25, 50, 100 per page) designed for 1,000+ keywords.
   - Responsive design transforming seamlessly to a card list on mobile screens.

3. **Interactive Kanban Board (`/board`)**
   - `@dnd-kit` drag-and-drop cards across statuses (`Research`, `Planned`, `Drafting`, `Review`, `Published`).
   - Dynamic column headers calculating active keyword counts and cumulative search volumes.
   - Category and priority filters with real-time card search.
   - Click any card to launch the deep-linkable editor panel.

4. **Keyword Side Panel (Deep-Linkable via `?keyword=<id>`)**
   - **Content Editor**: Large copy draft area with real-time word counter and Google Sheets 50,000-character cell limit validator.
   - **Live SEO Counters**:
     - Meta Title: live character counter (warns if > 60 chars).
     - Meta Description: live character counter (warns if > 160 chars, permits saving).
   - **Save Protection**: Dirty-state tracking that prompts if closing without saving.
   - **Activity Audit Trail**: History tab showing who changed what field, before and after values, and timestamps.

5. **CSV Import & Export (`/import`)**
   - Upload CSV spreadsheets with drag-and-drop.
   - Auto-guesser for column header mappings with manual overrides.
   - First 10 rows live preview.
   - Pre-import analysis reporting exact counts of keywords to add, duplicates skipped (case-insensitively against existing keywords and intra-file), and invalid rows.
   - One-click CSV export with category and status filtering.

6. **Deduplication Engine & Security**
   - Case-insensitive, whitespace-trimmed duplicate detection (e.g. `Aesthetic Clinic London` matches `aesthetic clinic london`).
   - Friendly conflict warning modal presenting the existing entry and allowing `Add Anyway` (`force: true`).
   - NextAuth session authentication with bcrypt password verification.
   - Rate limiting on login attempts (5 attempts, 15-minute lockout).
   - Next.js Auth Proxy protecting all pages and API routes (returns 401 JSON for unauthorized API calls).
   - Zero Google service account credentials reach the browser bundle (all access occurs server-side).

---

## 🏗️ Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript (strict mode)
- **Styling**: Tailwind CSS, shadcn/ui design tokens, Lucide icons
- **State & Caching**: TanStack React Query (15s server-side memory cache with instant write invalidation)
- **Drag & Drop**: `@dnd-kit/core`
- **Data & CSV**: Google Sheets API v4 (`googleapis`), `papaparse`, `zod`, `uuid`
- **Authentication**: Dual-provider authentication supporting:
  - **Firebase Auth**: "Continue with Google" (OAuth popup) and Firebase Email/Password accounts (with client-side session synchronization).
  - **Clinic Staff Credentials**: NextAuth Credentials provider with bcrypt password hashing and 1-click quick-fill.

---

## 📋 Google Cloud Setup (Step-by-Step)

Follow these steps to connect your Google Sheet as the database:

### 1. Create a Google Cloud Project & Enable Sheets API
1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click **Select a project** > **New Project**, name it `YourHealthFirst SEO CRM`, and click **Create**.
3. In the sidebar, go to **APIs & Services** > **Library**.
4. Search for **Google Sheets API**, select it, and click **Enable**.

### 2. Create a Service Account & Download Private Key
1. In the sidebar, go to **APIs & Services** > **Credentials**.
2. Click **Create Credentials** at the top and select **Service account**.
3. Enter a Service account name (e.g., `seo-crm-service-account`) and click **Create and Continue**.
4. (Optional) Skip role assignment and click **Done**.
5. Find your newly created service account in the table, click its email, and navigate to the **Keys** tab.
6. Click **Add Key** > **Create new key**, choose **JSON**, and click **Create**.
7. A JSON key file will download to your computer. Open it in a text editor to copy:
   - `client_email` (e.g., `seo-crm-service-account@your-project.iam.gserviceaccount.com`)
   - `private_key` (e.g., `"-----BEGIN PRIVATE KEY-----\nMIIEvgIBA...-----END PRIVATE KEY-----\n"`)

### 3. Create & Share Your Google Sheet
1. Open [Google Sheets](https://sheets.new) and create a new blank spreadsheet.
2. Name it `YourHealthFirst - SEO CRM Database`.
3. In the top-right corner, click **Share**.
4. In the "Add people and groups" box, paste your service account's **`client_email`**.
5. Set the permission role to **Editor** and uncheck "Notify people", then click **Share**.
6. Copy the **Spreadsheet ID** from the URL bar:
   ```
   https://docs.google.com/spreadsheets/d/<GOOGLE_SHEET_ID_IS_HERE>/edit
   ```

---

## ⚙️ Environment Configuration

Create a `.env.local` file in the root directory (you can copy [`.env.example`](file:///.env.example)):

```bash
# Google Sheets API - Service Account
GOOGLE_SERVICE_ACCOUNT_EMAIL=seo-crm-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your-google-sheet-id-from-url

# NextAuth
NEXTAUTH_SECRET=generate-a-random-32-character-secret
NEXTAUTH_URL=http://localhost:3000

# App Login Credentials
APP_USERNAME=admin
# Pre-hashed bcrypt password for: admin123
APP_PASSWORD_HASH=$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

# Firebase Authentication (Optional / For Google & Firebase Email Sign-In)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyYourFirebaseApiKeyHere
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456789
```

> **Note on Private Key Formatting**: Ensure escaped newlines (`\n`) in your private key are preserved in quotes. The server-side client automatically converts `\\n` to real newlines.

To generate a custom password hash:
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your-secure-password', 10).then(h => console.log(h))"
```

---

## 🚀 Running Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Initialize Google Sheet Tabs & Seed Initial Data**:
   Populate the clinic's initial aesthetic treatments portfolio from `/seed/keywords.csv`:
   ```bash
   npm run seed
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Access the Application**:
   - Open [http://localhost:3000](http://localhost:3000) in your browser.
   - You will be redirected to `/login`. Sign in using username `admin` and password `admin123`.

---

## 🧪 Running Automated Tests

To run the unit test suite verifying row-mapping, case-insensitive duplicate detection, and CSV parsing:
```bash
npm test
```

---

## ☁️ Deploying to Vercel

1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Log in to [Vercel](https://vercel.com/) and click **Add New** > **Project**.
3. Import your repository.
4. Under **Environment Variables**, add the variables from `.env.local`:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY` (paste the full string with `\n`)
   - `GOOGLE_SHEET_ID`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (set to your Vercel production URL, e.g. `https://your-app.vercel.app`)
   - `APP_USERNAME`
   - `APP_PASSWORD_HASH`
5. Click **Deploy**. Vercel will build and deploy the production bundle.

---

## 📊 Sheet Structure Reference

The application will automatically initialize three tabs on first run via `/api/setup`:

1. **`Keywords`**:
   `id`, `keyword`, `volume`, `category`, `status`, `priority`, `target_url`, `assigned_to`, `content`, `meta_title`, `meta_description`, `notes`, `created_at`, `updated_at`
2. **`Activity`**:
   `timestamp`, `user`, `keyword_id`, `action`, `old_value`, `new_value`
3. **`Settings`**:
   `statuses`, `categories`, `users`
