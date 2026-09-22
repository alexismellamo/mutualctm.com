import { A } from '@solidjs/router';
import {
  type Component,
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from 'solid-js';
import { toast } from 'solid-sonner';
import ctmLogo from '../assets/ctm-logo.png';
import { authStore } from '../stores/auth';
import { formatDate, getVigenciaStatus, type VigenciaStatus } from '../utils/dateUtils';
import { filterStrictIdentifierResults } from '../utils/searchResults';

type User = {
  id: string;
  firstName: string;
  lastName: string;
  secondLastName?: string | null;
  phoneMx: string;
  licenciaNum: string;
  gafeteNum: string;
  folio?: string | null;
  vigencia?: string | null;
};

type Filter = 'all' | VigenciaStatus;

const statusLabels: Record<VigenciaStatus, { label: string; class: string }> = {
  active: { label: 'Activo', class: 'bg-green-100 text-green-800' },
  expiring: { label: 'Próximo a vencer', class: 'bg-amber-100 text-amber-800' },
  expired: { label: 'Caducado', class: 'bg-red-100 text-red-800' },
};

const backupFilename = () => {
  const now = new Date();
  const part = (value: number, length = 2) => String(value).padStart(length, '0');
  const timestamp = [now.getFullYear(), part(now.getMonth() + 1), part(now.getDate())].join('-');
  const time = [part(now.getHours()), part(now.getMinutes()), part(now.getSeconds())].join('-');

  return `respaldo-usuarios-${timestamp}_${time}-${part(now.getMilliseconds(), 3)}.csv`;
};

const UsersPage: Component = () => {
  const [users, setUsers] = createSignal<User[]>([]);
  const [filter, setFilter] = createSignal<Filter>('all');
  const [searchQuery, setSearchQuery] = createSignal('');
  const [searchResults, setSearchResults] = createSignal<User[]>([]);
  const [isSearching, setIsSearching] = createSignal(false);
  const [searchError, setSearchError] = createSignal('');
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal('');
  let searchTimeout: ReturnType<typeof setTimeout> | undefined;
  let searchRequest = 0;

  onMount(async () => {
    try {
      const response = await fetch('/api/v1/user-directory', { credentials: 'include' });
      if (!response.ok) throw new Error('No se pudo cargar la lista de usuarios');

      const data: { users: User[] } = await response.json();
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la lista de usuarios');
    } finally {
      setIsLoading(false);
    }
  });

  createEffect(() => {
    const query = searchQuery().trim();
    const request = ++searchRequest;

    if (searchTimeout) clearTimeout(searchTimeout);

    if (!query) {
      setSearchResults([]);
      setSearchError('');
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setSearchError('');
    searchTimeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/v1/users?query=${encodeURIComponent(query)}`, {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Error al buscar usuarios');

        const data: { users?: User[] } = await response.json();
        if (request === searchRequest) {
          setSearchResults(filterStrictIdentifierResults(data.users || [], query));
        }
      } catch (err) {
        if (request === searchRequest) {
          setSearchError(err instanceof Error ? err.message : 'Error de búsqueda');
          setSearchResults([]);
        }
      } finally {
        if (request === searchRequest) setIsSearching(false);
      }
    }, 300);
  });

  onCleanup(() => {
    if (searchTimeout) clearTimeout(searchTimeout);
  });

  const visibleUsers = createMemo(() => (searchQuery().trim() ? searchResults() : users()));

  const filteredUsers = createMemo(() => {
    const selectedFilter = filter();
    return selectedFilter === 'all'
      ? visibleUsers()
      : visibleUsers().filter((user) => getVigenciaStatus(user.vigencia) === selectedFilter);
  });

  const count = (selectedFilter: Filter) =>
    selectedFilter === 'all'
      ? visibleUsers().length
      : visibleUsers().filter((user) => getVigenciaStatus(user.vigencia) === selectedFilter).length;

  const fullName = (user: User) =>
    [user.firstName, user.lastName, user.secondLastName].filter(Boolean).join(' ');

  const exportDirectory = async () => {
    const toastId = 'directory-export';
    toast.loading('Preparando respaldo CSV...', { id: toastId });
    try {
      const response = await fetch('/api/v1/user-directory/export', { credentials: 'include' });
      if (!response.ok) throw new Error('No se pudo generar el respaldo');

      const file = await response.blob();
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ctmmutual-usuarios-${backupFilename().replace('respaldo-usuarios-', '')}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Respaldo CSV descargado correctamente.', { id: toastId });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo generar el respaldo';
      setError(message);
      toast.error(message, { id: toastId });
    }
  };

  const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'expired', label: 'Caducos' },
    { value: 'expiring', label: 'Próximos a vencer' },
  ];

  return (
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col gap-3 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
            <div class="flex items-center">
              <img src={ctmLogo} alt="CTM Logo" class="w-8 h-8 object-contain" />
              <h1 class="ml-3 text-lg font-semibold text-ctm-text sm:text-xl">
                Sistema de Credenciales
              </h1>
            </div>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
              <A href="/" class="text-sm text-gray-500 hover:text-ctm-red transition-colors">
                Credenciales
              </A>
              <span class="text-sm font-semibold text-ctm-red" aria-current="page">
                Usuarios
              </span>
              <A
                href="/settings"
                class="text-sm text-gray-500 hover:text-ctm-red transition-colors"
              >
                Configuración
              </A>
              <button
                type="button"
                onClick={() => authStore.logout()}
                class="text-sm text-gray-500 hover:text-ctm-red transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="card">
          <div class="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-lg font-semibold text-ctm-text">Usuarios</h2>
              <p class="text-sm text-gray-500">Listado completo por estado de vigencia</p>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <button type="button" onClick={exportDirectory} class="btn-secondary text-sm">
                Descargar respaldo CSV
              </button>
              <fieldset class="flex flex-wrap gap-2">
                <legend class="sr-only">Filtrar usuarios por vigencia</legend>
                <For each={filters}>
                  {(item) => (
                    <button
                      type="button"
                      onClick={() => setFilter(item.value)}
                      aria-pressed={filter() === item.value}
                      class={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filter() === item.value
                          ? 'bg-ctm-red text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {item.label} ({count(item.value)})
                    </button>
                  )}
                </For>
              </fieldset>
            </div>
          </div>

          <div class="relative mb-6 w-full sm:max-w-2xl">
            <label for="user-directory-search" class="sr-only">
              Buscar usuarios
            </label>
            <input
              id="user-directory-search"
              type="search"
              placeholder="Buscar por nombre, folio, teléfono, credencial o gafete..."
              class="input-field w-full pr-10"
              value={searchQuery()}
              onInput={(event) => setSearchQuery(event.currentTarget.value)}
            />
            <div class="absolute right-3 top-1/2 -translate-y-1/2">
              <Show
                when={!isSearching()}
                fallback={
                  <div class="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-400" />
                }
              >
                <svg
                  class="h-4 w-4 text-gray-400"
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

          <Show when={searchError()}>
            <div class="mb-6 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {searchError()}
            </div>
          </Show>

          <Show
            when={!isLoading()}
            fallback={
              <div class="flex justify-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-ctm-red" />
              </div>
            }
          >
            <Show
              when={!error()}
              fallback={
                <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error()}
                </div>
              }
            >
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <For
                        each={[
                          'Folio',
                          'Nombre',
                          'Licencia',
                          'Gafete',
                          'Teléfono',
                          'Vigencia',
                          'Estado',
                        ]}
                      >
                        {(heading) => (
                          <th
                            scope="col"
                            class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                          >
                            {heading}
                          </th>
                        )}
                      </For>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 bg-white">
                    <For each={filteredUsers()}>
                      {(user) => {
                        const status = () => statusLabels[getVigenciaStatus(user.vigencia)];
                        return (
                          <tr class="hover:bg-gray-50">
                            <td class="px-4 py-3 text-sm text-gray-600">{user.folio || '—'}</td>
                            <td class="px-4 py-3 text-sm font-medium">
                              <A href={`/?userId=${user.id}`} class="text-ctm-red hover:underline">
                                {fullName(user)}
                              </A>
                            </td>
                            <td class="px-4 py-3 text-sm text-gray-600">{user.licenciaNum}</td>
                            <td class="px-4 py-3 text-sm text-gray-600">{user.gafeteNum}</td>
                            <td class="px-4 py-3 text-sm text-gray-600">{user.phoneMx}</td>
                            <td class="px-4 py-3 text-sm text-gray-600">
                              {user.vigencia ? formatDate(user.vigencia) : 'Sin vigencia'}
                            </td>
                            <td class="px-4 py-3 text-sm">
                              <span
                                class={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${status().class}`}
                              >
                                {status().label}
                              </span>
                            </td>
                          </tr>
                        );
                      }}
                    </For>
                  </tbody>
                </table>
              </div>
              <Show when={filteredUsers().length === 0 && !isSearching()}>
                <p class="py-10 text-center text-sm text-gray-500">
                  {searchQuery().trim()
                    ? 'No se encontraron usuarios.'
                    : 'No hay usuarios en este estado.'}
                </p>
              </Show>
            </Show>
          </Show>
        </div>
      </main>
    </div>
  );
};

export default UsersPage;
