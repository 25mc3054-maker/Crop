# 🔧 Troubleshooting Guide

## Issue: Pages Not Showing

### Problem 1: Login/Register Page Not Visible
**Solution:**
1. Make sure localStorage is clear: Open Developer Tools (F12) → Storage → LocalStorage → Delete `farmer_token`
2. Refresh the page
3. You should see the Login page

### Problem 2: Dashboard Pages Not Appearing
**Solution:**
1. First, ensure you're logged in
2. Check that backend API is running (should see prices loading)
3. Clear browser cache: Ctrl+Shift+Delete
4. Refresh page

### Problem 3: Navigation Cards Not Clickable
**Solution:**
1. Make sure you're authenticated (logged in)
2. Verify network tab in DevTools - no errors should appear
3. Check that routes in [frontend/src/App.jsx](frontend/src/App.jsx) match the onclick handlers

### Problem 4: "API Not Found" Error
**Solution:**
1. Check backend is running on correct port
2. Verify [frontend/src/config.js](frontend/src/config.js) has correct API_BASE_URL
3. Restart both backend and frontend

---

## 🔍 Debugging Steps

### Check Authentication Status
1. Open Developer Tools (F12)
2. Go to Console tab
3. Type: `localStorage.getItem('farmer_token')`
4. If it returns null, you're not logged in
5. If it returns a token string, you are logged in

### Check Current Route
1. Look at URL - it should show hash like `http://localhost:5174/#/soil-analyser`
2. Empty hash = Dashboard (when logged in)
3. No hash = Login page (when logged out)

### Check API Connection
1. Open Network tab in DevTools
2. Perform any action (e.g., click "Refresh Prices")
3. Look for requests to backend
4. Check response status - should be 200 OK

---

## 📱 Browser Console Tips

### Clear Authentication
```javascript
localStorage.removeItem('farmer_token')
location.reload()
```

### Check API Base URL
```javascript
// If this is undefined, update frontend/src/config.js
console.log(import.meta.env.VITE_API_BASE_URL)
```

### Manually Navigate
```javascript
window.location.hash = '#/soil-analyser'  // Go to soil analyser
window.location.hash = ''  // Go to dashboard
window.location.hash = '#/register'  // Go to register
```

---

## 🚨 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Blank white page | App not loaded | Check console for errors |
| Stuck on login | Backend down | Start backend server |
| Routes not working | Wrong API URL | Update config.js |
| Can't click cards | Not authenticated | Login first |
| Services not loading | Cache issue | Clear cache & refresh |

---

## ✅ Verification Checklist

- [ ] Frontend running on http://localhost:5174/
- [ ] Backend running on configured port
- [ ] Login page displays without authentication
- [ ] Can enter phone number
- [ ] Can click Register link
- [ ] After login, Dashboard displays with navigation cards
- [ ] Navigation cards are clickable
- [ ] Back buttons work correctly
- [ ] Logout button works
- [ ] Prices section loads data

---

## 📞 Need More Help?

1. Check the [WEBSITE_STRUCTURE.md](WEBSITE_STRUCTURE.md) for complete feature overview
2. Review [backend/README.md](backend/README.md) for API documentation
3. Check console errors (F12 → Console)
4. Verify network requests (F12 → Network)
