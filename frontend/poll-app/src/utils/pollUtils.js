import config from '../config';

const basePollAPIUrl = `${config.BACKEND_BASE_URL}/api/poll`;
export async function getPollRequest(pollId) {
    return fetch(`${basePollAPIUrl}/${pollId}`, {
        method: "GET",
        credentials: config.API_REQUEST_CREDENTIALS_SETTING,
    });

}

export async function createPollRequest(title, description, correct_option, options) {
    return fetch(`${basePollAPIUrl}`, {
        method: 'POST',
        credentials: config.API_REQUEST_CREDENTIALS_SETTING,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title,
            description,
            correct_option,
            options
        }),
    });

}

export async function votePollRequest(pollId, answerIndex) {
    return fetch(`${basePollAPIUrl}/${pollId}/vote`, {
        method: "PATCH",
        credentials: config.API_REQUEST_CREDENTIALS_SETTING,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            answer: answerIndex,
        })
    });
}

export async function availablePollRequest(pollId, availability) {
    return fetch(`${basePollAPIUrl}/${pollId}/available`, {
        method: "PATCH",
        credentials: config.API_REQUEST_CREDENTIALS_SETTING,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            available: availability
        })
    });

}

export async function deletePollRequest(pollId) {
    return fetch(`${basePollAPIUrl}/${pollId}/`, {
        method: "DELETE",
        credentials: config.API_REQUEST_CREDENTIALS_SETTING
    });
}
export async function clearPollRequest(pollId) {
    return fetch(`${basePollAPIUrl}/${pollId}/clear`, {
        method: "PATCH",
        credentials: config.API_REQUEST_CREDENTIALS_SETTING
    });


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

// Convert decimal to rounded percent string
export function percentOrZero(decimal, places=2) {
    if (isNaN(decimal)) return "0%";
    return (decimal * 100).toFixed(2) + "%";
}
