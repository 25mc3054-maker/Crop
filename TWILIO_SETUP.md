# Twilio SMS Setup Guide for Krishi-Net

This guide will help you configure real SMS OTP delivery to actual mobile numbers using Twilio.

## Step 1: Sign Up for Twilio Account

1. Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Click "Get started" or "Sign up for free"
3. Fill in your information:
   - Name
   - Email address
   - Password
   - Phone number (to receive verification code)
4. Verify your email address
5. Verify your phone number (Twilio will send an SMS with a code)

## Step 2: Get Your Twilio Credentials

1. After logging in, go to [Twilio Console](https://www.twilio.com/console)
2. You will see your **Account SID** and **Auth Token** on the main page
3. Keep these credentials safe - they authenticate API requests
4. **IMPORTANT:** Treat these like passwords - never share or commit them to version control

## Step 3: Get a Twilio Phone Number

1. In the Twilio Console, click on "Explore Products" → "Messaging"
2. Click "Get a trial phone number"
3. Twilio will suggest a number (you can accept it or try others)
4. Accept the phone number
5. You now have a **Twilio Phone Number** in format like `+1234567890`

## Step 4: Verify Recipient Phone Numbers (Trial Account)

⚠️ **Important for trial accounts:** Twilio trial accounts can only send SMS to verified numbers.

1. In Twilio Console, go to "Phone Numbers" → "Verified Caller IDs"
2. Click "Add a phone number"
3. Enter the mobile number you want to receive SMS (e.g., your phone)
4. Twilio will send a verification code to that number
5. Enter the code to verify it
6. Repeat for each number you want to test with

## Step 5: Update Backend .env File

Open `backend/.env` and update these lines with your real credentials:

```env
# Twilio Configuration for SMS OTP Delivery
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

Replace with:
- `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` → Your actual Account SID from Twilio Console
- `your_auth_token_here` → Your actual Auth Token from Twilio Console  
- `+1234567890` → Your actual Twilio phone number

**Example:**
```env
TWILIO_ACCOUNT_SID=AC00000000000000000000000000000000
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15550100
```

## Step 6: Restart Backend Server

After updating .env:

1. Stop the backend server (Ctrl+C)
2. Run the backend again: `node server.js`
3. The console should show: `✓ Twilio client configured` or similar

## Step 7: Test SMS OTP Flow

1. Go to http://localhost:5173/#/register
2. Enter your verified phone number (e.g., your own phone)
3. Enter a name and village name
4. Click "Send OTP"
5. **Check your phone** - you should receive an SMS with the OTP code:
   ```
   Your registration OTP for Krishi-Net is: 123456
   ```
6. Enter the OTP on the website and click "Verify OTP"
7. You should see a success message and be logged in

## Troubleshooting

### SMS not received?

1. **Check the backend logs** - Look for error messages like:
   ```
   Failed to send SMS to +91XXXXXXXXXX: ...
   ```

2. **Verify phone number registered?**
   - Confirm you've verified the recipient number in Twilio Console
   - Trial accounts can only send to verified numbers

3. **Correct Twilio credentials?**
   - Double-check Account SID and Auth Token match Twilio Console
   - Make sure TWILIO_PHONE_NUMBER matches the phone number you got from Twilio

4. **Backend restarted after .env changes?**
   - Changes to .env only take effect when server restarts
   - Stop (Ctrl+C) and run `node server.js` again

### Still getting mock SMS messages?

If you see `[MOCK SMS]` in the backend logs, the Twilio client is not configured:

1. Check backend console on startup - look for Twilio client status
2. Verify all three Twilio variables are set in .env (not empty)
3. Make sure file is saved after editing .env
4. Restart the backend: `node server.js`

## How It Works

**Without Twilio (Demo Mode):**
```
Backend logs: [MOCK SMS] To: +91... | Body: Your registration OTP...
User doesn't receive actual SMS (for testing/demo)
```

**With Twilio (Production):**
```
Backend logs: SMS sent to +91..., SID: SM123abc...
User receives actual SMS from your Twilio number
```

## Moving to Production

Once you're ready for production:

1. **Upgrade Twilio Account:** 
   - Move from trial to paid account (remove SMS verification requirement)
   - Add pricing as needed

2. **Store Credentials Securely:**
   - Never commit .env to git
   - Use AWS Secrets Manager or environment variable injection
   - Update `.gitignore` to exclude `.env`

3. **Update Domain:**
   - Change from localhost:5173 to your production domain
   - Update CORS settings in backend

## Support

For Twilio documentation: [https://www.twilio.com/docs/sms](https://www.twilio.com/docs/sms)

For issues: Check backend console logs for detailed error messages from Twilio API.
