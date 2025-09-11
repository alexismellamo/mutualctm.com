import { type Component, For, Show, createSignal, onCleanup, onMount } from 'solid-js';

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
  const [photoPreview, setPhotoPreview] = createSignal<string | null>(null);
  const [capturedBlob, setCapturedBlob] = createSignal<Blob | null>(null);

  let videoRef: HTMLVideoElement | undefined;
  let canvasRef: HTMLCanvasElement | undefined;

  const getAvailableCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === 'videoinput');
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
        for (const track of currentStream.getTracks()) {
          track.stop();
        }
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
        audio: false,
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
      for (const track of currentStream.getTracks()) {
        track.stop();
      }
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

      // Get preview image URL
      const previewUrl = canvasRef.toDataURL('image/jpeg', 0.8);
      setPhotoPreview(previewUrl);

      // Convert canvas to blob and store it
      canvasRef.toBlob(
        (blob) => {
          if (blob) {
            setCapturedBlob(blob);
          }
          setIsTakingPhoto(false);
        },
        'image/jpeg',
        0.8
      );
    }

    // Keep the video stream active in the background
    // Don't stop or pause the video element
  };

  const choosePhoto = () => {
    const blob = capturedBlob();
    if (blob) {
      props.onPhotoTaken(blob);
    }
  };

  const takeAnother = () => {
    setPhotoPreview(null);
    setCapturedBlob(null);
    // Video should already be running in background, just hide the preview
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

    // Add ESC key listener to close modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        props.onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup ESC listener
    onCleanup(() => {
      document.removeEventListener('keydown', handleKeyDown);
    });
  });

  onCleanup(() => {
    stopCamera();
  });

  return (
    <div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg p-4 md:p-6 w-full max-w-lg md:max-w-2xl max-h-full overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-ctm-text">Tomar Foto</h3>
          <button type="button" onClick={props.onCancel} class="text-gray-500 hover:text-gray-700">
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="Close"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
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
              <For each={cameras()}>
                {(camera, index) => (
                  <option value={camera.deviceId}>{camera.label || `Cámara ${index() + 1}`}</option>
                )}
              </For>
            </select>
          </div>
        </Show>

        <div
          class="relative bg-black rounded-lg overflow-hidden mb-4 max-h-96 mx-auto"
          style="aspect-ratio: 4/5;"
        >
          <Show when={isLoading()}>
            <div class="absolute inset-0 flex items-center justify-center text-white">
              <div class="flex items-center space-x-2">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                <span>Iniciando cámara...</span>
              </div>
            </div>
          </Show>

          {/* Always keep video running in background */}
          <video
            ref={videoRef}
            class={`w-full h-full object-cover ${photoPreview() ? 'hidden' : ''}`}
            autoplay
            muted
            playsinline
          />

          {/* Show preview overlay when photo is taken */}
          <Show when={photoPreview()}>
            <img
              src={photoPreview() ?? ''}
              alt="Foto capturada"
              class="absolute inset-0 w-full h-full object-cover"
            />
          </Show>

          <canvas ref={canvasRef} class="hidden" />
        </div>

        <div class="p-4 bg-gray-50 border-t">
          <Show
            when={photoPreview()}
            fallback={
              <div class="flex items-center justify-between">
                <button
                  type="button"
                  onClick={props.onCancel}
                  class="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={takePhoto}
                  disabled={isLoading() || isTakingPhoto()}
                  class="relative w-16 h-16 bg-white border-4 border-ctm-red rounded-full flex items-center justify-center hover:bg-ctm-red hover:text-white transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <Show
                    when={isTakingPhoto()}
                    fallback={
                      <svg
                        class="w-6 h-6 text-ctm-red group-hover:text-white transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        role="img"
                        aria-label="Take photo"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    }
                  >
                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                  </Show>
                </button>
                <div class="w-20" /> {/* Spacer for centering */}
              </div>
            }
          >
            {/* Photo preview buttons */}
            <div class="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={takeAnother}
                class="flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 border border-gray-500 rounded-full text-white font-medium shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  role="img"
                  aria-label="Retake"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Tomar Otra
              </button>

              <button
                type="button"
                onClick={choosePhoto}
                class="flex items-center justify-center gap-2 px-8 py-3 bg-ctm-red hover:bg-red-600 rounded-full text-white font-semibold shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-xl"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  role="img"
                  aria-label="Choose photo"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Elegir Esta Foto
              </button>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
