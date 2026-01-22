Context

This project is a static frontend dashboard hosted on GitHub Pages under /dashboard-webpot/.
Backend APIs (Apps Script + Cloudflare Worker) are already working and must NOT be modified.

Current problems:

Dashboard JS files fail to load due to incorrect paths

Auth helpers load after dependent code → dashboard auth check loops forever

Orders, totals, profile, and stats never render despite backend working

Logo links and nav labels are incorrect UX-wise

Your task is to fix frontend-only issues without touching backend code.

And:

1️⃣ Fix ALL Dashboard JS & Asset Paths

All dashboard HTML files are located under:

/dashboard-webpot/user_dashboard/html/


All JS files are located under:

/dashboard-webpot/js/


Update every <script src> in all dashboard HTML files to use absolute paths, for example:

<script src="/dashboard-webpot/js/config.js"></script>
<script src="/dashboard-webpot/js/api.js"></script>
<script src="/dashboard-webpot/js/auth.js"></script>
<script src="/dashboard-webpot/js/orders.js"></script>
<script src="/dashboard-webpot/js/script.js"></script>


Fix all asset paths (logo.png, profile image, icons) to use:

/dashboard-webpot/user_dashboard/assets/


Remove any relative paths like ../js/, ./js/, or user_dashboard/js/

2️⃣ Enforce Correct Script Load Order (CRITICAL)

Load scripts in this exact order in all dashboard pages:

config.js

api.js

auth.js

orders.js (only on orders page)

script.js (last)

Ensure no dashboard logic runs before auth helpers exist

In script.js, gate dashboard initialization like this:

Wait until window.isAuthenticated and getUserData() are available

Retry auth check with a short timeout (max retries = 10)

If still unavailable → redirect to /auth.html

3️⃣ Fix Auth Helper Availability Loop

Remove infinite “Auth helpers not yet available” warnings

Convert auth initialization into a single async bootstrap function

Ensure:

Token is read from localStorage

verifyToken API is called once

User data is cached globally

After auth success → trigger:

dashboard stats load

profile load

orders load (if page = orders)

4️⃣ Make Dashboard Data Actually Render

On Dashboard page:

Fetch user-specific order summary

Populate:

Total Orders

Total Spends

Referrals count

On Orders page:

Fetch orders filtered by logged-in user_id

Render rows dynamically into the table

Show proper empty state if no orders exist

Remove all placeholder “Loading…” states once data resolves

5️⃣ Prevent Silent Failures

Replace console.log-only failures with:

Visible UI fallback messages

Toast or inline warnings (non-blocking)

If API fails → dashboard still loads with empty state

6️⃣ Fix Dashboard Redirect Bugs

Prevent any redirect to:

/dashboard-webpot/auth.html


Auth redirects must always go to:

/auth.html

7️⃣ UX Tweaks (Required)

Clicking WebPot Logo should redirect to:

/


Rename nav item:

Dashboard → Back to Webpot


Ensure Orders & Settings nav remain dashboard-local

8️⃣ Clean Console Errors

Remove:

Duplicate variable declarations

Re-declared constants

Ensure each JS file uses a single global namespace

No global name collisions (API_CONFIG, orders, etc.)

❌ DO NOT

Modify Cloudflare Worker

Modify Apps Script

Change API routes or payload formats

Add new backend endpoints

✅ FINAL RESULT SHOULD BE

Dashboard loads with zero red console errors

Auth resolves once and only once

Orders appear correctly

Stats populate correctly

Navigation works cleanly

No random GitHub 404 pages

Dashboard feels stable and intentional