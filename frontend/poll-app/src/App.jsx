import Login from './pages/Login'
import SignUp from './pages/SignUp'
import MyPolls from './pages/MyPolls'
import './App.css'

// TODO: route between different pages
// https://reactrouter.com/en/main/start/tutorial
import {
  createBrowserRouter,
  RouterProvider
} from "react-router-dom"

// Routes page URL to page components (can use regex)
const router = createBrowserRouter([
  {
    path: "/",
    element: isLoggedIn ? <Dashboard /> : <Login />, // root is dashboard or login
  }, 
  {
    path: "/login",
    element: <Login></Login>,
  },
  {
    path: "/signup",
    element: <SignUp></SignUp>
  },
  {
    path: "/polls",
    element: <MyPolls></MyPolls>
  }
]);

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/api/user/auth/', {
      credentials: 'include' 
    })
      .then((response) => response.json())
      .then((data) => {
        setIsLoggedIn(data.isLoggedIn);
      })
      .catch((error) => {
        console.error('Error fetching auth status:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <div>Loading...</div>; // Or any other loading indicator
  }

  return (
    <Router>
      <Routes>
      <Route path="/" element={isLoggedIn ? <Dashboard /> : <React.Fragment><Login /><SignUp /></React.Fragment>} />
      </Routes>

    </Router>
  );
  return (
    <RouterProvider router={router} />
  )
}

export default App
