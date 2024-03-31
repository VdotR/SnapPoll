import Page from '../components/page'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';

function SignUp() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    async function handleSignUp() {
        if (password !== confirmPassword) {
            alert("Passwords don't match!");
            return;
        }
        if(!username || !email || !password || !confirmPassword){
            alert("Please fill in all fields.");
            return;
        }
        try {
            console.log("fetch")
            const res = await fetch(`${config.BACKEND_BASE_URL}/api/user/signup`, {
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

            if (res.status === 400) {
                alert(await res.text()); 
            } else if (res.ok) {
                // Handle successful sign up
                console.log("Sign Up Successful, will redirect to login page");
                // redirect to Login Page
                navigate('/login', { state: { message: 'Signup successful. Please log in.' } });
            } else {
                // Handle other errors or statuses here
                console.log("Error Signing Up");
            }
        }
        catch (err) {
            console.log(err);
        }
        
    }

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleSignUp();
        }
    }

    return (
        <Page title='Sign Up'>
            <form id='login-form' onKeyDown={ handleKeyDown }>
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