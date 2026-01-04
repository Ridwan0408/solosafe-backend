const admin = require('firebase-admin');
const serviceAccount = require('../.env');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;