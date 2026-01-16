const axios = require('axios');

exports.getAddress = async (lat, lng) => {
    const apiKey = process.env.LOCATIONIQ_API_KEY;
    const url = `https://us1.locationiq.com/v1/reverse.php?key=${apiKey}&lat=${lat}&lon=${lng}&format=json`;

    try {
        const response = await axios.get(url);
        return response.data.display_name;
    } catch (error) {
        console.error("Geocoding failed", error.message);
        return 'Address not found'; 
    }
};