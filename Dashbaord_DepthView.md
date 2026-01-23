WebPot User Dashboard – Technical & Functional Documentation
1. High-Level Overview
What the dashboard is:
The WebPot User Dashboard is a secure, web-based portal for end-users to manage their orders, account settings, and profile information within the WebPot ecosystem.

Who it is for:
It is designed for registered WebPot users who need to view, track, and manage their service orders, account data, and notifications.

What problem it solves:
The dashboard centralizes user account management, order tracking, and notification delivery, providing a seamless and intuitive interface for all user-related activities.

How it fits into the WebPot ecosystem:
The dashboard acts as the primary user-facing interface, integrating with backend APIs, Google Apps Script, and Cloudflare Worker for authentication, data storage, and business logic.

2. System Architecture
Authentication flow:

Users authenticate via a token-based system.
Login and registration are handled outside the dashboard, with tokens issued and validated on each dashboard page load.
Frontend–backend interaction:

The dashboard uses JavaScript API calls to interact with backend endpoints for user data, orders, and session management.
Data is fetched asynchronously and rendered dynamically.
Session/token lifecycle:

Tokens are valid for 24 hours from issuance.
Session expiry is tracked in real-time, with UI indicators and automatic logout/redirection on expiry.
Role of Google Apps Script and Cloudflare Worker:

Google Apps Script acts as the backend for data storage and business logic.
Cloudflare Worker may be used for API routing, caching, or additional security.
Data ownership and user isolation:

Each user’s data is isolated and accessible only via their authenticated session.
Data is fetched and displayed per user context.
3. Folder & File Structure
dashboard-webpot/user_dashboard/
css/
style.css: Global dashboard theming and layout.
orders.css, settings.css, terms-conditions.css: Page-specific styles.
html/
index.html: Main dashboard overview.
orders.html: Orders management page.
settings.html: User settings and profile.
privacy.html, terms.html, terms-conditions.html: Legal and informational pages.
QUICKSTART.html: User onboarding guide.
js/
api.js: Handles all API calls and backend integration.
auth.js: Authentication helpers (get/set user, logout).
orders.js: Orders page logic (filtering, actions).
script.js: Dashboard initialization, auth guard, session tracking, and data loading.
ui.js: UI rendering for profile, orders, sessions, and activity log.
4. Authentication & Security Model
Login and registration flow:

Users log in externally and are issued a token.
The dashboard checks for a valid token on every page load.
Token issuance and validation:

Tokens are stored in local storage and validated on each dashboard access.
Expiry is tracked and displayed in the UI.
Dashboard access protection:

All dashboard pages use a centralized requireDashboardAuth() guard.
Unauthenticated users are redirected to the login page.
Session expiration handling:

Session expiry is calculated and shown in the navbar.
On expiry, the user is logged out and redirected.
Redirect logic:

All unauthorized or expired sessions are redirected to auth.html or index.html.
5. Dashboard Pages (Detailed)
Dashboard Overview (index.html)
Purpose:
Main landing page showing user stats, profile, and quick links.
Data displayed:
User profile, order stats, recent activity.
Data fetching:
Via api.js and script.js on page load.
UI updates:
Dynamic rendering using ui.js functions.
User interaction:
Navigation, profile viewing, and notification access.
Orders Page (orders.html)
Purpose:
View, filter, and manage user orders.
Data displayed:
List of orders, statuses, amounts, and actions.
Data fetching:
Orders fetched via api.js (stubbed if backend not ready).
UI updates:
Orders rendered and filtered using ui.js and orders.js.
User interaction:
Filter by status, view details, complete payment.
Settings Page (settings.html)
Purpose:
Manage account settings and profile data.
Data displayed:
User profile, sessions, and account controls.
Data fetching:
Profile and session data via api.js.
UI updates:
Profile and session tables rendered by ui.js.
User interaction:
Edit profile, manage sessions, logout.
Profile Section
Purpose:
Display user’s personal and account information.
Data displayed:
Name, email, phone, status, last login, member since.
Data fetching:
Loaded on dashboard initialization.
UI updates:
Updated by updateProfileSection() in ui.js.
User interaction:
View and copy profile data.
6. Orders System
Order lifecycle:

Orders are created, displayed, and can be filtered by status.
Payment completion is handled via redirection.
Order statuses:

Typical statuses: pending, processing, completed, etc.
Data fields used:

order_id, order_date, service_type, total_amount, order_status.
How orders are displayed and filtered:

Orders are rendered in a table.
Filtering is handled by status via UI controls.
Revenue and summary calculations:

Total orders and total spend are calculated and displayed in stats cards.
7. Notifications System
What notifications are:

Alerts for new activity, order updates, or system messages.
How they are fetched:

Notification count and details are fetched from backend (stubbed if not available).
How they are displayed:

Bell icon in navbar with badge for unread count.
How unread/read states work:

Unread notifications increment the badge; read state is managed per user session.
8. Referral System
Referral code creation:

Users may receive or generate referral codes (implementation may be backend-driven).
One-time use logic:

Referral codes are typically single-use and tracked per user.
How referrals are tracked:

Referral usage is logged and associated with user accounts.
How they appear in the dashboard:

Referral status and codes may be displayed in the profile or settings section.
9. User Profile & Account Data
What user data exists:

Name, email, phone, profile image, status, last login, member since, sessions.
How it is loaded:

Fetched on dashboard initialization and on settings/profile page load.
How it is displayed:

Profile section, settings page, and navbar avatar.
Future extensibility considerations:

Profile schema allows for additional fields and settings.
10. Frontend Rendering Strategy
Script load order:

Core scripts (script.js, auth.js, api.js) load first, followed by page-specific scripts.
Initialization flow:

On DOMContentLoaded, authentication is checked, then data is loaded and rendered.
Loading states:

Spinners and placeholders are shown while data is loading.
Empty states:

Informative messages are displayed if no data is available (e.g., no orders).
Error-tolerant UI behavior:

Errors in data fetching are caught and displayed without breaking the UI.
11. Backend Responsibilities
APIs used:

User profile, orders, sessions, activity logs (stubbed if backend not ready).
Sheet/database structure:

Data is stored in Google Sheets or a similar backend, with user isolation.
Logging:

User actions and activity are logged for audit and support.
Metadata capture (IP, UA):

Session and activity logs may include IP address and user agent.
Data validation:

All data is validated on the backend before being returned to the frontend.
12. Design Philosophy
UI/UX principles:

Clean, modern, and accessible design with a focus on usability.
Visual hierarchy:

Clear separation of navigation, content, and actions.
Consistency rules:

Consistent theming, spacing, and component usage across all pages.
Dashboard color and interaction logic:

Professional black & white theme with accent colors for actions and statuses.
13. Scalability & Extensibility
How new features can be added:

Modular JS and CSS structure allows for easy addition of new pages and features.
How new dashboard sections fit in:

New sections can be added as new HTML pages and linked in the sidebar and navbar.
How backend can scale:

Backend APIs and data storage can be extended to support more users and features.
14. Final Summary
The WebPot User Dashboard is a robust, secure, and user-friendly portal for managing all aspects of a user’s WebPot account, including orders, profile, and notifications. It is built with modularity, security, and extensibility in mind, ensuring a seamless experience for every user.

Elevator pitch:
A modern, secure dashboard for WebPot users to manage their orders, account, and notifications—all in one place.