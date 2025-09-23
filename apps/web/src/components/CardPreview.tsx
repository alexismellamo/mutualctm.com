import QRCode from 'qrcode';
import { type Component, createResource, createSignal, onMount, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import ctmLogo from '../assets/ctm-logo.png';
import presidenteSignature from '../assets/presidente-signature.svg';
import type { User } from '../pages/DashboardPage';
import {
  calculateAge,
  formatPhone,
  formatUserName,
  getPhotoUrl,
  getSignatureUrl,
  getVigencyDate,
  handleCardPrint,
} from '../utils/cardUtils';

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
  const [isPrinting, setIsPrinting] = createSignal(false);

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

  // Generate QR code for validation URL
  const generateQRCode = async (userId: string) => {
    try {
      const validationUrl = `${window.location.origin}/validation/${userId}`;
      return await QRCode.toDataURL(validationUrl, {
        margin: 1,
        height: '100%',
        width: '100%',
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
    } catch (err) {
      console.error('Error generating QR code:', err);
      return null;
    }
  };

  const [qrCodeData] = createResource(() => props.user?.id, generateQRCode);

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      await handleCardPrint(props.user || undefined);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div class="card sticky top-8">
      <div class="mb-4 flex justify-between items-center">
        <h2 class="text-lg font-semibold text-ctm-text">Vista Previa</h2>

        <Show when={props.user}>
          <button
            class="text-sm px-4 py-2 bg-ctm-red text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handlePrint}
            disabled={isPrinting()}
            type="button"
          >
            {isPrinting() ? 'Preparando...' : 'Imprimir Credencial'}
          </button>
        </Show>
      </div>

      <div>
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
            <div class="print-content space-y-6 flex flex-col items-center print:space-y-0">
              {/* Front Card */}
              <div class="text-center print-front-card">
                <h3 class="text-sm font-medium text-gray-700 mb-2 print:hidden">FRENTE</h3>
                <div
                  class="screen-card bg-white border border-gray-400 overflow-hidden shadow-lg relative rounded-lg print:shadow-none print:border-0 print:rounded-none"
                  style={{
                    width: '320px',
                    height: '200px',
                  }}
                >
                  {/* Header with Logos and Title */}
                  <div class="flex items-center justify-between p-1 gap-1">
                    {/* Top Left Logo */}
                    <div class="w-6 h-6 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center border border-yellow-400 flex-shrink-0">
                      <img src={ctmLogo} alt="CTM Logo" class="h-4 w-4 object-contain" />
                    </div>

                    {/* Center Title */}
                    <div class="flex-1 text-center px-1">
                      <div
                        class="font-bold text-black"
                        style="font-size: 8px; letter-spacing: 0.2px;"
                      >
                        UNION DE PERMISIONARIOS DE SITIOS DE TAXIS DEL EDO. DE COLIMA A. C.
                      </div>
                    </div>

                    {/* Top Right Logo */}
                    <div class="w-6 h-6 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center border border-yellow-400 flex-shrink-0">
                      <img src={ctmLogo} alt="CTM Logo" class="h-4 w-4 object-contain" />
                    </div>
                  </div>

                  {/* Main Content */}
                  <div class="flex-1 px-4 flex flex-col justify-center text-left">
                    {/* Red and Green Line */}
                    <div class="flex mb-1">
                      <div class="flex-1 h-0.5 bg-red-600" />
                      <div class="flex-1 h-0.5 bg-green-600" />
                    </div>

                    {/* Photo and All Content Section */}
                    <div class="flex gap-3 flex-1">
                      {/* Photo Section with Numbers */}
                      <div class="flex flex-col w-20 flex-shrink-0">
                        {/* Photo */}
                        <div class="h-20 border border-gray-600 overflow-hidden bg-gray-50 rounded-md w-16">
                          <Show
                            when={props.user && getPhotoUrl(props.user)}
                            fallback={
                              <div class=" h-full flex items-center justify-center w-full">
                                <div class="text-center text-gray-400">
                                  <svg
                                    class="w-6 h-6 mx-auto mb-1"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <title>Foto del usuario</title>
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                  </svg>
                                  <span style="font-size: 5px;">FOTO</span>
                                </div>
                              </div>
                            }
                          >
                            <img
                              src={props.user ? getPhotoUrl(props.user) || '' : ''}
                              alt="Foto del usuario"
                              class="h-full object-cover print-photo rounded-md w-full"
                            />
                          </Show>
                        </div>

                        {/* Credential Numbers */}
                        <div class="mt-1 text-left" style="font-size: 8px;">
                          <div class="text-black text-nowrap">
                            <span class="font-bold">Credencial: </span>
                            <span class="text-black font-mono">{props.user?.folio || '0000'}</span>
                          </div>
                          <div class="text-black text-nowrap">
                            <span class="font-bold">Licencia: </span>
                            <span class="text-black font-mono">
                              {props.user?.licenciaNum || '000000'}
                            </span>
                          </div>
                          <div class="text-black text-nowrap">
                            <span class="font-bold">Gafete: </span>
                            <span class="text-black font-mono">
                              {props.user?.gafeteNum || '000000'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* All Right Content */}
                      <div class="flex-1 flex flex-col justify-between">
                        {/* Top Section */}
                        <div class="space-y-1">
                          {/* Subtitle */}
                          <div>
                            <div class="font-bold text-black" style="font-size: 9px;">
                              FONDO DE RESPONSABILIDAD CIVIL DEL PASAJERO Y COBERTURA AMPLIA C.T.M
                            </div>
                          </div>

                          {/* Validity */}
                          <div>
                            <div class="font-medium text-black" style="font-size: 8px;">
                              Valida en caso de accidente vial
                            </div>
                          </div>

                          {/* User Info */}
                          <div class="mt-1" style="font-size: 9px;">
                            <div class="text-black">
                              <div class="font-bold">La presente acredita al C.:</div>
                              <div class="text-black capitalize">
                                {formatUserName(props.user || undefined)?.toLowerCase()}
                              </div>
                            </div>

                            <div class="font-bold text-black mt-1">Con Domicilio en:</div>
                            <div class="text-black leading-tight">
                              <div>
                                {props.user?.address?.street} {props.user?.address?.exteriorNo},{' '}
                                {props.user?.address?.neighborhood}{' '}
                                {props.user?.address?.municipality}, {props.user?.address?.state},
                                CP {props.user?.address?.postalCode}
                              </div>
                            </div>

                            <div class="text-black mt-2">
                              <span class="text-black">
                                {props.user ? calculateAge(props.user.dob) : ''} años -{' '}
                                {props.user ? formatPhone(props.user.phoneMx) : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Section - Absolute positioned */}
                  <div class="absolute bottom-1 left-4 right-2 flex justify-between items-end">
                    {/* Vigency */}
                    <div class="text-left text-[8px]">
                      <p class="font-bold text-black mr-1">Vigente hasta:</p>
                      {props.user ? getVigencyDate(props.user) : ''}
                    </div>

                    {/* Presidente Signature */}
                    <div class="text-center">
                      <div class="flex items-center justify-center">
                        <img
                          src={presidenteSignature}
                          alt="Firma Presidente"
                          class="h-6 object-contain"
                        />
                      </div>
                      <div
                        class="font-bold text-black border-t border-gray-400"
                        style="font-size: 8px;"
                      >
                        PRESIDENTE
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Back Card */}
              <div class="text-center print-back-card">
                <h3 class="text-sm font-medium text-gray-700 mb-2 print:hidden">REVERSO</h3>
                <div
                  class="screen-card bg-white border border-gray-400 overflow-hidden shadow-lg flex flex-col h-full p-2 rounded-lg print:shadow-none print:border-0 print:rounded-none"
                  style={{
                    width: '320px',
                    height: '200px',
                  }}
                >
                  {/* Header with two logos */}
                  <div class="flex justify-between items-start mb-0">
                    {/* Top Left Logo */}
                    <div class="w-4 h-4 bg-gray-800 rounded-full flex items-center justify-center border-2 border-gray-600">
                      <img
                        src={ctmLogo}
                        alt="CTM Logo"
                        class="h-3 w-3 object-contain grayscale print-grayscale"
                      />
                    </div>

                    {/* Top Right Logo */}
                    <div class="w-4 h-4 bg-gray-800 rounded-full flex items-center justify-center border-2 border-gray-600">
                      <img
                        src={ctmLogo}
                        alt="CTM Logo"
                        class="h-3 w-3 object-contain grayscale print-grayscale"
                      />
                    </div>
                  </div>

                  {/* Numbers section - taking most space */}
                  <div class="flex items-center justify-center mb-2">
                    <div class="grid grid-cols-3 gap-6 text-center w-full">
                      <div>
                        <div class="font-bold text-black" style="font-size: 8px;">
                          AJUSTADOR
                        </div>
                        <div class="font-bold text-black mb-1" style="font-size: 8px;">
                          COLIMA
                        </div>
                        <div class="font-mono font-bold text-black" style="font-size: 10px;">
                          {settings()?.ajustadorColima
                            ? formatPhone(settings()?.ajustadorColima)
                            : ''}
                        </div>
                      </div>
                      <div>
                        <div class="font-bold text-black" style="font-size: 8px;">
                          AJUSTADOR
                        </div>
                        <div class="font-bold text-black mb-1" style="font-size: 8px;">
                          TECOMÁN
                        </div>
                        <div class="font-mono font-bold text-black" style="font-size: 10px;">
                          {settings()?.ajustadorTecoman
                            ? formatPhone(settings()?.ajustadorTecoman)
                            : ''}
                        </div>
                      </div>
                      <div>
                        <div class="font-bold text-black" style="font-size: 8px;">
                          AJUSTADOR
                        </div>
                        <div class="font-bold text-black mb-1" style="font-size: 8px;">
                          MANZANILLO
                        </div>
                        <div class="font-mono font-bold text-black" style="font-size: 10px;">
                          {settings()?.ajustadorManzanillo
                            ? formatPhone(settings()?.ajustadorManzanillo)
                            : ''}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom section with legal text and signature */}
                  <div class="flex-1 flex flex-col justify-between">
                    {/* Legal Text - AT TOP */}
                    <div class="text-center mb-1">
                      <div class="text-black leading-tight" style="font-size: 7px;">
                        <div class="font-bold mb-1">
                          VALIDA ÚNICAMENTE EN CARROS ASEGURADOS POR EL FONDO DE RESPONSABILIDAD
                          CIVIL DEL PASAJERO Y COBERTURA AMPLIA C.T.M.
                        </div>
                        <div>
                          EN CASO DE ACCIDENTE LLAMAR A LOS TELEFONOS ARRIBA MENCIONADOS Y NO
                          MOVERSE DEL LUGAR DEL ACCIDENTE.
                        </div>
                      </div>
                    </div>

                    {/* QR Code and Driver Signature - AT VERY BOTTOM */}
                    <div class="flex justify-between items-end flex-1">
                      {/* QR Code - LEFT SIDE */}
                      <div class="flex flex-col items-center">
                        <Show when={props.user && qrCodeData()}>
                          <div class="flex items-end justify-center">
                            <img
                              src={qrCodeData() || ''}
                              alt="QR Code"
                              class="object-contain h-[75px] w-auto"
                            />
                          </div>
                        </Show>
                      </div>

                      {/* Driver Signature - RIGHT SIDE */}
                      <div class="flex flex-col items-center">
                        <Show
                          when={props.user && getSignatureUrl(props.user)}
                          fallback={
                            <div class="h-8 flex items-end justify-center">
                              <div class="text-gray-400" style="font-size: 6px;">
                                Sin firma
                              </div>
                            </div>
                          }
                        >
                          <div class="h-8 flex items-end justify-center">
                            <img
                              src={props.user ? getSignatureUrl(props.user) || '' : ''}
                              alt="Firma del Chofer"
                              class="max-h-8 w-auto object-contain print-signature"
                            />
                          </div>
                        </Show>
                        <div class="border-t border-gray-400 pt-1 w-36">
                          <div class="text-black font-medium" style="font-size: 6px;">
                            Firma del Chofer
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Show>
        </div>
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

      {/* Loading Overlay - Portal to body for true full-screen coverage */}
      <Show when={isPrinting()}>
        <Portal>
          <div
            class="fixed inset-0 bg-white flex items-center justify-center"
            style="z-index: 9999;"
          >
            <div class="bg-white rounded-lg p-8 flex flex-col items-center shadow-2xl">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-ctm-red mb-4"></div>
              <div class="text-lg font-medium text-gray-900 mb-2">Preparando impresión...</div>
              <div class="text-sm text-gray-600">Generando credencial de alta calidad</div>
            </div>
          </div>
        </Portal>
      </Show>
    </div>
  );
};

export default CardPreview;
