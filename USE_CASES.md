# MailAI Analytics - Use Cases & Requirements

## Definitions
> **"Real-time"**: In the context of this dashboard, "Real-time" means **Listening to Database Events**. We are NOT visualizing the internal state of the n8n workflow nodes as they execute. Instead, we subscribe to Supabase `INSERT` and `UPDATE` events on the `email_analytics` and `email_decisions` tables. As soon as the workflow finishes a step and writes to the DB, it appears on the dashboard immediately (push), rather than waiting for a periodic refresh (poll).

## 1. Operational Monitoring (The "Live" View)
*By System Administrator / DevOps*

*   **UC-01: Monitor System Health**
    *   **User want to**: See at a glance if the system is running healthy (up status, error rates, average latency).
    *   **The System shall**: Display key metrics (Success Rate, Avg Processing Time, Error Count) for the current day.
    *   **The System shall**: Visually highlight abnormal error rates or latencies.

*   **UC-02: Live Activity Feed (Supabase Realtime)**
    *   **User want to**: Watch completed actions appear immediately to trust the system is active.
    *   **The System shall**: Subscribe to new rows in `email_decisions` and display them instantly as they are committed to the database.
    *   **The System shall**: Clearly distinguish between "Live" traffic and "Backfill/Test" traffic.

*   **UC-03: Error Investigation**
    *   **User want to**: Quickly identify and diagnose failed processing attempts.
    *   **The System shall**: Provide a filtered view of all "Error" status records.
    *   **User want to**: See the stack trace and error message for a specific failure.

## 2. Analytics & Cost Management
*By Business Owner / Stakeholder*

*   **UC-04: Cost Analysis**
    *   **User want to**: Understand the running cost of the AI models.
    *   **The System shall**: Aggregate `estimated_cost_usd` by day/week/month.
    *   **User want to**: See which specific workflows or nodes are most expensive.

*   **UC-05: Volume Tracking**
    *   **User want to**: See how many emails are being handled automatically vs manually.
    *   **The System shall**: Display trends of "Emails Processed" vs "Corrections made".

## 3. Learning & Improvement (The "Feedback Loop")
*By AI Trainer / Power User*

*   **UC-06: Review Corrections**
    *   **User want to**: Understand *why* the AI made a mistake that required correction.
    *   **The System shall**: Show a side-by-side comparison of "AI Decision" vs "User Actual Move".
    *   **User want to**: See the specific folder paths and the AI's original reasoning (if captured).

*   **UC-07: Drill-Down into Decision Logic**
    *   **User want to**: Inspect the full context of a decision (input prompt tokens, model used, output JSON).
    *   **The System shall**: Provide a detailed detail view for every transaction ID.

## 4. Data Management & Admin
*By Developer / Admin*

*   **UC-08: Data Filtering (Test vs Prod)**
    *   **User want to**: Exclude "Historical Backfill" and "Test" runs from the main dashboard stats so that metrics reflect real-world performance.
    *   **The System shall**: Provide a global toggle to switch between "Live Data", "All Data", and "Test Data".

*   **UC-09: Traceability & Search**
    *   **User want to**: Find out what happened to a specific email (e.g., "Where did the invoice from 'Vendor X' go?").
    *   **The System shall**: Allow searching by Subject, Sender, or Date to find specific decision logs.

*   **UC-10: System Configuration**
    *   **User want to**: View and potentially edit system parameters (e.g., AI thresholds, model selection) without touching the database directly.
    *   **The System shall**: Provide a read/write interface for the `email_system_config` table.
