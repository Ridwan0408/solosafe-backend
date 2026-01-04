const cron = require('node-cron');
const mongoose = require('mongoose'); // Import mongoose library instead of the file
const { sendEmergencyEmail, sendEmergencyMessage, sendPushNotification } = require('./message');


// This runs every minute [cite: 102]
module.exports = (io, injectedTrip) => {
    cron.schedule('* * * * *', async () => {
        try {
            let Trip;

            // 1. Check if the model passed from server.js works
            if (injectedTrip && injectedTrip.find) {
                Trip = injectedTrip;
            } else {
                // 2. FALLBACK: IF MISSING, FORCE LOAD THE FILE
                // This fixes 'MissingSchemaError' by forcing Node to read the blueprint file.
                console.log("Model missing. Force-loading file...");
                try {
                    // Try getting it from Mongoose memory first
                    Trip = mongoose.model('Trip');
                } catch (error) {
                    // If that fails, REQUIRE the file to register it
                    Trip = require('../models/Trip');
                }
            }
            const now = new Date();
            
            // Find travelers who missed their check-in time and haven't clicked "I'm Safe" [cite: 53, 54]
            const overdueTrips = await Trip.find({
                nextCheckIn: { $lt: now },
                status: 'Safe'
            }).populate('userId');

            for (const trip of overdueTrips) {
                trip.status = 'Missed Check-in'; //[cite: 48]
                await trip.save();

                // Send Email to each emergency contact [cite: 55, 56]
                trip.emergencyContacts.forEach(contact => {
                    // Logic to trigger email via Nodemailer goes here
                    sendEmergencyEmail(contact, trip, "MISSING CHECK-IN");
                    console.log(`Alert sent to ${contact.email} for ${trip.userId.name}`);
                });
                // Send SMS to each emergency contact via Twilio [cite: 57, 58]
                trip.emergencyContacts.forEach(contact => {
                    // Logic to trigger SMS via Twilio goes here
                    sendEmergencyMessage(contact.phone, trip, "MISSING CHECK-IN");
                    console.log(`SMS alert sent to ${contact.phone} for ${trip.userId.name}`);
                });
                // Push Notification if FCM token exists [cite: 59]
                if (trip.userId.fcmToken) {
                    sendPushNotification(
                        trip.userId.fcmToken,
                        "Missed Check-in Alert",
                        `${trip.userId.name} has missed their check-in. Please check your email/SMS for details.`
                    );
                }
            }
        } catch (error) {
            console.error("Error in missed check-in mail alert cron job:", error);
        }   
    });
};