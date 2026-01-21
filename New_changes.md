You are working inside an existing production frontend dashboard.

ABSOLUTE RULES:
- Do NOT modify backend code (Apps Script / Cloudflare Worker).
- Do NOT invent new API actions or endpoints.
- Do NOT assume backend supports orders, sessions, or logs yet.
- Do NOT remove existing UI features — disable or gate them safely.
- Follow the existing folder and file structure exactly.
- Make minimal, deterministic fixes.

========================================
PROBLEM SUMMARY (FACTUAL)
========================================

1. Dashboard loads without errors but shows no data.
2. Multiple frontend files define the same functions (name collisions).
3. Frontend calls backend actions that DO NOT EXIST.
4. Errors are swallowed, resulting in empty UI.
5. Dashboard appears “broken” but is actually miswired.

========================================
PART 1 — REMOVE DUPLICATE FUNCTION DEFINITIONS
========================================

Problem:
- fetchUserOrders(), updateStatsCards(), renderOrders() are defined
  in MULTIPLE files (api.js, orders.js, ui.js).
- The last-loaded script silently overrides earlier ones.

Required Fix:
- Enforce SINGLE OWNERSHIP of responsibilities:

  - api.js:
    - API communication ONLY
    - No DOM logic
  - ui.js:
    - Rendering & UI updates ONLY
    - No API calls
  - orders.js:
    - Orders feature glue (fetch + render)
  - script.js:
    - Dashboard bootstrap & orchestration

Actions:
- Remove or rename duplicate functions so each function name exists
  in exactly ONE file.
- Ensure no global function name collisions remain.

========================================
PART 2 — ALIGN FRONTEND WITH REAL BACKEND CAPABILITIES
========================================

Backend Reality:
The backend currently supports ONLY:
- register
- login
- googleLogin
- verifyToken
- contact
- (order creation only, not reading)

It does NOT support:
- getOrders
- getUserOrders
- getSessions
- getLogs
- getAuthTokens

Required Fix:
- Disable or gate frontend calls to unsupported backend actions.
- Do NOT call apiCall() with actions that do not exist.
- Replace those calls with:
  - safe stubs
  - empty resolved promises
  - or feature-disabled states

Example:
- fetchUserOrders() should return an empty array with a clear comment
  indicating backend read support is pending.

========================================
PART 3 — MAKE EMPTY STATES EXPLICIT (NOT SILENT)
========================================

Problem:
- Dashboard shows nothing, confusing the user.

Required Fix:
- Replace silent empty renders with intentional empty states.

Examples:
- Orders section:
  "You have no orders yet or order history is not available."
- Sessions section:
  "Session history will appear here."
- Activity log:
  "No activity data available."

DO NOT:
- Fake data
- Pretend backend returned results

========================================
PART 4 — FIX DASHBOARD BOOTSTRAP FLOW
========================================

Problem:
- Dashboard assumes data will load automatically.

Required Fix:
- In script.js:
  - Authenticate user
  - Load user profile ONLY (this is supported)
  - Conditionally load other features only if supported

Dashboard must:
- Always show profile
- Never fail because optional data is unavailable
- Never redirect or break due to missing data

========================================
PART 5 — REMOVE FALSE API DEPENDENCIES
========================================

Actions:
- Remove all calls to:
  - fetchUserSessions()
  - fetchActivityLogs()
  - fetchAuthTokens()
  unless backend support is explicitly added later.
- Leave UI containers intact but mark them as "coming soon" or disabled.

========================================
PART 6 — DOCUMENT THE STATE CLEARLY IN CODE
========================================

Add clear comments explaining:
- Which features are frontend-ready
- Which features depend on backend read APIs
- Why certain sections intentionally show empty states

This is to prevent future confusion or accidental re-breakage.

========================================
SUCCESS CRITERIA
========================================

After changes:
- Dashboard loads without errors
- User profile always displays
- Orders section shows a clear empty/disabled state
- No silent failures
- No duplicate function definitions
- No calls to non-existent backend actions
- Codebase reflects reality, not assumptions

Proceed to implement all changes above.



Next,

You are modifying a multi-page user dashboard frontend.

ABSOLUTE RULES:
- Do NOT modify backend code (Apps Script, Cloudflare Worker).
- Do NOT invent backend APIs.
- Do NOT remove HTML sections.
- Only adjust frontend JS behavior to match backend reality.

========================================
CONTEXT
========================================

Dashboard pages:
- index.html (main dashboard)
- orders.html
- settings.html

Dashboard HTML expects dynamic data in:
- #ordersContainer
- #sessionsContainer
- #activityLog
- stat cards (total orders, spends, referrals)

Backend reality:
- No read APIs exist for orders, sessions, or logs
- Only authentication and order creation are supported

========================================
TASKS
========================================

1. Dashboard Bootstrap
- In dashboard script.js, create a single initialization flow:
  - Validate auth
  - Load user profile only
  - Initialize dashboard UI
- Prevent dashboard from assuming orders/sessions/logs exist

2. Orders Handling
- Disable automatic order fetching
- Replace with:
  - Clear empty-state message:
    "Orders will appear here once available."
- Ensure Pay Later order creation remains untouched

3. Sessions Section
- Do NOT call any session APIs
- Render a static informational message instead of empty container

4. Activity Log Section
- Do NOT fetch logs
- Render a placeholder message explaining availability

5. UI Consistency
- Ensure index.html, orders.html, and settings.html
  do not crash if optional data is missing
- Never silently fail

6. Remove False Dependencies
- Remove or stub:
  fetchUserOrders()
  fetchUserSessions()
  fetchActivityLogs()
- Leave clear TODO comments for future backend support

7. Code Clarity
- Add comments explaining:
  - Why data is empty
  - Which features depend on future backend APIs
  - That this is intentional

========================================
SUCCESS CRITERIA
========================================

- Dashboard loads reliably
- User profile displays correctly
- Orders, sessions, activity show intentional empty states
- No calls to non-existent backend APIs
- No misleading behavior
- Code reflects real system capabilities
