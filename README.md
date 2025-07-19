# <img src="public/logo.svg" alt="StaffPulse Logo" width="40" style="vertical-align:middle;"> StaffPulse - Nurture Wellbeing, Amplify Performance

> **A comprehensive employee wellness platform with WhatsApp integration and AI-powered insights.**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/your-repo/staffpulse)
[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.4-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

---

## 🚀 **Quick Start**

```bash
# Clone the repository
git clone https://github.com/your-repo/staffpulse.git

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

## ✨ **Key Features**

- 👥 **Employee Management** - Complete employee lifecycle management
- 📱 **WhatsApp Integration** - Automated wellness check-ins via WhatsApp
- 🤖 **AI Insights** - Smart analysis and recommendations for HR teams
- 📊 **Real-time Analytics** - Live mood tracking and wellness trends
- 🏢 **Multi-Organization** - Secure data isolation for multiple companies
- 📅 **Smart Scheduling** - Automated check-in scheduling system
- 📈 **Bulk Operations** - CSV import and export capabilities

## � **Documentation**

All comprehensive documentation is available in the [`docs/`](./docs/) folder:

- **[📖 Complete Documentation](./docs/STAFF_PULSE_DOCUMENTATION.md)** - Full application overview
- **[🚀 Deployment Guide](./docs/DEPLOYMENT_CHECKLIST.md)** - Step-by-step deployment
- **[🔧 API Reference](./docs/API_DOCUMENTATION.md)** - Complete API documentation
- **[📱 WhatsApp Setup](./docs/TWILIO_SETUP.md)** - WhatsApp integration guide
- **[👑 Super Admin Setup](./docs/SUPER_ADMIN_SETUP.md)** - Admin configuration
- **[🔐 Role Permissions](./docs/ROLE_PERMISSIONS.md)** - Security and permissions

## 🛠️ **Tech Stack**

- **Frontend:** Next.js 15.3.4, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Supabase
- **Database:** PostgreSQL (Supabase)
- **Authentication:** Supabase Auth
- **Integrations:** Twilio WhatsApp, IntaSend Payments
- **Deployment:** Netlify, Vercel compatible

## 🏗️ **Project Structure**

```
StaffPulse/
├── docs/                    # 📚 All documentation
├── src/                     # 💻 Source code
│   ├── app/                 # 🌐 Next.js app router
│   ├── components/          # 🧩 Reusable components
│   ├── contexts/            # 🔄 React contexts
│   ├── hooks/               # 🪝 Custom hooks
│   ├── lib/                 # 📦 Utility libraries
│   └── types/               # 📝 TypeScript types
├── supabase/                # 🗄️ Database schema & migrations
├── public/                  # 🌍 Static assets
└── scripts/                 # 🔧 Build & setup scripts
```

## � **Quick Deploy**

```bash
# 1. Clone and install
git clone https://github.com/your-repo/staffpulse.git
cd staffpulse && npm install

# 2. Set up environment (see docs/DEPLOYMENT_CHECKLIST.md)
cp .env.example .env.local

# 3. Deploy to Netlify
chmod +x deploy.sh && ./deploy.sh
```

## 🔐 **Security & Compliance**

- ✅ Row Level Security (RLS) policies
- ✅ Organization data isolation
- ✅ Role-based access control (Admin, Manager, Employee)
- ✅ Webhook signature verification
- ✅ Secure API endpoints with authentication

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 **Support**

- 📖 **Documentation**: Check the [`docs/`](./docs/) folder
- 🐛 **Issues**: Report bugs via GitHub Issues
- 💬 **Discussions**: Use GitHub Discussions for questions

---

<div align="center">

**Built with ❤️ for better employee engagement**

[![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

</div>
