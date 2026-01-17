Ideation:
You are working inside the Webpot production repository.

Architecture (DO NOT BREAK):
Frontend (GitHub Pages) → Cloudflare Worker → Google Apps Script → Google Sheets

Critical Rules:

❌ Do NOT modify Cloudflare Worker logic unless explicitly stated

❌ Do NOT modify Google Apps Script unless explicitly stated

❌ Do NOT create new markdown files

❌ Do NOT change API routes, actions, or authentication flow

✅ Use existing apiCall() pattern

✅ Respect existing CORS, token-based auth, and headers

✅ Frontend changes must be modular and non-breaking

🎯 GOAL

Enhance the Main Website + User Dashboard + Auth UX with advanced, modern, production-grade features while maintaining backend stability and security.

🔐 AUTH & SECURITY FEATURES
1. Password Strength Indicator

Add a live password strength meter during registration

Rules:

Min 8 characters

Upper + lower case

Number

Special character

Visual bar with animated gradient (Weak → Medium → Strong)

Block registration until strength ≥ “Good”

Frontend only

2. Login Attempt Cooldown

After 3 failed login attempts:

Disable login button for 30 seconds

Show countdown timer

Optional: log attempts to Logs sheet

No server-side blocking

3. Session Expiry Indicator

Show “Session expires in Xh Ym” in dashboard

Warning state when <10 minutes remaining

Uses existing token expiry logic

No backend changes

🎨 MAIN WEBSITE (MARKETING & TRUST)
4. Live Statistics Section

Display real data:

Projects Delivered

Client Satisfaction %

Avg Response Time

Requirements:

Animated count-up effect

Fetch from backend (/stats?action=getStats)

Cache response in Worker (60s)

5. Interactive Pricing Comparison

Mobile-friendly pricing table

Toggle:

Monthly / One-time

Startup / Business

Highlight recommended plan

Sticky CTA button

CSS + JS only

6. Dynamic Testimonials Carousel

Fetch testimonials from API

Auto-rotate

Pause on hover

Skeleton loader while fetching

📊 USER DASHBOARD FEATURES
7. Visual Order Progress Tracker

Replace text status with a 4-step visual stepper:

Placed

Processing

Development

Delivered

Active steps in --primary-color

Tooltips on hover

Uses existing order_status

8. Invoice / Receipt Generator

“Download Invoice (PDF)” button per order

Generate HTML → PDF via Apps Script

No third-party services

9. User Activity Log

Show user-specific activity:

Login

Orders created

Profile updates

Pulled from Logs sheet

Filtered by user_id

💬 COMMUNICATION FEATURES
10. In-Dashboard Support Tickets

Ticket creation UI

Threaded replies

Status: Open / In Progress / Closed

Backend:

Tickets Google Sheet

Scoped to authenticated users

11. Order-Specific Comments

Per-order message thread

Two roles:

Client Notes

Developer Updates

Backend:

OrderMessages sheet

Linked via order_id

⚡ PERFORMANCE & UX POLISH
12. Skeleton Loaders

Add skeleton loaders for:

Dashboard cards

Orders table

Testimonials

Replace loaders once data arrives

13. Offline Detection Banner

Detect fetch/network failures

Show non-intrusive banner:
“You’re offline. Changes will retry.”

14. Global Toast Notification System

Toast container (top-right)

Types:

Success

Error

Info

Animations:

Slide in → auto dismiss

Persist messages across redirects using sessionStorage

Replace all inline alerts

🧠 SMART UX FEATURES
15. First-Time User Walkthrough

Guided tooltips for dashboard

“Next” step navigation

Triggered only once

Stored in localStorage

16. Smart Redirect After Login

Preserve intended destination:

Order page

Contact page

Redirect back after authentication

17. Account Linking (Future-Proof)

Google login users can add password later

Password users can link Google account

UI-only changes unless backend explicitly required

🛠 ADMIN-ONLY POWER FEATURES
18. Admin Quick Actions

From Admin Dashboard:

Update order status

Add internal notes

Flag refunds

Uses existing API permissions

19. Revenue Analytics Dashboard

Charts using Chart.js (CDN)

Visuals:

Monthly revenue (Line chart)

Plan distribution (Doughnut chart)

Client-side aggregation only

Uses /orders?action=getOrders

✅ FINAL CONSTRAINTS

Maintain strict modularity

No API contract changes

No CORS changes

No new markdown files

Clean, readable, production-quality code

Match existing glassmorphism + dark theme aesthetic

Proceed feature-by-feature, ensuring zero regressions.


Pending Changes:

Completed Changes:

✅ 1. Password Strength Indicator
- Real-time password strength meter with 5 requirement checks
- Visual animated gradient bar (Weak → Medium → Good → Strong)
- Interactive requirement checklist (Length, Uppercase, Lowercase, Number, Special)
- Registration button disabled until password strength ≥ "Good"
- Smooth slide-down animation when user starts typing password
- Color-coded labels and requirement indicators
- Frontend-only implementation (no API changes)

✅ 3. Session Expiry Indicator
- Live countdown showing "Session expires in Xh Ym" format
- Updates every minute in navbar across all dashboard pages
- Warning state (red border + pulsing icon) when <10 minutes remaining
- Auto-detects token expiry from login time (24-hour tokens)
- Automatically logs out user when session expires
- Displays on Dashboard, Orders, and Settings pages
- Non-breaking, modular implementation
- No backend changes required

✅ 5. Interactive Pricing Comparison
- Mobile-friendly responsive pricing table with 2x2 toggle system
- Toggle 1: Monthly vs One-time billing (12x multiplier for annual pricing)
- Toggle 2: Startup plans (Starter/Basic) vs Business plans (Professional/Premium)
- Dynamic price updates with smooth animations
- Recommended plan highlighting (blue border + shadow effect)
- Sticky CTA banner appears when user scrolls past pricing section
- Sticky banner with "Ready to get started?" prompt and smooth scroll link
- Auto-hide sticky CTA when user returns to pricing section
- Fully responsive design for mobile (single column, stacked toggles)
- CSS + JS only implementation (no API changes)

✅ Documentation Updated
- Updated Final_Website_DepthView.md to v2.3.0
- Added comprehensive sections for all 3 new features
- Documented implementation details, file changes, code statistics
- Updated table of contents with "New Features" section