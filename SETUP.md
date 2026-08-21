# DR NAEEM Eye Laser & Retina Center Call Assistant
## Cloud-Based Setup Guide

---

## Prerequisites

- [Supabase](https://supabase.com/) account (free tier works)
- [Vercel](https://vercel.com/) account (free tier works)
- [Git](https://git-scm.com/) installed

---

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com/) and sign in
2. Click **"New Project"**
3. Choose a project name (e.g., `dr-naeye-clinic`)
4. Set a strong database password
5. Select a region closest to your users
6. Click **"Create new project"**
7. Wait for the project to be provisioned

---

## Step 2: Get Supabase Credentials

1. In your Supabase dashboard, go to **Settings → API**
2. Copy these two values:
   - **Project URL** (looks like `https://xxxxxxxx.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)
3. Go to **Settings → API → Service Role Key**
   - Copy the **Service Role Key** (starts with `eyJ...`)
   - ⚠️ Keep this secret! Never put it in frontend code.

---

## Step 3: Set Up Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Open the file `supabase/schema.sql` from this project
4. Copy the entire contents and paste into the SQL Editor
5. Click **"Run"** to execute
6. You should see "Success. No rows returned"

---

## Step 4: Seed Initial Content

1. In SQL Editor, click **"New query"**
2. Open the file `supabase/seed.sql` from this project
3. Copy the entire contents and paste into the SQL Editor
4. Click **"Run"** to execute
5. All clinic questions, answers, and categories will be inserted

---

## Step 5: Enable Realtime

1. In Supabase dashboard, go to **Database → Replication**
2. Find the `categories` table and enable replication
3. Find the `questions` table and enable replication
4. This enables live synchronization between users

---

## Step 6: Configure Frontend

1. Open `script.js` in a text editor
2. Find these two lines at the top:
   ```javascript
   var SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
   var SUPABASE_ANON_KEY = "YOUR_ANON_KEY_HERE";
   ```
3. Replace with your actual Supabase credentials from Step 2
4. Save the file

---

## Step 7: Create First Admin User

You need to create your first admin user manually:

### Option A: Via Supabase Dashboard

1. Go to **Authentication → Users** in Supabase dashboard
2. Click **"Add user"**
3. Enter email and password
4. Click **"Create user"**
5. Go to **SQL Editor** and run:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'your-email@example.com';
   ```

### Option B: Via the App

1. Deploy the app first (Step 8)
2. Open the app in your browser
3. Sign up with your email/password through the Supabase dashboard
4. Then run the SQL update above

---

## Step 8: Deploy to Vercel

### Option A: Via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. In the project directory, run:
   ```bash
   vercel
   ```
3. Follow the prompts to link to your Vercel account
4. For production deployment:
   ```bash
   vercel --prod
   ```

### Option B: Via GitHub

1. Push this project to a GitHub repository
2. Go to [vercel.com](https://vercel.com/) and sign in
3. Click **"New Project"**
4. Import your GitHub repository
5. Set environment variables (see Step 9)
6. Click **"Deploy"**

---

## Step 9: Set Vercel Environment Variables

In your Vercel dashboard, go to **Project → Settings → Environment Variables** and add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `SUPABASE_URL` | Your Supabase Project URL | Production, Preview, Development |
| `SUPABASE_ANON_KEY` | Your Supabase Anon Key | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase Service Role Key | Production, Preview, Development |

⚠️ The Service Role Key is only used by the serverless API function (`api/admin/users.js`). It is never sent to the browser.

---

## Step 10: Test the Application

1. Open your Vercel deployment URL
2. You should see the login page
3. Sign in with the admin user you created
4. Verify:
   - ✅ Login works
   - ✅ Call Assistant loads with categories and questions
   - ✅ Search works (English and Urdu)
   - ✅ Admin can manage content
   - ✅ User management works
   - ✅ Logout works
   - ✅ Urdu content displays correctly (RTL, Nastaleeq font)

### Test Realtime Sync

1. Open the app in two different browsers/windows
2. Log in as admin in one, regular user in another
3. Add/edit/delete a question in the admin window
4. Verify it appears/disappears/updates automatically in the user window

---

## Architecture

```
User → Vercel (Frontend) → Supabase Auth → Supabase PostgreSQL → Supabase Realtime
```

- **Frontend**: Static HTML/CSS/JS served by Vercel
- **Authentication**: Supabase Auth (email/password)
- **Database**: Supabase PostgreSQL with Row Level Security
- **Realtime**: Supabase Realtime for live sync
- **User Management**: Vercel Serverless Function with Supabase Admin API

---

## Database Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (id, name, email, role, status) |
| `categories` | Question categories (id, name) |
| `questions` | Questions with answers (id, category_id, question, answer, keywords) |

## Row Level Security

- **Unauthenticated users**: Cannot read any data
- **Regular users**: Can read categories and questions
- **Admins**: Can read, create, update, delete everything + manage users

---

## Troubleshooting

### Login fails with "Invalid login credentials"
- Check email/password are correct
- Ensure the user has been created in Supabase Auth

### Data doesn't load after login
- Check the browser console for errors
- Verify Supabase URL and anon key are correct in `script.js`
- Check that RLS policies are set up (run `schema.sql`)

### Realtime not working
- Check that Realtime is enabled for `categories` and `questions` tables
- Look at the "Realtime Status" badge in the Backup pane

### Users can't be created
- Ensure the admin user is properly set up
- Check that the serverless function has the correct environment variables
- The service role key must be set as a Vercel environment variable

---

## Files

| File | Description |
|------|-------------|
| `index.html` | Main application (login + call assistant + admin) |
| `style.css` | All styling including login page |
| `script.js` | Application logic with Supabase integration |
| `api/admin/users.js` | Serverless function for user management |
| `supabase/schema.sql` | Database schema, RLS policies, triggers |
| `supabase/seed.sql` | Initial clinic content (questions, categories) |
| `vercel.json` | Vercel deployment configuration |
| `package.json` | Dependencies (Supabase JS SDK) |
| `.env.example` | Environment variables template |
| `SETUP.md` | This setup guide |
| `logo.png` | Clinic logo |
| `JameelNooriNastaleeq.*` | Urdu Nastaleeq font files |
| `eye-clinic-backup-2026-08-18.json` | Original backup data (reference) |
