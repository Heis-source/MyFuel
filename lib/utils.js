'use strict';

/**
 * Capitalizes the first letter of a string and lowercases the rest.
 * @param {string} str 
 * @returns {string} My string -> My string
 */
function capitalize(str) {
    if (typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Calculates the Haversine distance between two points in kilometers.
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in km
 */
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Formats distance for display.
 * @param {number} distKm 
 * @returns {string} 500m or 1.23km
 */
function formatDistance(distKm) {
    if (distKm < 1) {
        return `${Math.round(distKm * 1000)}m`;
    }
    return `${distKm.toFixed(2)}km`;
}

module.exports = {
    capitalize,
    getDistance,
    formatDistance
};
