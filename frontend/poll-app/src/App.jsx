import { useState } from 'react'
import MyPolls from './pages/MyPolls'
import Login from './pages/Login'
import './App.css'

// TODO: route between different pages

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      {/* <MyPolls></MyPolls> */}
      <Login></Login>
    </>
  )
}

export default App
