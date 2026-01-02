+ # Webpot Store - Complete Code Documentation
+ 
+ **Last Updated:** January 2, 2026  
+ **Project:** Webpot - Web Development Services Platform  
+ **Website:** webpot.shop  
+ **Email:** engagewebpot@gmail.com  
+ **Phone:** +91 9408191506
+ 
+ ---
+ 
+ ## Table of Contents
+ 
+ 1. [Project Overview](#project-overview)
+ 2. [Architecture Overview](#architecture-overview)
+ 3. [Frontend Structure](#frontend-structure)
+ 4. [Backend Structure](#backend-structure)
+ 5. [File-by-File Documentation](#file-by-file-documentation)
+ 6. [Workflow & Data Flow](#workflow--data-flow)
+ 7. [Key Features](#key-features)
+ 8. [Deployment Guide](#deployment-guide)
+ 
+ ---
+ 
+ ## Project Overview
+ 
+ **Webpot** is a modern web development agency website that offers three service tiers (Starter, Basic, Premium) for building custom websites. The platform allows users to:
+ 
+ - Browse and compare service packages
+ - Register and authenticate (with Google OAuth)
+ - Place orders for web development services
+ - Make payments via UPI QR codes
+ - Access a personalized dashboard
+ - Submit contact inquiries
+ 
+ **Tech Stack:**
+ - **Frontend:** HTML5, CSS3, Vanilla JavaScript
+ - **Backend:** Google Apps Script (Google Sheets as Database)
+ - **Authentication:** Google Sign-In OAuth
+ - **Payments:** UPI QR Code generation
+ - **Hosting:** Firebase / Custom Domain (webpot.shop)
+ - **Database:** Google Sheets with multiple sheet tabs
+ 
+ ---
+ 
+ ## Architecture Overview
+ 
+ ```
+ ┌─────────────────────────────────────────────────┐
+ │          Frontend (HTML/CSS/JavaScript)         │
+ ├─────────────────────────────────────────────────┤
+ │  index.html (Landing Page)                      │
+ │  auth.html (Login/Register)                     │
+ │  dashboard.html (User Dashboard)                │
+ │  Templates/ (Starter/Basic/Premium)             │
+ └────────────────┬────────────────────────────────┘
+                  │
+         HTTP POST/GET Requests
+                  │
+ ┌────────────────▼────────────────────────────────┐
+ │   Backend - Google Apps Script (code.gs)        │
+ ├─────────────────────────────────────────────────┤
+ │  - User Registration Handler                    │
+ │  - Login Handler                                │
+ │  - Order Processing                             │
+ │  - Email Notifications                          │
+ │  - Data Validation                              │
+ └────────────────┬────────────────────────────────┘
+                  │
+         Read/Write Operations
+                  │
+ ┌────────────────▼────────────────────────────────┐
+ │      Database - Google Sheets                   │
+ ├─────────────────────────────────────────────────┤
+ │  - Users Sheet (Authentication)                 │
+ │  - Orders Sheet (Service Orders)                │
+ │  - Contact_Inquiries Sheet (Inquiries)          │
+ │  - Settings Sheet (Configuration)               │
+ └─────────────────────────────────────────────────┘
+ ```
+ 
+ ---
+ 
+ ## Frontend Structure
+ 
+ ### Directory Layout
+ 
+ ```
+ Root Directory (webpot.shop)
+ ├── index.html                 # Landing page
+ ├── script.js                  # Main frontend logic
+ ├── styles.css                 # Global styles
+ │
+ ├── auth.html                  # Authentication page
+ ├── auth.js                    # Auth logic
+ ├── auth.css                   # Auth styles
+ │
+ ├── dashboard.html             # User dashboard
+ ├── dashboard.js               # Dashboard logic
+ ├── dashboard.css              # Dashboard styles
+ │
+ ├── privacy.html               # Privacy policy
+ ├── terms.html                 # Terms of service
+ ├── updates.html               # Updates page
+ │
+ ├── Templates/                 # Service templates
+ │   ├── starter.html/.js/.css
+ │   ├── basic.html/.js/.css
+ │   └── premium.html/.js/.css
+ │
+ ├── Readme.md                  # Project documentation
+ ├── code.gs                    # Google Apps Script backend
+ └── CNAME                      # Domain mapping file
+ ```
+ 
+ ### Frontend File Purposes
+ 
+ #### **1. index.html** - Landing Page
+ **Purpose:** Main entry point showcasing Webpot services and packages.
+ 
+ **Sections:**
+ - **Hero Section:** Eye-catching introduction with CTA
+ - **About Section:** Company mission and workflow explanation
+ - **Services Section:** Three pricing tiers (Starter ₹999, Basic ₹4999, Premium ₹9999)
+ - **Call-to-Action:** Links to templates and order buttons
+ - **Footer:** Contact information and links
+ 
+ **Key Elements:**
+ - Service cards with features list
+ - Template preview buttons
+ - Order modal trigger buttons
+ - Contact form
+ 
+ ---
+ 
+ #### **2. script.js** - Main Frontend Logic
+ **Purpose:** Core functionality handling user interactions, forms, and API communication.
+ 
+ **Key Functions:**
+ 1. **selectService(serviceName, price)**
+    - Opens order modal when user clicks "Choose Plan"
+    - Stores selected service and price
+    - Displays in the order form
+ 
+ 2. **submitOrder()**
+    - Validates order form (name, email, phone, details)
+    - Sends POST request to Google Apps Script (formType: 'order')
+    - Triggers UPI payment modal on success
+    - Displays error message on failure
+ 
+ 3. **generateUPIQR(amount)**
+    - Creates UPI payment QR code for the order amount
+    - Uses UPI format: `upi://pay?pa=EMAIL&pn=NAME&am=AMOUNT&tn=ORDER`
+    - Encodes to QR code image
+    - Implements auto-regenerate every 2 minutes
+ 
+ 4. **submitContact()**
+    - Captures contact form data
+    - Sends POST to Apps Script (formType: 'contact')
+    - Stores inquiry in Contact_Inquiries sheet
+    - Sends admin notification email
+ 
+ 5. **openLoginModal()**
+    - Displays authentication modal
+    - Provides login and registration forms
+    - Integrates Google Sign-In
+ 
+ 6. **toggleMobileMenu()**
+    - Opens/closes responsive navigation menu
+ 
+ **Data Structures:**
+ ```javascript
+ {
+   orderId: "timestamp-based",
+   formType: "order|contact|register",
+   name: "string",
+   email: "string",
+   phone: "string",
+   service: "Starter|Basic|Premium",
+   amount: "number",
+   message: "string"
+ }
+ ```
+ 
+ ---
+ 
+ #### **3. styles.css** - Global Styling
+ **Purpose:** Unified design system for the entire website.
+ 
+ **Design System:**
+ - **Color Scheme:** Neon blue (#00d4ff), Dark backgrounds, Accent purples
+ - **Typography:** Modern sans-serif, responsive font sizes
+ - **Layout:** Mobile-first responsive design
+ - **Animations:** Gradient shifts, hover effects, fade-ins
+ 
+ **Main Classes:**
+ - `.btn-primary`, `.btn-secondary`: Button styles
+ - `.modal`: Modal overlays and content boxes
+ - `.service-card`: Service package cards
+ - `.workflow-step`: Step indicators in "What We Do" section
+ - `.footer`: Footer styling
+ 
+ **Responsive Breakpoints:**
+ - Desktop: 1200px+
+ - Tablet: 768px - 1199px
+ - Mobile: Below 768px
+ 
+ ---
+ 
+ #### **4. auth.html** - Authentication Page
+ **Purpose:** User login and registration interface.
+ 
+ **Forms:**
+ 1. **Login Form**
+    - Email input
+    - Password input
+    - "Remember Me" checkbox
+    - Submit button
+    - Google Sign-In button
+    - Forgot password link
+ 
+ 2. **Registration Form**
+    - Full name input
+    - Email input
+    - Password input with strength indicator
+    - Confirm password
+    - Agree to Terms and Privacy checkboxes
+    - Submit button
+    - Google Sign-In button
+ 
+ **Features:**
+ - Two tabs (Login/Register)
+ - Modal for viewing Terms of Service
+ - Modal for viewing Privacy Policy
+ - Password strength validation
+ - Email format validation
+ 
+ ---
+ 
+ #### **5. auth.js** - Authentication Logic
+ **Purpose:** Handle user authentication flows and validation.
+ 
+ **Key Functions:**
+ 
+ 1. **toggleAuthTab(tab)**
+    - Switches between login and registration forms
+    - Clears previous form data
+ 
+ 2. **validateEmail(email)**
+    - Regex validation for email format
+    - Returns true/false
+ 
+ 3. **validatePasswordStrength(password)**
+    - Checks minimum 8 characters
+    - Requires uppercase, lowercase, number, special character
+    - Updates strength indicator
+ 
+ 4. **submitRegistration()**
+    - Validates all fields
+    - Sends POST to Apps Script (formType: 'register')
+    - Creates user in Users sheet
+    - Sends welcome email
+    - Redirects to dashboard on success
+ 
+ 5. **submitLogin()**
+    - Validates email and password
+    - Queries Users sheet for matching record
+    - Verifies password hash (SHA-256)
+    - Sets session/localStorage tokens
+    - Redirects to dashboard
+ 
+ 6. **handleGoogleSignIn(response)**
+    - Processes Google OAuth token
+    - Extracts user info (name, email)
+    - Auto-creates or updates user account
+    - Sets authentication state
+    - Redirects to dashboard
+ 
+ 7. **openTermsModal()**
+    - Displays full Terms of Service in modal
+    - User must read and accept before registration
+ 
+ 8. **openPrivacyModal()**
+    - Displays full Privacy Policy in modal
+    - User must read and accept before registration
+ 
+ **Password Hashing:**
+ - Client-side: SHA-256 (for preview/strength check)
+ - Server-side: SHA-256 via Google Apps Script Utilities
+ - Stored in Users sheet, never transmitted in plain text
+ 
+ ---
+ 
+ #### **6. auth.css** - Authentication Styling
+ **Purpose:** Style the authentication pages with modern design.
+ 
+ **Key Styles:**
+ - Gradient backgrounds (dark theme)
+ - Form animations and transitions
+ - Modal overlay with blur background
+ - Password strength indicator bar
+ - Google Sign-In button integration
+ - Responsive form layout
+ 
+ ---
+ 
+ #### **7. dashboard.html** - User Dashboard
+ **Purpose:** Post-login interface showing user orders and profile.
+ 
+ **Sections:**
+ 
+ 1. **Sidebar Navigation**
+    - Logo and user profile section
+    - Navigation links:
+      - Dashboard (Home)
+      - My Orders
+      - Payments
+      - Profile
+      - Support
+      - Logout button
+ 
+ 2. **Welcome Header**
+    - Greeting message with user name
+    - Member since date
+    - Quick stats (Total Orders, Completed, Pending, Total Spent)
+ 
+ 3. **Dashboard Sections**
+    - **Overview:** Stats cards with metrics
+    - **My Orders:** Table of user's service orders
+      - Order ID, Service, Amount, Status, Date
+      - Action buttons (View, Cancel, Download Invoice)
+    - **Payments:** Payment history and status
+    - **Profile:** User information and preferences
+ 
+ 4. **Payment Modal**
+    - UPI QR code display
+    - Payment amount and order details
+    - Timer showing QR validity (2 minutes)
+    - "Regenerate QR" button
+    - Close/Paid confirmation buttons
+ 
+ ---
+ 
+ #### **8. dashboard.js** - Dashboard Logic
+ **Purpose:** Manage dashboard functionality and user data.
+ 
+ **Key Functions:**
+ 
+ 1. **initializeDashboard()**
+    - Checks authentication status
+    - Loads user data from localStorage/session
+    - Initializes sidebar navigation
+    - Loads dashboard data from backend
+ 
+ 2. **setupSidebarNavigation()**
+    - Attaches click handlers to nav links
+    - Switches between dashboard sections
+    - Updates active state
+ 
+ 3. **switchSection(sectionName)**
+    - Shows/hides dashboard sections
+    - Triggers data loading if needed
+    - Updates URL/history
+ 
+ 4. **loadDashboardData()**
+    - Sends GET request to Apps Script
+    - Fetches user's orders from Orders sheet
+    - Passes data to `populateDashboard()`
+ 
+ 5. **populateDashboard(orders)**
+    - Renders orders table with order data
+    - Displays order status (Pending, In Progress, Completed, Cancelled)
+    - Creates action buttons for each order
+    - Updates stats cards (total orders, spent, etc.)
+ 
+ 6. **openPaymentModal(orderId, dueAmount)**
+    - Displays payment UPI QR code
+    - Shows order details and amount
+    - Starts 2-minute timer
+ 
+ 7. **generateUPIQR(amount)**
+    - Creates UPI payment string with:
+      - Payee email/UPI ID
+      - Amount (in rupees)
+      - Order reference
+    - Encodes to QR code
+    - Displays QR image in modal
+ 
+ 8. **startQRTimer()**
+    - Starts 2-minute countdown
+    - Disables QR after expiration
+    - Prompts regeneration
+ 
+ 9. **regenerateQR()**
+    - Resets timer
+    - Generates new UPI QR code
+    - Updates modal
+ 
+ 10. **closePaymentModal()**
+     - Hides payment modal
+     - Clears modal data
+ 
+ ---
+ 
+ #### **9. dashboard.css** - Dashboard Styling
+ **Purpose:** Style the user dashboard with professional appearance.
+ 
+ **Layout:**
+ - Fixed sidebar (250px width)
+ - Main content area with margin-left offset
+ - Responsive adjustments for mobile
+ 
+ **Components:**
+ - Sidebar with gradient background and neon border
+ - Welcome header section
+ - Stats cards grid (4 columns)
+ - Orders table with scrolling
+ - Payment modal overlay
+ - QR code display area
+ 
+ ---
+ 
+ #### **10. Templates Directory** - Service Templates
+ 
+ Users can preview what their final website might look like with three template options:
+ 
+ ##### **Starter Template** (starter.html/js/css)
+ **Purpose:** Affordable, minimal template showcasing basic web design.
+ 
+ **Features:**
+ - Theme palette with 7 color schemes:
+   - Default (Blue)
+   - Dark Mode (Black)
+   - Nature (Green)
+   - Ocean (Blue-teal)
+   - Sunset (Orange-pink)
+   - Berry (Purple-red)
+   - Mono (Grayscale)
+ - Hero section with call-to-action
+ - Feature grid (4 features)
+ - Responsive navigation
+ - Back button to main site
+ - Footer with contact info
+ 
+ **Technology:**
+ - Theme switching via CSS variables
+ - localStorage for theme persistence
+ - Dynamic color updates on palette click
+ 
+ ---
+ 
+ ##### **Basic Template** (basic.html/js/css)
+ **Purpose:** Professional business template with corporate appeal.
+ 
+ **Features:**
+ - Brand color palette with 7 corporate options:
+   - Corporate Blue (#001f5c)
+   - Energetic Red (#c41e3a)
+   - Luxury Gold (#d4af37)
+   - Modern Teal (#008b8b)
+   - Professional Gray (#4a4a4a)
+   - Executive Navy (#002e5c)
+   - Elegant Purple (#4a148c)
+ - Navigation bar
+ - Hero section with tagline
+ - Services grid (6 services)
+ - About section
+ - Contact form
+ - Professional footer
+ 
+ **Technology:**
+ - CSS variable-based theming
+ - Responsive grid layouts
+ - Form validation
+ - Brand color switching
+ 
+ ---
+ 
+ ##### **Premium Template** (premium.html/js/css)
+ **Purpose:** High-end, visually stunning template with animations.
+ 
+ **Features:**
+ - Vibe palette with 7 dramatic themes:
+   - Cyberpunk (Neon blues, dark background)
+   - Sunset (Orange/pink gradients)
+   - Stealth (Dark, muted grays)
+   - Matrix (Green on black)
+   - Galaxy (Space/cosmic colors)
+   - Lava (Red/orange flow)
+   - Holo (Holographic/iridescent)
+ - Animated hero section
+ - Feature cards with icons
+ - Glowing effects and shadows
+ - Call-to-action section
+ - Animated footer
+ - Back button to main site
+ 
+ **Technology:**
+ - Advanced CSS animations
+ - Gradient generators
+ - Glow and shadow effects
+ - Theme-specific animations
+ - localStorage persistence
+ 
+ ---
+ 
+ #### **11. privacy.html & terms.html** - Legal Pages
+ **Purpose:** Display company policies and legal terms.
+ 
+ **Content:**
+ - Privacy Policy (data collection, GDPR compliance)
+ - Terms of Service (payment terms, refund policy, IP rights, scope, liability)
+ - Styled with company branding
+ - Back links to main site
+ 
+ ---
+ 
+ ## Backend Structure
+ 
+ ### Google Apps Script (code.gs)
+ 
+ **Purpose:** Server-side API handling all data operations and email notifications.
+ 
+ **Architecture:**
+ - Entry point: `doPost()` function (handles all POST requests)
+ - Helper functions for each form type
+ - Direct Google Sheets integration
+ - Email notification system
+ - CORS headers for cross-origin requests
+ 
+ ---
+ 
+ ### Backend File: code.gs
+ 
+ #### **Core Functions:**
+ 
+ 1. **doPost(e) - Main API Handler**
+ ```javascript
+ function doPost(e) {
+   // Parse incoming JSON
+   // Route to appropriate handler based on formType
+   // Return JSON response
+   // formTypes: 'register', 'login', 'contact', 'order'
+ }
+ ```
+ 
+ **Flow:**
+ - Accepts POST requests with JSON payload
+ - Parses request body
+ - Validates formType parameter
+ - Routes to appropriate handler
+ - Returns JSON response with success/error status
+ 
+ ---
+ 
+ 2. **handleRegistration(data) - User Registration**
+ ```javascript
+ function handleRegistration(data) {
+   // Input: { name, email, password }
+   // Validates required fields
+   // Checks for duplicate emails
+   // Hashes password using SHA-256
+   // Appends new row to Users sheet
+   // Sends welcome email to user
+   // Sends notification to admin
+   // Returns { success: boolean, message: string }
+ }
+ ```
+ 
+ **Users Sheet Structure:**
+ | Column | Header | Data Type |
+ |--------|--------|-----------|
+ | A | Date | Timestamp |
+ | B | Name | Text |
+ | C | Email | Email |
+ | D | Password_Hash | SHA-256 Hash |
+ | E | Status | Active/Inactive |
+ | F | Created | Date |
+ 
+ **Email Notifications:**
+ - To User: Welcome email with account details
+ - To Admin: New registration notification
+ 
+ ---
+ 
+ 3. **handleLogin(data) - User Authentication**
+ ```javascript
+ function handleLogin(data) {
+   // Input: { email, password }
+   // Searches Users sheet for email
+   // Compares password hash
+   // Returns user data if authenticated
+   // Returns error if not found
+ }
+ ```
+ 
+ **Response:**
+ ```json
+ {
+   "success": true,
+   "user": {
+     "id": "email",
+     "name": "string",
+     "email": "string",
+     "status": "Active"
+   }
+ }
+ ```
+ 
+ ---
+ 
+ 4. **handleContact(data) - Contact Form Submission**
+ ```javascript
+ function handleContact(data) {
+   // Input: { name, email, phone, message }
+   // Validates all required fields
+   // Appends to Contact_Inquiries sheet
+   // Sends email to admin
+   // Returns confirmation to user
+ }
+ ```
+ 
+ **Contact_Inquiries Sheet:**
+ | Column | Header | Data Type |
+ |--------|--------|-----------|
+ | A | Date | Timestamp |
+ | B | Name | Text |
+ | C | Email | Email |
+ | D | Phone | Phone |
+ | E | Message | Long Text |
+ | F | Status | New/Read/Responded |
+ 
+ ---
+ 
+ 5. **handleOrder(data) - Service Order Processing**
+ ```javascript
+ function handleOrder(data) {
+   // Input: { name, email, phone, service, amount, details }
+   // Generates Order ID (timestamp-based)
+   // Validates required fields
+   // Appends to Orders sheet
+   // Sends order confirmation to user
+   // Sends notification to admin
+   // Returns order details and UPI payment link
+ }
+ ```
+ 
+ **Orders Sheet:**
+ | Column | Header | Data Type |
+ |--------|--------|-----------|
+ | A | Date | Timestamp |
+ | B | Order_ID | Auto-generated |
+ | C | Name | Text |
+ | D | Email | Email |
+ | E | Phone | Phone |
+ | F | Service | Starter/Basic/Premium |
+ | G | Amount | Number (INR) |
+ | H | Status | Pending/In Progress/Completed/Cancelled |
+ | I | Details | Text |
+ | J | Payment_Status | Paid/Unpaid |
+ 
+ **Order ID Format:** `WP-TIMESTAMP-RANDOM` (e.g., WP-1672531200-5847)
+ 
+ ---
+ 
+ 6. **Helper Functions:**
+ 
+ - **getSheet(name)** - Retrieves a sheet by name
+ - **getSetting(key)** - Gets configuration value from Settings sheet
+ - **validateEmail(email)** - Email format validation
+ - **validatePhone(phone)** - Phone format validation
+ - **sendEmailNotification(recipient, subject, body)** - Sends email via MailApp
+ 
+ ---
+ 
+ ### Google Sheets Database Structure
+ 
+ #### **Sheet 1: Users Sheet**
+ Stores user account information and authentication data.
+ 
+ **Columns:**
+ - A: Date (registration timestamp)
+ - B: Name (user's full name)
+ - C: Email (login identifier)
+ - D: Password_Hash (SHA-256 encrypted)
+ - E: Status (Active/Inactive/Suspended)
+ - F: Created (account creation date)
+ 
+ **Data Example:**
+ ```
+ Date | Name | Email | Password_Hash | Status | Created
+ 2025-01-02 | John Doe | john@example.com | a1b2c3d4... | Active | 2025-01-02
+ ```
+ 
+ ---
+ 
+ #### **Sheet 2: Orders Sheet**
+ Tracks all service orders and transactions.
+ 
+ **Columns:**
+ - A: Date (order submission date)
+ - B: Order_ID (unique identifier)
+ - C: Name (customer name)
+ - D: Email (customer email)
+ - E: Phone (customer phone)
+ - F: Service (Starter/Basic/Premium)
+ - G: Amount (price in INR)
+ - H: Status (Pending/In Progress/Completed/Cancelled)
+ - I: Details (custom requirements)
+ - J: Payment_Status (Paid/Unpaid)
+ 
+ **Data Example:**
+ ```
+ Date | Order_ID | Name | Email | Service | Amount | Status | Payment_Status
+ 2025-01-02 | WP-1704192000-1234 | Jane Smith | jane@example.com | Premium | 9999 | Pending | Unpaid
+ ```
+ 
+ ---
+ 
+ #### **Sheet 3: Contact_Inquiries Sheet**
+ Stores website contact form submissions.
+ 
+ **Columns:**
+ - A: Date (submission timestamp)
+ - B: Name (inquirer name)
+ - C: Email (inquirer email)
+ - D: Phone (inquirer phone)
+ - E: Message (inquiry message)
+ - F: Status (New/Read/Responded)
+ 
+ **Data Example:**
+ ```
+ Date | Name | Email | Phone | Message | Status
+ 2025-01-02 | Bob Johnson | bob@example.com | 9408191506 | Website inquiry | New
+ ```
+ 
+ ---
+ 
+ #### **Sheet 4: Settings Sheet**
+ Configuration key-value pairs for the application.
+ 
+ **Columns:**
+ - A: Setting (key name)
+ - B: Value (configuration value)
+ 
+ **Pre-configured Settings:**
+ ```
+ Setting | Value
+ Admin Email | engagewebpot@gmail.com
+ Company Phone | +91 9408191506
+ Company Address | 123 Web Street
+ Payment UPI ID | engagewebpot@upi (or email)
+ Currency | INR
+ Time Zone | Asia/Kolkata
+ ```
+ 
+ ---
+ 
+ ## File-by-File Documentation
+ 
+ ### Root Level Files
+ 
+ #### **index.html** (240 lines)
+ - Landing page with all service information
+ - Contains hero, services, about, workflow, contact sections
+ - Modal divs for orders and payment
+ - Link to authentication and dashboard pages
+ 
+ #### **script.js** (280+ lines)
+ - Form submission handlers (selectService, submitOrder, submitContact)
+ - UPI QR code generation
+ - Modal management
+ - Mobile menu toggle
+ - Google Sign-In integration
+ - Payment flow management
+ 
+ #### **styles.css** (1800+ lines)
+ - Complete responsive design system
+ - CSS variables for theming
+ - Animations and transitions
+ - Breakpoints for all device sizes
+ - Modal and form styling
+ 
+ #### **auth.html** (160 lines)
+ - Two-form authentication page (login + register)
+ - Embedded terms/privacy modals
+ - Google Sign-In button
+ - Form validation UI
+ 
+ #### **auth.js** (200+ lines)
+ - Form validation (email, password strength)
+ - Registration and login logic
+ - Google OAuth handling
+ - Session/localStorage management
+ - Modal display logic
+ 
+ #### **auth.css** (1000+ lines)
+ - Form styling and animations
+ - Gradient backgrounds
+ - Modal styling
+ - Responsive layout
+ - Input validation visuals
+ 
+ #### **dashboard.html** (280 lines)
+ - Sidebar navigation structure
+ - Welcome header with user info
+ - Content sections (orders, payments, profile)
+ - Payment modal with QR code area
+ - Stats cards grid
+ 
+ #### **dashboard.js** (300+ lines)
+ - Initialize dashboard on page load
+ - Sidebar navigation
+ - Section switching
+ - Load user orders from backend
+ - Payment modal management
+ - QR code generation and timer
+ 
+ #### **dashboard.css** (594 lines)
+ - Sidebar layout and styling
+ - Main content area layout
+ - Stats cards grid
+ - Orders table styling
+ - Modal styling
+ - Responsive adjustments
+ 
+ #### **Templates/starter.html** (120 lines)
+ - Theme palette selector
+ - Hero section
+ - Features grid
+ - Footer with contact info
+ 
+ #### **Templates/starter.js** (180 lines)
+ - Theme switching logic
+ - localStorage persistence
+ - Event listeners for palette buttons
+ - CSS variable updates
+ 
+ #### **Templates/starter.css** (850 lines)
+ - CSS variables for 7 themes
+ - Header and navigation
+ - Hero section
+ - Features grid
+ - Responsive design
+ 
+ #### **Templates/basic.html** (140 lines)
+ - Brand color palette selector
+ - Navigation bar
+ - Hero section
+ - Services grid
+ - About section
+ - Contact form
+ - Footer
+ 
+ #### **Templates/basic.js** (200 lines)
+ - Brand color switching
+ - Form submission
+ - Event handlers
+ - localStorage theming
+ 
+ #### **Templates/basic.css** (900 lines)
+ - CSS variables for 7 corporate themes
+ - Navigation styling
+ - Services grid
+ - About section
+ - Contact form styling
+ - Responsive design
+ 
+ #### **Templates/premium.html** (160 lines)
+ - Vibe palette selector
+ - Hero section with animations
+ - Feature cards
+ - Call-to-action section
+ - Footer
+ - Back button
+ 
+ #### **Templates/premium.js** (220 lines)
+ - Vibe switching with animations
+ - Advanced theme handling
+ - Event delegation
+ - localStorage persistence
+ - Animated color transitions
+ 
+ #### **Templates/premium.css** (1200+ lines)
+ - CSS variables for 7 vibe themes
+ - Gradient definitions
+ - Animation keyframes
+ - Glow and shadow effects
+ - Feature cards styling
+ - Responsive design
+ 
+ #### **privacy.html** (100 lines)
+ - Privacy policy content
+ - Data protection information
+ - Back link to home
+ 
+ #### **terms.html** (200 lines)
+ - Terms of service content
+ - Payment and refund policies
+ - IP rights and revisions
+ - Scope of work
+ - Back link to home
+ 
+ #### **updates.html** (80 lines)
+ - Updates and news page
+ - Back link to home
+ 
+ #### **Readme.md** (150 lines)
+ - Project overview
+ - Setup instructions
+ - Feature list
+ - Tech stack documentation
+ 
+ #### **code.gs** (350+ lines)
+ - Google Apps Script backend
+ - doPost() main handler
+ - Registration handler
+ - Login handler
+ - Contact handler
+ - Order handler
+ - Email notification functions
+ - Validation helpers
+ - Sheet management functions
+ 
+ #### **CNAME** (1 line)
+ - Domain mapping: `webpot.shop`
+ 
+ ---
+ 
+ ## Workflow & Data Flow
+ 
+ ### User Journey - Registration to Order
+ 
+ ```
+ ┌─────────────────────────────────────────────────────────────┐
+ │ Step 1: User visits index.html (Landing Page)               │
+ │ - Browses services and pricing                              │
+ │ - Clicks "Choose Plan" button                               │
+ └────────────────┬────────────────────────────────────────────┘
+                  │
+ ┌─────────────────▼────────────────────────────────────────────┐
+ │ Step 2: Order Modal Opens (script.js)                       │
+ │ - Service and price pre-filled                              │
+ │ - User enters name, email, phone, details                   │
+ │ - Clicks "Place Order"                                      │
+ └────────────────┬────────────────────────────────────────────┘
+                  │
+                  │ submitOrder() validates and sends POST
+                  │ formType: 'order'
+                  │ Destination: Google Apps Script Web App
+                  │
+ ┌─────────────────▼────────────────────────────────────────────┐
+ │ Step 3: Google Apps Script Backend (code.gs)                │
+ │ - doPost() receives order data                              │
+ │ - Routes to handleOrder()                                   │
+ │ - Validates all fields                                      │
+ │ - Generates unique Order ID                                 │
+ │ - Appends to Orders sheet                                   │
+ │ - Sends confirmation email to user                          │
+ │ - Sends notification to admin                               │
+ │ - Returns order details                                     │
+ └────────────────┬────────────────────────────────────────────┘
+                  │
+                  │ Response sent back to frontend
+                  │ JSON: { success: true, orderId: "...", ... }
+                  │
+ ┌─────────────────▼────────────────────────────────────────────┐
+ │ Step 4: Payment Modal Opens (script.js)                     │
+ │ - generateUPIQR() creates QR code                           │
+ │ - Shows amount and order details                            │
+ │ - Starts 2-minute timer                                     │
+ │ - User scans and pays via UPI                               │
+ └─────────────────────────────────────────────────────────────┘
+ ```
+ 
+ ### User Journey - Registration to Dashboard
+ 
+ ```
+ ┌─────────────────────────────────────────────────────────────┐
+ │ Step 1: User clicks login/register button                   │
+ │ - Redirected to auth.html                                   │
+ └────────────────┬────────────────────────────────────────────┘
+                  │
+ ┌─────────────────▼────────────────────────────────────────────┐
+ │ Step 2: Registration (auth.js)                              │
+ │ - Switches to Register tab                                  │
+ │ - User enters name, email, password                         │
+ │ - Password strength validated                               │
+ │ - Must agree to Terms & Privacy                             │
+ │ - Clicks "Register"                                         │
+ └────────────────┬────────────────────────────────────────────┘
+                  │
+                  │ submitRegistration() sends POST
+                  │ formType: 'register'
+                  │ Destination: Google Apps Script
+                  │
+ ┌─────────────────▼────────────────────────────────────────────┐
+ │ Step 3: Backend Registration (code.gs)                      │
+ │ - Validates email not already registered                    │
+ │ - Hashes password (SHA-256)                                 │
+ │ - Appends to Users sheet                                    │
+ │ - Sends welcome email                                       │
+ │ - Returns success response                                  │
+ └────────────────┬────────────────────────────────────────────┘
+                  │
+                  │ Response: { success: true, user: {...} }
+                  │
+ ┌─────────────────▼────────────────────────────────────────────┐
+ │ Step 4: Redirect to Dashboard (dashboard.html)              │
+ │ - initializeDashboard() runs                                │
+ │ - Loads user profile from localStorage                      │
+ │ - loadDashboardData() fetches user's orders                 │
+ │ - Displays stats and order history                          │
+ │ - Shows payment options                                     │
+ └─────────────────────────────────────────────────────────────┘
+ ```
+ 
+ ### Contact Form Workflow
+ 
+ ```
+ User fills contact form
+          │
+          ▼
+ submitContact() (script.js)
+          │
+          ▼ POST request
+ Google Apps Script (handleContact)
+          │
+     ┌────┴────┐
+     │          │
+     ▼          ▼
+ Append to   Send email to
+ Contact_    admin with
+ Inquiries   inquiry details
+ sheet
+ ```
+ 
+ ### Authentication Flow
+ 
+ ```
+ Frontend (auth.js)
+     │
+     ├─ Login: Check email → Hash password → Compare with Users sheet
+     │
+     ├─ Register: Validate email → Hash password → Add to Users sheet
+     │
+     └─ Google OAuth: Verify token → Create/update user → Set session
+          │
+          ▼
+     Backend (code.gs)
+          │
+     Google Sheets (Users sheet)
+ ```
+ 
+ ---
+ 
+ ## Key Features
+ 
+ ### 1. **Service Packages**
+ - **Starter (₹999):** Basic website with 3-5 pages
+ - **Basic (₹4999):** Professional site with 8-10 pages + SEO
+ - **Premium (₹9999):** Custom high-end design + advanced features
+ 
+ ### 2. **User Authentication**
+ - Email/password registration with strength validation
+ - Google Sign-In OAuth integration
+ - Secure password hashing (SHA-256)
+ - Session management via localStorage
+ 
+ ### 3. **Payment System**
+ - UPI QR code generation
+ - Dynamic amount calculation based on service
+ - 2-minute QR validity timer
+ - Auto-regenerate QR code feature
+ - Payment tracking in Orders sheet
+ 
+ ### 4. **Order Management**
+ - Service order creation
+ - Unique Order ID generation
+ - Order status tracking (Pending, In Progress, Completed)
+ - Custom requirements field
+ - Order history in dashboard
+ 
+ ### 5. **User Dashboard**
+ - Sidebar navigation
+ - User profile display
+ - Active orders table
+ - Payment history and status
+ - Section switching (Orders, Payments, Profile)
+ - Stats cards (Total Orders, Completed, Pending, Spent)
+ 
+ ### 6. **Email Notifications**
+ - Welcome email on registration
+ - Order confirmation email
+ - Admin notifications for new orders/registrations
+ - Contact inquiry acknowledgment
+ 
+ ### 7. **Template Previews**
+ - Three sample templates (Starter, Basic, Premium)
+ - Theme/vibe switching for each template
+ - localStorage persistence of theme choice
+ - Responsive design for all templates
+ 
+ ### 8. **Responsive Design**
+ - Mobile-first approach
+ - Breakpoints for all screen sizes
+ - Touch-friendly buttons and forms
+ - Mobile menu navigation
+ 
+ ### 9. **Contact Management**
+ - Contact form on landing page
+ - Contact inquiry storage
+ - Admin notification on submission
+ - Status tracking (New, Read, Responded)
+ 
+ ---
+ 
+ ## Deployment Guide
+ 
+ ### Frontend Deployment Options
+ 
+ #### **Option A: Firebase Hosting (Recommended)**
+ 
+ 1. **Install Firebase CLI:**
+    ```bash
+    npm install -g firebase-tools
+    ```
+ 
+ 2. **Login to Firebase:**
+    ```bash
+    firebase login
+    ```
+ 
+ 3. **Initialize Firebase:**
+    ```bash
+    firebase init hosting
+    ```
+    - Select "Create a new project" or existing
+    - Public directory: `.` (current directory)
+    - Single-page app: No
+    - Auto-deploy on git push: No
+ 
+ 4. **Deploy:**
+    ```bash
+    firebase deploy
+    ```
+ 
+ 5. **Get Live URL:**
+    - Firebase provides URL like: `https://webpot-xxxxx.web.app`
+ 
+ ---
+ 
+ #### **Option B: GitHub Pages**
+ 
+ 1. Create GitHub repository
+ 2. Push all files to `main` branch
+ 3. Enable GitHub Pages in repo settings
+ 4. Select `main` branch as source
+ 5. Access at `https://username.github.io/repo-name`
+ 
+ ---
+ 
+ #### **Option C: Custom Domain Hosting**
+ 
+ 1. Purchase domain (e.g., webpot.shop via Godaddy, Namecheap)
+ 2. Upload files via FTP/SFTP to hosting provider
+ 3. Set domain DNS to point to hosting server
+ 4. Update CNAME file with domain
+ 
+ ---
+ 
+ ### Backend Deployment
+ 
+ #### **Google Apps Script Setup:**
+ 
+ 1. **Create Google Sheet:**
+    - Go to Google Sheets
+    - Create new spreadsheet: "Webpot Backend"
+    - Create 4 sheets: Users, Orders, Contact_Inquiries, Settings
+ 
+ 2. **Deploy Apps Script:**
+    - Open Apps Script (Extensions > Apps Script)
+    - Copy code.gs contents
+    - Click "Deploy" > "New Deployment"
+    - Type: "Web App"
+    - Execute as: [Your Account]
+    - Who has access: "Anyone"
+    - Copy deployment URL
+ 
+ 3. **Update Frontend:**
+    - In script.js, find all `fetch()` calls
+    - Replace `YOUR_APPS_SCRIPT_URL` with deployment URL
+    ```javascript
+    const APPS_SCRIPT_URL = "https://script.google.com/macros/d/YOUR_DEPLOYMENT_ID/userweb/do";
+    ```
+ 
+ 4. **Configure Settings Sheet:**
+    - Admin Email: engagewebpot@gmail.com
+    - Company Phone: +91 9408191506
+    - Payment UPI ID: email@upi or payment ID
+ 
+ ---
+ 
+ ### Environment Configuration
+ 
+ **Settings to Update:**
+ 
+ 1. **Email Configuration (code.gs):**
+    - Admin email address
+    - Sender name
+    - Email templates
+ 
+ 2. **Frontend Constants (script.js):**
+    - Apps Script URL
+    - Google OAuth Client ID
+    - Payment UPI details
+ 
+ 3. **Google OAuth Setup:**
+    - Go to Google Cloud Console
+    - Create OAuth 2.0 credentials
+    - Add authorized JavaScript origins
+    - Copy Client ID to auth.js
+ 
+ ---
+ 
+ ## Maintenance & Future Development
+ 
+ ### Regular Tasks
+ 
+ - **Monitor Orders Sheet:** Check for new orders, update status
+ - **Check Emails:** Monitor registration and inquiry emails
+ - **Update Settings:** Modify pricing, admin email as needed
+ - **Backup Data:** Export Google Sheets regularly
+ 
+ ### Enhancement Ideas
+ 
+ 1. **Email Templates:** Add rich HTML email formatting
+ 2. **Payment Integration:** Connect actual payment gateway (Razorpay, PayU)
+ 3. **Automated Invoices:** Generate and email PDF invoices
+ 4. **CRM Integration:** Sync with CRM system
+ 5. **Advanced Analytics:** Track conversion metrics
+ 6. **Multi-language Support:** Add language switcher
+ 7. **Admin Panel:** Create admin dashboard for managing orders
+ 8. **Two-Factor Authentication:** Add 2FA for security
+ 9. **API Rate Limiting:** Prevent abuse
+ 10. **Database Migration:** Move from Sheets to proper database
+ 
+ ---
+ 
+ ## Security Considerations
+ 
+ ### Current Implementation
+ ✅ HTTPS recommended (use Firebase/custom HTTPS)  
+ ✅ Password hashing (SHA-256)  
+ ✅ Email validation  
+ ✅ CORS headers configured  
+ ✅ Input validation on backend  
+ 
+ ### Recommended Improvements
+ ⚠️ Add password reset functionality  
+ ⚠️ Implement rate limiting on API  
+ ⚠️ Add CAPTCHA to forms  
+ ⚠️ Use stronger hashing (bcrypt) instead of SHA-256  
+ ⚠️ Add audit logging  
+ ⚠️ Implement session expiration  
+ ⚠️ Add SQL injection prevention (already safe with Sheets)  
+ 
+ ---
+ 
+ ## Summary
+ 
+ Webpot is a complete web development services platform with:
+ 
+ - **Frontend:** HTML, CSS, JavaScript with responsive design
+ - **Backend:** Google Apps Script with Google Sheets database
+ - **Features:** User authentication, order management, payments, dashboard
+ - **Templates:** Three design templates showcasing different styles
+ - **Deployment:** Ready for Firebase, GitHub Pages, or custom hosting
+ 
+ All code is modular, well-documented, and follows best practices for maintainability and scalability.
+ 
+ ---
+ 
+ **For Questions or Support:**
+ - Email: engagewebpot@gmail.com
+ - Phone: +91 9408191506
+ - Website: webpot.shop
+ 
+ ---
+ 
+ *Documentation Generated: January 2, 2026*
+ *Webpot Store - Complete Codebase Documentation*
+ 