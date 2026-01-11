const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const Twilio = require('twilio');
const admin = require('../config/firebase');

//sgMail.setApiKey(process.env.SENDGRID_API_KEY);
// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // Or your preferred email provider
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
// Configure Twilio client
const twilioClient = new Twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS exists:', !!process.env.EMAIL_PASS);

// Helper function to format phone numbers in E.164
const formatPhoneNumber = (phone) => {
    if (!phone || typeof phone !== 'string') {
        return null;
    }
    // Remove all non-digit characters
    let digits = phone.replace(/\D/g, '');
    // If it starts with 0, replace with country code +234 (Nigeria)
    if (digits.startsWith('0')) digits = '+234' + digits.slice(1);
    // If it already starts with +, keep it
    else if (!digits.startsWith('+')) digits = '+' + digits;
    return digits;
};

exports.sendEmergencyEmail = async (contact, trip, type) => {
    const contactsArray = Array.isArray(contact) ? contact : [contact];
    const recipientEmails = contactsArray.map(c => c.email).join(', ');
    const mailOptions = {
        from: `"SoloSafe Emergency" <${process.env.EMAIL_USER}>`,
        to: recipientEmails,
        subject: `URGENT: ${type}: ${trip.userId.name} needs assistance`,
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
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Emergency email sent: ' + info.messageId);
    } catch (error) {
        console.error('Email delivery failed:', error);
    }
};

exports.sendEmergencyMessage = async (phone, trip, type) => {
    const formattedPhone = formatPhoneNumber(phone);
    const messageBody = `
        URGENT: ${trip.userId.name} has triggered a ${type} alert on SoloSafe.
        Destination: ${trip.destination}
        Accommodation: ${trip.accommodation}
        View their itinerary: https://solosafe.app/itinerary/${trip._id}`;
    try{        
        await twilioClient.messages.create({
            body: messageBody,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: formattedPhone
        });
        console.log('SMS sent to', phone);
    } catch (error) {
        console.error('SMS delivery failed:', error);
    }
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

exports.sendResetEmail = async (user, type, reset) => {
    const mailOptions = {
        from: `"SoloSafe " <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: ` ${type}: for ${user.name} `,
        html: `
            <h2>SoloSafe Password Reset</h2>
            <p>This is an automated alert for <strong>${user.name}</strong>.</p>
            <p><strong>Status:</strong> ${type}</p>
            <a href="${reset}">click here to reset</a>
            `
        };
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Emergency email sent: ' + info.messageId);
    } catch (error) {
        console.error('Email delivery failed:', error);
    }
};
exports.sendEmergencyEmailWithLoacation = async (contact, trip, type, mapLink, address) => {
    const contactsArray = Array.isArray(contact) ? contact : [contact];
    const recipientEmails = contactsArray.map(c => c.email).join(', ');
    const mailOptions = {
        from: `"SoloSafe Emergency" <${process.env.EMAIL_USER}>`,
        to: recipientEmails,
        subject: `URGENT: ${type}: ${trip.userId.name} needs assistance`,
        html: `
            <h2>SoloSafe Emergency Alert</h2>
            <p>This is an automated alert for <strong>${trip.userId.name}</strong>.</p>
            <p><strong>Status:</strong> ${type}</p>
            <p><strong>Destination:</strong> ${trip.destination}</p>
            <p><strong>Accommodation:</strong> ${trip.accommodation}</p>
            <hr>
            <p>View their full itinerary and last known location here:</p>
            <p><strong>Precise Location:</strong> ${address}</p>
            <a href="https://solosafe.app/itinerary/${trip._id}">View Shared Itinerary</a>
            <p>click here to view their location: ${mapLink}</p>
            `
        };
    try {

        const info = await transporter.sendMail(mailOptions);
        console.log('Emergency email sent: ' + info.messageId);
    } catch (error) {
        console.error('Email delivery failed:', error);
    }
};

exports.sendEmergencyMessageWithLocation = async (phone, trip, type, mapLink, address) => {
    const formattedPhone = formatPhoneNumber(phone);
    const messageBody = `
        URGENT: ${trip.userId.name} has triggered a ${type} alert on SoloSafe.\n
        Destination: ${trip.destination}\n
        Accommodation: ${trip.accommodation}\n<p>
        Address: ${address}\n
        View their itinerary: https://solosafe.app/itinerary/${trip._id}\n
        click here to view their location: ${mapLink}\n`
    try{
        await twilioClient.messages.create({
            body: messageBody,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: formattedPhone
        });
        console.log('SMS sent to', phone);
    } catch (error)
    {
        console.error('SMS delivery failed:', error);
    }
};

