const nodemailer = require('nodemailer');
const Twilio = require('twilio');
const admin = require('../config/firebase');

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // Or your preferred email provider
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
// Configure Twilio client
const twilioClient = new Twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

exports.sendEmergencyEmail = (contact, trip, type) => {
    const mailOptions = {
        from: '"SoloSafe Emergency" <alerts@solosafe.com>',
        to: contact.email,
        subject: `🚨 ${type}: ${trip.userId.name} needs assistance`,
        html: `
            <h2>SoloSafe Emergency Alert</h2>
            <p>This is an automated alert for <strong>${trip.userId.name}</strong>.</p>
            <p><strong>Status:</strong> ${type}</p>
            <p><strong>Destination:</strong> ${trip.destination}</p>
            <p><strong>Accommodation:</strong> ${trip.accommodation}</p>
            <hr>
            <p>View their full itinerary and last known location here:</p>
            <a href="https://solosafe.app/itinerary/${trip._id}">View Shared Itinerary</a>
        `
    };

    transporter.sendMail(mailOptions);
};
exports.sendEmergencyMessage = (phone, trip, type) => {
    const messageBody = `
        URGENT: ${trip.userId.name} has triggered a ${type} alert on SoloSafe.
        Destination: ${trip.destination}
        Accommodation: ${trip.accommodation}
        View their itinerary: https://solosafe.app/itinerary/${trip._id}
    `;
    twilioClient.messages.create({
        body: messageBody,
        from: process.env.TWILIO_PHONE,
        to: phone
    });
};  

exports.sendPushNotification = async (fcmToken, title, body) => {
    const message = {
        notification: { 
            title, 
            body 
        },  
        token: fcmToken
    };
    try {
        await admin.messaging().send(message);
        console.log('Push notification sent successfully');
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
};