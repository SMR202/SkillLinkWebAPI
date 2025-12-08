const admin = require('firebase-admin');
const path = require('path');

let initialized = false;

function initializeFirebase() {
  if (initialized) return;
  
  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
                               path.join(__dirname, '../firebase-service-account.json');
    
    const serviceAccount = require(serviceAccountPath);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    initialized = true;
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
    console.log('Push notifications will not be sent');
  }
}

async function sendPushNotification(fcmToken, title, body, data = {}) {
  if (!initialized) {
    initializeFirebase();
  }
  
  if (!initialized || !fcmToken) {
    return null;
  }

  const message = {
    token: fcmToken,
    notification: {
      title,
      body
    },
    data: {
      title,
      body,
      ...Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      click_action: 'FLUTTER_NOTIFICATION_CLICK'
    },
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'skilllink_notifications',
        priority: 'high'
      }
    }
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('✅ Push notification sent:', title);
    return response;
  } catch (error) {
    console.error('❌ Error sending push notification:', error.message);
    return null;
  }
}

module.exports = { sendPushNotification, initializeFirebase };
