#!/usr/bin/env node

// STAFF_PULSE Setup Script
// Run with: node setup.js

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setup() {
  console.log('🎯 STAFF_PULSE Setup Wizard');
  console.log('================================\n');

  // Check if .env.local exists
  const envPath = path.join(__dirname, '.env.local');
  const envExists = fs.existsSync(envPath);

  if (envExists) {
    const overwrite = await question('⚠️  .env.local already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }

  console.log('📝 Let\'s configure your environment variables...\n');

  // Supabase Configuration
  console.log('🗄️  SUPABASE CONFIGURATION');
  console.log('Your Supabase project is already set up!');
  const supabaseUrl = 'https://liafogjwtrplvlvsrsmn.supabase.co';
  
  const supabaseAnonKey = await question('Enter your Supabase ANON key: ');
  const supabaseServiceKey = await question('Enter your Supabase SERVICE ROLE key: ');

  // Twilio Configuration
  console.log('\n📱 TWILIO CONFIGURATION');
  console.log('Get these from: https://console.twilio.com/');
  
  const twilioAccountSid = await question('Enter your Twilio Account SID (starts with AC): ');
  const twilioAuthToken = await question('Enter your Twilio Auth Token: ');
  const twilioWhatsAppNumber = await question('WhatsApp number (default: whatsapp:+14155238886): ') || 'whatsapp:+14155238886';

  // App Configuration
  console.log('\n⚙️  APP CONFIGURATION');
  const appUrl = await question('Enter your app URL (e.g., https://my-app.netlify.app): ');
  const authSecret = await question('Enter a random secret key (or press Enter to generate): ') || generateRandomString(32);

  // Create .env.local file
  const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}
SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}

# Twilio Configuration
TWILIO_ACCOUNT_SID=${twilioAccountSid}
TWILIO_AUTH_TOKEN=${twilioAuthToken}
TWILIO_WHATSAPP_NUMBER=${twilioWhatsAppNumber}

# App Configuration
NEXTAUTH_URL=${appUrl}
NEXTAUTH_SECRET=${authSecret}
`;

  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Environment configuration saved to .env.local');
  console.log('\n🚀 NEXT STEPS:');
  console.log('1. Install dependencies: npm install');
  console.log('2. Test locally: npm run dev');
  console.log('3. Deploy to Netlify: ./deploy.sh');
  console.log('\n📖 See DEPLOYMENT_CHECKLIST.md for complete setup guide');

  // Validate Twilio credentials
  if (twilioAccountSid && twilioAuthToken) {
    console.log('\n🧪 Testing Twilio connection...');
    try {
      const twilio = require('twilio');
      const client = twilio(twilioAccountSid, twilioAuthToken);
      await client.api.accounts(twilioAccountSid).fetch();
      console.log('✅ Twilio credentials are valid!');
    } catch (error) {
      console.log('❌ Twilio credentials test failed:', error.message);
      console.log('💡 Double-check your Account SID and Auth Token');
    }
  }

  rl.close();
}

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Run setup
setup().catch(console.error);
