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