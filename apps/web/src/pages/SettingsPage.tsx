import { A } from '@solidjs/router';
import type { Component } from 'solid-js';
import ctmLogo from '../assets/ctm-logo.png';
import SettingsPanel from '../components/SettingsPanel';
import { authStore } from '../stores/auth';

const SettingsPage: Component = () => {
  const handleLogout = async () => {
    await authStore.logout();
  };

  return (
    <div class="min-h-screen bg-gray-50">
      {/* Header */}
      <header class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col gap-3 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
            <div class="flex items-center">
              <img src={ctmLogo} alt="CTM Logo" class="w-8 h-8 object-contain" />
              <h1 class="ml-3 text-lg font-semibold text-ctm-text sm:text-xl">
                Configuración del Sistema
              </h1>
            </div>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span class="text-sm text-gray-600">{authStore.admin()?.email}</span>
              <A
                href="/"
                class="text-sm text-gray-500 hover:text-ctm-red transition-colors flex items-center gap-1"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <title>Volver al Dashboard</title>
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Volver al Dashboard
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
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SettingsPanel />
      </div>
    </div>
  );
};

export default SettingsPage;
