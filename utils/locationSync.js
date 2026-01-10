
module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected for live tracking:', socket.id);

        // Join a unique 'room' based on the Trip ID
        socket.on('joinTrip', (tripId) => {
            socket.join(tripId);
            console.log(`User joined tracking room: ${tripId}`);
        });

        // Listen for GPS updates from the traveler's phone
        socket.on('sendLocation', (data) => {
            // data contains: { tripId, latitude, longitude, speed }
            // Broadcast this location to everyone in the trip room (emergency contacts)
            io.to(data.tripId).emit('locationUpdate', {
                lat: data.latitude,
                lng: data.longitude,
                timestamp: new Date()
            });
        });

        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });
};