import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import User from './pages/User'
import Admin from './pages/Admin'

export default function App() {
    return (
        <BrowserRouter>
            <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc', marginBottom: '1rem' }}>
                <Link to="/" style={{ marginRight: '1rem' }}>User Chat</Link>
                <Link to="/admin">Admin</Link>
            </nav>
            <Routes>
                <Route path="/" element={<User />} />
                <Route path="/admin" element={<Admin />} />
            </Routes>
        </BrowserRouter>
    )
}
