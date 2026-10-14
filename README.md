# DasaraDesk — Activity Attendance Platform

A responsive React + Vite attendance manager for coordinators who need separate attendance records for multiple events, many members, multiple dates, and multiple sessions per day.

## Features
- Create independent event workspaces (for example, Dasara Activity Attendance).
- Add hundreds of member names in one go. Paste one name per line; comma-separated names also work.
- Plan a date range and configure 1–12 named sessions with individual start times.
- Record Present, Absent, Late, or Excused for each member in each session.
- Bulk mark all members present/absent, search the roster, and filter by status.
- Event history and session-by-session completion tracking.
- Download a session CSV or complete event CSV.
- Print a clean official attendance sheet or choose **Save as PDF** in the print dialog.
- Light/dark themes and responsive phone/tablet/desktop layouts.
- Automatic browser-local persistence; data remains after refresh.

## Run locally
1. Install Node.js 18 or newer.
2. Extract the ZIP and open a terminal in this folder.
3. Run:
   ```bash
   npm install
   npm run dev
   ```
4. Open the local URL shown by Vite.

To create a production build:
```bash
npm run build
npm run preview
```

## Important storage note
This is a local-first, single-device prototype. It saves records in this browser's `localStorage`, so refreshes do not erase attendance. Records are not automatically synced between browsers or devices, and clearing browser/site data can erase them. Use **Export all** regularly to create a backup. A server/database can be added later if multiple coordinators need shared access.

## PDF reports
Use **Print / Save as PDF** in the active session. In the browser print window, select **Save as PDF** as the destination. The report includes the event name, date, session, member list, status, and signature/remarks column.
