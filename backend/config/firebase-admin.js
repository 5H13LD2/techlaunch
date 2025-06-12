const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Get Firestore instance
const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth }; 