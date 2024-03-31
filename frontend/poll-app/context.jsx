import { createContext, useState, useContext, useEffect } from 'react';
import Alert from './src/components/alert';

// Use context instead of state to manage App-level state for easier passing to children components
const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [alert, setAlert] = useState(null);
    const [username, setUsername] = useState('');

    // Set alert with message string and level (error or info)
    const pushAlert = (message, level = 'info') => {
        setAlert({
            message: message,
            level: level
        })
    }
    const popAlert = () => setAlert(null);
    
    return (
        <UserContext.Provider value={{
            isLoggedIn: isLoggedIn,
            setIsLoggedIn: setIsLoggedIn,
            isLoading: isLoading,
            setIsLoading: setIsLoading,
            alert: alert,
            pushAlert: pushAlert,
            popAlert: popAlert,
            username: username,
            setUsername: setUsername,
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUserContext = () => useContext(UserContext);