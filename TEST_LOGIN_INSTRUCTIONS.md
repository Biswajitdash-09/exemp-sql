# How to Test Verifier Login

## Issue Resolved ✅

The verifier `adityamathan@codemateai.dev` has been added to the server storage and should now be able to login.

## Login Steps

### Step 1: Navigate to the Login Page
Open your browser and go to:
```
http://localhost:3000/login
```
**NOT** `/verifier/login` (that page doesn't exist, which is why you saw 404)

### Step 2: Enter Credentials
```
Email: adityamathan@codemateai.dev
Password: Aditya@12345
```

### Step 3: Check if Login is Successful
After clicking "Login", you should:
1. See a success message
2. Be redirected to `/verify` page (the verification wizard)
3. Have a token stored in browser localStorage

### Step 4: Check Browser Console
Open browser DevTools (F12) and check the Console tab for debug logs. The debug API service will show:
- Token retrieval
- Authorization header being added
- API requests being made

### Step 5: Check LocalStorage
In DevTools, go to Application → Storage → Local Storage → `http://localhost:3000`

You should see:
- `verifier_session` with a JSON object containing:
  - `id`
  - `email`
  - `companyName`
  -  **`token`** (this is critical!)
  - `userType: "verifier"`

## Troubleshooting

### Problem: "Verifier access required" error

This means:
1. ✅ Login was successful
2. ✅ You accessed the `/verify` page
3. ❌ The token is either:
   - Missing from localStorage
   - Not being sent with API requests
   - Invalid or doesn't have `role: 'verifier'` in the JWT payload

#### Solution: Check the JWT Token

Run this in browser console after login:
```javascript
// Get the session
const session = JSON.parse(localStorage.getItem('verifier_session'));
console.log('Session:', session);

// Check if token exists
console.log('Has token:', !!session.token);

if (session.token) {
  // Decode the JWT token (just the payload, not verifying signature)
  const parts = session.token.split('.');
  const payload = JSON.parse(atob(parts[1]));
  console.log('Token payload:', payload);
  console.log('Role in token:', payload.role);
}
```

The payload should contain:
```json
{
  "id": "_ver1",
  "email": "adityamathan@codemateai.dev",
  "companyName": "codemate.ai",
  "role": "verifier",  ← THIS IS CRITICAL!
  "testMode": false,
  "iat": <timestamp>,
  "exp": <timestamp>,
  "iss": "employee-verification-portal",
  "aud": "verification-users"
}
```

### Problem: Token missing from localStorage

If the token is not being stored:
1. Check the login API response in Network tab
2. Make sure the response has `data.token`
3. Check for JavaScript errors in console

### Problem: Still getting 404 on  /verifier/login

The route is `/login` not `/ver ifier/login`. Update your browser bookmark or URL.

## Expected Flow

```
1. User visits /login
   ↓
2. Enters email & password
   ↓
3. LoginForm calls POST /api/auth/login
   ↓
4. Server checks .storage/database.json
   ↓
5. Server validates password (plain text: "Aditya@12345")
   ↓
6. Server generates JWT with role: "verifier"
   ↓
7. Client stores token in localStorage as "verifier_session"
   ↓
8. Client redirects to /verify
   ↓
9. VerificationWizard loads, checks localStorage for token
   ↓
10. User fills verification form
   ↓
11. Form submits POST /api/verify/request with Authorization header
   ↓
12. Server extracts token, verifies it, checks role === "verifier"
   ↓
13. Server processes verification and returns results
```

## Debug Commands

### Check if verifier exists in storage
```bash
node scripts/check-verifiers.js
```

### Re-add verifier if needed
```bash
node scripts/add-verifier.js
```

### Check server logs
The npm run dev terminal will show:
- Login attempts
- Token generation
- API requests
- Token verification

Look for these log messages:
- `🔐 Login attempt for: adityamathan@codemateai.dev`
- `✅ Verifier found:`
- `Verify Request - Token received: true`
- `Verify Request - Token decoded successfully:`
