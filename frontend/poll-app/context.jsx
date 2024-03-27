import { createContext, useState, useContext } from 'react';

// Use context instead of state to manage App-level state for easier passing to children components
const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [identifier, setIdentifier] = useState('');
    return (
        <UserContext.Provider value={{
            isLoggedIn: isLoggedIn,
            setIsLoggedIn: setIsLoggedIn,
            isLoading: isLoading,
            setIsLoading: setIsLoading,
            identifier: identifier,
            setIdentifier: setIdentifier,

        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUserContext = () => useContext(UserContext);