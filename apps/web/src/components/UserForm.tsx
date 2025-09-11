import { type Component, Show, createEffect, createSignal } from 'solid-js';
import type { User } from '../pages/DashboardPage';

type Props = {
  user: User | null;
  isNew: boolean;
  onUserSaved: (user: User) => void;
};

const UserForm: Component<Props> = (props) => {
  // Calculate default vigencia (1 year from now)
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
    credencialNum: '',
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

  // Load user data when user changes
  createEffect(() => {
    const user = props.user;
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        secondLastName: user.secondLastName || '',
        dob: user.dob.split('T')[0], // Convert to YYYY-MM-DD format
        vigencia: user.vigencia
          ? (() => {
              const storedDate = new Date(user.vigencia);
              const defaultDate = new Date(getDefaultVigencia());
              return storedDate > defaultDate
                ? storedDate.toISOString().split('T')[0]
                : getDefaultVigencia();
            })()
          : getDefaultVigencia(),
        phoneMx: user.phoneMx,
        credencialNum: user.credencialNum,
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
        credencialNum: '',
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

      <form onSubmit={handleSubmit} class="space-y-6">
        {/* Personal Information */}
        <div>
          <h3 class="text-md font-medium text-ctm-text mb-4">Información Personal</h3>
          <div class="grid grid-cols-2 gap-4">
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
                class="input-field"
                value={formData().vigencia}
                onInput={(e) => updateFormData('vigencia', e.currentTarget.value)}
              />
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
              <label for="credencialNum" class="block text-sm font-medium text-gray-700 mb-1">
                Número de Credencial *
              </label>
              <input
                id="credencialNum"
                type="text"
                required
                class="input-field"
                value={formData().credencialNum}
                onInput={(e) => updateFormData('credencialNum', e.currentTarget.value)}
              />
            </div>
            <div class="col-span-2">
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

        {/* Actions */}
        <div class="flex gap-4 pt-6 border-t">
          <button
            type="submit"
            disabled={isLoading()}
            class="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading() ? 'Guardando...' : props.isNew ? 'Crear Usuario' : 'Actualizar Usuario'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
