import { type Component, Show } from 'solid-js';
import type { User } from '../pages/DashboardPage';

type Props = {
  user: User | null;
};

const CardPreview: Component<Props> = (props) => {
  const formatUserName = (user?: User) => {
    if (!user) return '';
    const parts = [user.firstName, user.lastName.toUpperCase()];
    if (user.secondLastName) {
      parts.push(user.secondLastName.toUpperCase());
    }
    return parts.join(' ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX');
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  };

  const formatPhone = (phone: string) => {
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  };

  const getVigencyDate = (user: User) => {
    if (!user.vigencia) return 'Sin vigencia';
    return formatDate(user.vigencia);
  };

  const getPhotoUrl = (user: User) => {
    if (!user.id || !user.photoPath) return null;
    return `/api/v1/users/${user.id}/photo?t=${Date.now()}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div class="card h-full flex flex-col">
      <div class="mb-4 flex justify-between items-center">
        <h2 class="text-lg font-semibold text-ctm-text">Vista Previa</h2>

        <Show when={props.user}>
          <button
            class="text-sm px-4 py-2 bg-ctm-red text-white rounded-lg hover:bg-red-700 transition-colors"
            onClick={handlePrint}
            type="button"
          >
            Imprimir Credencial
          </button>
        </Show>
      </div>

      <div class="flex-1 overflow-y-auto">
        <Show
          when={props.user}
          fallback={
            <div class="h-full flex items-center justify-center text-center text-gray-500">
              <div>
                <svg
                  class="w-16 h-16 mx-auto mb-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  role="img"
                  aria-label="Icono de vista previa"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-4 0V4a2 2 0 014 0v2"
                  />
                </svg>
                <h3 class="text-lg font-medium mb-2">Vista Previa de Credencial</h3>
                <p class="text-sm">
                  Selecciona o crea un usuario para ver la vista previa de su credencial
                </p>
              </div>
            </div>
          }
        >
          <div class="print-content space-y-6 flex flex-col items-center">
            {/* Front Card */}
            <div class="text-center">
              <h3 class="text-sm font-medium text-gray-700 mb-2">FRENTE</h3>
              <div
                class="relative bg-white border-2 border-gray-300 overflow-hidden"
                style={{
                  width: '256px',
                  height: '161px',
                }}
              >
                <div class="absolute inset-0 p-2 text-xs">
                  {/* Header with CTM logo placeholder */}
                  <div class="flex justify-between items-start mb-2">
                    <div class="text-ctm-red font-bold text-lg">CTM</div>
                    <div class="w-12 h-12 bg-ctm-red rounded-full flex items-center justify-center">
                      <span class="text-white font-bold text-xs">LOGO</span>
                    </div>
                  </div>

                  {/* Green vertical rule */}
                  <div
                    class="absolute right-2 top-2 bottom-2 w-1 bg-ctm-green"
                    style="writing-mode: vertical-rl; text-orientation: mixed;"
                  >
                    <span class="text-white text-xs p-1">Válida en caso de accidente vial</span>
                  </div>

                  {/* User Photo - Back on the left side but larger and better */}
                  <div class="absolute left-2 top-12 w-18 h-22 rounded border-2 border-gray-600 overflow-hidden bg-white shadow-sm">
                    <Show
                      when={props.user && getPhotoUrl(props.user)}
                      fallback={
                        <div class="w-full h-full flex items-center justify-center">
                          <div class="text-center text-gray-500">
                            <svg
                              class="w-6 h-6 mx-auto mb-1"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                              role="img"
                              aria-label="Person icon"
                            >
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                            <span class="text-xs">FOTO</span>
                          </div>
                        </div>
                      }
                    >
                      <img
                        src={props.user ? getPhotoUrl(props.user) || '' : ''}
                        alt="Foto del usuario"
                        class="w-full h-full object-cover print:object-cover"
                      />
                    </Show>
                  </div>

                  {/* User name */}
                  <div class="absolute left-22 top-12 right-8">
                    <div class="font-bold text-sm leading-tight">
                      {formatUserName(props.user || undefined)}
                    </div>
                  </div>

                  {/* Credential numbers (left side, rotated) */}
                  <div class="absolute left-1 top-24 transform -rotate-90 origin-left">
                    <div class="font-mono text-xs">
                      <div>{props.user?.credencialNum}</div>
                      <div class="mt-1">{props.user?.gafeteNum}</div>
                    </div>
                  </div>

                  {/* Address */}
                  <div class="absolute left-22 top-20 right-8 text-xs">
                    <div class="mb-1">
                      <span class="font-semibold">Con domicilio en:</span>
                    </div>
                    <div>
                      {props.user?.address?.street} {props.user?.address?.exteriorNo}
                    </div>
                    <div>{props.user?.address?.neighborhood}</div>
                    <div>{props.user?.address?.municipality}</div>
                    <div>{props.user?.address?.state}</div>
                  </div>

                  {/* Age and phone (vertical) */}
                  <div class="absolute left-28 top-36 transform -rotate-90 origin-left">
                    <div class="font-bold text-xs">
                      <div>{props.user ? calculateAge(props.user.dob) : ''} AÑOS</div>
                      <div class="mt-1">
                        TEL.: {props.user ? formatPhone(props.user.phoneMx) : ''}
                      </div>
                    </div>
                  </div>

                  {/* President signature area */}
                  <div class="absolute bottom-8 left-2 text-xs">
                    <div class="w-16 h-8 border border-gray-300 flex items-center justify-center">
                      <span class="text-gray-500">Firma Presidente</span>
                    </div>
                  </div>

                  {/* Vigency */}
                  <div class="absolute bottom-2 left-2 right-2">
                    <div class="h-1 bg-ctm-red mb-1" />
                    <div class="text-xs font-bold text-ctm-red">
                      Vigente hasta: {props.user ? getVigencyDate(props.user) : 'Sin vigencia'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Back Card */}
            <div class="text-center">
              <h3 class="text-sm font-medium text-gray-700 mb-2">REVERSO</h3>
              <div
                class="relative bg-white border-2 border-gray-300 overflow-hidden"
                style={{
                  width: '256px',
                  height: '161px',
                }}
              >
                <div class="absolute inset-0 p-2 text-xs">
                  <div class="text-center mb-4">
                    <div class="text-ctm-red font-bold text-lg">CTM</div>
                    <div class="text-xs">Confederación de Trabajadores de México</div>
                  </div>

                  {/* Compact data */}
                  <div class="space-y-1 mb-4">
                    <div>
                      <span class="font-bold">No. de Credencial:</span> {props.user?.credencialNum}
                    </div>
                    <div>
                      <span class="font-bold">No. de Gafete:</span> {props.user?.gafeteNum}
                    </div>
                    <div>
                      <span class="font-bold">Nombre:</span>{' '}
                      {formatUserName(props.user || undefined)}
                    </div>
                    <div>
                      <span class="font-bold">Nacimiento:</span>{' '}
                      {props.user ? formatDate(props.user.dob) : ''} (
                      {props.user ? calculateAge(props.user.dob) : ''} años)
                    </div>
                    <div>
                      <span class="font-bold">Teléfono:</span>{' '}
                      {props.user ? formatPhone(props.user.phoneMx) : ''}
                    </div>
                  </div>

                  {/* Address */}
                  <div class="mb-4">
                    <div class="font-bold mb-1">Domicilio:</div>
                    <div class="text-xs leading-tight">
                      {props.user?.address?.street} {props.user?.address?.exteriorNo},{' '}
                      {props.user?.address?.neighborhood}, {props.user?.address?.municipality},{' '}
                      {props.user?.address?.state}, CP {props.user?.address?.postalCode}
                    </div>
                  </div>

                  {/* Ajustadores */}
                  <div class="grid grid-cols-3 gap-2 text-center border-t pt-2">
                    <div>
                      <div class="font-bold text-xs">Ajustador Colima</div>
                      <div class="font-mono text-lg">12345</div>
                    </div>
                    <div class="border-l border-r border-gray-300">
                      <div class="font-bold text-xs">Ajustador Tecomán</div>
                      <div class="font-mono text-lg">67890</div>
                    </div>
                    <div>
                      <div class="font-bold text-xs">Ajustador Manzanillo</div>
                      <div class="font-mono text-lg">54321</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Show>
      </div>

      {/* Print instructions */}
      <Show when={props.user}>
        <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <div class="font-medium text-blue-800 mb-1">Instrucciones de impresión:</div>
          <div class="text-blue-700 text-xs">
            • Configurar impresora al 100% de escala
            <br />• Sin márgenes
            <br />• Desactivar encabezados y pies de página
          </div>
        </div>
      </Show>
    </div>
  );
};

export default CardPreview;
