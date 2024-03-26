import React from 'react';

function Header() {
    return (
        <nav>
            {/* Placeholders for actual links */}
            <span>Home</span>
            <div className='nav-links'>
                <span>Answer Poll</span>
                <span>My Polls</span>
                <span>My Account</span>
                <span id='greet-user'>Hi, (identifier)</span>
            </div>            
        </nav>
    );
}

export default Header;