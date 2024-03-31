import { createContext, useState, useContext, useEffect } from 'react';
import Alert from './src/components/alert';

// Use context instead of state to manage App-level state for easier passing to children components
const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [identifier, setIdentifier] = useState('');
    const [alert, setAlert] = useState(null);

    useEffect(() => {
        console.log(alert);
    }, [alert]);

    return (
        <UserContext.Provider value={{
            isLoggedIn: isLoggedIn,
            setIsLoggedIn: setIsLoggedIn,
            isLoading: isLoading,
            setIsLoading: setIsLoading,
            identifier: identifier,
            setIdentifier: setIdentifier,
            alert: alert,
            setAlert: setAlert
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUserContext = () => useContext(UserContext);