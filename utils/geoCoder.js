const { Client } = require("@googlemaps/google-maps-services-js");
const client = new Client({});

exports.getAddress = async (lat, lng) => {
    try {
        // Ensure lat/lng are treated as numbers
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);

        if (isNaN(latitude) || isNaN(longitude)) {
            throw new Error("Invalid Coordinates provided to Geocoder");
        }

        const response = await client.reverseGeocode({
            params: {
                latlng: `${latitude},${longitude}`, // Use string format
                key: process.env.GOOGLE_MAPS_API_KEY
            },
            timeout: 5000 // 5-second timeout for emergency speed
        });

        // Safe check for results
        if (response.data.status === "OK" && response.data.results.length > 0) {
            return response.data.results[0].formatted_address;
        } else {
            console.warn("Google Maps Status:", response.data.status);
            return "Precise address not found";
        }

    } catch (error) {
        // Detailed logging to help you debug in your terminal
        console.error("Google Maps API Error:", error.response ? error.response.data : error.message);
        return "Location unavailable";
    }
};