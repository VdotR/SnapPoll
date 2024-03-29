import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import MyPolls from './pages/MyPolls'
import FindAvailablePoll from './pages/FindAvailablePoll';
import Vote from './pages/Vote'
import CreatePoll from './pages/CreatePoll';
import { useUserContext } from '../context'
import './App.css'
import config from './config';



function App() {
  const { 
    isLoggedIn,
    setIsLoggedIn,
    isLoading,
    setIsLoading,
    username,
    setUsername
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
    fetch(`${config.BACKEND_BASE_URL}/api/user/auth/`, {
      credentials: config.API_REQUEST_CREDENTIALS_SETTING 
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("/auth response: " + data.isLoggedIn)
        setIsLoggedIn(data.isLoggedIn);
        setUsername(data.username);
      })
      .catch((error) => {
        console.error('Error fetching auth status:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isLoading]);

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
        <Route path="/poll/:poll_id" element={pageifLoggedIn("/polls/:poll_id", <MyPolls />)} />
        <Route path="/vote" element={pageifLoggedIn("/vote", <FindAvailablePoll />)} />
        <Route path="/vote/:poll_id" element={pageifLoggedIn("/vote/:poll_id", <Vote />)} />
        <Route path="/polls/create" element={pageifLoggedIn("/polls/create", <CreatePoll />)} />        
      </Routes>
    </Router>
  );
}

export default App
