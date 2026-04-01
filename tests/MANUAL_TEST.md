# Manual Test Guide

Step-by-step instructions to manually verify every component of the Stream Monitoring Service.

---

## Prerequisites

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Copy and configure .env
cp .env.example .env
```

Edit `.env`:
```env
NODE_ENV=development
DISABLE_IP_WHITELIST=true
LOG_LEVEL=debug
```

---

## Test 1: Start Server

```bash
npm run dev
```

**Expected output:**
```
-------------------------------------------
  Stream Monitoring Service - Starting...
-------------------------------------------
  Mode: DEVELOPMENT
Using JSON file storage (development mode)
[JsonStorage] Loaded 0 streamers, 0 events, 0 users
Starting smart scheduler (tick: 30s, batch: 10, min interval: 300s)
API server running on http://0.0.0.0:3000
   Health check: http://0.0.0.0:3000/health
-------------------------------------------
  Service fully operational
-------------------------------------------
```

**PASS if:** Server starts without errors, shows development mode.

---

## Test 2: Health Check

```bash
curl http://localhost:3000/health
```

**Expected response:**
```json
{
  "status": "ok",
  "uptime": 5.123,
  "scheduler": true,
  "timestamp": "2026-03-31T12:00:00.000Z"
}
```

**PASS if:** Status is "ok", scheduler is true.

---

## Test 3: Add Streamer

```bash
curl -X POST http://localhost:3000/streamers \
  -H "Content-Type: application/json" \
  -d '{"platform":"twitch","username":"testuser","userId":"manual_user_1"}'
```

**Expected response (201):**
```json
{
  "streamer": {
    "id": "dev_...",
    "platform": "twitch",
    "username": "testuser",
    "isLive": false
  }
}
```

**PASS if:** Returns 201, has streamer object with id, platform, username.

> Save the returned `id` for later steps.

---

## Test 4: List Streamers

```bash
curl http://localhost:3000/streamers
```

**Expected response (200):**
```json
{
  "streamers": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "totalPages": 1
  }
}
```

**PASS if:** Returns array with the streamer added in Test 3.

---

## Test 5: Get Streamer by ID

Replace `STREAMER_ID` with the ID from Test 3:

```bash
curl http://localhost:3000/streamers/STREAMER_ID
```

**PASS if:** Returns the specific streamer with events and user info.

---

## Test 6: Filter by Platform

```bash
curl "http://localhost:3000/streamers?platform=twitch"
```

**PASS if:** Only returns streamers with platform "twitch".

---

## Test 7: Get Events

```bash
curl http://localhost:3000/events
```

**Expected response (200):**
```json
{
  "events": [],
  "count": 0
}
```

**PASS if:** Returns empty events array (no offline to live transitions yet).

---

## Test 8: Wait for Scheduler

Wait 30-60 seconds and watch the server logs.

**Expected logs:**
```
Scheduler: 1 streamers ready to check
[twitch] testuser: offline
```

**PASS if:** Scheduler checks the streamer and logs the result.

---

## Test 9: Check Events After Scheduler

```bash
curl http://localhost:3000/events
```

**Note:** Events are only created when a streamer transitions from offline to live. If the streamer is currently live, you will see an event.

---

## Test 10: Invalid Platform (400)

```bash
curl -X POST http://localhost:3000/streamers \
  -H "Content-Type: application/json" \
  -d '{"platform":"facebook","username":"test","userId":"user1"}'
```

**Expected response (400):**
```json
{
  "error": "Unsupported platform 'facebook'. Allowed: twitch, youtube, tiktok"
}
```

**PASS if:** Returns 400 with clear error message.

---

## Test 11: Invalid Username (400)

```bash
curl -X POST http://localhost:3000/streamers \
  -H "Content-Type: application/json" \
  -d '{"platform":"twitch","username":"bad<>chars","userId":"user1"}'
```

**PASS if:** Returns 400 — special characters rejected.

---

## Test 12: Delete Streamer

Replace `STREAMER_ID` with the ID from Test 3:

```bash
curl -X DELETE http://localhost:3000/streamers/STREAMER_ID
```

**Expected response (200):**
```json
{
  "message": "Streamer deleted",
  "id": "STREAMER_ID"
}
```

**PASS if:** Returns 200 with deletion confirmation.

---

## Test 13: IP Whitelist Enforcement

1. Stop the server
2. Edit `.env`:
   ```env
   DISABLE_IP_WHITELIST=false
   WHITELIST=
   ```
3. Restart: `npm run dev`
4. Test events endpoint:
   ```bash
   curl http://localhost:3000/events
   ```

**PASS if:** Returns 200 (localhost is always allowed).

To test blocking, you would need to make a request from a non-localhost IP.

---

## Test 14: JSON Storage Files

Check that data files were created:

```bash
# Windows
dir data\

# Linux/Mac
ls -la data/
```

**Expected files:**
```
streamers.json
events.json
users.json
```

**PASS if:** All 3 JSON files exist in /data/ directory.

---

## Test 15: Duplicate Streamer (409)

```bash
# Add a streamer
curl -X POST http://localhost:3000/streamers \
  -H "Content-Type: application/json" \
  -d '{"platform":"twitch","username":"duptest","userId":"dup_user"}'

# Try to add the same one again
curl -X POST http://localhost:3000/streamers \
  -H "Content-Type: application/json" \
  -d '{"platform":"twitch","username":"duptest","userId":"dup_user"}'
```

**PASS if:** First call returns 201, second returns 409.

---

## Test 16: Events with Since Filter

```bash
curl "http://localhost:3000/events?since=2026-03-31T00:00:00.000Z"
```

**PASS if:** Returns only events created after the specified timestamp.

---

## Summary Checklist

| # | Test | Expected | Status |
|---|------|----------|--------|
| 1 | Server start | No errors | |
| 2 | Health check | 200, ok | |
| 3 | Create streamer | 201 | |
| 4 | List streamers | 200, array | |
| 5 | Get by ID | 200, details | |
| 6 | Filter platform | Only matching | |
| 7 | Get events | 200, array | |
| 8 | Scheduler runs | Logs checks | |
| 9 | Events after live | Event created | |
| 10 | Bad platform | 400 | |
| 11 | Bad username | 400 | |
| 12 | Delete streamer | 200 | |
| 13 | IP whitelist | Enforced | |
| 14 | JSON files | Created | |
| 15 | Duplicate | 409 | |
| 16 | Since filter | Filtered | |
