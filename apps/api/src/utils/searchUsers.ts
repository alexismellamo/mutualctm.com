type SearchableUser = {
  firstName: string;
  lastName: string;
  secondLastName: string | null;
  phoneMx: string;
  licenciaNum: string;
  gafeteNum: string;
  folio: string | null;
};

const normalizeFolio = (value: string) => {
  const trimmed = value.trim();

  if (!/^\d+$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  return trimmed.replace(/^0+(?=\d)/, '');
};

export function filterUsers<T extends SearchableUser>(users: T[], rawQuery: string): T[] {
  const searchQuery = rawQuery.trim();
  const searchWords = searchQuery
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 0);

  if (/^\d{4}$/.test(searchQuery)) {
    const normalizedQueryFolio = normalizeFolio(searchQuery);

    return users
      .filter((user) => user.folio !== null && normalizeFolio(user.folio) === normalizedQueryFolio)
      .slice(0, 20);
  }

  if (searchWords.length === 1) {
    const searchTerm = searchWords[0];
    const exactIdentifierMatches = users.filter(
      (user) =>
        user.licenciaNum.trim().toLowerCase() === searchTerm ||
        user.gafeteNum.trim().toLowerCase() === searchTerm ||
        user.phoneMx.trim() === searchQuery
    );

    if (exactIdentifierMatches.length > 0) {
      return exactIdentifierMatches.slice(0, 20);
    }

    return users
      .filter(
        (user) =>
          user.firstName.toLowerCase().includes(searchTerm) ||
          user.lastName.toLowerCase().includes(searchTerm) ||
          user.secondLastName?.toLowerCase().includes(searchTerm)
      )
      .slice(0, 20);
  }

  return users
    .filter((user) =>
      searchWords.every(
        (word) =>
          user.firstName.toLowerCase().includes(word) ||
          user.lastName.toLowerCase().includes(word) ||
          user.secondLastName?.toLowerCase().includes(word)
      )
    )
    .slice(0, 20);
}
