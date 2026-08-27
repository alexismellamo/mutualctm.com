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

  if (searchWords.length === 1) {
    const searchTerm = searchWords[0];
    const normalizedQueryFolio = normalizeFolio(searchQuery);
    const shouldPrioritizeFolio = /^\d{4}$/.test(searchQuery);
    const exactFolioMatches: T[] = [];
    const otherMatches: T[] = [];

    for (const user of users) {
      const isExactFolio =
        shouldPrioritizeFolio &&
        user.folio !== null &&
        normalizeFolio(user.folio) === normalizedQueryFolio;
      const isMatch =
        isExactFolio ||
        user.firstName.toLowerCase().includes(searchTerm) ||
        user.lastName.toLowerCase().includes(searchTerm) ||
        user.secondLastName?.toLowerCase().includes(searchTerm) ||
        user.phoneMx.includes(searchQuery) ||
        user.licenciaNum.includes(searchQuery) ||
        user.gafeteNum.includes(searchQuery) ||
        user.folio?.includes(searchQuery);

      if (isExactFolio) {
        exactFolioMatches.push(user);
      } else if (isMatch) {
        otherMatches.push(user);
      }
    }

    return [...exactFolioMatches, ...otherMatches].slice(0, 20);
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
