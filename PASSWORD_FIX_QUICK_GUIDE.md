# 🔐 Quick Password Fix Guide

## ⚠️ Problem
You're getting "Invalid login credentials" for `homlender28@gmail.com`

**Root Cause:** Account created without password set in earlier versions

---

## ✅ Solution in 3 Steps

### Step 1: Start Backend
```bash
cd d:\Job\CWS\car-wash\backend
npm run dev
# Wait for: "Server running on port 5000"
```

### Step 2: Open Browser Console & Run Command
1. Go to `http://localhost:3000/login`
2. Press `F12` → Click **Console** tab
3. Paste this:

```javascript
fetch('http://localhost:5000/auth/fix-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'homlender28@gmail.com',
    password: 'test@123456'  // ← Change to your desired password
  })
})
.then(r => r.json())
.then(d => {
  console.log('Response:', d);
  if(d.success) {
    alert('✅ Password set!\n\nNow login with:\nEmail: homlender28@gmail.com\nPassword: test@123456');
  } else {
    alert('❌ Error: ' + (d.error || 'Unknown'));
  }
})
```

4. Press **Enter**
5. Wait for alert ✅

### Step 3: Login
- Email: `homlender28@gmail.com`
- Password: `test@123456` (or what you set)

---

## 🔍 Verify Account First (Optional)

Before fixing, check account status:

```javascript
fetch('http://localhost:5000/auth/check-user', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'homlender28@gmail.com' })
})
.then(r => r.json())
.then(d => console.log(JSON.stringify(d, null, 2)))
```

---

## ❌ If It Still Fails

| Error | Fix |
|-------|-----|
| "User not found" | Email is different/typo |
| "Employee pending approval" | Admin needs to approve account |
| CORS error | Backend not running on port 5000 |
| Still can't login | Clear browser cache (Ctrl+Shift+Del) and retry |

---

## ✅ After Password is Set

Future logins are simple:
- Email: `homlender28@gmail.com`
- Password: `test@123456`
- No OTP needed!