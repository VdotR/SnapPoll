import config from '../config';

export async function fetchPollDetails(pollId) {
    try {
        const response = await fetch(`${config.BACKEND_BASE_URL}/api/poll/${pollId}`, {
            method: "GET",
            credentials: config.API_REQUEST_CREDENTIALS_SETTING,
        });
        return await response.json();
    } catch (error) {
        console.error("Error fetching poll details:", error);
    }
}

// Truncate and add ellipsis for long poll or option name
export function truncate(str) {
    if (str.length > 30) {
        return str.substring(0, 30) + "...";
    }
    return str;
}