/**
 * Date utilities that handle timezone issues properly
 * All functions avoid timezone conversion by working with date parts directly
 */

/**
 * Formats date to Mexican locale (DD/MM/YYYY) without timezone conversion
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';

  // Extract just the date part to avoid timezone issues
  const datePart = dateString.split('T')[0]; // Gets YYYY-MM-DD

  // Parse the date components manually to avoid timezone conversion
  const [year, month, day] = datePart.split('-').map(Number);

  // Validate the components
  if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
    console.error('Invalid date string:', dateString);
    return '';
  }

  // Format as DD/MM/YYYY
  return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
};

/**
 * Formats date to Spanish locale (long format) without timezone conversion
 */
export const formatDateLong = (dateString: string): string => {
  if (!dateString) return 'No especificada';

  // Extract just the date part to avoid timezone issues
  const datePart = dateString.split('T')[0]; // Gets YYYY-MM-DD
  const [year, month, day] = datePart.split('-').map(Number);

  // Validate the components
  if (!year || !month || !day) return 'Fecha inválida';

  // Create date object without timezone conversion
  const date = new Date(year, month - 1, day); // month is 0-indexed
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Checks if a vigencia date is valid (not expired) without timezone conversion
 */
export const isVigenciaValid = (vigencia: string): boolean => {
  if (!vigencia) return false;

  // Extract just the date part to avoid timezone issues
  const datePart = vigencia.split('T')[0]; // Gets YYYY-MM-DD
  const [year, month, day] = datePart.split('-').map(Number);
  const vigenciaDate = new Date(year, month - 1, day); // month is 0-indexed
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Compare dates only, not time
  return vigenciaDate >= today;
};

/**
 * Calculates age from date of birth without timezone conversion
 */
export const calculateAge = (dob: string): number => {
  if (!dob) return 0;

  // Extract just the date part to avoid timezone issues
  const datePart = dob.split('T')[0]; // Gets YYYY-MM-DD
  const [birthYear, birthMonth, birthDay] = datePart.split('-').map(Number);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // getMonth() is 0-indexed
  const currentDay = today.getDate();

  let age = currentYear - birthYear;

  // Adjust if birthday hasn't occurred this year
  if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
    age--;
  }

  return age;
};
