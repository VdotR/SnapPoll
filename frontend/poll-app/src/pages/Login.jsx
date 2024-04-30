import Page from '../components/page'
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useUserContext } from '../../context';
import { loginUserRequest } from '../utils/userUtils';
import '../css/Login.css';

function Login({ redirected }) {
    const [userIdentifier, setUserIdentifier] = useState("");
    const [password, setPassword] = useState("")
    const navigate = useNavigate();
    const location = useLocation();
    const { from } = location.state || { from: '/' }
    const { isLoggedIn, setIsLoggedIn, setIsLoading, pushAlert, popAlert } = useUserContext();
    const successMessage = location.state?.message;

    async function handleLogin() {
        try {
            const res = await loginUserRequest(userIdentifier, password);
            
            // Login failed
            if (res.status === 400) {
                pushAlert("Username/Email and password do not match", 'error');
                return;
            } 
            else if (res.status === 403) {
                pushAlert("User not verified. Please check your mailbox for verification email.", 'error');
                return;
            }

            // Login success, change global state
            setIsLoggedIn(true);
            popAlert();
        }
        catch (err) {
            console.log(err);
        }
    }

    // Send the user back from whence they came on successful login or if already logged in
    useEffect(() => {
        if (isLoggedIn) {
            setIsLoading(true); //force auth check to get username
            navigate(from);
        }
    }, [isLoggedIn])

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleLogin();
        }
    }

    return (
        <Page title='Login' centerTitle={true} hideNav={true}>
            <form id='login-form' onKeyDown={ handleKeyDown }> 
                {successMessage && (
                    <div className='success-login-message'>
                        {successMessage}
                    </div>
                )}
                <input name='identifier' type='text' onInput={e => setUserIdentifier(e.target.value)} placeholder='Username or email' required></input>
                <input type='password' onInput={e => setPassword(e.target.value)} placeholder='Password' required></input>
                <button className='submit-btn' onClick={handleLogin} type='button'>
                    Sign in
                </button>
            </form>
            <div className="prompt-link">
                Not a Member? <Link to="/signup">Sign Up</Link>
            </div>
        </Page>
    )

}

export default Login;