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

export async function clearPoll(poll) {
    fetch(`${config.BACKEND_BASE_URL}/api/poll/${poll._id}/clear`, {
        method: "PATCH",
        credentials: 'include'
    })
    .then(res => {
        if (!res.ok) {
            pushAlert('Failed to clear poll responses', 'error');
        }
    })
    .then(() => pushAlert(`Cleared poll \"${truncate(poll.question)}\"`))
    .then(() => setPolls(prevPolls => prevPolls.map(p => {
        if (p._id === poll._id) {
            // Return a new object with the updated available property
            return { ...p, responses: [] };
        }
        return p;
    })))
    .catch(error => console.log(error))
}


// Truncate and add ellipsis for long poll or option name
export function truncate(str) {
    if (str.length > 30) {
        return str.substring(0, 30) + "...";
    }
    return str;
}

// Generate dialog text for some action
export function getDialogText(message) {
    return `Are you sure you want to ${message}?`;
}