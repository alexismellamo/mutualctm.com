import { A } from '@solidjs/router';
import { type Component, createMemo, createSignal, For, onMount, Show } from 'solid-js';
import ctmLogo from '../assets/ctm-logo.png';
import { authStore } from '../stores/auth';
import { formatDate, getVigenciaStatus, type VigenciaStatus } from '../utils/dateUtils';

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

const UsersPage: Component = () => {
  const [users, setUsers] = createSignal<User[]>([]);
  const [filter, setFilter] = createSignal<Filter>('all');
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal('');

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

  const filteredUsers = createMemo(() => {
    const selectedFilter = filter();
    return selectedFilter === 'all'
      ? users()
      : users().filter((user) => getVigenciaStatus(user.vigencia) === selectedFilter);
  });

  const count = (selectedFilter: Filter) =>
    selectedFilter === 'all'
      ? users().length
      : users().filter((user) => getVigenciaStatus(user.vigencia) === selectedFilter).length;

  const fullName = (user: User) =>
    [user.firstName, user.lastName, user.secondLastName].filter(Boolean).join(' ');

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
              <Show when={filteredUsers().length === 0}>
                <p class="py-10 text-center text-sm text-gray-500">
                  No hay usuarios en este estado.
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
