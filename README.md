# DR NAEEM Eye Laser & Retina Center — Call Assistant

A cloud-based, multi-user internal web application engineered for clinic staff to quickly search and retrieve clinic-approved answers to patient inquiries in real time during live phone calls.

---

## Key Features

- **Fast Dual-Language Knowledge Base**: Immediate search and access across English and Urdu questions, answers, and keywords.
- **Urdu Nastaleeq Typography & Direction**: Auto-detects Urdu script per entry, rendering right-to-left in the self-hosted **Jameel Noori Nastaleeq** font.
- **Real-Time Synchronisation**: Instant push updates via Supabase Realtime across all active clinic devices when content is updated.
- **Role-Based Access Control**:
  - **User (Staff)**: Fast searching and browsing of approved answers.
  - **Admin**: Full CRUD on categories, questions, staff user management (create, update, role toggle, enable/disable access), and data export.
- **Idempotent Guarded Startup Architecture**: Guaranteed single-flight initialization with bounded timeouts (≤ 15–20s) preventing race conditions, flashes of incorrect role UI, or infinite loading screens.
- **"Resume Where I Left Off"**: Automatically restores active category, open question, and view state upon page refresh.
- **Secure User Management**: Serverless API endpoint (`/api/admin/users`) isolating the Supabase service role key to server execution only.

---

## Tech Stack

- **Frontend**: Pure HTML5, Vanilla CSS3 (Custom responsive layout & RTL support), Vanilla JavaScript (ES6+).
- **Backend & Database**: Supabase (PostgreSQL, Supabase Auth, Supabase Realtime, Row Level Security).
- **Serverless API**: Node.js Serverless Function deployed on Vercel (`api/admin/users.js`).
- **Urdu Fonts**: Self-hosted `JameelNooriNastaleeq.woff2` and `.ttf`.
- **Hosting**: Vercel (static frontend + serverless functions).

---

## Project Structure

```
dr-naeem-clinic/
├── index.html                  # SPA shell: login view & main call assistant interface
├── style.css                   # Complete design system, responsive layouts & Urdu typography
├── script.js                   # Client application logic with guarded startup flow
├── supabase.min.js             # Supabase JavaScript Client bundle
├── logo.png                    # Clinic logo
├── favicon.png                 # Browser favicon
├── JameelNooriNastaleeq.woff2  # Urdu Nastaleeq font (primary)
├── JameelNooriNastaleeq.ttf    # Urdu Nastaleeq font (fallback)
├── api/
│   └── admin/
│       └── users.js            # Admin user management serverless function
├── supabase/
│   ├── schema.sql              # Database schema, RLS policies, triggers
│   └── seed.sql                # Initial clinic categories & Q&A knowledge base
├── package.json
├── vercel.json                 # Vercel routing and security headers
├── .env.example                # Environment variables template
├── .gitignore
├── README.md                   # Application overview & feature documentation
└── SETUP.md                    # Step-by-step Supabase and Vercel deployment guide
```

---

## Quick Setup & Deployment

Refer to [`SETUP.md`](SETUP.md) for full step-by-step instructions:
1. Create a Supabase project and execute `supabase/schema.sql`.
2. Seed initial clinic Q&A with `supabase/seed.sql`.
3. Enable replication on `categories` and `questions` under **Database → Replication**.
4. Configure Supabase credentials in `script.js`.
5. Deploy to Vercel and add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to Vercel Environment Variables.
