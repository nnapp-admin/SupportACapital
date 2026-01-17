import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import User from './pages/User'
import Admin from './pages/Admin'

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<User />} />
                <Route path="/admin" element={<Admin />} />
            </Routes>
        </BrowserRouter>
    )
}
