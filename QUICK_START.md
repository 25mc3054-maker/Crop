# 🚀 QUICK START GUIDE

## ⏱️ 30 Second Setup

### 1. Start Backend
```powershell
cd backend
npm install
npm start
```

### 2. Start Frontend  
```powershell
cd frontend
npm install
npm run dev
```

### 3. Open Browser
```
http://localhost:5174/
```

---

## 🎯 What You'll See

### First Time: Login Page 📱
```
🌾 Krishi-Net Login

Phone: [10 digits]

[Send OTP]  [Use Password]

Don't have account? [Register]
```

**Actions:**
- Enter phone number
- Click "Send OTP" or "Use Password"
- Enter OTP/password
- Click "Login"

### After Login: Dashboard 🏠
```
🌾 Krishi-Net Dashboard                [🚪 Logout]

📊 Live Mandi Prices
[Wheat][Rice][Maize][Sugarcane][Cotton]...

🌱 Soil Health Analyser  ☁️ Weather     👥 Forum      🤖 AI      🔔 Notify
💰 Sell Crops           🏛️ Schemes      🚜 Equipment
```

**What to Click:**
- Any of the 8 cards to go to that page
- Back button to return to Dashboard
- Logout to exit

---

## 🎮 Test the Website

### Test 1: Login Flow
1. Go to http://localhost:5174/
2. You should see Login page
3. (Mock: Phone numbers are validated, backend handles actual OTP)

### Test 2: Navigation
1. After login, click any card
2. Page should load
3. Click Back to return

### Test 3: Logout
1. Click Logout button
2. Should see Login page again

### Test 4: Register
1. On Login page, click Register
2. Fill form
3. Click Register
4. Should return to Login page

---

## 📱 Pages Available

| # | Page | Route | Try This |
|---|------|-------|----------|
| 1 | Login | `#/` | Enter phone, click login |
| 2 | Register | `#/register` | Click "Register" link |
| 3 | Dashboard | `#/` (after login) | See all options |
| 4 | Soil Analyser | `#/soil-analyser` | Click green card |
| 5 | Weather | `#/weather` | Click blue card |
| 6 | Forum | `#/forum` | Click purple card |
| 7 | AI Assistant | `#/ai-assistant` | Click pink card |
| 8 | Notifications | `#/notifications` | Click red card |
| 9 | Sell Crops | `#/sell-crops` | Click orange card |
| 10 | Schemes | `#/schemes` | Click teal card |
| 11 | Equipment | `#/equipment` | Click yellow card |

---

## 🔑 Key Points

✅ **All pages now visible and clickable**
✅ **Navigation working properly**
✅ **Back buttons functional**
✅ **Login/Logout working**
✅ **Responsive design**

---

## ⚙️ If Something Doesn't Work

### Blank White Page?
```javascript
// Open console (F12) and run:
localStorage.removeItem('farmer_token')
location.reload()
```

### API Not Found?
- Check backend is running
- Verify port matches in config.js

### Pages Not Loading?
- Clear browser cache: Ctrl+Shift+Delete
- Hard refresh: Ctrl+Shift+R

---

## 📖 Full Documentation

- **[WEBSITE_FIXED.md](WEBSITE_FIXED.md)** - Complete overview
- **[WEBSITE_STRUCTURE.md](WEBSITE_STRUCTURE.md)** - All features explained
- **[NAVIGATION_MAP.md](NAVIGATION_MAP.md)** - Visual diagrams
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues

---

## 🎉 You're All Set!

The website is now fully functional with all pages visible and properly navigated.

Visit **http://localhost:5174/** to see it live!
