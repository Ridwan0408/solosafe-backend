const Trip = require('../models/Trip');
const geoCoder = require('../utils/geoCoder');
const { sendEmergencyEmailWithLocation, sendEmergencyMessageWithLocation, sendSafetyEmailWithLocation, sendPushNotification} = require('../utils/message');

exports.triggerSOS = async (req, res) => {
    try {
        const { tripId, latitude, longitude } = req.body; // Received from browser geolocation API

        const trip = await Trip.findById(tripId).populate('userId');

        if (trip.status === 'SOS') {
            return res.status(400).json({ message: "SOS already active for this trip." });
        }

        if (!trip) return res.status(404).json({ message: "Trip not found" });

        // 1. Correct coordinates handling
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        // 2. Fix the mapLink syntax (Using the standard Google Maps Search URL)
        const mapLink = (!isNaN(lat) && !isNaN(lng))
            ? `https://www.google.com/maps?q=${lat},${lng}` 
            : null;

        // Reverse geocode to get precise address
        let preciseAddress = 'Location not available';
        if (mapLink) {
            try {
                const loc = await geoCoder.getAddress(lat, lng);
                preciseAddress = loc;
            } catch (error) {
                console.error("Error reverse geocoding:", error);
            }
        }

        // Update status to Emergency 
        trip.status = 'SOS';
        trip.lastKnownLocation.lat = latitude; // storing for record-keeping
        trip.lastKnownLocation.lng = longitude; // storing for record-keeping
        await trip.save();

        // Construct location link for the alerts 
        //const mapLink = latitude ? `https://www.google.com/maps?q=${latitude},${longitude}` : 'Not available';

        // Immediate email to all emergency contacts [cite: 64]

        trip.emergencyContacts.forEach(contact => {
            sendEmergencyEmailWithLocation(contact, trip, "SOS ALERT", mapLink, preciseAddress);
            sendEmergencyMessageWithLocation(contact.phone, trip, "SOS ALERT", mapLink, preciseAddress);
            console.log(`SOS Alert sent to ${contact.email} and ${contact.phone} for ${trip.userId.name}`);

            // Push Notification if FCM token exists [cite: 65]
        
            if (trip.userId.fcmToken) {
                sendPushNotification(
                    trip.userId.fcmToken,
                    "SOS Alert Triggered",
                    `${trip.userId.name} has triggered an SOS alert. Check your email/SMS for details.`
                );
            }
        });

        res.status(200).json({ message: "Emergency alert sent successfully.", address: preciseAddress});
    } catch (error) {
        res.status(500).json({ error: "Failed to process SOS", message: error.message });
    }
};
exports.cancelSOS = async (req, res) => {
    try {
        const { tripId, latitude, longitude } = req.body;    
        const trip = await Trip.findById(tripId).populate('userId');

        if (!trip) return res.status(404).json({ message: "Trip not found" });

        // 1. Correct coordinates handling
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        // 2. Fix the mapLink syntax (Using the standard Google Maps Search URL)
        const mapLink = (!isNaN(lat) && !isNaN(lng)) 
            ? `https://www.google.com/maps?q=${lat},${lng}` 
            : null;

        // Revert status back to Safe
        trip.status = 'Safe';

        if (latitude && longitude) {
            trip.lastKnownLocation.lat = latitude; 
            trip.lastKnownLocation.lng = longitude; 
        }
        await trip.save();

        let preciseAddress = 'Location not available';
        if (mapLink) {
            try {
                const loc = await geoCoder.getAddress(lat, lng);
                preciseAddress = loc;
            } catch (error) {
                console.error("Error reverse geocoding:", error);
            }
        }
        //const mapLink = latitude ? `https://www.google.com/maps?q=${latitude},${longitude}` : 'Not available';

        // Send safety email and SMS
        trip.emergencyContacts.forEach(contact => {
            sendSafetyEmailWithLocation(contact, trip, "SOS CANCELLED", mapLink, preciseAddress);
            console.log(`Safety confirmation sent to ${contact.email} for ${trip.userId.name}`);
        });

        res.status(200).json({
            message: "SOS cancelled, status reverted to Safe.",
            address: preciseAddress,
            status: trip.status
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to cancel SOS" });
    }   
};
exports.getLastKnownLocation = async (req, res) => {
    try {
        const { tripId } = req.params;  
        const trip = await Trip.findById(tripId);
        if (!trip) return res.status(404).json({ message: "Trip not found" });
        res.status(200).json({ lastKnownLocation: trip.lastKnownLocation });
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve last known location" });
    }
};
exports.updateLastKnownLocation = async (req, res) => {
    try {
        const { tripId } = req.params;  
        const { location } = req.body;
        const trip = await Trip.findById(tripId);
        if (!trip) return res.status(404).json({ message: "Trip not found" });
        trip.lastKnownLocation = location;
        await trip.save();
        res.status(200).json({ message: "Last known location updated." });
    } catch (error) {
        res.status(500).json({ error: "Failed to update last known location" });
    }
};
