import { type Component, createEffect, createSignal, Show } from 'solid-js';
import type { User } from '../pages/DashboardPage';
import { getSignatureUrl } from '../utils/cardUtils';
import PhotoManager from './PhotoManager';
import SignatureModal from './SignatureModal';

type Props = {
  user: User | null;
  isNew: boolean;
  onUserSaved: (user: User) => void;
};

const UserForm: Component<Props> = (props) => {
  const getDefaultVigencia = () => {
    const today = new Date();
    const oneYearFromNow = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    return oneYearFromNow.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  const [formData, setFormData] = createSignal({
    firstName: '',
    lastName: '',
    secondLastName: '',
    dob: '',
    vigencia: getDefaultVigencia(),
    phoneMx: '',
    licenciaNum: '',
    gafeteNum: '',
    folio: '',
    address: {
      street: '',
      exteriorNo: '',
      interiorNo: '',
      neighborhood: '',
      city: '',
      municipality: '',
      state: '',
      postalCode: '',
      references: '',
    },
  });

  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal('');
  const [success, setSuccess] = createSignal('');
  const [selectedPhoto, setSelectedPhoto] = createSignal<Blob | null>(null);
  const [selectedSignature, setSelectedSignature] = createSignal<Blob | null>(null);
  const [signaturePreview, setSignaturePreview] = createSignal<string>('');
  const [isSignatureModalOpen, setIsSignatureModalOpen] = createSignal(false);

  // Autosave states
  const [autoSaveStatus, setAutoSaveStatus] = createSignal<'idle' | 'saving' | 'saved' | 'error'>(
    'idle'
  );
  let autoSaveTimeout: NodeJS.Timeout;

  // Load user data when user changes
  createEffect(() => {
    const user = props.user;
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        secondLastName: user.secondLastName || '',
        dob: user.dob.split('T')[0], // Convert to YYYY-MM-DD format
        vigencia: user.vigencia ? user.vigencia.split('T')[0] : getDefaultVigencia(),
        phoneMx: user.phoneMx,
        licenciaNum: user.licenciaNum,
        gafeteNum: user.gafeteNum,
        folio: user.folio || '',
        address: {
          street: user.address?.street || '',
          exteriorNo: user.address?.exteriorNo || '',
          interiorNo: user.address?.interiorNo || '',
          neighborhood: user.address?.neighborhood || '',
          city: user.address?.city || '',
          municipality: user.address?.municipality || '',
          state: user.address?.state || '',
          postalCode: user.address?.postalCode || '',
          references: user.address?.references || '',
        },
      });
    } else if (props.isNew) {
      // Reset form for new user
      setFormData({
        firstName: '',
        lastName: '',
        secondLastName: '',
        dob: '',
        vigencia: getDefaultVigencia(),
        phoneMx: '',
        licenciaNum: '',
        gafeteNum: '',
        folio: '',
        address: {
          street: '',
          exteriorNo: '',
          interiorNo: '',
          neighborhood: '',
          city: '',
          municipality: '',
          state: '',
          postalCode: '',
          references: '',
        },
      });

      (async () => {
        try {
          const res = await fetch('/api/v1/users/next-folio', { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            if (data?.nextFolio) {
              setFormData((prev) => ({ ...prev, folio: data.nextFolio }));
            }
          }
        } catch (_e) {}
      })();
    }
  });

  // Autosave function
  const performAutoSave = async () => {
    if (props.isNew || !props.user?.id) return;

    setAutoSaveStatus('saving');

    try {
      const data = formData();
      const response = await fetch(`/api/v1/users/${props.user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al autoguardar');
      }

      setAutoSaveStatus('saved');
      props.onUserSaved(result.user);

      // Clear saved status after 2 seconds
      setTimeout(() => {
        setAutoSaveStatus('idle');
      }, 2000);
    } catch (err) {
      setAutoSaveStatus('error');
      console.error('Autosave error:', err);

      // Clear error status after 3 seconds
      setTimeout(() => {
        setAutoSaveStatus('idle');
      }, 3000);
    }
  };

  // Debounced autosave
  const triggerAutoSave = () => {
    if (props.isNew || !props.user?.id) return;

    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
      performAutoSave();
    }, 1000); // 1 second delay
  };

  const updateFormData = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.replace('address.', '');
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

    // Trigger autosave after field update
    triggerAutoSave();
  };

  const handleSignatureSaved = (signatureBlob: Blob) => {
    setSelectedSignature(signatureBlob);
    // Create preview URL
    const url = URL.createObjectURL(signatureBlob);
    setSignaturePreview(url);

    // Auto-upload signature if editing existing user
    if (!props.isNew && props.user?.id) {
      uploadSignature(signatureBlob);
    }
  };

  const handlePhotoSelected = (photoBlob: Blob | null) => {
    setSelectedPhoto(photoBlob);

    // Auto-upload photo if editing existing user
    if (photoBlob && !props.isNew && props.user?.id) {
      uploadPhoto(photoBlob);
    }
  };

  const uploadPhoto = async (photoBlob: Blob) => {
    if (!props.user?.id) return;

    setAutoSaveStatus('saving');
    try {
      const formData = new FormData();
      formData.append('file', photoBlob, `photo-${Date.now()}.jpg`);

      const response = await fetch(`/api/v1/users/${props.user.id}/photo`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        // Update user with new photo path
        const updatedUser = { ...props.user, photoPath: result.path };
        props.onUserSaved(updatedUser);
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } else {
        setAutoSaveStatus('error');
        setTimeout(() => setAutoSaveStatus('idle'), 3000);
      }
    } catch (err) {
      setAutoSaveStatus('error');
      console.error('Photo upload error:', err);
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    }
  };

  const uploadSignature = async (signatureBlob: Blob) => {
    if (!props.user?.id) return;

    setAutoSaveStatus('saving');
    try {
      const formData = new FormData();
      formData.append('file', signatureBlob, `signature-${Date.now()}.png`);

      const response = await fetch(`/api/v1/users/${props.user.id}/signature`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        // Update user with new signature path
        const updatedUser = { ...props.user, signaturePath: result.path };
        props.onUserSaved(updatedUser);
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } else {
        setAutoSaveStatus('error');
        setTimeout(() => setAutoSaveStatus('idle'), 3000);
      }
    } catch (err) {
      setAutoSaveStatus('error');
      console.error('Signature upload error:', err);
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = formData();
      const url = props.isNew ? '/api/v1/users' : `/api/v1/users/${props.user?.id}`;
      const method = props.isNew ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al guardar usuario');
      }

      setSuccess(result.message);

      // Upload photo if one was selected
      const photo = selectedPhoto();
      const signature = selectedSignature();
      const uploadErrors: string[] = [];

      if (photo && result.user?.id) {
        try {
          const formData = new FormData();
          formData.append('file', photo, `photo-${Date.now()}.jpg`);

          const photoResponse = await fetch(`/api/v1/users/${result.user.id}/photo`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
          });

          if (photoResponse.ok) {
            const photoResult = await photoResponse.json();
            // Update user with photo path
            result.user.photoPath = photoResult.path;
          } else {
            uploadErrors.push('error al subir la foto');
          }
        } catch (_photoErr) {
          uploadErrors.push('error al subir la foto');
        }
      }

      // Upload signature if one was selected
      if (signature && result.user?.id) {
        try {
          const formData = new FormData();
          formData.append('file', signature, `signature-${Date.now()}.png`);

          const signatureResponse = await fetch(`/api/v1/users/${result.user.id}/signature`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
          });

          if (signatureResponse.ok) {
            const signatureResult = await signatureResponse.json();
            // Update user with signature path
            result.user.signaturePath = signatureResult.path;
          } else {
            uploadErrors.push('error al subir la firma');
          }
        } catch (_signatureErr) {
          uploadErrors.push('error al subir la firma');
        }
      }

      // Set success/error messages
      if (uploadErrors.length > 0) {
        setError(`Usuario guardado pero ${uploadErrors.join(' y ')}`);
      } else {
        const uploads = [];
        if (photo) uploads.push('Foto');
        if (signature) uploads.push('Firma');
        const uploadText =
          uploads.length > 0
            ? ` ${uploads.join(' y ')} guardada${uploads.length > 1 ? 's' : ''} exitosamente.`
            : '';
        setSuccess(`${result.message}${uploadText}`);
      }

      props.onUserSaved(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="card h-full overflow-y-auto">
      <div class="mb-6">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-ctm-text">
            {props.isNew ? 'Crear Nuevo Usuario' : 'Editar Usuario'}
          </h2>

          {/* Autosave status indicator */}
          <Show when={!props.isNew}>
            <div class="flex items-center text-sm">
              <Show when={autoSaveStatus() === 'saving'}>
                <div class="flex items-center text-blue-600">
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Guardando...
                </div>
              </Show>
              <Show when={autoSaveStatus() === 'saved'}>
                <div class="flex items-center text-green-600">
                  <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <title>Guardado exitosamente</title>
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  Guardado
                </div>
              </Show>
              <Show when={autoSaveStatus() === 'error'}>
                <div class="flex items-center text-red-600">
                  <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <title>Error al guardar</title>
                    <path
                      fill-rule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  Error al guardar
                </div>
              </Show>
            </div>
          </Show>
        </div>
      </div>

      <Show when={error()}>
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error()}
        </div>
      </Show>

      <Show when={success()}>
        <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {success()}
        </div>
      </Show>

      <form id="user-form" onSubmit={handleSubmit} class="space-y-6 pb-20">
        {/* Personal Information with Photo */}
        <div>
          <h3 class="text-md font-medium text-ctm-text mb-4">Información Personal</h3>
          <div class="grid grid-cols-3 gap-6">
            {/* Left Column - Photo only */}
            <div class="col-span-1">
              <PhotoManager
                userId={props.user?.id}
                currentPhotoPath={props.user?.photoPath}
                onPhotoSelected={handlePhotoSelected}
              />
            </div>

            {/* Right Columns - All form fields */}
            <div class="col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  class="input-field"
                  value={formData().firstName}
                  onInput={(e) => updateFormData('firstName', e.currentTarget.value)}
                />
              </div>
              <div>
                <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">
                  Apellido Paterno *
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  class="input-field"
                  value={formData().lastName}
                  onInput={(e) => updateFormData('lastName', e.currentTarget.value)}
                />
              </div>
              <div>
                <label for="secondLastName" class="block text-sm font-medium text-gray-700 mb-1">
                  Apellido Materno
                </label>
                <input
                  id="secondLastName"
                  type="text"
                  class="input-field"
                  value={formData().secondLastName}
                  onInput={(e) => updateFormData('secondLastName', e.currentTarget.value)}
                />
              </div>
              <div>
                <label for="dob" class="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Nacimiento *
                </label>
                <input
                  id="dob"
                  type="date"
                  required
                  class="input-field"
                  value={formData().dob}
                  onInput={(e) => updateFormData('dob', e.currentTarget.value)}
                />
              </div>
              <div>
                <label for="vigencia" class="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Vigencia *
                </label>
                <input
                  id="vigencia"
                  type="date"
                  required
                  class="input-field w-full"
                  value={formData().vigencia}
                  onInput={(e) => updateFormData('vigencia', e.currentTarget.value)}
                />
                <button
                  type="button"
                  class="mt-1 px-2 py-1 text-xs text-ctm-red border border-ctm-red rounded hover:bg-red-50 transition-colors duration-200"
                  onClick={() => updateFormData('vigencia', getDefaultVigencia())}
                >
                  + 1 año
                </button>
              </div>
              <div>
                <label for="phoneMx" class="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono (10 dígitos) *
                </label>
                <input
                  id="phoneMx"
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  class="input-field"
                  placeholder="3121234567"
                  value={formData().phoneMx}
                  onInput={(e) => updateFormData('phoneMx', e.currentTarget.value)}
                />
              </div>
              <div>
                <label for="licenciaNum" class="block text-sm font-medium text-gray-700 mb-1">
                  Número de Licencia *
                </label>
                <input
                  id="licenciaNum"
                  type="text"
                  required
                  class="input-field"
                  value={formData().licenciaNum}
                  onInput={(e) => updateFormData('licenciaNum', e.currentTarget.value)}
                />
              </div>
              <div>
                <label for="gafeteNum" class="block text-sm font-medium text-gray-700 mb-1">
                  Número de Gafete *
                </label>
                <input
                  id="gafeteNum"
                  type="text"
                  required
                  class="input-field"
                  value={formData().gafeteNum}
                  onInput={(e) => updateFormData('gafeteNum', e.currentTarget.value)}
                />
              </div>
              <div>
                <label for="folio" class="block text-sm font-medium text-gray-700 mb-1">
                  Folio de Credencial
                </label>
                <input
                  id="folio"
                  type="text"
                  class="input-field"
                  placeholder="0001"
                  value={formData().folio}
                  onInput={(e) => updateFormData('folio', e.currentTarget.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div>
          <h3 class="text-md font-medium text-ctm-text mb-4">Domicilio</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="street" class="block text-sm font-medium text-gray-700 mb-1">
                Calle *
              </label>
              <input
                id="street"
                type="text"
                required
                class="input-field"
                value={formData().address.street}
                onInput={(e) => updateFormData('address.street', e.currentTarget.value)}
              />
            </div>
            <div>
              <label for="exteriorNo" class="block text-sm font-medium text-gray-700 mb-1">
                Número Exterior
              </label>
              <input
                id="exteriorNo"
                type="text"
                class="input-field"
                value={formData().address.exteriorNo}
                onInput={(e) => updateFormData('address.exteriorNo', e.currentTarget.value)}
              />
            </div>
            <div>
              <label for="interiorNo" class="block text-sm font-medium text-gray-700 mb-1">
                Número Interior
              </label>
              <input
                id="interiorNo"
                type="text"
                class="input-field"
                value={formData().address.interiorNo}
                onInput={(e) => updateFormData('address.interiorNo', e.currentTarget.value)}
              />
            </div>
            <div>
              <label for="neighborhood" class="block text-sm font-medium text-gray-700 mb-1">
                Colonia *
              </label>
              <input
                id="neighborhood"
                type="text"
                required
                class="input-field"
                value={formData().address.neighborhood}
                onInput={(e) => updateFormData('address.neighborhood', e.currentTarget.value)}
              />
            </div>
            <div>
              <label for="city" class="block text-sm font-medium text-gray-700 mb-1">
                Ciudad *
              </label>
              <input
                id="city"
                type="text"
                required
                class="input-field"
                value={formData().address.city}
                onInput={(e) => updateFormData('address.city', e.currentTarget.value)}
              />
            </div>
            <div>
              <label for="municipality" class="block text-sm font-medium text-gray-700 mb-1">
                Municipio *
              </label>
              <input
                id="municipality"
                type="text"
                required
                class="input-field"
                value={formData().address.municipality}
                onInput={(e) => updateFormData('address.municipality', e.currentTarget.value)}
              />
            </div>
            <div>
              <label for="state" class="block text-sm font-medium text-gray-700 mb-1">
                Estado *
              </label>
              <input
                id="state"
                type="text"
                required
                class="input-field"
                value={formData().address.state}
                onInput={(e) => updateFormData('address.state', e.currentTarget.value)}
              />
            </div>
            <div>
              <label for="postalCode" class="block text-sm font-medium text-gray-700 mb-1">
                Código Postal *
              </label>
              <input
                id="postalCode"
                type="text"
                required
                pattern="[0-9]{5}"
                class="input-field"
                placeholder="28000"
                value={formData().address.postalCode}
                onInput={(e) => updateFormData('address.postalCode', e.currentTarget.value)}
              />
            </div>
            <div class="col-span-2">
              <label for="references" class="block text-sm font-medium text-gray-700 mb-1">
                Referencias
              </label>
              <input
                id="references"
                type="text"
                class="input-field"
                value={formData().address.references}
                onInput={(e) => updateFormData('address.references', e.currentTarget.value)}
              />
            </div>
          </div>
        </div>

        {/* Signature Section */}
        <div>
          <h3 class="text-md font-medium text-ctm-text mb-4">Firma Digital</h3>
          <div class="space-y-4">
            <Show when={signaturePreview()}>
              <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div class="flex justify-between items-center mb-2">
                  <p class="text-sm text-gray-600">Vista previa de la firma:</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSignature(null);
                      setSignaturePreview('');
                    }}
                    class="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors duration-200"
                  >
                    Eliminar
                  </button>
                </div>
                <img
                  src={signaturePreview()}
                  alt="Firma capturada"
                  class="border border-gray-300 rounded bg-white max-w-full h-auto"
                  style="max-height: 120px;"
                />
              </div>
            </Show>

            <Show when={!signaturePreview() && !getSignatureUrl(props.user)}>
              <div class="border border-gray-200 rounded-lg p-6 bg-gray-50 text-center">
                <div class="text-gray-400 mb-3">
                  <svg
                    class="w-12 h-12 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-label="Icono de cámara"
                  >
                    <title>Icono de firma</title>
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </div>
                <p class="text-sm text-gray-600 mb-2">No hay firma capturada</p>
                <p class="text-xs text-gray-500 mb-4">
                  Haga clic en "Capturar Firma" para usar la tableta Topaz
                </p>
                <button
                  type="button"
                  onClick={() => setIsSignatureModalOpen(true)}
                  class="px-4 py-2 bg-ctm-red text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                >
                  Capturar Firma
                </button>
              </div>
            </Show>

            <Show when={!signaturePreview() && getSignatureUrl(props.user)}>
              <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div class="flex justify-between items-center mb-2">
                  <p class="text-sm text-gray-600">Firma existente:</p>
                  <div class="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsSignatureModalOpen(true)}
                      class="px-3 py-1 text-sm text-ctm-red border border-ctm-red rounded hover:bg-red-50 transition-colors duration-200"
                    >
                      Recapturar
                    </button>
                  </div>
                </div>
                <img
                  src={getSignatureUrl(props.user) || ''}
                  alt="Firma existente"
                  class="border border-gray-300 rounded bg-white max-w-full h-auto"
                  style="max-height: 120px;"
                />
              </div>
            </Show>
          </div>
        </div>
      </form>

      {/* Sticky Actions - Only show for new users */}
      <Show when={props.isNew}>
        <div class="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-6 -mb-6">
          <button
            type="submit"
            form="user-form"
            disabled={isLoading()}
            class="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading() ? 'Guardando...' : 'Crear Usuario'}
          </button>
        </div>
      </Show>

      {/* Signature Modal */}
      <SignatureModal
        isOpen={isSignatureModalOpen()}
        onClose={() => setIsSignatureModalOpen(false)}
        onSignatureSaved={handleSignatureSaved}
      />
    </div>
  );
};

export default UserForm;
