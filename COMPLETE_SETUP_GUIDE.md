# 🌾 Krishi-Net Complete Setup & Usage Guide

## ✅ Current Status - Everything Fixed!

Your Krishi-Net application is now fully configured with:
- ✅ **User Registration** - Working with local file storage
- ✅ **OTP System** - Generating and verifying OTPs
- ✅ **Authentication** - JWT token-based login
- ✅ **Frontend** - All 11 pages accessible
- ✅ **Backend API** - Running and responding
- ⏳ **Real SMS** - Ready after Twilio configuration

---

## 🚀 Quick Start

### Start the Backend
```bash
cd backend
node server.js
```
Expected output:
```
Twilio client not configured. OTPs will be logged to console instead of sent via SMS.
Backend running on http://localhost:4000
```

### Start the Frontend
```bash
cd frontend
npm run dev
```
Expected output:
```
VITE v... running at:
  ➜  Local:   http://localhost:5173/
```

### Test the Application
1. Open http://localhost:5173 in your browser
2. Click "Register" on login page
3. Enter phone number, name, and village
4. Click "Send OTP"
5. Check **backend console** for OTP (look for line: `Registration OTP for ... is 123456`)
6. Enter OTP on website
7. You're logged in! 🎉

---

## 📱 User Registration Flow

### Step 1: Access Registration Page
- URL: `http://localhost:5173/#/register`
- Form has three fields:
  - **Mobile Number** (required)
  - **Name** (required)
  - **Village** (required)

### Step 2: Send OTP
- Click "Send OTP" button
- Backend generates 6-digit random code
- OTP is stored for 10 minutes
- Backend logs: `Registration OTP for 7483960412 is 472114 (for testing)`
- **Demo mode:** OTP logged to console (mock SMS)
- **With Twilio:** User receives real SMS

### Step 3: Verify OTP
- Enter the OTP from backend console (or SMS with Twilio)
- Click "Verify OTP" button
- Backend validates OTP matches stored value
- User is automatically created in database
- JWT token is generated
- You're logged in and redirected to Dashboard

### Step 4: Logged In
- User data saved to `backend/users-db.json`
- Token stored in browser localStorage
- Access all dashboard features

---

## 🔑 Understanding the Architecture

### Frontend (React)
- **Location:** `frontend/src/`
- **Technology:** React 18.2.0 + Vite
- **Files:**
  - `Register.jsx` - Registration with 2-step OTP flow
  - `Login.jsx` - Login with OTP or password
  - `App.jsx` - Router with 11 pages
  - `Dashboard.jsx` - Main dashboard after login

### Backend (Node.js/Express)
- **Location:** `backend/`
- **Technology:** Express.js + Node.js
- **Key Features:**
  - File-based user storage (`users-db.json`)
  - In-memory OTP storage (with Map fallback)
  - DynamoDB support (optional)
  - Twilio SMS integration (when configured)
  - JWT token authentication

### Data Storage
- **User Database:** `backend/users-db.json`
- **Format:** JSON with phone as key
- **Auto-created** on first user registration
- **Example:**
```json
{
  "7483960412": {
    "phone": "7483960412",
    "name": "Farmer Name",
    "village": "Village Name",
    "createdAt": "2025-02-03T05:28:14Z"
  }
}
```

---

## 🔐 How Authentication Works

### 1. Registration Process
```
User fills form
         ↓
POST /auth/register
         ↓
Check if phone already exists
         ↓
Generate 6-digit OTP
         ↓
Store OTP + user data (10 min expiry)
         ↓
Send SMS (or log to console in demo)
         ↓
Response: { success: true, message: "OTP sent" }
```

### 2. Verification Process
```
User enters OTP
         ↓
POST /auth/verify-registration
         ↓
Validate OTP exists and not expired
         ↓
Validate OTP matches
         ↓
Create user in database
         ↓
Generate JWT token (30 days)
         ↓
Response: { success: true, token: "...", user: {...} }
```

### 3. Login with JWT
```
Request to protected endpoint
         ↓
Include token in Authorization header
         ↓
Backend validates token signature
         ↓
Token valid → Process request
Token invalid → 401 Unauthorized
```

---

## 📂 Important Files

### Backend
| File | Purpose |
|------|---------|
| `server.js` | Main API server with all endpoints |
| `.env` | Configuration file (database, Twilio, etc.) |
| `users-db.json` | User database (auto-created) |
| `create_tables.js` | DynamoDB table setup script |
| `package.json` | Dependencies |

### Frontend
| File | Purpose |
|------|---------|
| `App.jsx` | Main router with 11 page routes |
| `Register.jsx` | 2-step OTP registration |
| `Login.jsx` | Login with OTP or password |
| `Dashboard.jsx` | Main app after login |
| `config.js` | API base URL configuration |

---

## 🔧 Configuration (.env)

The `.env` file in `backend/` contains:

```env
# Server Port
PORT=4000

# Database
USERS_TABLE=krishi-users
PRODUCTS_TABLE=krishi-products

# JWT Secret
LOCAL_JWT_SECRET=dev_local_secret_change_me_in_production

# Twilio (for real SMS)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# AWS (optional)
AWS_REGION=ap-south-1
```

### To Enable Real SMS OTP:
1. Fill in Twilio credentials (see TWILIO_SETUP.md)
2. Restart backend: `node server.js`
3. Backend will automatically use Twilio for SMS

