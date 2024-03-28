import Page from '../components/page'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';


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

            if (res.status === 400) {
                alert("Can't create user. User with same username/email may already exist."); 
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