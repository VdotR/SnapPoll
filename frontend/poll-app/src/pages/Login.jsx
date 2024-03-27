import Page from '../components/page'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';


function Login() {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("")

    async function handleLogin() {
        try {
            const res = await fetch('http://localhost:3000/api/user/login', {
                method: "POST",
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    "identifier": identifier,
                    "password": password
                })
            })

            // Login failed
            if (res.status === 400) {
                alert("Username/Email and password do not match");
                return;
            }

            // Set global user identifier, removed automatically when browser closed
            sessionStorage.setItem('identifier', identifier);

            // Redirect to polls page
            navigate('/polls')
        }
        catch (err) {
            console.log(err);
        }
        
    }

    return (
        <Page title='Login' centerTitle={true} hideNav={true}>
            <form id='login-form'>
                <input name='identifier' type='text' onInput={e => setIdentifier(e.target.value)} placeholder='Username or email' required></input>
                <input type='password' onInput={e => setPassword(e.target.value)} placeholder='Password' required></input>
                <button onClick={handleLogin} type='button'>
                    Login
                </button>
            </form>
        </Page>
    )
    
}

export default Login;