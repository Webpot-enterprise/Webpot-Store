Webpot User Dashboard — Functional & System Specification
1. Purpose of the Dashboard

The Webpot User Dashboard is a secured, authenticated customer portal that allows a logged-in user to manage their relationship with Webpot.

It acts as:

The customer’s control panel

A single source of truth for orders, payments, and services

A replacement for manual communication (email / WhatsApp updates)

A foundation for future automation and scaling

The dashboard must only be accessible after successful authentication and must operate entirely on user-scoped backend data.

2. Core Principles
2.1 Authentication-First Architecture

Every dashboard page is protected

Access requires a valid session token

Token is verified on load

If invalid or expired → redirect to auth page

There is no public state inside the dashboard.

2.2 Backend-Driven Rendering

UI does not contain hardcoded user data

All numbers, lists, and profile data come from APIs

Dashboard renders based on real backend state

The frontend is a renderer, not a data source.

2.3 User-Scoped Data Isolation

Every API request is tied to a user_id

A user can only see their own data

Orders, referrals, notifications, and profile info are filtered server-side

This is critical for security and correctness.

3. High-Level System Flow

User logs in (email/password or Google)

Backend issues a session token

Token is stored client-side

User is redirected to dashboard

Dashboard:

Verifies token

Fetches user profile

Fetches dashboard data

UI renders dynamically

4. Dashboard Structure
4.1 Global Layout (Persistent Across Pages)

Every dashboard page shares the same layout:

Top navigation bar

Left sidebar navigation

Main content area

Top Navigation Bar

Webpot logo (click → main website)

Navigation links

Notification icon (with unread count)

User avatar + dropdown

Sidebar Navigation

Dashboard (overview)

Orders

Settings

5. Dashboard Pages & Behavior
5.1 Dashboard Overview Page

Purpose:
Give the user a quick summary of their account status.

Displays:

Total number of orders

Total amount spent

Referral count

User profile summary

Behavior:

Data is fetched on page load

Shows loading states while fetching

Displays zero or empty states if no data exists

This page is read-only and informational.

5.2 Orders Page

Purpose:
Allow the user to view and manage their service orders.

Each order includes:

Order ID

Customer name & email

Service plan

Total amount

Due amount

Order status

Delivery date

Features:

Filter by order status

Search orders

Summary metrics:

Total orders

Pending orders

Delivered orders

Total revenue

Behavior:

Orders are fetched from backend using user session

Data updates automatically when backend changes

No order can belong to another user

This is the core operational page of the dashboard.

5.3 User Profile Section

Purpose:
Represent the user’s identity inside the system.

Contains:

Full name

Email address

Authentication provider

Account metadata

Capabilities:

View profile info

Edit profile (future scope)

Profile data is always fetched from backend, never cached blindly.

5.4 Notifications System

Purpose:
Deliver system-initiated updates to the user.

Examples:

Order created

Payment reminders

Service updates

Admin messages

Behavior:

Notifications are fetched after authentication

Unread count is shown in navbar

Non-blocking (dashboard still loads if notifications fail)

5.5 Settings Page

Purpose:
Account configuration and preferences.

Scope:

Profile updates

Security actions

Preferences

Logout

This page is designed for future extensibility.

6. Backend Responsibilities

The backend must provide:

Authentication

User registration

Login (local + Google)

Token issuance

Token validation

Session expiry

Data Management

Users table

Orders table

Referral codes

Notifications

Logs

Security

User-scoped access

Token hashing

Expiration handling

Request validation

7. Frontend Responsibilities

The frontend must:

Enforce authentication on every dashboard page

Load scripts in correct order

Fetch data only after auth is confirmed

Render UI from API responses

Handle empty, loading, and error states gracefully

Never assume backend success

8. What the Dashboard Is Not

It is not a static site

It is not a demo UI

It is not client-side state driven

It is not multi-tenant without backend filtering

9. Mental Model for the Developer

You should think of this dashboard as:

“A mini SaaS customer portal, where the backend is the source of truth and the frontend is a dynamic viewer.”

If backend data changes, the dashboard must reflect it automatically.

10. Final One-Line Description (Hand-Off Ready)

The Webpot User Dashboard is an authenticated, backend-driven customer portal that allows users to view and manage their orders, profile, referrals, and notifications in real time, with strict user-scoped security and a scalable SaaS-style architecture.