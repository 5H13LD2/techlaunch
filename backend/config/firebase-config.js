const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

let firebaseApp;

const initializeFirebase = () => {
  if (!firebaseApp) {
    try {
      const serviceAccount = require('./serviceAccountKey.json');
      
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
      });

      // Only connect to emulator if explicitly enabled
      if (process.env.USE_FIREBASE_EMULATOR === 'true') {
        console.log('🔧 Connecting to Firestore emulator on port 8081...');
        admin.firestore().settings({
          host: '127.0.0.1:8081',
          ssl: false
        });
      }
      
      console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('❌ Firebase initialization error:', error);
      throw error;
    }
  }
  
  return admin.firestore();
};

module.exports = {
  initializeFirebase,
  admin
}; 