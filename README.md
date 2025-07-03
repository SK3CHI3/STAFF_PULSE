# 🎯 STAFF_PULSE - Employee Wellness Platform

A comprehensive employee wellness platform with WhatsApp integration and AI-powered insights.

## ✨ Features

- 👥 **Employee Management** - Add, import, and manage employees by departments
- 📱 **WhatsApp Integration** - Automated wellness check-ins via WhatsApp
- 🤖 **AI Insights** - Smart analysis and recommendations for HR teams
- 📊 **Analytics Dashboard** - Real-time mood tracking and trends
- 🏢 **Multi-Organization** - Secure data isolation for multiple companies
- 📅 **Schedule Management** - Automated check-in scheduling
- 📈 **Bulk Import** - CSV import for easy employee onboarding

## 🚀 Quick Deploy to Netlify

### Option 1: Automatic Deploy Script
```bash
# Make deploy script executable and run
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Manual Steps
1. Push code to GitHub
2. Connect GitHub repo to Netlify
3. Set environment variables
4. Deploy!

See `NETLIFY_DEPLOYMENT.md` for detailed instructions.

## ⚙️ Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://liafogjwtrplvlvsrsmn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Twilio WhatsApp (Required)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## 📱 WhatsApp Setup

### Get Your Twilio Account SID
1. Go to [console.twilio.com](https://console.twilio.com)
2. Look for "Account Info" on the dashboard
3. Copy the Account SID (starts with "AC")
4. Copy the Auth Token (click eye icon to reveal)

### Sandbox Testing (Free)
- Use sandbox number: `+1 415 523 8886`
- Users send "join [sandbox-name]" to opt in
- Perfect for testing all functionality

## 🗄️ Database

Uses Supabase with pre-configured schema:
- Employee management
- Mood tracking
- AI insights
- Multi-organization support

## 🔐 Security Features

- Row Level Security (RLS)
- Organization data isolation
- Role-based access control
- Webhook signature verification

## 📊 Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Supabase, Next.js API Routes
- **Messaging**: Twilio WhatsApp API
- **Deployment**: Netlify
- **AI**: Custom sentiment analysis

---

**Ready for production deployment! 🚀**
