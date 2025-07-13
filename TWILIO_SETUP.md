# Twilio WhatsApp Setup Guide for STAFF_PULSE

## 🚀 Quick Start (Sandbox - Free Testing)

### Step 1: Create Twilio Account
1. Go to [Twilio Console](https://console.twilio.com/)
2. Sign up for a free account
3. Verify your phone number

### Step 2: Get Sandbox Credentials
1. In Twilio Console, go to **Develop > Messaging > Try it out > Send a WhatsApp message**
2. Copy these values:
   ```
   Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Auth Token: your_auth_token_here
   Sandbox Number: +1 415 523 8886
   ```

### Step 3: Configure Environment Variables
Add to your `.env.local` file:
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### Step 4: Set Up Webhook
1. In Twilio Console, go to **Develop > Messaging > Settings > WhatsApp sandbox settings**
2. Set webhook URL to: `https://yourdomain.com/api/whatsapp/webhook`
3. Set HTTP method to: `POST`

### Step 5: Test the Sandbox
1. Send "join [your-sandbox-name]" to +1 415 523 8886 from your WhatsApp
2. You'll see your sandbox name in the Twilio console
3. Now you can receive messages from that number

## 📱 Testing with Sandbox

### Add Test Employees
```javascript
// Example test employee data
{
  first_name: "John",
  last_name: "Doe", 
  phone: "+1234567890", // Your actual WhatsApp number
  department: "Engineering"
}
```

### Send Test Message
```bash
# Using your API
curl -X POST http://localhost:3000/api/whatsapp/send-checkin \
  -H "Content-Type: application/json" \
  -d '{
    "type": "single",
    "employeeId": "employee-uuid-here",
    "messageType": "weekly"
  }'
```

## 🏢 Production Setup (WhatsApp Business API)

### Requirements for Production
1. **Facebook Business Manager Account**
2. **WhatsApp Business Account** 
3. **Business Verification** (can take 1-3 weeks)
4. **Phone Number** dedicated to WhatsApp Business
5. **Message Templates** (pre-approved by WhatsApp)

### Step 1: WhatsApp Business Account
1. Go to [Facebook Business Manager](https://business.facebook.com/)
2. Create/use existing business account
3. Add WhatsApp Business API
4. Submit business verification documents

### Step 2: Connect to Twilio
1. In Twilio Console: **Develop > Messaging > Senders > WhatsApp senders**
2. Click "Request Access" for WhatsApp Business API
3. Follow the verification process
4. Connect your WhatsApp Business Account

### Step 3: Message Templates
WhatsApp requires pre-approved templates for business messaging:

```javascript
// Example template (must be approved by WhatsApp)
{
  "name": "weekly_checkin",
  "language": "en",
  "components": [
    {
      "type": "BODY",
      "text": "Hi {{1}},\n\nHope you're doing well! {{2}} values your wellbeing and we'd appreciate a quick check-in. 💙\n\nHow are things going for you at work?\n• Excellent (5) 😊\n• Good (4) 👍\n• Okay (3) 😐\n• Challenging (2) 😔\n• Difficult (1) 😞\n\nIf you'd like to share more details or have any concerns, please feel free to add a comment. 💬\n\nThank you for helping us support our team better! 🙏"
    }
  ]
}
```

### Step 4: Update Code for Templates
```javascript
// Update send-checkin API to use templates
const response = await twilioClient.messages.create({
  from: process.env.TWILIO_WHATSAPP_NUMBER,
  to: `whatsapp:${employee.phone}`,
  contentSid: 'HX...', // Template SID from Twilio
  contentVariables: JSON.stringify({
    "1": employee.first_name,
    "2": employee.organization.name
  })
})
```

## 💰 Pricing

### Sandbox (Free)
- ✅ Free for testing
- ✅ Unlimited messages during development
- ❌ 72-hour user sessions
- ❌ Shared number

### Production WhatsApp Business API
- **Conversation-based pricing**:
  - Business-initiated: ~$0.005-0.009 per message
  - User-initiated: Free for 24 hours after user message
- **Template messages**: Required for business-initiated messages
- **Session messages**: Free-form messages within 24-hour window

## 🔧 Environment Variables Needed

```bash
# Twilio Credentials
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here

# WhatsApp Configuration
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886  # Sandbox
# OR for production:
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890   # Your business number

# Webhook Configuration
WEBHOOK_URL=https://yourdomain.com/api/whatsapp/webhook
```

## 🧪 Testing Checklist

### Sandbox Testing
- [ ] Twilio account created
- [ ] Environment variables set
- [ ] Webhook URL configured
- [ ] Joined sandbox with test phone
- [ ] Employee added with test phone number
- [ ] Test message sent successfully
- [ ] Response received and processed
- [ ] AI insights generated

### Production Testing
- [ ] WhatsApp Business Account verified
- [ ] Message templates approved
- [ ] Production webhook configured
- [ ] SSL certificate valid
- [ ] Rate limiting configured
- [ ] Error handling tested
- [ ] Compliance requirements met

## 🚨 Important Notes

### Compliance
- **Opt-in required**: Users must consent to receive messages
- **Opt-out mechanism**: Provide clear unsubscribe instructions
- **Data privacy**: Follow GDPR/CCPA requirements
- **Message frequency**: Don't spam users

### Rate Limits
- **Sandbox**: 1 message per second
- **Production**: Varies by account tier
- **Implement queuing** for bulk messages

### Error Handling
```javascript
// Handle common WhatsApp errors
const errorCodes = {
  63016: "Phone number not on WhatsApp",
  63017: "User has not opted in",
  63018: "Message template not approved"
}
```

## 🔗 Useful Links

- [Twilio WhatsApp API Docs](https://www.twilio.com/docs/whatsapp)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Message Templates Guide](https://developers.facebook.com/docs/whatsapp/message-templates)
- [Twilio Console](https://console.twilio.com/)

## 🆘 Troubleshooting

### Common Issues
1. **"User has not opted in"**: User needs to send "join [sandbox-name]" first
2. **"Invalid phone number"**: Ensure format is +[country][number]
3. **"Webhook timeout"**: Check your server response time (<5 seconds)
4. **"Template not found"**: Verify template is approved and SID is correct

### Debug Steps
1. Check Twilio Console logs
2. Verify webhook URL is accessible
3. Test with Twilio's API Explorer
4. Check your server logs for errors
