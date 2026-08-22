# Krishi-Net Website - Navigation Guide

## ✅ Issue Fixed
The website routing has been fixed to properly display all pages. All navigation components are now accessible through the hash-based routing system.

## 🌍 Website Structure

### Entry Point
- **URL:** `http://localhost:5174/`
- **Starting Screen:** Login Page (if not authenticated)

### Authentication Flow

#### 1. **Login Page** (`#/` or empty hash)
- Phone number login with OTP or Password
- **Features:**
  - Send OTP option
  - Verify OTP
  - Password login alternative
- **Action:** Click "Register" link to go to Registration page

#### 2. **Register Page** (`#/register`)
- Create new farmer account
- **Required Fields:**
  - Phone (10 digits)
  - Full Name
  - Village
  - Password (optional)
- **Action:** After registration, user is redirected to Login page

---

## 📱 Main Dashboard (Authenticated)
After successful login, users see the **Dashboard** with:

### Live Mandi Prices Section
- Real-time commodity prices (Wheat, Rice, Maize, Sugarcane, etc.)
- Refresh button to update prices
- Responsive grid layout

### Navigation Cards (8 Main Features)

#### 1. 🌱 **Soil Health Analyser** (`#/soil-analyser`)
- Upload soil photos
- Get detailed soil analysis
- Crop recommendations
- ✅ **Fully Implemented**

#### 2. ☁️ **Weather Forecast** (`#/weather`)
- 7-day weather forecast
- Location-based predictions
- ✅ **Fully Implemented**

#### 3. 👥 **Community Forum** (`#/forum`)
- Connect with other farmers
- Ask questions and share knowledge
- ✅ **Fully Implemented**

#### 4. 🤖 **AI Assistant** (`#/ai-assistant`)
- Voice/text-based farming queries
- AI-powered recommendations
- ✅ **Fully Implemented**

#### 5. 🔔 **Notifications** (`#/notifications`)
- View alerts and updates
- Agricultural alerts
- ✅ **Fully Implemented**

#### 6. 💰 **Sell Your Crops** (`#/sell-crops`)
- List crops for sale
- Connect with buyers
- 🔄 **Placeholder - Coming Soon**

#### 7. 🏛️ **Government Schemes** (`#/schemes`)
- Browse subsidies
- Scheme information
- 🔄 **Placeholder - Coming Soon**

#### 8. 🚜 **Equipment Rental** (`#/equipment`)
- Rent/lend farm equipment
- Equipment marketplace
- 🔄 **Placeholder - Coming Soon**

### Support Section
- WhatsApp contact button
- Direct support link

---

## 🔐 Logout Feature
- "Logout" button in top-right corner of Dashboard
- Clears authentication token
- Returns to Login page

---

## 🛠️ Technical Details

### Routing System
- **Type:** Hash-based routing
- **Format:** `#/page-name`
- **Implementation:** Custom useState hook in App.jsx

### Authentication
- **Method:** JWT Token stored in localStorage
- **Header:** `Authorization: Bearer <token>`
- **Token Verification:** On app startup

### API Base URL
- Configured in [config.js](frontend/src/config.js)
- Update this if changing backend URL

---

## 📋 Navigation Summary

| Page | Route | Status | Features |
|------|-------|--------|----------|
| Login | `#/` | ✅ Active | OTP/Password login |
| Register | `#/register` | ✅ Active | Create account |
| Dashboard | `#/` (authenticated) | ✅ Active | Main hub |
| Soil Analyser | `#/soil-analyser` | ✅ Active | Photo analysis |
| Weather | `#/weather` | ✅ Active | Forecast |
| Forum | `#/forum` | ✅ Active | Community |
| AI Assistant | `#/ai-assistant` | ✅ Active | Voice queries |
| Notifications | `#/notifications` | ✅ Active | Alerts |
| Sell Crops | `#/sell-crops` | 🔄 Soon | Marketplace |
| Schemes | `#/schemes` | 🔄 Soon | Government info |
| Equipment | `#/equipment` | 🔄 Soon | Rental platform |

---

## 🚀 How to Run

```bash
# Terminal 1 - Backend
cd backend
npm install
npm start

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

**Frontend URL:** `http://localhost:5174/`

---

## 📝 Notes
- All page transitions are smooth with back buttons
- Mobile responsive design
- Gradient backgrounds for each section
- Hover effects on navigation cards
