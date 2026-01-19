You are working on the USER DASHBOARD of a live production website.

ABSOLUTE RULES:
- Do NOT modify backend code (Apps Script, Cloudflare Worker, APIs).
- Do NOT change request/response formats.
- Do NOT add new backend features.
- Do NOT invent new data fields.
- Do NOT remove existing functionality.
- All changes must be frontend-only and backward compatible.
- Use the existing folder structure as the source of truth.
- Prefer refactors over hacks.
- Avoid DOM-mutation-driven logic.

========================================
GOAL
========================================
Upgrade the User Dashboard UI/UX to feel intentional, clear, and action-oriented,
without altering backend behavior.

========================================
1. INFORMATION HIERARCHY
========================================
Reorganize the dashboard into three clear vertical zones:

1) STATUS / SUMMARY (top)
2) PRIMARY ACTIONS (middle)
3) DETAILS & HISTORY (bottom)

Ensure visual hierarchy clearly communicates:
- What is my current status?
- What should I do next?
- Where can I see details?

========================================
2. ACTION-ORIENTED STAT CARDS
========================================
Refactor stat cards so they are not passive numbers.

Each card must:
- Show the metric
- Indicate status (e.g., pending, active, completed)
- Provide a clear CTA (View Orders, Complete Payment, Invite Users)

Avoid cards that only display numbers with no affordance.

========================================
3. PRIMARY CTA ZONE
========================================
Introduce a dedicated “Next Action” section.

This section should:
- Highlight the most likely next step (e.g., Start New Project, Complete Payment)
- Be visually distinct from metrics
- Reduce user confusion after landing on the dashboard

Never leave the user without a clear next action.

========================================
4. ORDERS VISIBILITY & EMPTY STATES
========================================
Improve orders visibility without backend changes.

- Group orders by status where possible
- If no orders exist, show a clear empty-state message with guidance
- Avoid blank sections or silent failures
- Do NOT fake orders or statuses

========================================
5. PROGRESSIVE DISCLOSURE
========================================
Reduce cognitive overload.

- Show only essential profile info by default (name, email, status)
- Hide secondary details behind “View Profile” / “Edit Profile”
- Do not dump all profile fields on initial load

========================================
6. EXPLICIT STATUS INDICATORS
========================================
Make system state visible.

Add clear indicators for:
- Account status
- Payment status
- Order progress (even simple step indicators)

Never force users to infer system state.

========================================
7. SESSION AWARENESS (UX ONLY)
========================================
Improve trust and clarity.

- Display last login time if available
- If session expiry logic exists, show non-intrusive warnings
- Do NOT implement new auth logic

========================================
8. NAVIGATION SIMPLIFICATION
========================================
Ensure navigation clarity.

- Current section must be visually obvious
- Remove admin-only affordances from user dashboard
- Sidebar should not overwhelm on smaller screens
- Optional: collapse sidebar to icons on narrow viewports

========================================
9. FEEDBACK & LOADING STATES
========================================
Improve perceived performance.

- Replace “Loading…” text with skeleton loaders where appropriate
- Show inline success/error feedback for user actions
- Avoid global alert spam

========================================
10. CONSISTENCY ACROSS APP
========================================
Ensure dashboard behavior matches:
- Auth pages
- Pricing pages

Maintain consistency in:
- Button hierarchy
- Spacing rhythm
- Interaction patterns

========================================
IMPLEMENTATION CONSTRAINTS
========================================
- Do not introduce new frameworks
- Do not refactor unrelated pages
- Keep logic readable and maintainable
- Avoid cumulative DOM mutations
- Prefer centralized state where applicable

========================================
SUCCESS CRITERIA
========================================
- Dashboard feels structured and purposeful
- Users always know what to do next
- No backend regressions
- No visual overload
- No broken navigation


 ""AND""


You are upgrading the USER DASHBOARD UI color system.

THIS IS A VISUAL REFACTOR ONLY.
Do NOT touch:
- Backend code
- API calls
- Auth/session logic
- Business logic
- Pricing calculations
- DOM structure unless required for styling consistency

========================================
COLOR PALETTE (SOURCE OF TRUTH)
========================================

Primary Background:
- #0B0E14 (Deep Midnight)

Surface / Card Background:
- #161B22 (Elevated grey-blue surface)

Accent / Primary Action:
- #00F2FE (Electric Cyan)
- #7000FF (Vivid Violet)
Use accents intentionally, never together in the same component.

Text Colors:
- Primary Text: #E6EDF3
- Secondary Text: rgba(230, 237, 243, 0.7)
- Muted Text: rgba(230, 237, 243, 0.45)

========================================
GLOBAL APPLICATION RULES
========================================

- Apply palette ONLY to USER DASHBOARD files
- Do NOT affect admin dashboard
- Do NOT affect auth pages
- Do NOT affect pricing page
- Do NOT hardcode colors inline unless unavoidable
- Prefer CSS variables where possible

========================================
BACKGROUND & LAYOUT
========================================

- Set main dashboard background to #0B0E14
- Remove pure white backgrounds
- Maintain sufficient contrast for readability
- Avoid pitch-black (#000000)

========================================
CARDS & SURFACES
========================================

- All dashboard cards use #161B22
- Subtle elevation via:
  - soft shadow
  - border using rgba(255,255,255,0.04–0.08)
- Rounded corners must remain consistent

========================================
ACCENT COLOR USAGE
========================================

Use accent colors ONLY for:
- Primary CTA buttons
- Active navigation state
- Focus states (inputs, tabs)
- Important status indicators

Rules:
- Cyan (#00F2FE): primary user actions
- Violet (#7000FF): highlights, badges, secondary emphasis
- Never overuse accents
- Never apply accent to large background areas

========================================
TEXT & TYPOGRAPHY
========================================

- All primary text uses #E6EDF3
- Headings slightly brighter or bolder, not different color
- Secondary labels slightly muted
- Avoid low-contrast greys

========================================
ICONS & DIVIDERS
========================================

- Icons inherit text color by default
- Accent icons only when interactive
- Dividers should be subtle:
  rgba(255,255,255,0.06)

========================================
STATES & FEEDBACK
========================================

- Hover: slight brightness or glow using accent color
- Active: stronger accent presence
- Disabled: opacity reduction, never color change
- Loading states must not flash white

========================================
RESPONSIVE CONSISTENCY
========================================

- Colors must remain consistent across breakpoints
- No mobile-only color overrides
- Dark theme remains intact on all devices

========================================
SUCCESS CRITERIA
========================================

- Dashboard feels cohesive and premium
- No white flashes or mismatched surfaces
- Clear visual hierarchy
- Accents guide attention, not overwhelm
- Matches futuristic, dark-tech brand language
