#!/usr/bin/env node

/**
 * 🔐 Chrome Web Store OAuth Token Generator
 * 
 * This script helps you get the refresh token needed for Chrome Web Store automation.
 * Run this after setting up your Google Cloud OAuth 2.0 credentials.
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log(`
🔐 Chrome Web Store OAuth Token Generator
═══════════════════════════════════════

This script will generate the URLs you need to get your refresh token.

📋 Prerequisites:
1. Google Cloud project created
2. Chrome Web Store API enabled
3. OAuth 2.0 credentials downloaded (JSON file)
`);

function promptUser(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function generateRefreshToken() {
  try {
    console.log('\n🔑 Step 1: Enter your OAuth 2.0 credentials\n');
    
    const clientId = await promptUser('Enter your CLIENT_ID: ');
    const clientSecret = await promptUser('Enter your CLIENT_SECRET: ');
    
    if (!clientId || !clientSecret) {
      console.log('❌ Client ID and Secret are required!');
      process.exit(1);
    }
    
    // Step 1: Authorization URL
    const scopes = 'https://www.googleapis.com/auth/chromewebstore';
    const redirectUri = 'urn:ietf:wg:oauth:2.0:oob';
    
    const authUrl = `https://accounts.google.com/o/oauth2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent`;
    
    console.log(`
🌐 Step 2: Open this URL in your browser:

${authUrl}

📋 This will:
1. Ask you to sign in to Google
2. Show consent screen for Chrome Web Store access  
3. Display an authorization code
4. Copy that code and paste it here
`);
    
    const authCode = await promptUser('\n🔑 Enter the authorization code from your browser: ');
    
    if (!authCode) {
      console.log('❌ Authorization code is required!');
      process.exit(1);
    }
    
    console.log('\n🔄 Step 3: Getting refresh token...\n');
    
    // Step 2: Exchange code for tokens
    const tokenRequestBody = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: authCode,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenRequestBody
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.log(`❌ Error getting tokens: ${tokenData.error_description || tokenData.error}`);
      process.exit(1);
    }
    
    console.log(`✅ SUCCESS! Here are your tokens:

📋 GitHub Secrets Configuration:
═══════════════════════════════════

Add these to your GitHub repository secrets:
(Settings → Secrets and variables → Actions)

CHROME_CLIENT_ID:     ${clientId}
CHROME_CLIENT_SECRET: ${clientSecret}
CHROME_REFRESH_TOKEN: ${tokenData.refresh_token}
CHROME_EXTENSION_ID:  [Get this after creating draft extension]

🔐 Your Refresh Token:
${tokenData.refresh_token}

⏰ Token expires: ${tokenData.expires_in ? `${tokenData.expires_in} seconds` : 'Never (refresh token)'}

🎉 You're ready for Chrome Web Store automation!
`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Common issues:');
    console.log('   - Make sure you copied the authorization code correctly');
    console.log('   - Check your Client ID and Secret are correct');
    console.log('   - Ensure Chrome Web Store API is enabled in Google Cloud');
  } finally {
    rl.close();
  }
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ with built-in fetch support.');
  console.log('💡 Alternative: Use the manual method below...\n');
  
  console.log(`
🔧 Manual Method (if Node < 18):

1. 📂 Open your Chrome Web Store credentials JSON file
2. 🌐 Go to: https://developers.google.com/oauthplayground/
3. ⚙️  Click gear icon → "Use your own OAuth credentials"
4. 📝 Enter your Client ID and Client Secret
5. 🔍 In "Step 1", enter scope: https://www.googleapis.com/auth/chromewebstore
6. 🔑 Click "Authorize APIs" and get authorization code
7. 💱 Click "Exchange authorization code for tokens"
8. 📋 Copy the "Refresh token" value

That's your CHROME_REFRESH_TOKEN! 🎉
`);
  
  process.exit(0);
}

generateRefreshToken();
