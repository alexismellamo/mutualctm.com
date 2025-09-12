import { type Component, Show, createSignal, onMount } from 'solid-js';
import ctmLogo from '../assets/ctm-logo.png';
import presidenteSignature from '../assets/presidente-signature.jpeg';
import html2canvas from 'html2canvas';
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

  const handlePrint = async () => {
    try {
      // Get the front and back card elements
      const frontCard = document.querySelector('.print-front-card') as HTMLElement;
      const backCard = document.querySelector('.print-back-card') as HTMLElement;
      
      if (!frontCard || !backCard) {
        console.error('Could not find card elements');
        return;
      }

      // Hide the FRENTE/REVERSO labels before capturing
      const frontLabel = frontCard.querySelector('h3') as HTMLElement;
      const backLabel = backCard.querySelector('h3') as HTMLElement;
      
      if (frontLabel) frontLabel.style.display = 'none';
      if (backLabel) backLabel.style.display = 'none';

      // Temporarily scale up the cards for much higher quality capture
      const originalTransform = frontCard.style.transform;
      const originalTransformBack = backCard.style.transform;
      const originalTransformOrigin = frontCard.style.transformOrigin;
      const originalTransformOriginBack = backCard.style.transformOrigin;
      
      // Scale up 3x for capture
      frontCard.style.transformOrigin = '0 0';
      frontCard.style.transform = 'scale(3)';
      backCard.style.transformOrigin = '0 0';
      backCard.style.transform = 'scale(3)';

      // Wait a moment for the transform to take effect
      await new Promise(resolve => setTimeout(resolve, 100));

      // Force a repaint to ensure styles are applied, especially for object-cover images
      const userPhoto = frontCard.querySelector('.print-photo') as HTMLImageElement;
      if (userPhoto) {
        userPhoto.style.imageRendering = 'high-quality';
        userPhoto.style.imageRendering = '-webkit-optimize-contrast';
        
        // Ensure the image is fully loaded before capturing
        if (!userPhoto.complete) {
          await new Promise(resolve => {
            userPhoto.onload = resolve;
            userPhoto.onerror = resolve; // Continue even if image fails to load
          });
        }
        
        // Additional small delay to ensure object-cover calculations are done
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Calculate CR-80 aspect ratio dimensions for capture
      // CR-80: 85.6mm × 53.98mm = 1.586:1 aspect ratio
      const cr80AspectRatio = 85.6 / 53.98; // ~1.586
      const captureWidth = 960; // High resolution width
      const captureHeight = Math.round(captureWidth / cr80AspectRatio); // ~605px

      // Convert to images with ultra-high quality settings and correct aspect ratio
      const frontCanvas = await html2canvas(frontCard, {
        width: captureWidth,
        height: captureHeight,
        scale: 2, // Additional scale for even more quality
        backgroundColor: '#ffffff',
        removeContainer: true,
        useCORS: true,
        allowTaint: false,
        imageTimeout: 0,
        logging: false,
        pixelRatio: window.devicePixelRatio,
      });

      const backCanvas = await html2canvas(backCard, {
        width: captureWidth,
        height: captureHeight,
        scale: 2, // Additional scale for even more quality
        backgroundColor: '#ffffff',
        removeContainer: true,
        useCORS: true,
        allowTaint: false,
        imageTimeout: 0,
        logging: false,
        pixelRatio: window.devicePixelRatio,
      });

      // Restore original transforms and labels
      frontCard.style.transform = originalTransform;
      frontCard.style.transformOrigin = originalTransformOrigin;
      backCard.style.transform = originalTransformBack;
      backCard.style.transformOrigin = originalTransformOriginBack;
      
      if (frontLabel) frontLabel.style.display = '';
      if (backLabel) backLabel.style.display = '';

      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      // Set up the print page with exact CR-80 sizing
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>CTM Credencial</title>
            <style>
              @page {
                size: 85.6mm 53.98mm;
                margin: 0;
              }
              
              body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
              }
              
              .page {
                width: 85.6mm;
                height: 53.98mm;
                display: flex;
                align-items: center;
                justify-content: center;
                page-break-after: always;
                box-sizing: border-box;
              }
              
              .page:last-child {
                page-break-after: auto;
              }
              
              .card-image {
                width: 85.6mm;
                height: 53.98mm;
                object-fit: cover;
                object-position: center;
              }
            </style>
          </head>
          <body>
            <div class="page">
              <img src="${frontCanvas.toDataURL('image/png', 1.0)}" alt="Front Card" class="card-image" />
            </div>
            <div class="page">
              <img src="${backCanvas.toDataURL('image/png', 1.0)}" alt="Back Card" class="card-image" />
            </div>
          </body>
        </html>
      `);

      printWindow.document.close();
      
      // Wait a bit for images to load, then print
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }, 500);

    } catch (error) {
      console.error('Error generating print images:', error);
      // Fallback to regular print
    window.print();
    }
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
                class="screen-card bg-white border border-gray-400 overflow-hidden shadow-lg relative print:shadow-none print:border-0"
                style={{
                  width: '320px',
                  height: '200px',
                }}
              >
                {/* Header with Logos and Title */}
                <div class="flex items-center justify-between p-1 gap-12">
                  {/* Top Left Logo */}
                  <div class="w-6 h-6 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center border border-yellow-400 flex-shrink-0">
                    <img src={ctmLogo} alt="CTM Logo" class="h-4 w-4 object-contain" />
                  </div>

                  {/* Center Title */}
                  <div class="flex-1 text-center px-1">
                    <div class="font-bold text-gray-900" style="font-size: 6px; letter-spacing: 0.2px;">
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
                  <div class="flex mb-2">
                    <div class="flex-1 h-0.5 bg-red-600" />
                    <div class="flex-1 h-0.5 bg-green-600" />
                  </div>

                  {/* Photo and All Content Section */}
                  <div class="flex gap-3 flex-1">
                    {/* Photo Section with Numbers */}
                    <div class="flex flex-col w-16 flex-shrink-0">
                      {/* Photo */}
                      <div class="h-20 border border-gray-600 overflow-hidden bg-gray-50">
                    <Show
                      when={props.user && getPhotoUrl(props.user)}
                      fallback={
                        <div class="w-full h-full flex items-center justify-center">
                              <div class="text-center text-gray-400">
                                <svg class="w-6 h-6 mx-auto mb-1" fill="currentColor" viewBox="0 0 24 24">
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
                          class="w-full h-full object-cover print-photo"
                      />
                    </Show>
                  </div>

                      {/* Credential Numbers */}
                      <div class="mt-1 text-left" style="font-size: 6px;">
                        <div class="text-gray-800">
                          <span class="font-bold">No. CRED:</span>
                        </div>
                        <div class="text-gray-900 font-mono">
                          {props.user?.credencialNum || '000000'}
                        </div>
                        <div class="text-gray-800 mt-1">
                          <span class="font-bold">No. GAF:</span>
                        </div>
                        <div class="text-gray-900 font-mono">
                          {props.user?.gafeteNum || '000000'}
                        </div>
                      </div>
                    </div>

                    {/* All Right Content */}
                    <div class="flex-1 flex flex-col justify-between">
                      {/* Top Section */}
                      <div class="space-y-1">
                        {/* Subtitle */}
                        <div>
                          <div class="font-bold text-gray-800 text-center" style="font-size: 7px;">
                            FONDO DE RESPONSABILIDAD CIVIL DEL PASAJERO Y COBERTURA AMPLIA C.T.M
                    </div>
                  </div>

                        {/* Validity */}
                        <div>
                          <div class="font-medium text-gray-700" style="font-size: 6px;">
                            Valida en caso de accidente vial
                    </div>
                  </div>

                        {/* User Info */}
                        <div class="mt-1" style="font-size: 8px;">
                          <div class="text-gray-800">
                            <div class="font-bold">La presente acredita al C.:</div>
                            <div class="text-gray-900 capitalize">{formatUserName(props.user || undefined)?.toLowerCase()}</div>
                    </div>
                          
                          <div class="font-bold text-gray-800 mt-1">
                            Con Domicilio en:
                    </div>
                          <div class="text-gray-900 leading-tight">
                            <div>{props.user?.address?.street} {props.user?.address?.exteriorNo}, {props.user?.address?.neighborhood}</div>
                            <div>{props.user?.address?.municipality}, {props.user?.address?.state}, CP {props.user?.address?.postalCode}</div>
                  </div>

                          <div class="text-gray-800 mt-2">
                            <span class="text-gray-900">{props.user ? calculateAge(props.user.dob) : ''} años - {props.user ? formatPhone(props.user.phoneMx) : ''}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    </div>
                  </div>


                {/* Bottom Section - Absolute positioned */}
                <div class="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                  {/* Vigency */}
                  <div style="font-size: 6px;">
                    <span class="font-bold text-gray-800">
                      Vigente hasta: 
                      </span>{props.user ? getVigencyDate(props.user) : ''}
                    
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
                    <div class="font-bold text-gray-700 border-t border-gray-400" style="font-size: 6px;">
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
                class="screen-card bg-white border border-gray-400 overflow-hidden shadow-lg flex flex-col h-full p-2 print:shadow-none print:border-0"
                style={{
                  width: '320px',
                  height: '200px',
                }}
              >
                {/* Header with two logos */}
                <div class="flex justify-between items-start mb-2">
                  {/* Top Left Logo */}
                  <div class="w-8 h-8 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center border-2 border-yellow-400">
                    <img src={ctmLogo} alt="CTM Logo" class="h-5 w-5 object-contain" />
                  </div>

                  {/* Top Right Logo */}
                  <div class="w-8 h-8 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center border-2 border-yellow-400">
                    <img src={ctmLogo} alt="CTM Logo" class="h-5 w-5 object-contain" />
                  </div>
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
                <div class="space-y-1">
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
