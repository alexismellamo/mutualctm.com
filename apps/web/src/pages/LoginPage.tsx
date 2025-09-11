import { type Component, Show, createSignal } from 'solid-js';
import { authStore } from '../stores/auth';

type Props = {
  onLogin?: () => void;
};

const LoginPage: Component<Props> = (props) => {
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [error, setError] = createSignal('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');

    const result = await authStore.login(email(), password());

    if (result.success) {
      props.onLogin?.();
    } else {
      setError(result.error || 'Error de autenticación');
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-ctm-red/10 to-ctm-amber/10">
      <div class="w-full max-w-md">
        <div class="card">
          <div class="text-center mb-8">
            <div class="w-16 h-16 bg-ctm-red rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-white font-bold text-xl">CTM</span>
            </div>
            <h1 class="text-2xl font-bold text-ctm-text">Sistema de Credenciales</h1>
            <p class="text-gray-600 mt-2">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} class="space-y-6">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                class="input-field"
                placeholder="admin@ctm.local"
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
              />
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                class="input-field"
                placeholder="••••••••"
                value={password()}
                onInput={(e) => setPassword(e.currentTarget.value)}
              />
            </div>

            <Show when={error()}>
              <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error()}
              </div>
            </Show>

            <button
              type="submit"
              disabled={authStore.isLoading()}
              class="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Show
                when={!authStore.isLoading()}
                fallback={
                  <>
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Iniciando sesión...
                  </>
                }
              >
                Iniciar Sesión
              </Show>
            </button>
          </form>

          <div class="mt-6 text-center text-sm text-gray-500">
            <p>Credenciales por defecto:</p>
            <p class="font-mono text-xs mt-1">admin@ctm.local / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