---

## 📋 API Endpoints

### Authentication Endpoints

#### POST `/auth/register`
Register a new user and send OTP
```json
{
  "phone": "7483960412",
  "name": "Farmer Name",
  "village": "Village Name"
}
```
Response:
```json
{
  "success": true,
  "message": "OTP sent to your phone number for verification."
}
```

#### POST `/auth/verify-registration`
Verify OTP and create user
```json
{
  "phone": "7483960412",
  "otp": "472114"
}
```
Response:
```json
{
  "success": true,
  "message": "Registration successful!",
  "token": "eyJhbGc...",
  "user": {
    "phone": "7483960412",
    "name": "Farmer Name",
    "village": "Village Name"
  }
}
```

#### POST `/auth/send-otp`
Send OTP for login (user must exist)
```json
{
  "phone": "7483960412"
}
```

#### POST `/auth/verify-otp`
Verify login OTP
```json
{
  "phone": "7483960412",
  "otp": "472114"
}
```

#### POST `/auth/verify-password`
Login with password (if available)
```json
{
  "phone": "7483960412",
  "password": "user_password"
}
```

---

## 🧪 Testing Checklist

- [ ] **Backend starts** - `node server.js` runs without errors
- [ ] **Frontend loads** - http://localhost:5173 opens
- [ ] **Registration page** - #/register displays form
- [ ] **Send OTP** - Form submits and OTP appears in backend console
- [ ] **Verify OTP** - Backend shows: `User ... saved to local file storage`
- [ ] **User created** - Check `backend/users-db.json` has user entry
- [ ] **Logged in** - Redirects to Dashboard
- [ ] **All pages work** - #/soil-analyser, #/weather, #/forum, etc.

---

## ⚠️ Common Issues & Solutions

### Issue: "User creation failed" message
**Solution:**
- Check `backend/users-db.json` is writable
- Check backend logs for error details
- Restart backend: `node server.js`

### Issue: OTP doesn't appear in console
**Solution:**
- Make sure you're looking at the backend terminal, not frontend
- Check for: `Registration OTP for ... is 123456`
- Try a different phone number

### Issue: "Invalid OTP" error
**Solution:**
- Copy OTP exactly from console (no spaces)
- OTP expires after 10 minutes - get a new one if needed
- Check the right phone number matches

### Issue: Page shows "Not logged in"
**Solution:**
- Verify registration completed successfully
- Check browser developer tools (F12) → Application → LocalStorage
- Should have `authToken` and `user` keys

### Issue: Backend won't start
**Solution:**
- Kill existing Node process: `taskkill /IM node.exe /F`
- Delete `users-db.json` if corrupted
- Run: `npm install` in backend directory
- Then: `node server.js`

---

## 🎯 Next: Real SMS OTP

To send OTP to actual phone numbers:

1. **Read:** `TWILIO_SETUP.md` in project root
2. **Sign up:** https://www.twilio.com/try-twilio
3. **Get credentials:**
   - Account SID
   - Auth Token
   - Phone number
4. **Update `.env`:** Add credentials
5. **Restart:** `node server.js`
6. **Test:** Register with real phone number
7. **Verify:** You'll receive actual SMS!

---

## 📚 Project Structure

```
INVENTRA/
├── backend/
│   ├── server.js                 ← Main API
│   ├── .env                      ← Configuration
│   ├── users-db.json             ← User database
│   ├── package.json
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── Register.jsx          ← Registration form
│   │   ├── Login.jsx             ← Login page
│   │   ├── Dashboard.jsx         ← Main app
│   │   ├── App.jsx               ← Router
│   │   ├── config.js
│   │   └── ...
│   ├── index.html
│   └── package.json
├── infra/                        ← AWS infrastructure
├── scripts/                      ← Utility scripts
├── TWILIO_SETUP.md               ← SMS configuration guide
├── REGISTRATION_SYSTEM_FIXED.md  ← What was fixed
└── README.md
```

---

## 🚀 Production Deployment

When ready to deploy:

1. **Environment Variables:**
   - Use AWS Secrets Manager instead of .env
   - Set all environment variables in deployment platform

2. **Database:**
   - Migrate from JSON file to DynamoDB or PostgreSQL
   - Create proper database migrations

3. **SMS:**
   - Use paid Twilio account (remove phone verification requirement)
   - Implement retry logic for failed SMS

4. **Security:**
   - Change `LOCAL_JWT_SECRET` to strong random value
   - Enable HTTPS
   - Implement rate limiting
   - Add input validation

5. **Infrastructure:**
   - Deploy backend to AWS Lambda or EC2
   - Deploy frontend to S3 + CloudFront
   - Set up proper DNS and domain

---

## 💡 Tips

- **Testing with different phones?** Just use different numbers in registration form
- **Lost OTP?** Click "Send OTP" again to get a new one
- **Need to restart fresh?** Delete `users-db.json` and start over
- **Checking logs?** Backend logs show all requests and OTPs
- **Using Postman?** Import the API endpoints to test manually

---

## 📞 Support

For issues:
1. Check backend console for error messages
2. Check frontend browser console (F12)
3. Verify .env file has correct values
4. Check users-db.json exists and is readable
5. Try restarting both backend and frontend

Good luck! 🌾✨
