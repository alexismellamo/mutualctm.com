import { type Component, createEffect, createSignal, For, Show } from 'solid-js';
import type { User } from '../pages/DashboardPage';

type Props = {
  onUserSelect: (user: User) => void;
  onCreateNew: () => void;
  initialQuery?: string;
};

const SearchPanel: Component<Props> = (props) => {
  const [searchQuery, setSearchQuery] = createSignal(props.initialQuery || '');
  const [users, setUsers] = createSignal<User[]>([]);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal('');

  // Keep timeout reference outside effect
  let debounceTimeout: NodeJS.Timeout | undefined;

  // Auto-search with proper debounce
  createEffect(() => {
    const query = searchQuery();

    // Clear previous timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    if (query.trim().length === 0) {
      setUsers([]);
      setError('');
      return;
    }

    // Set new timeout
    debounceTimeout = setTimeout(() => {
      searchUsers();
    }, 300);
  });

  const searchUsers = async () => {
    const query = searchQuery().trim();
    if (!query) {
      setUsers([]);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/v1/users?query=${encodeURIComponent(query)}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error al buscar usuarios');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de búsqueda');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatUserName = (user: User) => {
    const parts = [user.firstName, user.lastName];
    if (user.secondLastName) {
      parts.push(user.secondLastName);
    }
    return parts.join(' ');
  };

  const getVigencyStatus = (user: User) => {
    if (!user.vigencia) {
      return { text: 'Sin vigencia', color: 'text-gray-500' };
    }

    const vigencyDate = new Date(user.vigencia);
    const today = new Date();

    if (vigencyDate > today) {
      return { text: 'Vigente', color: 'text-ctm-green' };
    }
    return { text: 'Vencida', color: 'text-red-600' };
  };

  return (
    <div class="card">
      <div class="space-y-4">
        {/* Header and Search Bar */}
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-lg font-semibold text-ctm-text">Buscar Usuarios</h2>

          <div class="flex-1 max-w-2xl relative">
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono, credencial o gafete..."
              class="input-field w-full pr-10"
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
            />
            {/* Search icon or loading spinner */}
            <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Show
                when={!isLoading()}
                fallback={
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
                }
              >
                <svg
                  class="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>Buscar</title>
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </Show>
            </div>
          </div>

          <button type="button" onClick={props.onCreateNew} class="btn-secondary whitespace-nowrap">
            + Crear Nuevo Usuario
          </button>
        </div>

        {/* Error Message */}
        <Show when={error()}>
          <div class="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
            {error()}
          </div>
        </Show>

        {/* Results */}
        <Show when={users().length > 0}>
          <div class="space-y-3">
            <p class="text-sm text-gray-600">
              {users().length} usuario{users().length !== 1 ? 's' : ''} encontrado
              {users().length !== 1 ? 's' : ''}
            </p>

            {/* Users Grid - Horizontal layout */}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              <For each={users()}>
                {(user) => (
                  <button
                    type="button"
                    class="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-md hover:scale-105 cursor-pointer transition-all duration-200 text-left transform"
                    onClick={() => {
                      props.onUserSelect(user);
                      setSearchQuery('');
                      setUsers([]);
                    }}
                  >
                    <div class="font-medium text-ctm-text text-sm">{formatUserName(user)}</div>
                    <div class="text-xs text-gray-600 mt-1 space-y-1">
                      <div>Lic: {user.licenciaNum}</div>
                      <div>Tel: {user.phoneMx}</div>
                      <div class={getVigencyStatus(user).color}>{getVigencyStatus(user).text}</div>
                    </div>
                  </button>
                )}
              </For>
            </div>
          </div>
        </Show>

        {/* No Results */}
        <Show when={searchQuery() && users().length === 0 && !isLoading() && !error()}>
          <div class="text-center text-gray-500 py-6">
            <svg
              class="w-6 h-6 mx-auto mb-2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>Icono de búsqueda</title>
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p class="text-sm">No se encontraron usuarios</p>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default SearchPanel;
