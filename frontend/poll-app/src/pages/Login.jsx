import Page from '../components/page'
import { useState } from 'react';


function Login() {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("")

    async function handleLogin() {
        try {
            console.log("fetch")
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
            console.log(res);

            if (res.status === 400) {
                alert("Username/Email and password do not match");
            } else if (res.ok) {
                // Handle successful login here
                console.log("Login Successful");
                window.location.reload(); //just refresh I guess

            } else {
                // Handle other errors or statuses here
                console.log("Error logging in");
            }

        }
        catch (err) {
            console.log(err);
        }
        
    }

    return (
        <Page title='Login'>
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