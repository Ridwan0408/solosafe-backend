const Trip = require('../models/Trip');
const { sendEmergencyEmail, sendEmergencyMessage, sendPushNotification} = require('../utils/message');

exports.triggerSOS = async (req, res) => {
    try {
        const { tripId, location } = req.body; // Location is optional for MVP [cite: 63]

        const trip = await Trip.findById(tripId).populate('userId');

        if (!trip) return res.status(404).json({ message: "Trip not found" });

        // Update status to Emergency 
        trip.status = 'SOS';
        if (location) trip.lastKnownLocation = location;
        await trip.save();

        // Immediate email to all emergency contacts [cite: 64]

        trip.emergencyContacts.forEach(contact => {
            sendEmergencyEmail(contact, trip, "SOS ALERT");
            sendEmergencyMessage(contact.phone, trip, "SOS ALERT");
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

        res.status(200).json({ message: "Emergency alert sent successfully." });
    } catch (error) {
        res.status(500).json({ error: "Failed to process SOS" });
    }
};
exports.cancelSOS = async (req, res) => {
    try {
        const { tripId } = req.body;    
        const trip = await Trip.findById(tripId);

        if (!trip) return res.status(404).json({ message: "Trip not found" });
        // Revert status back to Safe
        trip.status = 'Safe';
        await trip.save();
        res.status(200).json({ message: "SOS cancelled, status reverted to Safe." });
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
