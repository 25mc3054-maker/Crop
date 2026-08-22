# ⚡ Quick Reference Card - Krishi-Net

## 🚀 Start Servers (Two Terminal Windows)

**Terminal 1 - Backend:**
```bash
cd backend
node server.js
```
✅ Should show: `Backend running on http://localhost:4000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
✅ Should show: `Local: http://localhost:5173/`

---

## 🧪 Test Registration (30 seconds)

1. Open http://localhost:5173 in browser
2. Click **"Register"**
3. Fill in:
   - Phone: `7483960412` (or any number)
   - Name: `Test Farmer`
   - Village: `Test Village`
4. Click **"Send OTP"**
5. **Check Backend Console** for line:
   ```
   Registration OTP for 7483960412 is 123456
   ```
6. Copy that OTP number and enter it on the website
7. Click **"Verify OTP"**
8. ✅ **You're logged in!**

---

## 📁 Key Files

| File | What It Does |
|------|--------------|
| `backend/server.js` | Main API server |
| `backend/.env` | Configuration (needs Twilio) |
| `backend/users-db.json` | User database (auto-created) |
| `frontend/src/Register.jsx` | Registration form |
| `frontend/src/App.jsx` | Page routing |

---

## 📱 User Data Storage

After registration, user is stored in:
```
backend/users-db.json
```

Example content:
```json
{
  "7483960412": {
    "phone": "7483960412",
    "name": "Test Farmer",
    "village": "Test Village",
    "createdAt": "2025-02-03T05:30:00Z"
  }
}
```

---

## 🔑 API Endpoints

### Register User
```
POST http://localhost:4000/auth/register
Body: {
  "phone": "7483960412",
  "name": "Farmer Name",
  "village": "Village Name"
}
```

### Verify OTP & Create User
```
POST http://localhost:4000/auth/verify-registration
Body: {
  "phone": "7483960412",
  "otp": "123456"
}
Response: {
  "success": true,
  "token": "...",
  "user": {...}
}
```

---

## 📱 To Get REAL SMS OTP

1. **Read:** `TWILIO_SETUP.md` (in project root)
2. **Sign up:** https://www.twilio.com/try-twilio
3. **Get:**
   - Account SID
   - Auth Token
   - Phone Number
4. **Update** `backend/.env`:
   ```env
   TWILIO_ACCOUNT_SID=ACxxxxxxx...
   TWILIO_AUTH_TOKEN=your_token...
   TWILIO_PHONE_NUMBER=+1234567890
   ```
5. **Restart** backend: `node server.js`
6. **Test:** Register with your real phone
7. **Receive:** Actual SMS! 📨

---

## ⚠️ Common Issues

| Problem | Solution |
|---------|----------|
| Backend won't start | Delete `users-db.json`, run `npm install`, then `node server.js` |
| "User not found" on OTP | Make sure you verified OTP before trying to log in elsewhere |
| OTP expired | Click "Send OTP" again - OTP valid for 10 minutes |
| Page blank/not working | Open F12 console to check for errors |
| SMS not received | You haven't set up Twilio yet - see TWILIO_SETUP.md |

---

## 🎯 Your Next Action

### ✅ Completed
- ✅ User registration working
- ✅ OTP generation working
- ✅ User creation working
- ✅ All 11 pages accessible

### 📝 TODO: Enable Real SMS OTP
1. Open `TWILIO_SETUP.md`
2. Sign up for Twilio
3. Get credentials
4. Update `.env`
5. Restart backend
6. Test with real phone! 🎉

---

## 🔗 Page Routes

Once logged in, access these pages:
- `#/` → Dashboard (default)
- `#/soil-analyser` → Soil Analysis
- `#/weather` → Weather Forecast
- `#/forum` → Community Forum
- `#/notifications` → Notifications
- `#/ai-assistant` → AI Assistant
- `#/sell-crops` → Sell Crops
- `#/schemes` → Government Schemes
- `#/equipment` → Equipment Rental
- `#/amazon-rates` → Market Rates
- `#/soil-analysis` → Detailed Analysis

---

## 📊 System Status

```
Component     │ Status  │ Port   │ Location
──────────────┼─────────┼────────┼─────────────────
Backend       │ ✅ OK   │ 4000   │ localhost:4000
Frontend      │ ✅ OK   │ 5173   │ localhost:5173
User Storage  │ ✅ OK   │ File   │ users-db.json
OTP System    │ ✅ OK   │ Memory │ Expires 10 min
SMS (Real)    │ ⏳ Ready │ -      │ Twilio config
```

---

## 💡 Pro Tips

- **Multiple users?** Register different phone numbers in same file
- **Clear all data?** Delete `users-db.json` and start fresh
- **Debug OTP?** Check backend console for OTP values
- **Change phone format?** No restriction - any number works in demo
- **Token expires?** Re-register or implement refresh token logic

---

**You're all set! 🎉 Just follow TWILIO_SETUP.md to get real SMS working.**
