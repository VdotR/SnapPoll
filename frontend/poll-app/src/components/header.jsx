import React, { useState } from 'react';

function Header() {
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const identifier = "User"; // This should be dynamically set based on the logged-in user

    const toggleDropdown = () => setDropdownVisible(!dropdownVisible);

    const handleLogout = async () => {
        try {
            // Make a GET request to the logout endpoint
            const response = await fetch('http://localhost:3000/api/user/logout', {
                method: 'GET',
                credentials: 'include', // Ensure cookies are sent with the request if sessions are used
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

    return (
        <nav>
            {/* Placeholders for actual links */}
            <span>Home</span>
            <div className='nav-links'>
                <span>Answer Poll</span>
                <span>My Polls</span>
                <span>My Account</span>
                <div className="dropdown">
                    <span id='greet-user' onClick={toggleDropdown}>Hi, {identifier}</span>
                    {dropdownVisible && (
                        <div className="dropdown-content">
                            <span onClick={handleLogout}>Logout</span>
                        </div>
                    )}
                </div>
            </div>            
        </nav>
    );
}

export default Header;