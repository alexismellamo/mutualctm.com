import { Route, Router } from '@solidjs/router';
import { type Component, onMount, Show } from 'solid-js';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
import SignatureTestPage from './pages/SignatureTestPage';
import ValidationPage from './pages/ValidationPage';
import { authStore } from './stores/auth';

const App: Component = () => {
  onMount(async () => {
    await authStore.checkAuth();
  });

  const ProtectedRoute: Component<{ component: Component }> = (props) => (
    <Show
      when={authStore.isInitialized()}
      fallback={
        <div class="flex items-center justify-center min-h-screen">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-ctm-red" />
          <span class="ml-3 text-gray-600">Verificando autenticación...</span>
        </div>
      }
    >
      <Show when={authStore.admin()} fallback={<LoginPage onLogin={() => {}} />}>
        <props.component />
      </Show>
    </Show>
  );

  return (
    <div class="min-h-screen">
      <Router>
        {/* Public validation route - no authentication required */}
        <Route path="/validation/:id" component={ValidationPage} />

        {/* Protected routes - require authentication */}
        <Route path="/" component={() => <ProtectedRoute component={DashboardPage} />} />
        <Route path="/settings" component={() => <ProtectedRoute component={SettingsPage} />} />
        <Route
          path="/signature-test"
          component={() => <ProtectedRoute component={SignatureTestPage} />}
        />
      </Router>
    </div>
  );
};

export default App;
