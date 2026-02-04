# RealtimeTube (Supabase Realtime YouTube Clone)

A lightweight, realtime YouTube-style experience built with Supabase and vanilla JavaScript. Open multiple tabs to see videos, likes, and comments update instantly.

## Features
- Publish videos with title, description, and YouTube URL.
- Create channels with avatars and realtime subscriber counts.
- Watch videos in an embedded player.
- Realtime counts for views and likes.
- Realtime comments (live chat).
- Search, filter by category, and sort trending videos.

## Setup

1. Create a new Supabase project.
2. Open **SQL Editor** and run the contents of `supabase.sql` (includes channels, videos, and comments).
3. Copy your project **URL** and **anon key**.
4. Open `app.js` and replace:
   ```js
   const SUPABASE_URL = "YOUR_SUPABASE_URL";
   const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
   ```
5. Serve the project locally:
   ```bash
   python -m http.server 5173
   ```
6. Open <http://localhost:5173>.

## Push to GitHub

From the project folder, commit your changes and push to your GitHub repo:

```bash
git status
git add .
git commit -m "Set up RealtimeTube app"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

If you already have a remote named `origin`, skip the `git remote add` line.

## Deploy to Vercel

1. Go to <https://vercel.com/new> and import your GitHub repo.
2. In **Framework Preset**, choose **Other**.
3. Leave **Build Command** empty.
4. Set **Output Directory** to `.` (root).
5. Click **Deploy**.

Because this is a static site, Vercel will serve the files directly once the repo is connected.

## Notes
- Make sure the Supabase project has **Realtime** enabled (the SQL adds the tables to the realtime publication).
- If you want to lock down permissions, replace the public RLS policies with authenticated policies.

## Supabase SQL
The full SQL to create tables, policies, and realtime publication lives in `supabase.sql`.
