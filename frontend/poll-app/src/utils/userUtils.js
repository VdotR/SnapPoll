import config from '../config';

const baseUserAPIUrl = `${config.BACKEND_BASE_URL}/api/user`;

export async function createdPollsRequest(userId) {
    return fetch(`${baseUserAPIUrl}/created_polls/${userId}`, {
        credentials: config.API_REQUEST_CREDENTIALS_SETTING
    });
}

export async function getUserRequest(userId) {
    return fetch(`${config.BACKEND_BASE_URL}/api/user/${userId}`, {
        credentials: config.API_REQUEST_CREDENTIALS_SETTING
    });
}

export async function loginUserRequest(identifier, password) {
    return fetch(`${baseUserAPIUrl}/login`, {
        method: "POST",
        credentials: config.API_REQUEST_CREDENTIALS_SETTING,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "identifier": identifier,
            "password": password
        })
    })
}

export async function signupUserRequest(username, email, password) {
    return fetch(`${baseUserAPIUrl}/signup`, {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "username": username,
            "email": email,
            "password": password
        })
    })
}

export async function changePasswordRequest(old_password, new_password) {
    return fetch(`${baseUserAPIUrl}/change_password`, {
        method: "PATCH",
        credentials: config.API_REQUEST_CREDENTIALS_SETTING,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            old_password: old_password,
            new_password: new_password
        })
    });
}

export async function logoutUserRequest() {
    return fetch(`${baseUserAPIUrl}/logout`, {
        method: 'GET',
        credentials: config.API_REQUEST_CREDENTIALS_SETTING,
    });
}

export async function authUserRequest() {
    return fetch(`${baseUserAPIUrl}/auth/`, {
        credentials: config.API_REQUEST_CREDENTIALS_SETTING
    });
}

export async function lookupUserRequest(identifier) {
    return fetch(`${baseUserAPIUrl}/lookup/${identifier}`, {
        credentials: config.API_REQUEST_CREDENTIALS_SETTING
    });
}

export async function deleteUserRequest(password) {
    return fetch(`$${baseUserAPIUrl}/delete`, {
        method: "DELETE",
        credentials: config.API_REQUEST_CREDENTIALS_SETTING,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            password: password,
        })
    });
}    