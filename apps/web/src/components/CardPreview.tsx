import { type Component, Show, createSignal, onMount } from 'solid-js';
import ctmLogo from '../assets/ctm-logo.png';
import presidenteSignature from '../assets/presidente-signature.jpeg';
import type { User } from '../pages/DashboardPage';

type Settings = {
  id: number;
  ajustadorColima: string;
  ajustadorTecoman: string;
  ajustadorManzanillo: string;
  presidenteFirmaPath?: string;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  user: User | null;
};

const CardPreview: Component<Props> = (props) => {
  const [settings, setSettings] = createSignal<Settings | null>(null);

  onMount(async () => {
    try {
      const response = await fetch('/api/v1/settings', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  });

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
    if (!user || !user.vigencia) return '';
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
    <div class="card sticky top-8">
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

      <div>
        <Show
          when={props.user}
          fallback={
            <div class="py-8 flex items-center justify-center text-center text-gray-500">
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
                class="relative bg-white border border-gray-400 overflow-hidden shadow-lg"
                style={{
                  width: '324px',
                  height: '204px',
                }}
              >
                {/* Header with logo */}
                <div class="absolute top-0 left-0 right-0 bg-ctm-red h-8 flex items-center justify-between px-3">
                  <span class="text-white font-bold" style="font-size: 8px;">
                    CONFEDERACIÓN DE TRABAJADORES DE MÉXICO
                  </span>
                  <img src={ctmLogo} alt="CTM Logo" class="h-4 w-4 object-contain" />
                </div>

                {/* Photo */}
                <div class="absolute left-4 top-12 w-20 h-24 border border-gray-400 overflow-hidden bg-gray-50">
                  <Show
                    when={props.user && getPhotoUrl(props.user)}
                    fallback={
                      <div class="w-full h-full flex items-center justify-center">
                        <div class="text-center text-gray-400">
                          <svg class="w-8 h-8 mx-auto mb-1" fill="currentColor" viewBox="0 0 24 24">
                            <title>Foto del usuario</title>
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                          <span style="font-size: 8px;">FOTO</span>
                        </div>
                      </div>
                    }
                  >
                    <img
                      src={props.user ? getPhotoUrl(props.user) || '' : ''}
                      alt="Foto del usuario"
                      class="w-full h-full object-cover"
                    />
                  </Show>
                </div>

                {/* Name */}
                <div class="absolute left-28 top-12 right-4">
                  <div class="font-bold text-ctm-text leading-tight" style="font-size: 10px;">
                    {formatUserName(props.user || undefined)}
                  </div>
                </div>

                {/* Address */}
                <div class="absolute left-28 top-20 right-4 text-gray-700" style="font-size: 8px;">
                  <div class="mb-1 font-medium">DOMICILIO:</div>
                  <div class="leading-tight">
                    {props.user?.address?.street} {props.user?.address?.exteriorNo}
                    {props.user?.address?.interiorNo
                      ? ` Int. ${props.user.address.interiorNo}`
                      : ''}
                  </div>
                  <div>{props.user?.address?.neighborhood}</div>
                  <div>
                    {props.user?.address?.municipality}, {props.user?.address?.state}
                  </div>
                  <div>CP {props.user?.address?.postalCode}</div>
                </div>

                {/* Phone and Age */}
                {/* Credential and Gafete Numbers */}
                <div class="absolute left-28 top-32 right-4 text-gray-700" style="font-size: 8px;">
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <span class="font-medium">CREDENCIAL:</span> {props.user?.credencialNum}
                    </div>
                    <div>
                      <span class="font-medium">GAFETE:</span> {props.user?.gafeteNum}
                    </div>
                  </div>
                </div>

                {/* Phone and Age */}
                <div class="absolute left-4 bottom-20 text-gray-700" style="font-size: 8px;">
                  <div>
                    <span class="font-medium">TEL:</span>{' '}
                    {props.user ? formatPhone(props.user.phoneMx) : ''}
                  </div>
                  <div>
                    <span class="font-medium">EDAD:</span>{' '}
                    {props.user ? calculateAge(props.user.dob) : ''} años
                  </div>
                </div>

                {/* Presidente Signature */}
                <div class="absolute bottom-8 right-4 text-center">
                  <div class="h-8 flex items-center justify-center mb-1">
                    <img
                      src={presidenteSignature}
                      alt="Firma Presidente"
                      class="h-6 object-contain"
                    />
                  </div>
                  <div class="font-bold text-gray-700" style="font-size: 6px;">
                    PRESIDENTE
                  </div>
                </div>

                {/* Vigency */}
                <div class="absolute bottom-2 left-4 right-4">
                  <div class="h-0.5 bg-ctm-red mb-1" />
                  <div class="font-bold text-ctm-red text-center" style="font-size: 8px;">
                    VIGENTE HASTA: {props.user ? getVigencyDate(props.user) : ''}
                  </div>
                </div>
              </div>
            </div>

            {/* Back Card */}
            <div class="text-center">
              <h3 class="text-sm font-medium text-gray-700 mb-2">REVERSO</h3>
              <div
                class="bg-white border border-gray-400 overflow-hidden shadow-lg flex flex-col h-full p-2"
                style={{
                  width: '324px',
                  height: '204px',
                }}
              >
                {/* Header with logo */}
                <div class="flex justify-start">
                  <img src={ctmLogo} alt="CTM Logo" class="h-6 w-6 object-contain" />
                </div>

                {/* Numbers section - taking most space */}
                <div class="flex-1 flex items-center justify-center">
                  <div class="grid grid-cols-3 gap-6 text-center w-full">
                    <div>
                      <div class="font-bold text-gray-700 mb-1" style="font-size: 8px;">
                        AJUSTADOR
                      </div>
                      <div class="font-bold text-gray-700 mb-1" style="font-size: 8px;">
                        COLIMA
                      </div>
                      <div class="font-mono font-bold text-ctm-red" style="font-size: 10px;">
                        {settings()?.ajustadorColima
                          ? formatPhone(settings()!.ajustadorColima)
                          : ''}
                      </div>
                    </div>
                    <div>
                      <div class="font-bold text-gray-700 mb-1" style="font-size: 8px;">
                        AJUSTADOR
                      </div>
                      <div class="font-bold text-gray-700 mb-1" style="font-size: 8px;">
                        TECOMÁN
                      </div>
                      <div class="font-mono font-bold text-ctm-red" style="font-size: 10px;">
                        {settings()?.ajustadorTecoman
                          ? formatPhone(settings()!.ajustadorTecoman)
                          : ''}
                      </div>
                    </div>
                    <div>
                      <div class="font-bold text-gray-700 mb-1" style="font-size: 8px;">
                        AJUSTADOR
                      </div>
                      <div class="font-bold text-gray-700 mb-1" style="font-size: 8px;">
                        MANZANILLO
                      </div>
                      <div class="font-mono font-bold text-ctm-red" style="font-size: 10px;">
                        {settings()?.ajustadorManzanillo
                          ? formatPhone(settings()!.ajustadorManzanillo)
                          : ''}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom section with legal text and signature */}
                <div class="space-y-2">
                  {/* Legal Text */}
                  <div class="text-center mb-8">
                    <div class="text-gray-700 leading-tight" style="font-size: 6px;">
                      <div class="font-bold mb-1">
                        VALIDA ÚNICAMENTE EN CARROS ASEGURADOS POR EL FONDO DE RESPONSABILIDAD CIVIL
                        DEL PASAJERO Y COBERTURA AMPLIA C.T.M.
                      </div>
                      <div>
                        EN CASO DE ACCIDENTE LLAMAR A LOS TELEFONOS ARRIBA MENCIONADOS Y NO MOVERSE
                        DEL LUGAR DEL ACCIDENTE.
                      </div>
                    </div>
                  </div>

                  {/* Driver Signature */}
                  <div class="text-center">
                    <div class="border-t border-gray-400 pt-1">
                      <div class="text-gray-700 font-medium" style="font-size: 7px;">
                        Firma del Chofer
                      </div>
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
