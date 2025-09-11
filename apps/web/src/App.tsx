import { type Component, Show, onMount } from 'solid-js';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import { authStore } from './stores/auth';

const App: Component = () => {
  onMount(async () => {
    await authStore.checkAuth();
  });

  const navigateTo = (page: 'login' | 'dashboard') => {
    // This function will be used by child components but actual navigation
    // is handled by the reactive Show components below
  };

  return (
    <div class="min-h-screen">
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
          <DashboardPage onLogout={() => {}} />
        </Show>
      </Show>
    </div>
  );
};

export default App;
