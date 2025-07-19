# 🚀 STAFF_PULSE Netlify Deployment Guide

## 📋 Prerequisites

1. **GitHub Account** - Your code needs to be in a GitHub repository
2. **Netlify Account** - Sign up at [netlify.com](https://netlify.com)
3. **Supabase Project** - Already set up ✅
4. **Twilio Account** - For WhatsApp functionality

## 🔧 Step 1: Prepare Your Repository

### Push to GitHub
```bash
cd STAFF_PULSE/staff-pulse
git init
git add .
git commit -m "Initial STAFF_PULSE deployment"
git branch -M main
git remote add origin https://github.com/yourusername/staff-pulse.git
git push -u origin main
```

## 🌐 Step 2: Deploy to Netlify

### Option A: Netlify Dashboard (Recommended)
1. Go to [netlify.com](https://netlify.com) and login
2. Click **"New site from Git"**
3. Choose **GitHub** and authorize Netlify
4. Select your **staff-pulse** repository
5. Configure build settings:
   ```
   Build command: npm run build
   Publish directory: .next
   ```
6. Click **"Deploy site"**

### Option B: Netlify CLI
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

## ⚙️ Step 3: Configure Environment Variables

In your Netlify dashboard:

1. Go to **Site settings > Environment variables**
2. Add these variables:

### Supabase Variables
```
NEXT_PUBLIC_SUPABASE_URL = https://liafogjwtrplvlvsrsmn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = [your-anon-key]
SUPABASE_SERVICE_ROLE_KEY = [your-service-role-key]
```

### Twilio Variables
```
TWILIO_ACCOUNT_SID = ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN = [your-auth-token]
TWILIO_WHATSAPP_NUMBER = whatsapp:+14155238886
```

### App Variables
```
NEXTAUTH_URL = https://your-app-name.netlify.app
NEXTAUTH_SECRET = [generate-random-string]
```

## 🔗 Step 4: Configure Webhooks

### Update Twilio Webhook URL
1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Develop > Messaging > Settings > WhatsApp sandbox settings**
3. Set webhook URL to: `https://your-app-name.netlify.app/api/whatsapp/webhook`
4. Set HTTP method to: **POST**

### Update Supabase Auth URLs
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication > URL Configuration**
3. Add your Netlify URL:
   ```
   Site URL: https://your-app-name.netlify.app
   Redirect URLs: https://your-app-name.netlify.app/auth/callback
   ```

## 🧪 Step 5: Test Your Deployment

### 1. Test the Website
- Visit your Netlify URL
- Try signing up/logging in
- Navigate through the dashboard

### 2. Test WhatsApp Integration
```bash
# Send test message via your deployed API
curl -X POST https://your-app-name.netlify.app/api/whatsapp/send-checkin \
  -H "Content-Type: application/json" \
  -d '{
    "type": "single",
    "employeeId": "test-employee-id",
    "messageType": "weekly"
  }'
```

### 3. Test Database Connection
- Add a test employee
- Check if data appears in Supabase
- Try importing CSV data

## 🔄 Step 6: Automatic Deployments

Netlify will automatically redeploy when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Update feature"
git push origin main
# Netlify automatically deploys! 🎉
```

## 🛠️ Troubleshooting

### Common Issues

#### Build Fails
```bash
# Check build logs in Netlify dashboard
# Common fixes:
npm install  # Install dependencies
npm run build  # Test build locally
```

#### Environment Variables Not Working
- Double-check variable names (case-sensitive)
- Redeploy after adding variables
- Check Netlify function logs

#### API Routes Not Working
- Ensure `netlify.toml` is in root directory
- Check function logs in Netlify dashboard
- Verify environment variables are set

#### WhatsApp Webhook Fails
- Check webhook URL is correct
- Verify SSL certificate is valid
- Test webhook endpoint manually

### Debug Commands
```bash
# Test locally with Netlify CLI
netlify dev

# Check function logs
netlify functions:log

# Test build locally
netlify build
```

## 📊 Step 7: Monitor Your App

### Netlify Analytics
- Go to **Site overview** in Netlify dashboard
- Monitor traffic, performance, and errors

### Supabase Monitoring
- Check **Database > Logs** for query performance
- Monitor **Auth > Users** for user activity

### Twilio Monitoring
- Check **Monitor > Logs** for message delivery
- Monitor usage and costs

## 🔐 Security Checklist

- [ ] Environment variables are set correctly
- [ ] Supabase RLS policies are enabled
- [ ] Twilio webhook signature verification is working
- [ ] HTTPS is enabled (automatic with Netlify)
- [ ] Auth redirects are configured properly

## 🚀 Your App is Live!

Once deployed, your STAFF_PULSE app will be available at:
```
https://your-app-name.netlify.app
```

### Features Available:
✅ Employee Management
✅ WhatsApp Integration  
✅ AI Insights Dashboard
✅ Bulk CSV Import
✅ Schedule Management
✅ Multi-Organization Support

## 📞 Support

If you encounter issues:
1. Check Netlify build logs
2. Check browser console for errors
3. Verify all environment variables
4. Test API endpoints individually

Your STAFF_PULSE system is now production-ready! 🎉
