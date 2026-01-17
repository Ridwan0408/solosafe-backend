const Mailjet = require('node-mailjet');
const Twilio = require('twilio');
const admin = require('../config/firebase');


// Configure Mailjet with your API Keys
const mailjet = Mailjet.apiConnect(
    process.env.MJ_APIKEY_PUBLIC,
    process.env.MJ_APIKEY_PRIVATE
);
// Configure Twilio client
const twilioClient = new Twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

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

/**
 * REUSABLE MAILJET SENDER
 * This handles the API call to Mailjet
 */
const sendMailjetEmail = async (recipients, subject, htmlContent) => {
    // Mailjet expects an array of recipient objects: { Email: "..." }
    const toArray = Array.isArray(recipients) 
        ? recipients.map(email => ({ Email: email }))
        : [{ Email: recipients }];

    try {
        const result = await mailjet
            .post("send", { version: 'v3.1' })
            .request({
                "Messages": [
                    {
                        "From": {
                            "Email": process.env.EMAIL_USER, 
                            "Name": "SoloSafe Emergency"
                        },
                        "To": toArray,
                        "Subject": subject,
                        "HTMLPart": htmlContent
                    }
                ]
            });
        console.log('Email sent successfully via Mailjet');
        return result;
    } catch (error) {
        console.error('Mailjet delivery failed:', error.statusCode, error.message);
        throw error;
    }
};
exports.sendEmergencyEmail = async (contact, trip, type) => {
    const contactsArray = Array.isArray(contact) ? contact : [contact];
    const recipientEmails = contactsArray.map(c => c.email).join(', ');
    const html = `
        <h2>SoloSafe Emergency Alert</h2>
        <p>This is an automated alert for <strong>${trip.userId.name}</strong>.</p>
        <p><strong>Status:</strong> ${type}</p>
        <p><strong>Destination:</strong> ${trip.destination}</p>
        <p><strong>Accommodation:</strong> ${trip.accommodation}</p>
        <hr>
        <p>View their full itinerary here:</p>
        <a href="${process.env.CLIENT_URL}/public/${trip._id}">View Shared Itinerary</a>
        <a href="${process.env.CLIENT_URL}/shared-trip.html?id=${trip._id}">View Itinerary</a>
    `;

    await sendMailjetEmail(recipientEmails, `URGENT: ${type}: ${trip.userId.name} needs assistance`, html);
};
   

exports.sendEmergencyMessage = async (phone, trip, type) => {
    const formattedPhone = formatPhoneNumber(phone);
    const messageBody = `
        URGENT: ${trip.userId.name} has triggered a ${type} alert on SoloSafe.
        Destination: ${trip.destination}
        Accommodation: ${trip.accommodation}
        View their itinerary: ${process.env.CLIENT_URL}/public/${trip._id}
        View their itinerary: ${process.env.CLIENT_URL}/shared-trip.html?id=${trip._id}`;
        
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
    const html = `
        <h2>SoloSafe Password Reset</h2>
        <p>This is an automated alert for <strong>${user.name}</strong>.</p>
        <p><strong>Status:</strong> ${type}</p>
        <a href="${reset}" style="padding: 10px; background: blue; color: white; text-decoration: none;">Click here to reset your password</a>
    `;

    await sendMailjetEmail(user.email, `${type}: for ${user.name}`, html);
};

exports.sendEmergencyEmailWithLocation = async (contact, trip, type, mapLink, address) => {
    const contactsArray = Array.isArray(contact) ? contact : [contact];
    const recipientEmails = contactsArray.map(c => c.email).join(', ');
    // Conditional rendering for the map button
    const mapButton = (mapLink && mapLink !== 'Not available') 
        ? `<div style="margin: 20px 0;">
             <a href="${mapLink}" style="background-color: #d9534f; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                VIEW CURRENT LOCATION ON MAP
             </a>
           </div>`
        : `<p style="color: #777; font-style: italic;">(Map location unavailable at the time of alert)</p>`;
    const html = `
    <div style="border: 2px solid red; padding: 20px; font-family: sans-serif;">
        <h2 style="color: red;">SoloSafe Emergency Alert</h2>
        <p>This is an automated alert for <strong>${trip.userId.name}</strong>.</p>
        <p><strong>Status:</strong> ${type}</p>
        <p><strong>Precise Location:</strong> ${address}</p>
        <hr style="border: 0; border-top: 1px solid #eee;">
        ${mapButton}
        <a href="${process.env.CLIENT_URL}/public/${trip._id}">View Itinerary</a>
        <a href="${process.env.CLIENT_URL}/shared-trip.html?id=${trip._id}">View Itinerary</a>
    </div>
    `;

    await sendMailjetEmail(recipientEmails, `URGENT: ${type}: ${trip.userId.name} needs assistance`, html);
};

exports.sendSafetyEmailWithLocation = async (contact, trip, type, mapLink, address) => {
    const contactsArray = Array.isArray(contact) ? contact : [contact];
    const recipientEmails = contactsArray.map(c => c.email).join(', ');
    // Conditional rendering for the map button
    const mapButton = (mapLink && mapLink !== 'Not available') 
        ? `<div style="margin: 20px 0;">
             <a href="${mapLink}" style="background-color: #d9534f; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                VIEW CURRENT LOCATION ON MAP
             </a>
           </div>`
        : `<p style="color: #777; font-style: italic;">(Map location unavailable at the time of alert)</p>`;
    const html = `
    <div style="border: 2px solid green; padding: 20px; font-family: sans-serif;">
        <h2 style="color: green;">SoloSafe: User is SAFE</h2>
        <p>Good news! <strong>${trip.userId.name}</strong> has confirmed safety and cancelled SOS.</p>
        <p><strong>Status:</strong> ${type}</p>
        <p><strong>Precise Location:</strong> ${address}</p>
        <hr style="border: 0; border-top: 1px solid #eee;">
        ${mapButton}
        <p>You can still view the trip details here:</p>
        <a href="${process.env.CLIENT_URL}/public/${trip._id}">View Itinerary</a>
        <a href="${process.env.CLIENT_URL}/shared-trip.html?id=${trip._id}">View Itinerary</a>
    </div>
    `;

    await sendMailjetEmail(recipientEmails, `SAFE: ${type}: ${trip.userId.name} has confirmed safety and cancelled SOS`, html);
};

exports.sendEmergencyMessageWithLocation = async (phone, trip, type, mapLink, address) => {
    const formattedPhone = formatPhoneNumber(phone);
    const messageBody = `
        URGENT: ${trip.userId.name} has triggered a ${type} alert on SoloSafe.\n
        Destination: ${trip.destination}\n
        Accommodation: ${trip.accommodation}\n<p>
        Address: ${address}\n
        View their itinerary: ${process.env.CLIENT_URL}/public/${trip._id}\n
        View their itinerary: ${process.env.CLIENT_URL}/shared-trip.html?id=${trip._id}\n
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