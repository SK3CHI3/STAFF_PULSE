# Staff Pulse - Technical Documentation

## Overview

Staff Pulse is a comprehensive employee wellbeing platform that helps organizations monitor and improve employee wellness through regular check-ins, analytics, and AI-powered insights. The platform features WhatsApp integration for employee communication, subscription-based access tiers, and a robust analytics dashboard.

## Tech Stack

- **Frontend**: Next.js 15 with App Router, React, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **API**: Next.js API Routes
- **Messaging**: Twilio WhatsApp API
- **Payments**: IntaSend
- **AI**: OpenRouter API
- **Deployment**: Netlify

## Project Structure

```
staff-pulse/
├── public/              # Static assets
├── src/
│   ├── app/             # Next.js App Router pages
│   │   ├── api/         # API routes
│   │   ├── auth/        # Authentication pages
│   │   ├── dashboard/   # Dashboard pages
│   │   └── super-admin/ # Admin pages
│   ├── components/      # Reusable React components
│   ├── contexts/        # React context providers
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and libraries
│   └── styles/          # Global styles
├── supabase/            # Supabase configuration
│   ├── migrations/      # Database migrations
│   └── schema.sql       # Database schema
├── next.config.ts       # Next.js configuration
└── netlify.toml         # Netlify deployment configuration
```

## Core Features

### 1. Authentication System

The authentication system uses Supabase Auth with email/password and magic link options. The system includes:

- Login, signup, and password reset flows
- Session management with AuthContext
- Role-based access control (Super Admin, HR Admin, Employee)
- Protected routes with AuthGuard components

Key files:
- `src/contexts/AuthContext.tsx` - Central auth state management
- `src/app/auth/*` - Authentication pages
- `src/components/AuthGuard.tsx` - Route protection

### 2. WhatsApp Integration

Staff Pulse uses Twilio's WhatsApp API to send check-in messages to employees and process their responses:

- Automated check-in scheduling
- Response collection and processing
- Webhook handling for incoming messages

Key files:
- `src/app/api/whatsapp/webhook/route.ts` - Handles incoming WhatsApp messages
- `src/app/api/whatsapp/send-checkin/route.ts` - Sends check-in messages
- `src/lib/twilio-client.ts` - Twilio API integration

### 3. Subscription & Billing System

The platform uses a tiered subscription model with three plans:

- **Free**: Basic features with limited employees (4)
- **Team**: Advanced features including AI insights (15 employees)
- **Enterprise**: All features with custom integrations (50 employees)

The billing system uses IntaSend for payment processing:

Key files:
- `src/lib/feature-access.ts` - Feature access control based on plan
- `src/lib/subscription-manager.ts` - Subscription management
- `src/app/api/intasend/webhook/route.ts` - Payment webhook handling
- `src/app/dashboard/billing/page.tsx` - Billing page

### 4. AI Insights

The platform generates AI-powered insights based on employee responses:

- Mood trend analysis
- Burnout risk detection
- Actionable recommendations

Key files:
- `src/app/api/ai/insights/route.ts` - AI insights generation
- `src/app/dashboard/insights/page.tsx` - Insights display page
- `src/components/DirectPlanCheck.tsx` - Feature access control for AI features

### 5. Analytics Dashboard

The analytics dashboard provides visualizations of employee wellbeing data:

- Mood trends over time
- Response rates
- Department-level analytics

Key files:
- `src/app/dashboard/analytics/page.tsx` - Analytics page
- `src/app/dashboard/page.tsx` - Main dashboard with summary metrics

## Database Schema

The database is structured around these main tables:

1. **organizations** - Companies using the platform
   - Subscription plan and status
   - Employee count and limits

2. **profiles** - User profiles linked to auth.users
   - Role-based permissions
   - Organization association

3. **employees** - Employee records
   - Contact information
   - Department and position

4. **mood_checkins** - Employee responses
   - Mood ratings
   - Comments and timestamps

