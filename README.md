
Tech stack
Node.js, Express (HTTP API)

Sequelize (database ORM)

moment-timezone (time math)

CSV written to disk under public/reports

Prerequisites
Node.js (LTS) and npm

Database (e.g., PostgreSQL/MySQL/SQLite) reachable via environment variables

CSV data loaded into database tables (StoreStatus, BusinessHour, StoreTimezone)

Configuration
Create a .env file at the project root. Example keys:

PORT=3000

DATABASE_URL=postgres://user:pass@localhost:5432/monitoring

VERBOSE_LOGS=true

NODE_ENV=development

Ensure .env is in .gitignore.

Installation
npm install

Run database migrations and seed steps (if provided) to import CSV data into tables.

Verify DB connectivity via logs on startup.

Running
Development:

npm run dev

Production:

npm start

The server listens on http://localhost:3000 by default (configurable via PORT).

API Reference
POST /api/trigger_report
Triggers generation of the report based on current data in the database.

Request: no body

Response (200):
{
"report_id": "89292b8d-7bde-4c8d-a2ef-c5ac65f0284f"
}

Example:

curl -X POST http://localhost:3000/api/trigger_report

GET /api/get_report/:report_id
Polls report status; returns “Running”, or “Complete” with the CSV stream/download.

Improvements (suggested)
Move report work to a queue with retries
Batch/concurrent store processing; cache business hours per store/day-of-week.
Use non-blocking write streams and stream rows to reduce memory footprint.



