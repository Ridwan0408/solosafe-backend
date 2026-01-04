const express = require('express');
const router = express.Router();
const {triggerSOS, cancelSOS, getLastKnownLocation, updateLastKnownLocation} = require('../controllers/alertControllers');
const { auth } = require('../middleware/auth');

router.route('/sos').post(auth, triggerSOS);
router.route('/cancel-sos').post(auth, cancelSOS);
router.route('/last-known-location/:tripId').get(auth, getLastKnownLocation);
router.route('/last-known-location/:tripId').put(auth, updateLastKnownLocation);

module.exports = router;