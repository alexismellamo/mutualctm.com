import { useParams } from '@solidjs/router';
import { createSignal, onMount, Show } from 'solid-js';
import { formatDateLong, isVigenciaValid } from '../utils/dateUtils';

type User = {
  id: string;
  firstName: string;
  lastName: string;
  secondLastName?: string;
  vigencia?: string;
};

type ValidationResult = {
  isValid: boolean;
  user?: User;
  error?: string;
};

export default function ValidationPage() {
  const params = useParams();
  const [validationResult, setValidationResult] = createSignal<ValidationResult | null>(null);
  const [loading, setLoading] = createSignal(true);

  const formatUserName = (user: User | undefined) => {
    if (!user) return '';
    return `${user.firstName} ${user.lastName} ${user.secondLastName || ''}`.trim();
  };

  const isValidVigencia = (vigencia?: string) => {
    if (!vigencia) return false;
    return isVigenciaValid(vigencia);
  };

  onMount(async () => {
    try {
      const response = await fetch(`/api/v1/users/${params.id}/validate`);

      if (response.ok) {
        const data = await response.json();
        const isValid = isValidVigencia(data.user?.vigencia);
        setValidationResult({
          isValid,
          user: data.user,
        });
      } else if (response.status === 404) {
        setValidationResult({
          isValid: false,
          error: 'Usuario no encontrado',
        });
      } else {
        setValidationResult({
          isValid: false,
          error: 'Error al validar usuario',
        });
      }
    } catch (_error) {
      setValidationResult({
        isValid: false,
        error: 'Error de conexión',
      });
    } finally {
      setLoading(false);
    }
  });

  return (
    <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <Show when={loading()}>
          <div class="bg-white rounded-lg shadow-lg p-8 text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-ctm-red mx-auto mb-4"></div>
            <p class="text-gray-600">Validando credencial...</p>
          </div>
        </Show>

        <Show when={!loading() && validationResult()}>
          <div class="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header with validation status */}
            <div
              class={`p-6 text-center ${
                validationResult()?.isValid ? 'bg-green-500' : 'bg-red-500'
              }`}
            >
              <div class="text-white">
                <div class="text-6xl mb-2">{validationResult()?.isValid ? '✓' : '✗'}</div>
                <h1 class="text-xl font-bold">
                  {validationResult()?.isValid ? 'CREDENCIAL VÁLIDA' : 'CREDENCIAL INVÁLIDA'}
                </h1>
              </div>
            </div>

            {/* User information */}
            <div class="p-6">
              <Show when={validationResult()?.user}>
                <div class="space-y-4">
                  <div>
                    <div class="block text-sm font-medium text-gray-500 mb-1">Nombre Completo</div>
                    <p class="text-lg font-semibold text-gray-900">
                      {formatUserName(validationResult()?.user)}
                    </p>
                  </div>

                  <div>
                    <div class="block text-sm font-medium text-gray-500 mb-1">Vigencia</div>
                    <p
                      class={`text-lg font-semibold ${
                        isValidVigencia(validationResult()?.user?.vigencia)
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {formatDateLong(validationResult()?.user?.vigencia || '')}
                    </p>
                  </div>

                  <Show when={!isValidVigencia(validationResult()?.user?.vigencia)}>
                    <div class="bg-red-50 border border-red-200 rounded-md p-3">
                      <p class="text-red-800 text-sm">⚠️ Esta credencial ha expirado</p>
                    </div>
                  </Show>

                  <Show when={isValidVigencia(validationResult()?.user?.vigencia)}>
                    <div class="bg-green-50 border border-green-200 rounded-md p-3">
                      <p class="text-green-800 text-sm">✅ Credencial vigente y válida</p>
                    </div>
                  </Show>
                </div>
              </Show>

              <Show when={validationResult()?.error}>
                <div class="text-center">
                  <div class="text-red-600 text-lg font-semibold mb-2">
                    {validationResult()?.error}
                  </div>
                  <p class="text-gray-600 text-sm">
                    Por favor, verifica el código QR e intenta nuevamente
                  </p>
                </div>
              </Show>
            </div>

            {/* CTM Logo/Branding */}
            <div class="bg-gray-50 p-4 text-center border-t">
              <p class="text-sm text-gray-600">Sistema de Validación CTM</p>
              <p class="text-xs text-gray-500 mt-1">Colegio de Técnicos en Mantenimiento</p>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}
