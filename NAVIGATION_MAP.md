# 🗺️ Krishi-Net Complete Navigation Map

## User Journey Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    KRISHI-NET USER FLOW                         │
└─────────────────────────────────────────────────────────────────┘

                         START (/)
                            │
                            ▼
                  ┌──────────────────┐
                  │ Check Token in   │
                  │  localStorage    │
                  └──────────────────┘
                   │                │
            Has Token          No Token
            (Valid)               │
              │                   ▼
              │            ┌─────────────────┐
              │            │  LOGIN PAGE     │◄────────┐
              │            │  Route: #/      │         │
              │            │  Features:      │         │
              │            │  - Send OTP     │         │
              │            │  - Verify OTP   │         │
              │            │  - Password     │         │
              │            │  - Register     │─────┐   │
              │            └─────────────────┘     │   │
              │                │                   │   │
              │         ┌───────┴───────┐           │   │
              │         ▼               ▼           │   │
              │    LOGIN SUCCESS    CLICK REGISTER  │   │
              │         │               │           │   │
              │         │               ▼           │   │
              │         │        ┌──────────────┐   │   │
              │         │        │ REGISTER     │   │   │
              │         │        │ Route:       │   │   │
              │         │        │ #/register   │   │   │
              │         │        │              │   │   │
              │         │        │ Fields:      │   │   │
              │         │        │ - Phone      │   │   │
              │         │        │ - Name       │   │   │
              │         │        │ - Village    │   │   │
              │         │        │ - Password   │   │   │
              │         │        └──────────────┘   │   │
              │         │              │            │   │
              │         │              ▼            │   │
              │         │      Register Complete    │   │
              │         │              │            │   │
              │         └───────┬───────┘────────────┘   │
              │                 ▼                        │
              │         Redirect to Login ──────────────┘
              │
              ▼
        ┌─────────────────────────────────┐
        │   DASHBOARD (Home)              │
        │   Route: #/ (when auth)         │
        │                                  │
        │   ┌─ Live Mandi Prices ─┐      │
        │   │ • Wheat              │      │
        │   │ • Rice               │      │
        │   │ • Maize              │      │
        │   │ • Sugarcane          │      │
        │   │ • Cotton             │      │
        │   │ • Soybean            │      │
        │   │ • Mustard            │      │
        │   │ • Chickpea           │      │
        │   └──────────────────────┘      │
        │                                  │
        │   ┌─ Navigation Cards ─┐        │
        │   │ [Clickable Routes] │        │
        │   └────────────────────┘        │
        └─────────────────────────────────┘
                │
    ┌───────────┼───────────────────────────────────┐
    │           │                                   │
    ▼           ▼           ▼           ▼           ▼
┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐
│Soil  │   │Weather│  │Forum │  │Notif-│  │AI-   │
│Anal. │   │Cast  │  │       │  │cation│  │Asst. │
└──┬───┘   └───┬──┘   └───┬──┘   └──┬───┘   └───┬──┘
   │           │          │         │           │
   #/soil-     #/         #/        #/          #/
   analyser    weather    forum     notifications
                                    ai-assistant

┌──────┐   ┌──────┐   ┌──────┐
│Sell  │   │Govt  │   │Equip │
│Crops │   │Schemes│  │Rental│
└──┬───┘   └───┬──┘   └───┬──┘
   │           │          │
   #/sell-     #/         #/
   crops       schemes    equipment
   
   [Coming Soon - Placeholders Available]
