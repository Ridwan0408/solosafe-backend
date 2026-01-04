const express = require('express');
const router = express.Router();
const { 
    createTrip, 
    confirmSafety, 
    addContactToTrip, 
    deleteContactFromTrip, 
    displayContacts,
    endTrip,
    getPublicItinerary,
    getUserTrips,
} = require('../controllers/tripControllers');
const { auth } = require('../middleware/auth');

// @route   POST api/trips/
// @desc    Create a new trip

// POST request to create a new trip
router.route('/').post(auth, createTrip);
// PUT request to add an emergency contact to a trip
router.route('/:tripId/contacts').put(auth, addContactToTrip).get(auth, displayContacts);
// DELETE request to remove an emergency contact from a trip
router.route('/:tripId/contacts/:contactId').delete(auth, deleteContactFromTrip);
// PUT request to confirm safety for a trip
router.route('/:tripId/safe').put(auth, confirmSafety);
// PUT request to end a trip
router.route('/:tripId/end').put(auth, endTrip);
// GET request to fetch public itinerary by share token
router.route('/public/:tripId').get(getPublicItinerary);
// GET request to fetch all trips for the authenticated user
router.route('/').get(auth, getUserTrips);


module.exports = router;