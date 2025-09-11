import { A } from '@solidjs/router';
import { type Component, Show, createSignal } from 'solid-js';
import ctmLogo from '../assets/ctm-logo.png';
import CardPreview from '../components/CardPreview';
import SearchPanel from '../components/SearchPanel';
import UserForm from '../components/UserForm';
import { authStore } from '../stores/auth';

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  secondLastName?: string;
  dob: string;
  vigencia?: string;
  phoneMx: string;
  credencialNum: string;
  gafeteNum: string;
  photoPath?: string;
  signaturePath?: string;
  lastVigencyAt?: string;
  createdAt: string;
  updatedAt: string;
  address?: {
    id: string;
    street: string;
    exteriorNo?: string;
    interiorNo?: string;
    neighborhood: string;
    city: string;
    municipality: string;
    state: string;
    postalCode: string;
    references?: string;
  };
};

const DashboardPage: Component = () => {
  const [selectedUser, setSelectedUser] = createSignal<User | null>(null);
  const [isCreatingNew, setIsCreatingNew] = createSignal(false);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setIsCreatingNew(false);
  };

  const handleCreateNew = () => {
    setSelectedUser(null);
    setIsCreatingNew(true);
  };

  const handleUserSaved = (user: User) => {
    setSelectedUser(user);
    setIsCreatingNew(false);
  };

  const handleLogout = async () => {
    await authStore.logout();
  };

  return (
    <div class="min-h-screen bg-gray-50">
      {/* Header */}
      <header class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center">
              <img src={ctmLogo} alt="CTM Logo" class="w-8 h-8 object-contain" />
              <h1 class="ml-3 text-xl font-semibold text-ctm-text">Sistema de Credenciales</h1>
            </div>
            <div class="flex items-center space-x-4">
              <span class="text-sm text-gray-600">{authStore.admin()?.email}</span>
              <A
                href="/settings"
                class="text-sm text-gray-500 hover:text-ctm-red transition-colors flex items-center gap-1"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <title>Configuración</title>
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Configuración
              </A>
              <button
                onClick={handleLogout}
                class="text-sm text-gray-500 hover:text-ctm-red transition-colors"
                type="button"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Search Panel - Top (Horizontal) */}
        <div class="w-full">
          <SearchPanel onUserSelect={handleUserSelect} onCreateNew={handleCreateNew} />
        </div>

        {/* Two Panel Layout - Bottom */}
        <div class="grid grid-cols-10 gap-8">
          {/* User Form - Left (70%) */}
          <div class="col-span-7">
            <Show
              when={selectedUser() || isCreatingNew()}
              fallback={
                <div class="card py-12 flex items-center justify-center">
                  <div class="text-center text-gray-500">
                    <svg
                      class="w-12 h-12 mx-auto mb-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <title>Icono de usuario</title>
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <h3 class="text-lg font-medium mb-2">Selecciona un usuario</h3>
                    <p class="text-sm">Busca un usuario existente o crea uno nuevo para comenzar</p>
                  </div>
                </div>
              }
            >
              <UserForm
                user={selectedUser()}
                isNew={isCreatingNew()}
                onUserSaved={handleUserSaved}
              />
            </Show>
          </div>

          {/* Card Preview - Right (30%) */}
          <div class="col-span-3">
            <CardPreview user={selectedUser()} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
