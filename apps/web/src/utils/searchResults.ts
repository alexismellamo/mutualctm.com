type UserWithIdentifiers = {
  folio?: string | null;
  licenciaNum?: string | null;
  gafeteNum?: string | null;
  phoneMx?: string | null;
};

export function filterStrictIdentifierResults<T extends UserWithIdentifiers>(
  users: T[],
  rawQuery: string
): T[] {
  const query = rawQuery.trim();

  if (/^\d{4}$/.test(query)) {
    const normalizedQuery = query.replace(/^0+(?=\d)/, '');
    return users.filter((user) => user.folio?.trim().replace(/^0+(?=\d)/, '') === normalizedQuery);
  }

  const normalizedQuery = query.toLowerCase();
  const exactIdentifierMatches = users.filter(
    (user) =>
      user.licenciaNum?.trim().toLowerCase() === normalizedQuery ||
      user.gafeteNum?.trim().toLowerCase() === normalizedQuery ||
      user.phoneMx?.trim() === query
  );

  if (exactIdentifierMatches.length > 0) {
    return exactIdentifierMatches;
  }

  return /\d/.test(query) ? [] : users;
}
