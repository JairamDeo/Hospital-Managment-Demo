import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { PatientPortalAuthProvider } from '@/context/PatientPortalAuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { ToastContainer } from '@/components/ui/Toast';
import { AppRoutes } from '@/routes/AppRoutes';

const App = () => (
  <BrowserRouter>
    <ToastProvider>
      <AuthProvider>
        <PatientPortalAuthProvider>
          <AppRoutes />
          <ToastContainer />
        </PatientPortalAuthProvider>
      </AuthProvider>
    </ToastProvider>
  </BrowserRouter>
);

export default App;
