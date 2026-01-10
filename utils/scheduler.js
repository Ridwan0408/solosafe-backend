const Trip = require('../models/Trip');
const cron = require('node-cron');
const { sendEmergencyEmail, sendEmergencyMessage, sendPushNotification } = require('./message');


// This runs every MINUTE [cite: 102]
    cron.schedule('* * * * *', async () => {
        try {
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
                    sendEmergencyEmail(contact.email, trip, "MISSING CHECK-IN");
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
                console.log(`Missed check-in alerts processed for trip ID: ${trip._id}`);
            }
            console.log(`Missed check-in mail alert cron job executed at ${now.toISOString()}`);
        } catch (error) {
            console.error("Error in missed check-in mail alert cron job:", error);
        }   
    });




// const cron = require('node-cron');
// const Trip = require('../models/Trip');

// // Runs every hour to check for missed check-ins
// cron.schedule('0 * * * *', async () => {
//     const now = new Date();
//     const activeTrips = await Trip.find({ status: 'Safe' });

//     for (let trip of activeTrips) {
//         const hoursDiff = (now - trip.lastCheckIn) / (1000 * 60 * 60);
//         if (hoursDiff > trip.checkInFrequency) {
//             trip.status = 'Missed Check-in';
//             await trip.save();
//             // Trigger email service to alert contacts
//             console.log(`ALERT: User ${trip.userId} missed their check-in!`);
//         }
//     }
// });