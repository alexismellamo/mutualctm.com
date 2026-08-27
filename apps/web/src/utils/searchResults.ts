type UserWithFolio = {
  folio?: string | null;
};

export function prioritizeExactFolio<T extends UserWithFolio>(users: T[], rawQuery: string): T[] {
  const query = rawQuery.trim();

  if (!/^\d{4}$/.test(query)) {
    return users;
  }

  const normalizedQuery = query.replace(/^0+(?=\d)/, '');
  return users.filter((user) => user.folio?.trim().replace(/^0+(?=\d)/, '') === normalizedQuery);
}
