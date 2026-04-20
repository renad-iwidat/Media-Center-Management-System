import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ManualInputText from './pages/ManualInputText'
import ManualInputAudio from './pages/ManualInputAudio'
import ManualInputVideo from './pages/ManualInputVideo'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/text" element={<ManualInputText />} />
        <Route path="/audio" element={<ManualInputAudio />} />
        <Route path="/video" element={<ManualInputVideo />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
