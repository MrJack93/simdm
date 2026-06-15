---
description: "Run SIMDM API smoke test — login, extract token, verify protected endpoints"
---

# SIMDM API Smoke Test

Quick health check for the SIMDM backend. Login as `inginer`, verify token works, hit a protected endpoint.

## Usage

```
/smoke-test
```

## Procedure

1. Check backend health:
   ```bash
   curl -s http://localhost:3001/api/health
   ```

2. Login and extract token:
   ```bash
   TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"inginer","password":"admin"}' | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
   ```

3. Verify protected endpoint:
   ```bash
   curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/sections
   ```

4. Report results: ✅ Backend OK / ❌ Backend down / ⚠️ Auth broken

## Expected output

- Health returns JSON status
- Login returns `{ accessToken: "eyJ..." }`
- Sections returns array of hospital sections
