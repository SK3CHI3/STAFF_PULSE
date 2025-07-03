// Test script to verify your Twilio credentials
// Run with: node test-twilio.js

const twilio = require('twilio');

// Replace with your actual credentials
const accountSid = 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'; // Your Account SID
const authToken = 'your_auth_token_here';                // Your Auth Token
const fromNumber = 'whatsapp:+14155238886';              // Sandbox number

const client = twilio(accountSid, authToken);

async function testTwilioConnection() {
  try {
    console.log('🔍 Testing Twilio connection...');
    
    // Test 1: Verify account
    const account = await client.api.accounts(accountSid).fetch();
    console.log('✅ Account verified:', account.friendlyName);
    
    // Test 2: List WhatsApp senders
    const senders = await client.messaging.v1.services.list();
    console.log('✅ Messaging service accessible');
    
    // Test 3: Send a test message (to yourself)
    const testPhoneNumber = '+1234567890'; // Replace with your WhatsApp number
    
    console.log(`📱 Sending test message to ${testPhoneNumber}...`);
    console.log('⚠️  Make sure you\'ve joined the sandbox first!');
    console.log('   Send "join [sandbox-name]" to +1 415 523 8886');
    
    // Uncomment the lines below to send a test message
    /*
    const message = await client.messages.create({
      from: fromNumber,
      to: `whatsapp:${testPhoneNumber}`,
      body: 'Hello from STAFF_PULSE! 🎉 Your Twilio integration is working!'
    });
    
    console.log('✅ Test message sent! SID:', message.sid);
    */
    
    console.log('\n🎉 Twilio setup looks good!');
    console.log('\nNext steps:');
    console.log('1. Join the sandbox: Send "join [sandbox-name]" to +1 415 523 8886');
    console.log('2. Uncomment the message sending code above');
    console.log('3. Replace testPhoneNumber with your WhatsApp number');
    console.log('4. Run this script again to test messaging');
    
  } catch (error) {
    console.error('❌ Error testing Twilio:', error.message);
    
    if (error.code === 20003) {
      console.log('💡 This usually means your Auth Token is incorrect');
    } else if (error.code === 21608) {
      console.log('💡 This usually means your Account SID is incorrect');
    }
  }
}

testTwilioConnection();
