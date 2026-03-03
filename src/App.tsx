import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import { seedDatabase } from './services/db';
import { getUserProfile, createUserProfile } from './services/UserService';
import { useStore } from './store/useStore';
import { useNotificationStore } from './services/NotificationService';
import ToastRenderer from './components/ToastRenderer';
import ConfirmRenderer from './components/ConfirmRenderer';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Lazy load all route-level components for optimal bundle splitting
const Login = lazy(() => import('./pages/Login'));
const Schemes = lazy(() => import('./pages/Schemes'));
const Diagnosis = lazy(() => import('./pages/Diagnosis'));
const History = lazy(() => import('./pages/History'));
const Settings = lazy(() => import('./pages/Settings'));
const Experts = lazy(() => import('./pages/Experts'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ProfileSetup = lazy(() => import('./pages/ProfileSetup'));
const ExpertConsultation = lazy(() => import('./pages/ExpertConsultation'));
const Premium = lazy(() => import('./pages/Premium'));
const SoilAnalyzer = lazy(() => import('./pages/SoilAnalyzer'));
const Experimental = lazy(() => import('./pages/Experimental'));

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      {/* Invisible loader to prevent flash */}
    </div>
  );
}

function ProtectedRoute() {
  const { isAuthenticated } = useStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function App() {
  // Removed unused loadModel from store state as it is an imported service function logic

  useEffect(() => {
    seedDatabase();

    // ── One-time migration: clear stale dismissedIds that blocked daily tips
    // Previous clearAll() incorrectly added IDs to dismissedIds permanently.
    const migrated = localStorage.getItem('notif-migrated-v2');
    if (!migrated) {
      try {
        const stored = localStorage.getItem('cropguard-ai-notifications');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.state?.dismissedIds?.length > 0) {
            parsed.state.dismissedIds = [];
            localStorage.setItem('cropguard-ai-notifications', JSON.stringify(parsed));
            // Also reset in-memory store
            useNotificationStore.setState({ dismissedIds: [] });
          }
        }
      } catch (_) { /* ignore parse errors */ }
      localStorage.setItem('notif-migrated-v2', '1');
    }

    // Preload AI Models
    setTimeout(() => {
      import('./services/DiagnosisService').then(m => m.loadModel());
    }, 1000);

    // Firebase Auth Listener
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        const { login, logout, user } = useStore.getState();

        if (firebaseUser) {
          // If we already have a user in store, we might not need to do anything
          // unless we want to sync metadata.
          // For now, if store is empty but firebase has user, we log them in.
          // Fetch User Profile from Firestore
          getUserProfile(firebaseUser.uid).then(async (profile) => {
            const { setUserId, loadCloudNotifications } = useNotificationStore.getState();
            setUserId(firebaseUser.uid);
            loadCloudNotifications();

            if (profile) {
              login(profile);
            } else {
              // New User: Create Initial Profile in Firestore
              const newProfile = {
                id: firebaseUser.uid,
                firstName: firebaseUser.displayName?.split(' ')[0] || 'Farmer',
                surname: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
                phone: firebaseUser.phoneNumber || '',
                email: firebaseUser.email || '',
                language: 'en' as const,
                farmSize: '5',
                profileComplete: false
              };

              await createUserProfile(firebaseUser.uid, newProfile);
              login(newProfile);
            }
          });
        } else {
          // If firebase says logged out, and we are logged in (and not Guest), logout.
          // allow guest mode to persist locally without firebase auth
          const { isGuest } = useStore.getState();
          if (!isGuest && user) {
            logout();
            const { setUserId, clearAll } = useNotificationStore.getState();
            setUserId(null);
            clearAll();
          }
        }
      });

      return () => unsubscribe();
    }
  }, []);

  return (
    <>
      <ToastRenderer />
      <ConfirmRenderer />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="diagnosis" element={<Diagnosis />} />
              <Route path="history" element={<History />} />
              <Route path="schemes" element={<Schemes />} />
              <Route path="consultations" element={<ExpertConsultation />} />
              <Route path="experts" element={<Experts />} />
              <Route path="premium" element={<Premium />} />
              <Route path="soil" element={<SoilAnalyzer />} />
              <Route path="experimental" element={<Experimental />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Admin Route (No Layout) */}
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