```

## Detailed Page Structure

### 1️⃣ LOGIN PAGE
```
┌─────────────────────────────────┐
│  🌾 Krishi-Net Login             │
├─────────────────────────────────┤
│                                  │
│  Phone Number: [__________]      │
│                                  │
│  [Send OTP] [Use Password]       │
│                                  │
│  After OTP/Password Auth:        │
│  ├─ Store JWT token              │
│  ├─ Set isAuthenticated = true   │
│  └─ Redirect to Dashboard        │
│                                  │
│  [Register] link → #/register    │
└─────────────────────────────────┘
```

### 2️⃣ REGISTER PAGE
```
┌─────────────────────────────────┐
│  Farmer Registration              │
├─────────────────────────────────┤
│                                  │
│  Phone: [__________]             │
│  Name:  [__________]             │
│  Village: [__________]           │
│  Password: [__________]          │
│                                  │
│  [Register]  [Login]             │
│                                  │
│  After submission:               │
│  └─ Redirect to Login #/         │
└─────────────────────────────────┘
```

### 3️⃣ AUTHENTICATED DASHBOARD
```
┌───────────────────────────────────────────┐
│  🌾 Krishi-Net Dashboard    [🚪 Logout]   │
│  Welcome, Farmer Name!                     │
├───────────────────────────────────────────┤
│                                            │
│  📊 Live Mandi Prices                     │
│  ┌──┬──┬──┬──┬──┬──┬──┬──┐               │
│  │W │R │M │S │C │So│M │C │               │
│  │h │i │a │u │o │y │u │h │               │
│  │e │c │i │g │t │b │s │i │               │
│  │a │e │z │a │t │e │t │c │               │
│  │t │  │e │r │o │a │a │k │               │
│  │  │  │  │c │n │n │r │p │               │
│  │  │  │  │a │  │  │d │e │               │
│  │  │  │  │n │  │  │  │a │               │
│  │  │  │  │e │  │  │  │  │               │
│  │₹X │₹X │₹X │₹X │₹X │₹X │₹X │₹X │               │
│  └──┴──┴──┴──┴──┴──┴──┴──┘               │
│  [🔄 Refresh Prices]                      │
│                                            │
│  🌱 Soil Health Analyser                  │
│  ├─ Upload soil photos                    │
│  └─ Get detailed analysis                 │
│                                            │
│  ☁️ Weather Forecast                      │
│  ├─ 7-day forecast                        │
│  └─ Location-based                        │
│                                            │
│  👥 Community Forum                       │
│  ├─ Connect with farmers                  │
│  └─ Share knowledge                       │
│                                            │
│  🤖 AI Assistant                          │
│  ├─ Voice/Text queries                    │
│  └─ Smart recommendations                 │
│                                            │
│  🔔 Notifications                         │
│  ├─ Alerts & updates                      │
│  └─ Agricultural news                     │
│                                            │
│  💰 Sell Your Crops (Coming Soon)         │
│  ├─ List crops                            │
│  └─ Find buyers                           │
│                                            │
│  🏛️ Government Schemes (Coming Soon)     │
│  ├─ Browse subsidies                      │
│  └─ Scheme info                           │
│                                            │
│  🚜 Equipment Rental (Coming Soon)        │
│  ├─ Rent equipment                        │
│  └─ Equipment marketplace                 │
│                                            │
│  💬 [Contact Support on WhatsApp]         │
└───────────────────────────────────────────┘
```

### 4️⃣ FEATURE PAGES (with Back Button)
```
┌─────────────────────────────┐
│  [← Back]                   │
├─────────────────────────────┤
│                              │
│  Feature Content             │
│  - Fully interactive         │
│  - Feature-specific UI       │
│  - Back button redirects     │
│    to Dashboard (#/)         │
│                              │
└─────────────────────────────┘
```

## State Management

```javascript
// App.jsx State
const [isAuthenticated, setIsAuthenticated] = false  // Auth status
const [loading, setLoading] = true                    // Loading state
const [route, setRoute] = ""]                         // Current route

// Authentication Flow
1. Mount App
   ├─ Check localStorage for 'farmer_token'
   ├─ Verify token with backend
   └─ Set isAuthenticated accordingly

2. Non-Authenticated
   ├─ Show Login by default
   ├─ Allow Register via #/register route
   └─ Routes: #/, #/register

3. Authenticated
   ├─ Show Dashboard by default
   ├─ Allow navigation via hash routes
   └─ Routes: #/, #/soil-analyser, #/weather, etc.

4. Logout
   ├─ Clear localStorage token
   ├─ Set isAuthenticated = false
   └─ Redirect to Login (#/)
```

## Route Configuration

```javascript
Hash Routes:
├─ #/              → Login (unauthenticated) / Dashboard (authenticated)
├─ #/register      → Register page (unauthenticated only)
├─ #/soil-analyser → Soil Health Analyser (authenticated)
├─ #/weather       → Weather Forecast (authenticated)
├─ #/forum         → Community Forum (authenticated)
├─ #/notifications → Notifications (authenticated)
├─ #/ai-assistant  → AI Assistant (authenticated)
├─ #/sell-crops    → Sell Crops placeholder (authenticated, coming soon)
├─ #/schemes       → Government Schemes placeholder (authenticated, coming soon)
└─ #/equipment     → Equipment Rental placeholder (authenticated, coming soon)
```

## API Integration Points

```
Frontend ←→ Backend API Calls

Login/Register:
├─ POST /auth/send-otp
├─ POST /auth/verify-otp
├─ POST /auth/login
├─ POST /auth/register
└─ GET /auth/verify

Feature Pages:
├─ GET /prices (Dashboard)
├─ GET /soil/analyze (Soil Analyser)
├─ GET /weather (Weather)
├─ GET /forum/posts (Community)
├─ GET /notifications (Notifications)
├─ POST /ai/query (AI Assistant)
├─ GET /crops/sell (Sell Crops)
├─ GET /schemes (Government Schemes)
└─ GET /equipment (Equipment Rental)
```

---

## 🎯 Summary

✅ **Fully Implemented:**
- Login/Register flow
- Authentication & token management
- Dashboard with navigation
- 5 feature pages (Soil, Weather, Forum, Notifications, AI)
- Responsive design
- Back navigation

🔄 **Coming Soon:**
- Sell Crops marketplace
- Government Schemes info
- Equipment Rental system

