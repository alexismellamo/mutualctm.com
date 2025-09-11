import { type Component, createSignal, onMount } from 'solid-js';

type Settings = {
  id: number;
  ajustadorColima: string;
  ajustadorTecoman: string;
  ajustadorManzanillo: string;
  presidenteFirmaPath?: string;
  createdAt: string;
  updatedAt: string;
};

const SettingsPanel: Component = () => {
  const [settings, setSettings] = createSignal<Settings | null>(null);
  const [formData, setFormData] = createSignal({
    ajustadorColima: '',
    ajustadorTecoman: '',
    ajustadorManzanillo: '',
  });
  const [isLoading, setIsLoading] = createSignal(false);
  const [isSaving, setIsSaving] = createSignal(false);
  const [error, setError] = createSignal('');
  const [success, setSuccess] = createSignal('');

  const loadSettings = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/v1/settings', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error al cargar configuración');
      }

      const data = await response.json();
      setSettings(data.settings);
      setFormData({
        ajustadorColima: data.settings.ajustadorColima,
        ajustadorTecoman: data.settings.ajustadorTecoman,
        ajustadorManzanillo: data.settings.ajustadorManzanillo,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de carga');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/v1/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData()),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar configuración');
      }

      const data = await response.json();
      setSettings(data.settings);
      setSuccess('Configuración actualizada correctamente');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const updateFormData = (field: keyof Settings, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return '-';
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  };

  onMount(() => {
    loadSettings();
  });

  return (
    <div class="card">
      <div class="mb-6">
        <h2 class="text-lg font-semibold text-ctm-text">Configuración del Sistema</h2>
        <p class="text-sm text-gray-600 mt-1">
          Configura los números de teléfono de los ajustadores por región
        </p>
      </div>

      {error() && (
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error()}
        </div>
      )}

      {success() && (
        <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {success()}
        </div>
      )}

      {isLoading() ? (
        <div class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-ctm-red" />
          <span class="ml-3 text-gray-600">Cargando configuración...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Colima */}
            <div class="space-y-2">
              <label for="ajustadorColima" class="block text-sm font-medium text-gray-700">
                Ajustador Colima
              </label>
              <input
                id="ajustadorColima"
                type="tel"
                required
                pattern="[0-9]{10}"
                class="input-field"
                placeholder="3121020805"
                value={formData().ajustadorColima}
                onInput={(e) => updateFormData('ajustadorColima', e.currentTarget.value)}
              />
              <p class="text-xs text-gray-500">
                Actual: {formatPhone(settings()?.ajustadorColima)}
              </p>
            </div>

            {/* Tecomán */}
            <div class="space-y-2">
              <label for="ajustadorTecoman" class="block text-sm font-medium text-gray-700">
                Ajustador Tecomán
              </label>
              <input
                id="ajustadorTecoman"
                type="tel"
                required
                pattern="[0-9]{10}"
                class="input-field"
                placeholder="3131202631"
                value={formData().ajustadorTecoman}
                onInput={(e) => updateFormData('ajustadorTecoman', e.currentTarget.value)}
              />
              <p class="text-xs text-gray-500">
                Actual: {formatPhone(settings()?.ajustadorTecoman)}
              </p>
            </div>

            {/* Manzanillo */}
            <div class="space-y-2">
              <label for="ajustadorManzanillo" class="block text-sm font-medium text-gray-700">
                Ajustador Manzanillo
              </label>
              <input
                id="ajustadorManzanillo"
                type="tel"
                required
                pattern="[0-9]{10}"
                class="input-field"
                placeholder="3141351075"
                value={formData().ajustadorManzanillo}
                onInput={(e) => updateFormData('ajustadorManzanillo', e.currentTarget.value)}
              />
              <p class="text-xs text-gray-500">
                Actual: {formatPhone(settings()?.ajustadorManzanillo)}
              </p>
            </div>
          </div>

          {/* Info */}
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 class="text-sm font-medium text-blue-800 mb-2">Información importante:</h3>
            <ul class="text-xs text-blue-700 space-y-1">
              <li>• Los números deben tener exactamente 10 dígitos</li>
              <li>• Estos teléfonos aparecerán en las credenciales impresas</li>
              <li>• Formato de ejemplo: 3121020805</li>
            </ul>
          </div>

          {/* Actions */}
          <div class="flex gap-4 pt-4 border-t">
            <button
              type="submit"
              disabled={isSaving()}
              class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving() ? 'Guardando...' : 'Actualizar Configuración'}
            </button>

            <button
              type="button"
              onClick={loadSettings}
              disabled={isLoading() || isSaving()}
              class="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Recargar
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SettingsPanel;
