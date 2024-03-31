import Page from '../components/page'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';
import { useUserContext } from '../../context';

function SignUp() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const { pushAlert } = useUserContext();

    async function handleSignUp() {
        if (password !== confirmPassword) {
            pushAlert("Passwords don't match!", 'error');
            return;
        }
        if(!username || !email || !password || !confirmPassword){
            pushAlert("Please fill in all fields.", 'error');
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
                pushAlert(await res.text(), 'error'); 
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
        <Page title='Sign Up' centerTitle={true} hideNav={true}>
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