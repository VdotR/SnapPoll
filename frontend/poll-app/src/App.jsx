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
import { authUserRequest } from './utils/userUtils';
import Page from './components/page';
import Loading from './components/loading';
import PollDetails from './pages/PollDetails';
import MyAccount from './pages/MyAccount';
import VerifyEmail from './pages/VerifyEmail';

function App() {
  const {
    isLoggedIn,
    setIsLoggedIn,
    isLoading,
    setIsLoading,
    username,
    setUsername,
    userId,
    setUserId
  } = useUserContext();

  function pageifLoggedIn(path, page) {
    console.log("logged in " + isLoggedIn)
    // return isLoggedIn ? page : <Login />
    if (isLoggedIn) {
      return page;
    }
    else {
      return <Navigate to="/login" replace={true} state={{ from: path }} />
    }
  }

  useEffect(() => {
    authUserRequest()
      .then((response) => response.json())
      .then((data) => {
        setIsLoggedIn(data.isLoggedIn);
        setUsername(data.username);
        setUserId(data.userId);
      })
      .catch((error) => {
        console.error('Error fetching auth status:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isLoading]);

  if (isLoading) {
    return (
      <Page hideNav={true}><Loading /></Page>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={pageifLoggedIn("/", <Dashboard />)} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/polls" element={pageifLoggedIn("/polls", <MyPolls />)} />
        <Route path="/poll/:poll_id" element={pageifLoggedIn("/polls/:poll_id", <PollDetails />)} />
        <Route path="/vote" element={pageifLoggedIn("/vote", <FindAvailablePoll />)} />
        <Route path="/vote/:poll_id" element={pageifLoggedIn("/vote/:poll_id", <Vote />)} />
        <Route path="/polls/create" element={pageifLoggedIn("/polls/create", <CreatePoll />)} />
        <Route path="/myaccount" element={pageifLoggedIn("/myaccount", <MyAccount />)} />
        <Route path="/verify/:token" element={<VerifyEmail />} />
      </Routes>
    </Router>
  );
}

export default App
