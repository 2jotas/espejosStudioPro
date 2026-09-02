import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Landing from './routes/Landing';
import Login from './routes/Login';
import Register from './routes/Register';
import Space from './routes/Space';
import SuperAdminDashboard from './routes/SuperAdminDashboard';
import PerformanceApp from './routes/PerformanceApp';
import AutoStudio from './routes/AutoStudio';

export default function App() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
  const isPerformanceSubdomain = hostname.startsWith('performance.');
  const isAutoSubdomain = hostname.startsWith('auto.');

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {isPerformanceSubdomain ? (
            <Route path="*" element={<PerformanceApp />} />
          ) : isAutoSubdomain ? (
            <Route path="*" element={<AutoStudio />} />
          ) : (
            <>
              <Route path="/" element={<Landing />} />
              <Route path="/performance" element={<PerformanceApp />} />
              <Route path="/visagismo" element={<PerformanceApp />} />
              <Route path="/auto" element={<AutoStudio />} />
              <Route path="/studio" element={<AutoStudio />} />
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Register />} />
              <Route path="/super-admin" element={<SuperAdminDashboard />} />
              <Route path="/:slug" element={<Space />} />
            </>
          )}
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

