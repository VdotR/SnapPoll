import Page from '../components/page'
import { useState, useRef, useSyncExternalStore } from 'react';

function Login() {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");

    async function handleLogin() {
        try {
            console.log("fetch")
            const res = await fetch('http://localhost:3000/api/user/login', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    "identifier": identifier,
                    "password": password
                })
            })
            console.log(res);
        }
        catch (err) {
            console.log(err);
        }
        
    }

    return (
        <Page title='Login'>
            <form id='login-form'>
                <input name='identifier' type='text' onInput={e => setIdentifier(e.target.value)} placeholder='Username or email'></input>
                <input type='password' onInput={e => setPassword(e.target.value)} placeholder='Password'></input>
                <button onClick={handleLogin} type='button'>
                    Login
                </button>
            </form>
        </Page>
    )
    
}

export default Login;