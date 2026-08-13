import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Landing from './routes/Landing';
import Login from './routes/Login';
import Register from './routes/Register';
import Space from './routes/Space';
import SuperAdminDashboard from './routes/SuperAdminDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/super-admin" element={<SuperAdminDashboard />} />
          <Route path="/:slug" element={<Space />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
