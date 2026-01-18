const Trip = require('../models/Trip');

exports.createTrip = async (req, res) => {
    try {
        const { destination, startDate, endDate, accommodation, checkInFrequency, emergencyContacts } = req.body;
        const userId = req.userId;
        const now = new Date();
        const start = new Date(startDate);
        // 1. Check if user already has an active trip (MVP Constraint) 
        const existingTrip = await Trip.findOne({
            userId: userId, 
            status: {$in: ['active', 'Safe', 'Missed Check-in', 'SOS'] }
        });// ['Safe', 'Missed Check-in', 'SOS', 'Completed', 'active']
        if (existingTrip) {
            return res.status(400).json({ message: "You already have an active trip." });
        }
        // 2. Calculate the first check-in time based on frequency (e.g., 8 or 24 hours) [cite: 51]
        const isStartingNow = start <= now;

        let firstCheckIn = null;
        if (isStartingNow) {
            firstCheckIn = new Date();
            firstCheckIn.setMinutes(firstCheckIn.getMinutes() + parseInt(checkInFrequency));
        }
        // const firstCheckIn = new Date();
        // firstCheckIn.setMinutes(firstCheckIn.getMinutes() + parseInt(checkInFrequency));

        // 3. Create the trip 
        const newTrip = await Trip.create({
            userId,
            destination,
            startDate,
            endDate,
            accommodation,
            checkInFrequency,
            nextCheckIn: firstCheckIn,
            status: isStartingNow ? 'active' : 'upcoming',
            emergencyContacts // These can be pulled from user profile or set specifically for this trip [cite: 37]
        });

        res.status(201).json(newTrip);
    } catch (err) {
        res.status(500).json({ error: "Failed to create trip", message: err.message });
    }
};

exports.addContactToTrip = async (req, res) => {
    try {
        const { tripId } = req.params;
        const { name, email, phone } = req.body;

        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.status(404).json({ message: "Trip not found." });
        }

        // Add the new contact to the trip's emergency contacts
        trip.emergencyContacts.push({ name, email, phone });
        await trip.save();

        res.status(200).json({ message: "Contact added successfully.", trip });
    } catch (err) {
        res.status(500).json({ error: "Failed to add contact." });
    }
};

exports.displayContacts = async (req, res) => {
    try {
        const { tripId } = req.params;
        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.status(404).json({ message: "Trip not found." });
        }       
        res.status(200).json({ emergencyContacts: trip.emergencyContacts });
    } catch (err) {
        res.status(500).json({ error: "Failed to retrieve contacts." });
    }
};

exports.deleteContactFromTrip = async (req, res) => {
    try {
        const { tripId, contactId } = req.params;   

        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.status(404).json({ message: "Trip not found." });
        }

        // Remove the contact from the trip's emergency contacts
        trip.emergencyContacts = trip.emergencyContacts.filter(contact => contact._id.toString() !== contactId);
        await trip.save();
        
        res.status(200).json({ message: "Contact deleted successfully.", trip });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete contact." });
    }
};

exports.confirmSafety = async (req, res) => {
    try {
        const { tripId } = req.params;
        const userId = req.userId;

        // 1. Find the trip and ensure it belongs to the logged-in user
        const trip = await Trip.findOne({ _id: tripId, userId: userId });

        if (!trip) {
            return res.status(404).json({ message: "Trip not found or unauthorized." });
        }

        // 2. Calculate the NEW next check-in time [cite: 51]
        const newCheckIn = new Date();
        newCheckIn.setMinutes(newCheckIn.getMinutes() + trip.checkInFrequency);

        // 3. Reset status and update the time 
        trip.nextCheckIn = newCheckIn;
        trip.status = 'Safe';
        await trip.save();

        res.status(200).json({ 
            message: "Check-in successful. Your next check-in is scheduled.",
            nextCheckIn: newCheckIn 
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to confirm safety." });
    }
};

exports.getPublicItinerary = async (req, res) => {
    try {
        
        // We find the trip by ID but we DO NOT use 'auth' middleware here
        // so that emergency contacts can view it via the link 
        const trip = await Trip.findById(req.params.tripId)
            .populate('userId', 'name') // Only show the traveler's name [cite: 72]
            .select('destination startDate endDate accommodation status nextCheckIn');

        if (!trip) return res.status(404).json({ message: "Itinerary not found." });

        res.json(trip);
    } catch (err) {
        res.status(500).json({ error: "Error fetching itinerary." });
    }
};

exports.getUserTrips = async (req, res) => {
    try {
        const trips = await Trip.find({ userId: req.userId });
        res.status(200).json(trips);
    } catch (err) {
        res.status(500).json({ error: "Failed to retrieve trips." });
    }
};

exports.endTrip = async (req, res) => {
    try {
        const { tripId } = req.params;  
        const trip = await Trip.findOne({ _id: tripId, userId: req.userId });

        if (!trip) {
            return res.status(404).json({ message: "Trip not found." });
        }
        trip.status = 'Completed';
        await trip.save();
        res.status(200).json({ message: "Trip ended successfully." });
    } catch (err) {
        res.status(500).json({ error: "Failed to end trip." });
    }
};
