import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserContext } from '../../context';
import config from '../config';
import { FaAngleDown, FaBars } from 'react-icons/fa';
import useWindowDimensions from '../utils/dimensions'

function Header() {
    const { username } = useUserContext();
    const { width } = useWindowDimensions();
    const isSmallDevice = width < 640;
    const [navOpen, setNavOpen] = useState(false);

    const handleLogout = async () => {
        try {
            // Make a GET request to the logout endpoint
            const response = await fetch(`${config.BACKEND_BASE_URL}/api/user/logout`, {
                method: 'GET',
                credentials: config.API_REQUEST_CREDENTIALS_SETTING, // Ensure cookies are sent with the request if sessions are used
            });
    
            if (response.ok) {
                console.log("Logged out successfully");
                window.location.reload(); //just refresh I guess
                // Optionally: Update application state or redirect the user to a login page
                // For example, using a state management library, context, or triggering a re-render
            } else {
                console.error("Logout failed", response.statusText);
            }
        } catch (error) {
            console.error("Error during logout", error);
        }
    };

    const navContents = <>
        <Link to='/'>Home</Link>
        <div className='nav-links'>
            <Link to='/vote'>Answer Poll</Link>
            <Link to='/polls'>My Polls</Link>
            <div className="dropdown">
                <div id='greet-user'>
                    <span>Hi, {username}</span><FaAngleDown />
                </div>
                <div className="dropdown-content" >
                    <span>My Account</span>
                    <span onClick={handleLogout}>Logout</span>
                </div>
            </div>
        </div> 
    </>

    return (
        <nav>
            { isSmallDevice? 
                <>
                    <span className='nav-btn' onClick={() => setNavOpen(!navOpen)}><FaBars /></span>
                    <div className='nav-contents' style={{display: navOpen? 'flex' : 'none'}}>
                        {navContents}
                    </div>
                </>                
                : navContents
            }                       
        </nav>
    );
}

export default Header;