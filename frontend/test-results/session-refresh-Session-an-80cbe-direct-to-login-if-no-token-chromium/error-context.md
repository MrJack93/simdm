# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: session-refresh.spec.js >> Session and Token Refresh >> Protected routes redirect to login if no token
- Location: e2e\session-refresh.spec.js:74:3

# Error details

```
Error: page.evaluate: SecurityError: Failed to read the 'sessionStorage' property from 'Window': Access is denied for this document.
    at UtilityScript.evaluate (<anonymous>:304:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
```