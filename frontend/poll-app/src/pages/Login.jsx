import Page from '../components/page'
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserContext } from '../../context';
import config from '../config';


function Login({ redirected }) {
    const [userIdentifier, setUserIdentifier] = useState("");
    const [password, setPassword] = useState("")
    const navigate = useNavigate();
    const location = useLocation();
    const { from } = location.state || {from: '/'}
    const { isLoggedIn, setIsLoggedIn, setIdentifier } = useUserContext();
    const successMessage = location.state?.message;

    async function handleLogin() {
        try {
            const res = await fetch(`${config.BACKEND_BASE_URL}/api/user/login`, {
                method: "POST",
                credentials: config.API_REQUEST_CREDENTIALS_SETTING,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    "identifier": userIdentifier,
                    "password": password
                })
            })

            // Login failed
            if (res.status === 400) {
                alert("Username/Email and password do not match");
                return;
            }

            // Login success, change global state
            setIsLoggedIn(true);      
            setIdentifier(userIdentifier);      
        }
        catch (err) {
            console.log(err);
        }        
    }

    // Send the user back from whence they came on successful login or if already logged in
    useEffect(() => {
        if (isLoggedIn) {
            navigate(from);
        } 
    }, [isLoggedIn])

    return (
        <Page title='Login' centerTitle={true} hideNav={true}>
            <form id='login-form'>  
                {successMessage && (
                    <div className='success-login-message'>
                        {successMessage}
                    </div>
                )}            
                <input name='identifier' type='text' onInput={e => setUserIdentifier(e.target.value)} placeholder='Username or email' required></input>
                <input type='password' onInput={e => setPassword(e.target.value)} placeholder='Password' required></input>
                <button onClick={handleLogin} type='button'>
                    Login
                </button>
            </form>
        </Page>
    )
    
}

export default Login;