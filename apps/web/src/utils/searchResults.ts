type UserWithFolio = {
  folio?: string | null;
};

export function prioritizeExactFolio<T extends UserWithFolio>(users: T[], rawQuery: string): T[] {
  const query = rawQuery.trim();

  if (!/^\d{4}$/.test(query)) {
    return users;
  }

  const normalizedQuery = query.replace(/^0+(?=\d)/, '');
  const exactMatches: T[] = [];
  const otherMatches: T[] = [];

  for (const user of users) {
    const normalizedFolio = user.folio?.trim().replace(/^0+(?=\d)/, '');

    if (normalizedFolio === normalizedQuery) {
      exactMatches.push(user);
    } else {
      otherMatches.push(user);
    }
  }

  return [...exactMatches, ...otherMatches];
}
