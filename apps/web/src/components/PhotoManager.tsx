import { type Component, createSignal, Show } from 'solid-js';
import CameraCapture from './CameraCapture';

type Props = {
  userId?: string;
  currentPhotoPath?: string;
  onPhotoSelected: (photoBlob: Blob | null) => void;
};

const PhotoManager: Component<Props> = (props) => {
  const [showCamera, setShowCamera] = createSignal(false);
  const [error, setError] = createSignal('');
  const [photoPreviewUrl, setPhotoPreviewUrl] = createSignal<string | null>(null);

  const handlePhotoSelection = (photoBlob: Blob) => {
    setError('');

    // Validate file size (2MB)
    if (photoBlob.size > 2 * 1024 * 1024) {
      setError('El archivo debe ser menor a 2MB');
      return;
    }

    // Store the photo temporarily (handled by parent)

    // Create preview URL
    const previewUrl = URL.createObjectURL(photoBlob);
    setPhotoPreviewUrl(previewUrl);

    // Notify parent component
    props.onPhotoSelected(photoBlob);
  };

  const handleCameraPhoto = (photoBlob: Blob) => {
    setShowCamera(false);
    handlePhotoSelection(photoBlob);
  };

  const getDisplayPhotoUrl = () => {
    // Show preview of new photo if selected
    if (photoPreviewUrl()) return photoPreviewUrl();

    // Otherwise show existing photo from server
    if (props.userId && props.currentPhotoPath) {
      return `/api/v1/users/${props.userId}/photo?t=${Date.now()}`;
    }

    return null;
  };

  return (
    <div>
      {/* Photo Display Section */}
      <div class="text-center">
        <div class="relative inline-block">
          <Show
            when={getDisplayPhotoUrl()}
            fallback={
              <button
                type="button"
                class="w-32 h-40 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setShowCamera(true)}
                aria-label="Tomar foto"
              >
                <div class="text-center text-gray-400">
                  <svg
                    class="w-12 h-12 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    role="img"
                    aria-label="User placeholder"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <p class="text-sm font-medium">Sin foto</p>
                  <p class="text-xs text-gray-500 mt-1">Haz clic para tomar foto</p>
                </div>
              </button>
            }
          >
            <button
              type="button"
              class="relative group cursor-pointer"
              onClick={() => setShowCamera(true)}
              aria-label="Cambiar foto"
            >
              <img
                src={getDisplayPhotoUrl() || ''}
                alt="Foto del usuario"
                class="w-32 h-40 object-cover rounded-lg border-2 border-gray-300 shadow-lg"
              />
              <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all duration-200 flex items-center justify-center">
                <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 rounded-full p-3">
                  <svg
                    class="w-6 h-6 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    role="img"
                    aria-label="Camera icon"
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
                      d="M15 13a3 3 0 11-6 0 3 3 0 616 0z"
                    />
                  </svg>
                </div>
              </div>
            </button>
          </Show>

          {/* Photo size reference */}
          <div class="text-xs text-gray-500 mt-2">Foto frontal</div>
        </div>

        <Show when={error()}>
          <div class="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs mt-3 max-w-xs mx-auto">
            {error()}
          </div>
        </Show>
      </div>

      {/* Camera Modal */}
      <Show when={showCamera()}>
        <CameraCapture onPhotoTaken={handleCameraPhoto} onCancel={() => setShowCamera(false)} />
      </Show>
    </div>
  );
};

export default PhotoManager;
