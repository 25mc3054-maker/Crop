#!/bin/bash
# Test script for user registration flow

API_BASE="http://localhost:4000"
PHONE="+919876543210"  # Change this to your test phone number
NAME="Test Farmer"
VILLAGE="Test Village"

echo "=== Krishi-Net Registration Test ==="
echo ""

# Step 1: Send registration OTP
echo "Step 1: Sending registration OTP..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$PHONE\",\"name\":\"$NAME\",\"village\":\"$VILLAGE\"}")

echo "Response: $REGISTER_RESPONSE"
echo ""

# Extract OTP from response (if provided in demo mode)
echo "Step 2: Check backend logs for OTP (look for 'Registration OTP for $PHONE is')"
echo ""

# For testing, we'll need to get the OTP from backend logs
# In a real scenario, it would come via SMS
read -p "Enter the OTP you received: " OTP

echo "Step 3: Verifying OTP and creating user..."
VERIFY_RESPONSE=$(curl -s -X POST "$API_BASE/auth/verify-registration" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$PHONE\",\"otp\":\"$OTP\"}")

echo "Response: $VERIFY_RESPONSE"
echo ""

# Check if successful
if echo "$VERIFY_RESPONSE" | grep -q "\"success\":true"; then
  echo "✅ Registration successful!"
  # Extract token
  TOKEN=$(echo "$VERIFY_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  echo "Token: $TOKEN"
else
  echo "❌ Registration failed!"
fi
