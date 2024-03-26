import Page from '../components/page'
import { useState } from 'react';

function SignUp() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    async function handleSignUp() {
        if (password !== confirmPassword) {
            alert("Passwords don't match!");
            return;
        }

        try {
            console.log("fetch")
            const res = await fetch('http://localhost:3000/api/user/signup', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    "username": username,
                    "email" : email,
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
        <Page title='Sign Up'>
            <form id='login-form'>
                <input name='username' type='text' onInput={e => setUsername(e.target.value)} placeholder='Username' required></input>
                <input name='email' type='email' onInput={e => setEmail(e.target.value)} placeholder='Email' required></input>
                <input type='password' onInput={e => setPassword(e.target.value)} placeholder='Password' required></input>
                <input type='password' onInput={e => setConfirmPassword(e.target.value)} placeholder='Confirm Password' required></input>
                <button onClick={handleSignUp} type='button'>
                    Sign Up
                </button>
            </form>
        </Page>
    )
    
}

export default SignUp;