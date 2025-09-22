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

  return (
    <div class="min-h-screen">
      <Router>
        {/* Public validation route - no authentication required */}
        <Route path="/validation/:id" component={ValidationPage} />

        {/* Protected routes - require authentication */}
        <Route
          path="/*"
          component={() => (
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
                <Router>
                  <Route path="/" component={DashboardPage} />
                  <Route path="/settings" component={SettingsPage} />
                  <Route path="/signature-test" component={SignatureTestPage} />
                </Router>
              </Show>
            </Show>
          )}
        />
      </Router>
    </div>
  );
};

export default App;
