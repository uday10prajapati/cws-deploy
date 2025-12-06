# Password Reset Instructions

To fix the "Invalid login credentials" error for `homlender28@gmail.com`, use one of these methods:

## ✅ Method 1: Using the new /fix-password endpoint (EASIEST)

Open your browser console (F12 → Console) and run:

```javascript
fetch('http://localhost:5000/auth/fix-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'homlender28@gmail.com',
    password: 'test@123456'  // Your desired password
  })
})
.then(r => r.json())
.then(d => {
  console.log(d);
  if(d.success) alert('✅ Password set! Try logging in now.');
  else alert('❌ Error: ' + d.error);
})
```

This endpoint:
- ✅ Checks if user exists
- ✅ Verifies approval status (for employees)
- ✅ Sets the password
- ✅ Returns status

## Method 2: Using /reset-password endpoint

```powershell
$body = @{
    email = "homlender28@gmail.com"
    newPassword = "your_new_password_123"  # Change this to your desired password
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/auth/reset-password" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body | Select-Object -ExpandProperty Content | ConvertFrom-Json
```

## Method 3: Check if user exists first

Before resetting, verify the user exists:

```javascript
fetch('http://localhost:5000/auth/check-user', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'homlender28@gmail.com'
  })
})
.then(r => r.json())
.then(d => console.log(JSON.stringify(d, null, 2)))
```

This will show you the user's profile and auth status.

## Important Notes

- ✅ Make sure your backend server is running (`npm run dev` in the backend folder)
- ✅ Password should be strong (at least 8 characters recommended)
- ✅ After reset, try logging in immediately with the new password
- ✅ If still failing, the user might not be approved (check `approval_status` in the response from `/check-user`)

