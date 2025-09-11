import { A } from '@solidjs/router';
import type { Component } from 'solid-js';
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
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-ctm-red rounded flex items-center justify-center">
                <span class="text-white font-bold text-sm">CTM</span>
              </div>
              <h1 class="ml-3 text-xl font-semibold text-ctm-text">Configuración del Sistema</h1>
            </div>
            <div class="flex items-center space-x-4">
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
