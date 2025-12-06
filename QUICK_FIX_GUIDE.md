# QUICK FIX GUIDE - Profile Insert Error

## ⚡ TL;DR

**Issue:** Profile insert failed - "Could not find 'full_name' column"

**Reason:** Code was using wrong column name (`full_name` doesn't exist in your schema)

**Solution:** ✅ All code updated to use correct column name (`name`)

---

## 🚀 What To Do (3 Steps)

### 1. Restart Backend
```bash
cd backend
npm start
```

### 2. Restart Frontend
```bash
cd frontend
npm run dev
```

### 3. Test
- Register new user
- Check database
- Should work! ✅

---

## ✅ What Was Fixed

| Component | Change |
|-----------|--------|
| `backend/routes/auth.js` | Use `name` column instead of `full_name` |
| `frontend/src/page/Login.jsx` | Use `profile.name` instead of `profile.full_name` |
| `frontend/src/Admin/Earnings.jsx` | Use `profile.name` instead of `profile.full_name` |
| `frontend/src/Employee/Earnings.jsx` | Use `profile.name` instead of `profile.full_name` |
| `frontend/src/components/Navbar.jsx` | Use `userDetails.name` instead of `userDetails.full_name` |
| `frontend/src/Customer/Profile.jsx` | Use correct display logic |

---

## 🧪 Test It

After restart, register new user and check:

```sql
SELECT name, email, phone, role, employee_type 
FROM profiles 
WHERE email = 'newuser@email.com';
```

Should see:
```
name     | email          | phone      | role     | employee_type
---------|----------------|------------|----------|---------------
War      | test@email.com | 8546791234 | employee | washer
```

NOT NULL values ✅

---

## 🎯 Done!

No SQL changes needed. Just restart and test! 🚀