5. **checkin_schedules** - Automated check-in configuration
   - Frequency and timing
   - Target departments/employees

## Feature Access Control

The platform implements a robust feature access control system:

1. **Plan-Based Features**: Features are enabled/disabled based on the organization's subscription plan
2. **Employee Limits**: Each plan has a maximum number of employees
3. **Action Permissions**: Certain actions (like adding employees) are controlled by plan limits

Key files:
- `src/lib/feature-access.ts` - Core feature access logic
- `src/hooks/useFeatureAccess.ts` - React hooks for feature access
- `src/components/FeatureGate.tsx` - UI components for feature gating
- `src/components/DirectPlanCheck.tsx` - Simplified plan checking

## API Structure

The API is organized into these main sections:

1. **/api/auth/** - Authentication endpoints
2. **/api/organization/** - Organization management
3. **/api/employees/** - Employee management
4. **/api/whatsapp/** - WhatsApp integration
5. **/api/ai/** - AI insights generation
6. **/api/billing/** - Subscription and billing
7. **/api/super-admin/** - Admin-only endpoints

## Deployment

The application is deployed on Netlify with these configurations:

- **netlify.toml** - Deployment configuration
- **next.config.ts** - Next.js build settings
- **Environment Variables** - Stored in Netlify UI

## Important Implementation Details

### Plan Standardization

The system uses a standardized 3-tier plan structure:
- **free** - Basic plan
- **team** - Professional plan with AI features
- **enterprise** - Full-featured plan

This standardization is enforced across:
- Database schema constraints
- Feature access system
- Subscription management
- UI components

### Error Handling

The application implements comprehensive error handling:
- API error responses with consistent format
- Client-side error boundaries
- Logging for debugging

### Security Considerations

- Authentication with Supabase Auth
- Row-Level Security in database
- API route protection
- CORS and security headers

## Development Guidelines

1. **Feature Access**: Always use the FeatureGate or DirectPlanCheck components for gated features
2. **API Routes**: Follow the established pattern for API routes with proper error handling
3. **Database Access**: Use Supabase client for frontend, supabaseAdmin for API routes
4. **State Management**: Use React Context for global state, local state for component-specific state
5. **Styling**: Use Tailwind CSS for all styling, following the established design patterns

## Environment Variables

The application requires these environment variables:

### Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Twilio WhatsApp Integration
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### AI and Analytics
```bash
OPENROUTER_API_KEY=your-openrouter-key
```

### Payment Processing (IntaSend)
```bash
INTASEND_PUBLISHABLE_KEY=your-publishable-key
INTASEND_SECRET_KEY=your-secret-key
```

## Component Architecture

### Core Components

1. **AuthGuard** - Protects routes requiring authentication
2. **FeatureGate** - Controls access to premium features
3. **DirectPlanCheck** - Simplified plan-based access control
4. **LoadingState** - Consistent loading indicators
5. **Pagination** - Reusable pagination component

### Layout Components

1. **DashboardLayout** - Main dashboard wrapper
2. **Sidebar** - Navigation sidebar
3. **Header** - Top navigation bar

### Feature-Specific Components

1. **MoodChart** - Displays mood trends
2. **ResponseCard** - Shows individual responses
3. **EmployeeList** - Employee management interface
4. **PlanStatus** - Subscription plan display

## Data Flow

### Employee Check-in Process

1. **Scheduling**: Check-in schedules are created in the database
2. **Sending**: Cron job or manual trigger sends WhatsApp messages
3. **Response**: Employees respond via WhatsApp
4. **Processing**: Webhook processes responses and stores in database
5. **Analytics**: Data is aggregated for dashboard display

### Payment Processing Flow

1. **Plan Selection**: User selects a plan on billing page
2. **Payment**: IntaSend payment button handles payment
3. **Webhook**: Payment completion triggers webhook
4. **Update**: Organization subscription is updated
5. **Access**: Feature access is immediately updated

## Troubleshooting Common Issues

1. **Plan Access Issues**: Check the organization's subscription_plan in the database matches one of: 'free', 'team', 'enterprise'
2. **WhatsApp Integration**: Verify Twilio credentials and webhook configuration
3. **Payment Processing**: Check IntaSend webhook configuration and event handling
4. **Build Errors**: Use dynamic imports for API routes that cause prerendering issues
5. **Feature Access**: Use browser console to check feature access API responses
6. **Database Issues**: Check Supabase logs for RLS policy violations

## Detailed Implementation Guide

### Setting Up WhatsApp Integration

1. **Twilio Setup**:
   - Create Twilio account and get WhatsApp sandbox number
   - Configure webhook URL: `https://your-domain.com/api/whatsapp/webhook`
   - Set environment variables

2. **Message Templates**:
   - Check-in messages are defined in the API route
   - Responses are parsed using regex patterns
   - Mood ratings are extracted from 1-5 scale responses

### AI Insights Implementation

The AI insights system uses OpenRouter API to generate insights:

1. **Data Collection**: Aggregates mood check-in data
2. **Analysis**: Sends data to AI model for analysis
3. **Storage**: Stores insights in the database
4. **Display**: Shows insights on the dashboard

Key considerations:
- Rate limiting for AI API calls
- Error handling for API failures
- Caching of insights to reduce costs

### Subscription Management

The subscription system handles:

1. **Plan Changes**: Immediate feature access updates
2. **Payment Processing**: IntaSend webhook integration
3. **Grace Periods**: Temporary access during payment issues
4. **Employee Limits**: Enforcement of plan-based limits

### Database Migrations

Important migrations to run:

1. **Initial Schema**: `supabase/schema.sql`
2. **Plan Standardization**: `supabase/migrations/20250115_standardize_plans.sql`
3. **Billing Tables**: `supabase/migrations/20240709120000_add_billing_tables.sql`

### Performance Optimizations

1. **Caching**: API responses are cached where appropriate
2. **Pagination**: Large datasets use pagination
3. **Lazy Loading**: Components load data on demand
4. **Image Optimization**: Netlify Image CDN integration

### Security Implementation

1. **Authentication**: Supabase Auth with JWT tokens
2. **Authorization**: Role-based access control
3. **API Security**: Rate limiting and input validation
4. **Database Security**: Row-Level Security policies

## Testing Strategy

### Unit Testing
- Component testing with React Testing Library
- API route testing with Jest
- Utility function testing

### Integration Testing
- End-to-end user flows
- WhatsApp webhook testing
- Payment processing testing

### Manual Testing Checklist

1. **Authentication Flow**:
   - [ ] Login/logout works
   - [ ] Password reset functions
   - [ ] Role-based access enforced

2. **Subscription Features**:
   - [ ] Plan upgrades work
   - [ ] Feature access is enforced
   - [ ] Payment processing completes

3. **WhatsApp Integration**:
   - [ ] Messages send successfully
   - [ ] Responses are processed
   - [ ] Data appears in dashboard

4. **Dashboard Functionality**:
   - [ ] Charts display correctly
   - [ ] Data updates in real-time
   - [ ] Pagination works

## Deployment Checklist

### Pre-deployment
- [ ] All environment variables set
- [ ] Database migrations run
- [ ] Build completes successfully
- [ ] Tests pass

### Post-deployment
- [ ] Health check endpoints respond
- [ ] Authentication works
- [ ] WhatsApp webhooks configured
- [ ] Payment webhooks configured
- [ ] SSL certificates valid

## Maintenance Tasks

### Regular Tasks
1. **Database Cleanup**: Remove old check-in data
2. **Log Monitoring**: Check for errors and performance issues
3. **Security Updates**: Keep dependencies updated
4. **Backup Verification**: Ensure backups are working

### Monthly Tasks
1. **Performance Review**: Analyze dashboard metrics
2. **Cost Analysis**: Review AI API usage and costs
3. **User Feedback**: Collect and analyze user feedback
4. **Feature Usage**: Analyze which features are most used
