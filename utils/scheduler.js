const Trip = require('../models/Trip');
const cron = require('node-cron');
const geoCoder = require('./geoCoder');
const { sendEmergencyEmail, sendEmergencyMessage, sendPushNotification, sendEmergencyEmailWithLocation, sendEmergencyMessageWithLocation, } = require('./message');


// This runs every MINUTE [cite: 102]
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            const GRACE_PERIOD_MINUTES = 30;

            const graceStartTime = new Date(now.getTime() - GRACE_PERIOD_MINUTES * 60000);
            //graceStartTime.setMinutes(graceStartTime.getMinutes() - GRACE_PERIOD_MINUTES);

            // 1. Find users who are 1 minute late (Send a Warning)
            const lateTrips = await Trip.find({
            status: 'Safe',
            nextCheckIn: { $lt: now, $gt: graceStartTime } 
            }).populate('userId');

            for (const trip of lateTrips) {
                trip.status = 'Missed Check-in';
                await trip.save();

                if (trip.userId.fcmToken) {
                    sendPushNotification(trip.userId.fcmToken, 
                        "⚠️ Check-in Overdue!", 
                        "Are you safe? Please check in!",
                        "You missed your check-in. You have 30 minutes before your emergency contacts are alerted.");
                }
                console.log(`Warning push notification sent to user ID: ${trip.userId} for trip ID: ${trip._id}` ); 
            }


            // Find travelers who missed their check-in time and haven't clicked "I'm Safe" 
            const overdueTrips = await Trip.find({
                nextCheckIn: { $lte: graceStartTime}, // 30 minutes grace period
                status: 'Missed Check-in'
            }).populate('userId');

            for (const trip of overdueTrips) {
                trip.status = 'SOS'; 
                await trip.save();

                    // Get location details
                const lat = trip.lastKnownLocation.lat;
                const lng = trip.lastKnownLocation.lng;
                const mapLink = (!isNaN(lat) && !isNaN(lng))
                    ? `https://www.google.com/maps?q=${lat},${lng}` 
                    : null;
                
                let address = 'Address not available';
                if (lat && lng) {
                    try {
                        address = await geoCoder.getAddress(lat, lng);
                    } catch (err) {
                        console.error("Cron Geocode Error:", err.message);
                    }
                }

                // Send Email to each emergency contact [cite: 55, 56]
                trip.emergencyContacts.forEach(contact => {
                    // Logic to trigger email via Nodemailer goes here
                    if (contact.email) {
                        sendEmergencyEmailWithLocation(
                            contact, 
                            trip, 
                            "URGENT: MISSED CHECK-IN ALERT & GRACE PERIOD EXPIRED", 
                            mapLink, 
                            address);
                        console.log(`Missed check-in email sent to ${contact.email} for ${trip.userId.name}`);
                    }
                    console.log(`Alert sent to ${contact.email} for ${trip.userId.name}`);
                });
                // Send SMS to each emergency contact via Twilio
                trip.emergencyContacts.forEach(contact => {
                    // Logic to trigger SMS via Twilio goes here
                    if (contact.phone){
                        sendEmergencyMessageWithLocation(
                            contact.phone, 
                            trip, 
                            "URGENT: MISSED CHECK-IN ALERT & GRACE PERIOD EXPIRED", 
                            mapLink, 
                            address);
                    }
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
                console.log(` EMERGENCY and Missed check-in alerts processed for trip ID: ${trip._id}`);
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