import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import MyPolls from './pages/MyPolls'
import { useUserContext } from '../context'
import './App.css'


// TODO: route between different pages
// https://reactrouter.com/en/main/start/tutorial
import {
  createBrowserRouter,
  RouterProvider
} from "react-router-dom"

function App() {
  const { 
    isLoggedIn,
    setIsLoggedIn,
    isLoading,
    setIsLoading,
    identifier,
    setIdentifier
  } = useUserContext();

  function pageifLoggedIn(path, page) {
    // return isLoggedIn ? page : <Login />
    if (isLoggedIn) {
      return page;
    }
    else {
      return <Navigate to="/login" replace={true} state={{ from: path }}/>
    } 
  }

  useEffect(() => {
    fetch('http://localhost:3000/api/user/auth/', {
      credentials: 'include' 
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("/auth response: " + data.isLoggedIn)
        setIsLoggedIn(data.isLoggedIn);
        setIdentifier(data.identifier);
      })
      .catch((error) => {
        console.error('Error fetching auth status:', error);
      })
      .finally(() => {
        // console.log(isLoggedIn) // redirect doesn't work without this?
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <div>Loading...</div>; // Or any other loading indicator
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={pageifLoggedIn("/", <Dashboard />)} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/polls" element={pageifLoggedIn("/polls", <MyPolls />)} />
      </Routes>
    </Router>
  );
}

export default App
