import { createSignal, onCleanup, onMount } from 'solid-js';

type TopazWrapper = {
  SigWebSetDisplayTarget: (canvasId: string) => number;
  SigWebSetDisplayXSize: (width: number) => number;
  SigWebSetDisplayYSize: (height: number) => number;
  SigWebSetJustifyMode: (mode: number) => number;
  SigWebSetTabletConnect: (connectType: number) => number;
  SigWebSetTabletState: (state: number, tmr: number) => number;
  SigWebTabletConnect: () => number;
  SigWebTabletDisconnect: () => number;
  SigWebGetSigString: () => string;
  SigWebClearTablet: () => number;
  SigWebIsSigStringValid: (sigString: string) => boolean;
  SigWebWriteSigStringToCanvas: (sigString: string) => number;
  Global: {
    Connect: () => Promise<number>;
    Disconnect: () => Promise<void>;
    GetLastError: () => Promise<string>;
    GetDeviceStatus: () => Promise<number>;
    GetSigPlusExtLiteVersion: () => Promise<string>;
    GetSigPlusExtLiteNMHVersion: () => Promise<string>;
  };
  Sign: {
    SetTabletState: (state: number) => Promise<number>;
    ClearTablet: () => Promise<void>;
    GetNumberOfTabletPoints: () => Promise<number | undefined>;
    GetSigImageB64: (format: number) => Promise<string>;
    GetSigString: () => Promise<string>;
  };
};

declare global {
  interface Window {
    Topaz?: TopazWrapper;
  }
}

type SignatureCaptureProps = {
  onSignature?: (signatureData: string) => void;
  onError?: (error: string) => void;
};

