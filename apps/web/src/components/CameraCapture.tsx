import { type Component, createSignal, onMount, onCleanup, Show } from 'solid-js';

type Props = {
  onPhotoTaken: (photoBlob: Blob) => void;
  onCancel: () => void;
};

const CameraCapture: Component<Props> = (props) => {
  const [stream, setStream] = createSignal<MediaStream | null>(null);
  const [cameras, setCameras] = createSignal<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = createSignal<string>('');
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal('');
  const [isTakingPhoto, setIsTakingPhoto] = createSignal(false);
  
  let videoRef: HTMLVideoElement | undefined;
  let canvasRef: HTMLCanvasElement | undefined;

  const getAvailableCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameras(videoDevices);
      
      if (videoDevices.length > 0) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
      
      return videoDevices;
    } catch (err) {
      console.error('Error getting cameras:', err);
      setError('No se pudieron obtener las cámaras disponibles');
      return [];
    }
  };

  const startCamera = async (deviceId?: string) => {
    try {
      setError('');
      setIsLoading(true);
      
      // Stop any existing stream
      const currentStream = stream();
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
        audio: false
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef) {
        videoRef.srcObject = newStream;
        await videoRef.play();
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error starting camera:', err);
      setError('No se pudo acceder a la cámara. Verifica los permisos.');
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    const currentStream = stream();
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const takePhoto = () => {
    if (!videoRef || !canvasRef) return;
    
    setIsTakingPhoto(true);
    
    // Set canvas size to match video
    const video = videoRef;
    canvasRef.width = video.videoWidth;
    canvasRef.height = video.videoHeight;
    
    // Draw video frame to canvas
    const context = canvasRef.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0);
      
      // Convert canvas to blob
      canvasRef.toBlob((blob) => {
        if (blob) {
          props.onPhotoTaken(blob);
        }
        setIsTakingPhoto(false);
      }, 'image/jpeg', 0.8);
    }
  };

  const handleCameraChange = (deviceId: string) => {
    setSelectedCamera(deviceId);
    startCamera(deviceId);
  };

  onMount(async () => {
    const availableCameras = await getAvailableCameras();
    if (availableCameras.length > 0) {
      await startCamera(availableCameras[0].deviceId);
    }
  });

  onCleanup(() => {
    stopCamera();
  });

  return (
    <div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-ctm-text">Tomar Foto</h3>
          <button
            type="button"
            onClick={props.onCancel}
            class="text-gray-500 hover:text-gray-700"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <Show when={error()}>
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error()}
          </div>
        </Show>

        <Show when={cameras().length > 1}>
          <div class="mb-4">
            <label for="camera-select" class="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Cámara
            </label>
            <select
              id="camera-select"
              class="input-field"
              value={selectedCamera()}
              onChange={(e) => handleCameraChange(e.currentTarget.value)}
            >
              {cameras().map((camera, index) => (
                <option value={camera.deviceId}>
                  {camera.label || `Cámara ${index + 1}`}
                </option>
              ))}
            </select>
          </div>
        </Show>

        <div class="relative bg-black rounded-lg overflow-hidden mb-4" style="aspect-ratio: 4/3;">
          <Show when={isLoading()}>
            <div class="absolute inset-0 flex items-center justify-center text-white">
              <div class="flex items-center space-x-2">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span>Iniciando cámara...</span>
              </div>
            </div>
          </Show>
          
          <video
            ref={videoRef}
            class="w-full h-full object-cover"
            autoplay
            muted
            playsinline
          />
          
          <canvas
            ref={canvasRef}
            class="hidden"
          />
        </div>

        <div class="flex justify-center space-x-4">
          <button
            type="button"
            onClick={props.onCancel}
            class="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={takePhoto}
            disabled={isLoading() || isTakingPhoto()}
            class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Show when={isTakingPhoto()}>
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            </Show>
            📸 Tomar Foto
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
