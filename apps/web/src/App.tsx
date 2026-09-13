import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import SeoHead from './components/common/SeoHead';
import Landing from './routes/Landing';
import Login from './routes/Login';
import Register from './routes/Register';
import Space from './routes/Space';
import AdminPanel from './routes/AdminPanel';
import SuperAdminDashboard from './routes/SuperAdminDashboard';
import PerformanceApp from './routes/PerformanceApp';
import AutoStudio from './routes/AutoStudio';

export default function App() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
  const isPerformanceSubdomain = hostname.startsWith('performance.');
  const isAutoSubdomain = hostname.startsWith('auto.');
  const isAppSubdomain = hostname.startsWith('app.') || hostname.startsWith('agenda.');

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <SeoHead />
        <AuthProvider>
        <Routes>
          {isPerformanceSubdomain ? (
            <Route path="*" element={<PerformanceApp />} />
          ) : isAutoSubdomain ? (
            <Route path="*" element={<AutoStudio />} />
          ) : isAppSubdomain ? (
            <>
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Register />} />
              <Route path="*" element={<AdminPanel />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Landing />} />
              <Route path="/performance" element={<PerformanceApp />} />
              <Route path="/visagismo" element={<PerformanceApp />} />
              <Route path="/auto" element={<AutoStudio />} />
              <Route path="/studio" element={<AutoStudio />} />
              <Route path="/panel" element={<AdminPanel />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Register />} />
              <Route path="/super-admin" element={<SuperAdminDashboard />} />
              <Route path="/:slug" element={<Space />} />
            </>
          )}
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
