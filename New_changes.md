Refactor the user dashboard frontend authentication flow to fix an incorrect redirect that causes a GitHub Pages 404 after dashboard load.

Context:

The dashboard correctly loads at /dashboard-webpot/user_dashboard/html/index.html

Immediately after load, the page redirects to /dashboard-webpot/auth.html, which does not exist and triggers a GitHub Pages 404

This redirect happens due to premature or incorrect auth guard logic in frontend scripts

Requirements:

Locate and remove any hardcoded redirects to /dashboard-webpot/auth.html

Replace them with a centralized auth guard function that:

Waits until all required auth/config scripts are loaded

Checks authentication state only after initialization completes

Ensure authentication failure redirects only to the correct login page path (root-level auth page), not a dashboard-relative path

Prevent redirects during initial render caused by transient undefined helpers or race conditions

Make the dashboard resilient so missing optional data (notifications, testimonials, marketing blocks) does NOT trigger logout or redirect

Ensure the dashboard stays mounted if a valid auth token exists in storage

Add a single, clearly named requireDashboardAuth() guard that is called once on load

Remove duplicated auth checks across multiple files and make this guard the single source of truth

Constraints:

Do NOT modify Cloudflare Worker code

Do NOT modify Google Apps Script (code.gs)

Do NOT change API contracts

Only update frontend JS and HTML within the dashboard structure

Goal:

The dashboard must load and remain stable

No redirects should occur unless authentication is definitively invalid

GitHub Pages 404 must never appear during normal dashboard navigation