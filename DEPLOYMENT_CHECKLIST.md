# ✅ STAFF_PULSE Deployment Checklist

## 📋 Pre-Deployment Setup

### 1. Supabase Setup ✅
- [x] Database schema applied
- [x] RLS policies configured
- [x] Environment variables noted
- [x] Test data added

### 2. Twilio Setup ⏳
- [ ] Twilio account created
- [ ] Account SID obtained (starts with "AC")
- [ ] Auth Token obtained
- [ ] WhatsApp sandbox configured
- [ ] Test phone number joined sandbox

### 3. GitHub Repository ⏳
- [ ] Code pushed to GitHub
- [ ] Repository is public or accessible to Netlify
- [ ] All files committed

## 🚀 Netlify Deployment

### 4. Netlify Account ⏳
- [ ] Netlify account created
- [ ] GitHub connected to Netlify

### 5. Site Configuration ⏳
- [ ] New site created from Git
- [ ] Repository selected
- [ ] Build settings configured:
  - Build command: `npm run build`
  - Publish directory: `.next`

### 6. Environment Variables ⏳
Add these in Netlify Site Settings > Environment Variables:

#### Supabase Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = `https://liafogjwtrplvlvsrsmn.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `[your-anon-key]`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = `[your-service-role-key]`

#### Twilio Variables  
- [ ] `TWILIO_ACCOUNT_SID` = `AC[your-account-sid]`
- [ ] `TWILIO_AUTH_TOKEN` = `[your-auth-token]`
- [ ] `TWILIO_WHATSAPP_NUMBER` = `whatsapp:+14155238886`

#### App Variables
- [ ] `NEXTAUTH_URL` = `https://[your-app-name].netlify.app`
- [ ] `NEXTAUTH_SECRET` = `[random-string]`

### 7. Deploy ⏳
- [ ] Click "Deploy site"
- [ ] Wait for build to complete
- [ ] Check for build errors

## 🔧 Post-Deployment Configuration

### 8. Update Webhook URLs ⏳
- [ ] Copy your Netlify app URL
- [ ] Update Twilio webhook: `https://[your-app].netlify.app/api/whatsapp/webhook`
- [ ] Update Supabase auth URLs

### 9. Test Deployment ⏳
- [ ] Visit your Netlify URL
- [ ] Test user registration/login
- [ ] Add a test employee
- [ ] Send test WhatsApp message
- [ ] Check AI insights generation

## 🧪 Testing Checklist

### 10. Core Functionality ⏳
- [ ] **Authentication**: Sign up/login works
- [ ] **Employee Management**: Add employee works
- [ ] **CSV Import**: Upload test CSV file
- [ ] **WhatsApp**: Send test message
- [ ] **AI Insights**: Generate insights
- [ ] **Schedules**: Create test schedule

### 11. WhatsApp Integration ⏳
- [ ] Join Twilio sandbox from your phone
- [ ] Add your phone as test employee
- [ ] Send check-in message to yourself
- [ ] Reply with mood score (1-5)
- [ ] Check response appears in dashboard
- [ ] Verify AI insight generated

## 🎯 Quick Test Commands

### Test API Endpoints
```bash
# Replace with your actual Netlify URL
export APP_URL="https://your-app-name.netlify.app"

# Test employee creation
curl -X POST $APP_URL/api/employees \
  -H "Content-Type: application/json" \
  -d '{"organizationId":"test","first_name":"Test","last_name":"User","phone":"+1234567890"}'

# Test WhatsApp message
curl -X POST $APP_URL/api/whatsapp/send-checkin \
  -H "Content-Type: application/json" \
  -d '{"type":"single","employeeId":"test-id","messageType":"weekly"}'
```

## 🚨 Troubleshooting

### Common Issues
- **Build fails**: Check package.json dependencies
- **API routes 404**: Verify netlify.toml configuration
- **Environment variables**: Double-check names and values
- **WhatsApp webhook fails**: Ensure URL is accessible

### Debug Steps
1. Check Netlify build logs
2. Check Netlify function logs
3. Test API endpoints individually
4. Verify environment variables are set

## ✅ Success Criteria

Your deployment is successful when:
- [ ] App loads at Netlify URL
- [ ] User can sign up and login
- [ ] Employee management works
- [ ] WhatsApp messages send and receive
- [ ] AI insights generate automatically
- [ ] All dashboard pages load correctly

## 🎉 You're Live!

Once all items are checked, your STAFF_PULSE app is production-ready!

**Your app URL**: `https://[your-app-name].netlify.app`

### Next Steps
1. Add real employee data
2. Set up production WhatsApp Business account
3. Configure regular backup schedules
4. Monitor usage and performance

---

**Need help?** Check `NETLIFY_DEPLOYMENT.md` for detailed instructions.