export const SignatureCapture = (props: SignatureCaptureProps) => {
  const [isConnected, setIsConnected] = createSignal(false);
  const [isCapturing, setIsCapturing] = createSignal(false);
  const [status, setStatus] = createSignal('Inicializando...');
  const [signatureImage, setSignatureImage] = createSignal('');
  const [isLoading, setIsLoading] = createSignal(false);

  let canvasRef: HTMLCanvasElement | undefined;
  let topazWrapper: TopazWrapper | null = null;

  onMount(async () => {
    await loadTopazWrapper();
  });

  onCleanup(() => {
    if (isConnected()) {
      disconnect();
    }
  });

  const loadTopazWrapper = async () => {
    try {
      const url = document.documentElement.getAttribute('SigPlusExtLiteWrapperURL');
      if (url) {
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => {
          topazWrapper = window.Topaz || null;
          setStatus(
            'Listo para conectar. Asegúrate de tener instalada la extensión Topaz SigPlusExtLite.'
          );
        };
        script.onerror = () => {
          updateStatus(
            'Error: No se pudo cargar el wrapper de Topaz. Verifica que la extensión esté instalada.',
            true
          );
        };
        document.head.appendChild(script);
      } else {
        updateStatus(
          'Error: SigPlusExtLiteWrapperURL no encontrado. Instala la extensión Topaz.',
          true
        );
      }
    } catch (error) {
      updateStatus(`Error al cargar Topaz: ${error}`, true);
    }
  };

  const updateStatus = (message: string, isError = false) => {
    setStatus(message);
    console.log(message);
    if (isError && props.onError) {
      props.onError(message);
    }
  };

  const connect = async () => {
    try {
      setIsLoading(true);
      updateStatus('Conectando a Topaz...');

      if (!topazWrapper) {
        throw new Error(
          'Topaz object not available. Please install the Topaz SigPlusExtLite extension.'
        );
      }

      const global = topazWrapper?.Global;
      const result = await global?.Connect();

      if (result === 1) {
        setIsConnected(true);
        updateStatus('Conectado exitosamente');

        const deviceStatus = await global.GetDeviceStatus();
        let deviceInfo = '';
        switch (deviceStatus) {
          case 0:
            deviceInfo = 'No se detectó dispositivo';
            break;
          case 1:
            deviceInfo = 'Tableta de firma Topaz detectada';
            break;
          case 2:
            deviceInfo = 'Pantalla GemView detectada';
            break;
          default:
            deviceInfo = `Error del dispositivo: ${deviceStatus}`;
        }
        updateStatus(`Conectado - ${deviceInfo}`);

        const extVersion = await global.GetSigPlusExtLiteVersion();
        const nmhVersion = await global.GetSigPlusExtLiteNMHVersion();
        console.log(`Extension version: ${extVersion}`);
        console.log(`NMH version: ${nmhVersion}`);
      } else {
        const error = await global.GetLastError();
        throw new Error(`Error de conexión: ${error || result}`);
      }
    } catch (error) {
      updateStatus(`Error de conexión: ${error}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      if (isCapturing()) {
        await stop();
      }

      const global = topazWrapper?.Global;
      await global?.Disconnect();
      setIsConnected(false);
      updateStatus('Desconectado');
    } catch (error) {
      updateStatus(`Error al desconectar: ${error}`, true);
    }
  };

  const startCapture = async () => {
    try {
      updateStatus('Iniciando captura de firma...');

      const sign = topazWrapper?.Sign;
      const result = await sign?.SetTabletState(1);

      if (result === 1) {
        setIsCapturing(true);
        updateStatus('Captura iniciada - Firma en la tableta');
      } else {
        const error = await topazWrapper?.Global?.GetLastError();
        throw new Error(`Error al iniciar captura: ${error || result}`);
      }
    } catch (error) {
      updateStatus(`Error al iniciar: ${error}`, true);
    }
  };

  const stopCapture = async () => {
    try {
      const sign = topazWrapper?.Sign;
      await sign?.SetTabletState(0);
      setIsCapturing(false);
      updateStatus('Captura detenida');
    } catch (error) {
      updateStatus(`Error al detener: ${error}`, true);
    }
  };

  const clearSignature = async () => {
    try {
      const sign = topazWrapper?.Sign;
      await sign?.ClearTablet();
      if (canvasRef) {
        const context = canvasRef.getContext('2d');
        context?.clearRect(0, 0, canvasRef.width, canvasRef.height);
      }
      setSignatureImage('');
      updateStatus('Firma limpiada');
    } catch (error) {
      updateStatus(`Error al limpiar: ${error}`, true);
    }
  };

  const saveSignature = async () => {
    try {
      updateStatus('Guardando firma...');

      const sign = topazWrapper?.Sign;
      const pointCount = await sign?.GetNumberOfTabletPoints();

      if (!pointCount || pointCount <= 0) {
        updateStatus('No hay firma para guardar', true);
        return;
      }

      const sigString = await sign?.GetSigImageB64(1); // 1 = JPG format

      if (sigString) {
        const signatureData = `data:image/jpeg;base64,${sigString}`;
        setSignatureImage(signatureData);
        updateStatus('Firma guardada exitosamente');

        if (props.onSignature) {
          props.onSignature(sigString);
        }

        const sigStringData = await sign?.GetSigString();
        console.log('Signature string:', sigStringData);
      } else {
        throw new Error('No se pudo obtener la imagen de la firma');
      }
    } catch (error) {
      updateStatus(`Error al guardar: ${error}`, true);
    }
  };

  return (
    <div class="signature-capture">
      <h2>Captura de Firma Topaz</h2>

      <div class={`status ${status().includes('Error') ? 'error' : 'success'}`}>{status()}</div>

      <div class="controls">
        <button
          type="button"
          onClick={connect}
          disabled={isConnected() || isLoading()}
          class="btn btn-primary"
        >
          {isLoading() ? 'Conectando...' : 'Conectar'}
        </button>

        <button
          type="button"
          onClick={disconnect}
          disabled={!isConnected()}
          class="btn btn-secondary"
        >
          Desconectar
        </button>

        <button
          type="button"
          onClick={startCapture}
          disabled={!isConnected() || isCapturing()}
          class="btn btn-primary"
        >
          Iniciar Captura
        </button>

        <button
          type="button"
          onClick={stopCapture}
          disabled={!isConnected() || !isCapturing()}
          class="btn btn-secondary"
        >
          Detener
        </button>

        <button
          type="button"
          onClick={clearSignature}
          disabled={!isConnected()}
          class="btn btn-warning"
        >
          Limpiar
        </button>

        <button
          type="button"
          onClick={saveSignature}
          disabled={!isConnected()}
          class="btn btn-success"
        >
          Guardar Firma
        </button>
      </div>

      <canvas ref={canvasRef} width="450" height="150" class="signature-canvas">
        Tu navegador no soporta canvas
      </canvas>

      {signatureImage() && (
        <div class="signature-preview">
          <h3>Vista Previa de la Firma:</h3>
          <img src={signatureImage()} alt="Firma capturada" class="signature-image" />
        </div>
      )}
    </div>
  );
};
