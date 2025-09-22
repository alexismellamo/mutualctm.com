import { type Component, createEffect, createSignal, onCleanup, Show } from 'solid-js';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSignatureSaved: (signatureBlob: Blob) => void;
};

declare global {
  function IsSigWebInstalled(): boolean;
  function SetDisplayXSize(width: number): void;
  function SetDisplayYSize(height: number): void;
  function SetImageXSize(width: number): void;
  function SetImageYSize(height: number): void;
  function SetDisplayPenWidth(width: number): void;
  function SetImagePenWidth(width: number): void;
  function SetJustifyMode(mode: number): void;
  function ClearTablet(): void;
  function SigWebSetDisplayTarget(context: CanvasRenderingContext2D | null): void;
  function SetTabletState(
    state: number,
    context?: CanvasRenderingContext2D,
    interval?: number
  ): number;
  function GetTabletState(): number;
  function NumberOfTabletPoints(): string;
  function GetSigImageB64(callback: (base64: string) => void): void;
  function ResetParameters(): void;
}

const SignatureModal: Component<Props> = (props) => {
  const [isCapturing, setIsCapturing] = createSignal(false);
  const [error, setError] = createSignal('');
  const [points, setPoints] = createSignal(0);
  const [sigWebInstalled, setSigWebInstalled] = createSignal(false);

  let canvas: HTMLCanvasElement | undefined;
  let canvasContext: CanvasRenderingContext2D | null = null;
  let refreshTimer: number | null = null;
  let pointsTicker: number | null = null;

  // Check if SigWeb is installed when modal opens
  createEffect(() => {
    if (props.isOpen) {
      checkSigWebInstallation();
    } else {
      // Always stop capture when modal closes
      stopCapture();
    }
  });

  // Clean up on component unmount
  onCleanup(() => {
    stopCapture();
  });

  const checkSigWebInstallation = () => {
    try {
      const installed =
        typeof window.IsSigWebInstalled === 'function' && window.IsSigWebInstalled();
      setSigWebInstalled(installed);
      if (installed) {
        setError('');
        // Auto-start capture if SigWeb is available
        setTimeout(() => {
          startCapture();
        }, 100);
      } else {
        setError(
          'SigWeb no está instalado. Por favor instale el servicio SigWeb y reinicie el navegador.'
        );
      }
    } catch (_e) {
      setSigWebInstalled(false);
      setError(
        'Error al detectar SigWeb. Asegúrese de que el servicio esté instalado y ejecutándose.'
      );
    }
  };

  const startPointTicker = () => {
    if (pointsTicker) return;
    pointsTicker = window.setInterval(() => {
      try {
        const pts = Number(window.NumberOfTabletPoints());
        setPoints(pts);
      } catch (e) {
        console.warn('Error reading tablet points:', e);
      }
    }, 200);
  };

  const stopPointTicker = () => {
    if (pointsTicker) {
      clearInterval(pointsTicker);
      pointsTicker = null;
    }
  };

  const startCapture = () => {
    if (!canvas || !sigWebInstalled()) return;

    try {
      // Hard reset like in test.html
      try {
        window.SetTabletState(0);
        window.ResetParameters();
        window.ClearTablet();
      } catch (e) {
        console.warn('Reset warnings (may be normal):', e);
      }

      canvasContext = canvas.getContext('2d', { willReadFrequently: true });
      if (!canvasContext) {
        setError('Error al obtener el contexto del canvas');
        return;
      }

      // Configure SigWeb settings exactly like test.html
      window.SetDisplayXSize(canvas.width);
      window.SetDisplayYSize(canvas.height);
      window.SetImageXSize(canvas.width);
      window.SetImageYSize(canvas.height);
      window.SigWebSetDisplayTarget(canvasContext);
      window.SetDisplayPenWidth(2);
      window.SetImagePenWidth(2);
      window.SetJustifyMode(0); // top-left

      // Clear canvas
      canvasContext.clearRect(0, 0, canvas.width, canvas.height);
      refreshTimer = window.SetTabletState(1, canvasContext, 100);

      setIsCapturing(true);
      setError('');
      startPointTicker();
    } catch (e) {
      setError(
        'Error al iniciar la captura de firma. Verifique que SigWeb esté funcionando correctamente.'
      );
      console.error('Start capture error:', e);
    }
  };

  const stopCapture = () => {
    try {
      if (refreshTimer) {
        window.SetTabletState(0);
        clearInterval(refreshTimer);
        refreshTimer = null;
      }
      window.SigWebSetDisplayTarget(null);
      stopPointTicker();
      setIsCapturing(false);
    } catch (e) {
      console.warn('Stop capture warning:', e);
    }
  };

  const clearSignature = () => {
    if (!sigWebInstalled() || !canvas || !canvasContext) return;

    try {
      window.ClearTablet();
      canvasContext.clearRect(0, 0, canvas.width, canvas.height);
      setPoints(0);
    } catch (_e) {
      setError('Error al limpiar la firma');
    }
  };

  const trimSignatureImage = (base64: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto del canvas'));
          return;
        }

        // Draw image to canvas with transparent background
        canvas.width = img.width;
        canvas.height = img.height;

        // Make sure background is transparent
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Find bounds of signature content (dark pixels)
        let minX = canvas.width,
          minY = canvas.height,
          maxX = 0,
          maxY = 0;
        let hasContent = false;

        console.log('Starting trim analysis...');

        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const index = (y * canvas.width + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            const alpha = data[index + 3];

            // More aggressive detection: anything that's significantly darker than white
            const brightness = (r + g + b) / 3;
            const isDark = brightness < 200; // Much more aggressive than 240
            const hasAlpha = alpha > 10; // Lower alpha threshold

            // Consider it content if it's dark OR has alpha (covers both white bg and transparent)
            if ((isDark && hasAlpha) || (alpha > 0 && brightness < 250)) {
              if (!hasContent) {
                console.log(
                  `First content pixel found at (${x}, ${y}): r=${r}, g=${g}, b=${b}, a=${alpha}, brightness=${brightness}`
                );
              }
              hasContent = true;
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }
          }
        }

        console.log(`Content bounds: ${minX}, ${minY} to ${maxX}, ${maxY}`);
        console.log(`Original size: ${canvas.width}x${canvas.height}`);

        if (!hasContent) {
          reject(new Error('No se encontró contenido en la firma'));
          return;
        }

        // Add minimal padding to make trimming obvious
        const padding = 2;
        minX = Math.max(0, minX - padding);
        minY = Math.max(0, minY - padding);
        maxX = Math.min(canvas.width - 1, maxX + padding);
        maxY = Math.min(canvas.height - 1, maxY + padding);

        // Create trimmed canvas with transparent background
        const trimmedWidth = maxX - minX + 1;
        const trimmedHeight = maxY - minY + 1;
        const trimmedCanvas = document.createElement('canvas');
        const trimmedCtx = trimmedCanvas.getContext('2d');

        if (!trimmedCtx) {
          reject(new Error('No se pudo crear el canvas recortado'));
          return;
        }

        trimmedCanvas.width = trimmedWidth;
        trimmedCanvas.height = trimmedHeight;

        // Ensure transparent background
        trimmedCtx.clearRect(0, 0, trimmedWidth, trimmedHeight);

        // Copy trimmed portion
        trimmedCtx.drawImage(
          canvas,
          minX,
          minY,
          trimmedWidth,
          trimmedHeight,
          0,
          0,
          trimmedWidth,
          trimmedHeight
        );

        // Convert to blob with PNG to preserve transparency
        trimmedCanvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(
                `Signature trimmed from ${canvas.width}x${canvas.height} to ${trimmedWidth}x${trimmedHeight}`
              );
              resolve(blob);
            } else {
              reject(new Error('Error al crear el blob de la firma'));
            }
          },
          'image/png',
          1.0
        );
      };

      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = `data:image/png;base64,${base64}`;
    });
  };

  const saveSignature = () => {
    if (!sigWebInstalled()) return;

    const currentPoints = points();
    if (!currentPoints || currentPoints === 0) {
      setError('No hay firma para guardar. Por favor firme en la tableta.');
      return;
    }

    try {
      window.GetSigImageB64(async (base64png: string) => {
        if (!base64png) {
          setError('Error al obtener la imagen de la firma');
          return;
        }

        try {
          console.log('Raw base64 length:', base64png.length);
          console.log('Starting trimming process...');

          // Trim the signature to remove empty space
          const trimmedBlob = await trimSignatureImage(base64png);
          console.log('Trimming completed successfully');
          props.onSignatureSaved(trimmedBlob);
          handleClose();
        } catch (e) {
          console.error('Trim error details:', e);
          setError(
            `Error al procesar la imagen de la firma: ${e instanceof Error ? e.message : 'Error desconocido'}`
          );

          // Fallback: save without trimming
          console.log('Saving without trimming as fallback...');
          const byteCharacters = atob(base64png);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'image/png' });
          props.onSignatureSaved(blob);
          handleClose();
        }
      });
    } catch (_e) {
      setError('Error al guardar la firma');
    }
  };

  const handleClose = () => {
    stopCapture();
    props.onClose();
  };

  return (
    <Show when={props.isOpen}>
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
          <div class="p-6">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-xl font-semibold text-ctm-text">Captura de Firma</h2>
              <button
                type="button"
                onClick={handleClose}
                class="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <Show when={error()}>
              <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error()}
              </div>
            </Show>

            <Show when={!sigWebInstalled()}>
              <div class="text-center py-8">
                <div class="text-gray-500 mb-4">
                  <svg
                    class="w-16 h-16 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-label="Icono de firma digital"
                  >
                    <title>Icono de firma digital</title>
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <h3 class="text-lg font-medium text-gray-900 mb-2">SigWeb No Detectado</h3>
                  <p class="text-gray-600 mb-4">
                    Para capturar firmas se requiere tener instalado el servicio SigWeb de Topaz.
                  </p>
                  <div class="text-sm text-gray-500">
                    <p>1. Instale SigWeb desde el sitio web de Topaz</p>
                    <p>2. Asegúrese de que el servicio esté ejecutándose</p>
                    <p>3. Reinicie el navegador</p>
                    <p>4. Conecte su tableta de firmas Topaz</p>
                  </div>
                </div>
              </div>
            </Show>

            <Show when={sigWebInstalled()}>
              <div class="space-y-4">
                <div class="flex justify-between items-center">
                  <div class="flex gap-2">
                    <button
                      type="button"
                      onClick={clearSignature}
                      disabled={!isCapturing()}
                      class="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Limpiar
                    </button>
                    <button
                      type="button"
                      onClick={saveSignature}
                      disabled={!isCapturing() || points() === 0}
                      class="px-4 py-2 text-sm bg-ctm-red text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Guardar Firma
                    </button>
                  </div>
                  <div class="text-sm text-gray-600">
                    Estado: {isCapturing() ? 'Capturando' : 'Detenido'}
                  </div>
                </div>

                <div class="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <canvas
                    ref={canvas}
                    width="600"
                    height="200"
                    class="border border-gray-200 bg-white rounded mx-auto block"
                    style="max-width: 100%; height: auto;"
                  />
                  <p class="text-sm text-gray-600 text-center mt-2">
                    {isCapturing()
                      ? 'Firme en la tableta Topaz. La firma aparecerá aquí en tiempo real.'
                      : 'Conecte su tableta Topaz y la captura iniciará automáticamente.'}
                  </p>
                </div>
              </div>
            </Show>

            <div class="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={handleClose}
                class="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default SignatureModal;
