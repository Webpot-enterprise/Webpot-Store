1: webpot- dashboard/user dashboard/index.html

Prepare this dashboard page for future PHP integration without changing the UI.
Replace all hardcoded user data with clearly marked placeholder comments.
Add data attributes to stats, profile fields, orders, and invoices to support dynamic rendering later.
Do not introduce PHP or JavaScript logic yet.

2: webpot- dashboard/user dashboard/orders.html

Refactor this page to be fully ready for dynamic order data.
Add semantic structure and data attributes to each order row for filtering and status tracking.
Ensure filters and summary boxes can be updated via JavaScript later.
Do not change layout, styles, or visual behavior.

3: webpot- dashboard/user dashboard/settings.html

Convert account and security sections into properly structured HTML forms suitable for PHP processing.
Add meaningful name attributes to all inputs and group them logically.
Keep all styling, layout, and animations unchanged and do not implement backend logic.

4: webpot- dashboard/user dashboard/legal.html

Fix all invalid HTML, broken tags, and stray characters in this file.
Ensure tab navigation works with both clicks and URL hash fragments (#terms, #privacy).
Keep all legal text unchanged and do not modify wording.

5: webpot- dashboard/user dashboard/script.js

Clean up this script by removing or commenting incomplete example code that references undefined variables.
Add safe DOM existence checks before querying elements.
Keep this file as a lightweight placeholder for future dashboard logic.

6: webpot- dashboard/user dashboard/style.css

Refactor this stylesheet to remove duplicated selectors, repeated :root declarations, and overlapping component definitions.
Consolidate shared styles while preserving the exact visual output.
Do not rename existing classes and do not split into multiple files.