import { type Component, Show, createEffect, createSignal } from 'solid-js';
import type { User } from '../pages/DashboardPage';
import PhotoManager from './PhotoManager';
import SignatureModal from './SignatureModal';
import { getSignatureUrl } from '../utils/cardUtils';

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

  // Load user data when user changes
  createEffect(() => {
    const user = props.user;
    console.log(user?.vigencia);
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
    }
  });

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
  };

  const handleSignatureSaved = (signatureBlob: Blob) => {
    setSelectedSignature(signatureBlob);
    // Create preview URL
    const url = URL.createObjectURL(signatureBlob);
    setSignaturePreview(url);
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
      let uploadErrors: string[] = [];

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
        } catch (photoErr) {
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
        } catch (signatureErr) {
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
        const uploadText = uploads.length > 0 ? ` ${uploads.join(' y ')} guardada${uploads.length > 1 ? 's' : ''} exitosamente.` : '';
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
        <h2 class="text-lg font-semibold text-ctm-text">
          {props.isNew ? 'Crear Nuevo Usuario' : 'Editar Usuario'}
        </h2>
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
                onPhotoSelected={setSelectedPhoto}
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
                  <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
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

      {/* Sticky Actions */}
      <div class="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-6 -mb-6">
        <button
          type="submit"
          form="user-form"
          disabled={isLoading()}
          class="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading() ? 'Guardando...' : props.isNew ? 'Crear Usuario' : 'Actualizar Usuario'}
        </button>
      </div>

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
