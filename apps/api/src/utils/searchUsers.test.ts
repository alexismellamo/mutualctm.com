import { describe, expect, test } from 'bun:test';
import { filterUsers } from './searchUsers';

type SearchableUser = Parameters<typeof filterUsers>[0][number];

const makeUser = (overrides: Partial<SearchableUser> = {}): SearchableUser => ({
  firstName: 'Persona',
  lastName: 'Prueba',
  secondLastName: null,
  phoneMx: '3120000000',
  licenciaNum: 'LIC-9999',
  gafeteNum: 'GAF-9999',
  folio: null,
  ...overrides,
});

describe('filterUsers', () => {
  test('returns only the exact folio for a four-digit query', () => {
    const partialMatches = Array.from({ length: 20 }, (_, index) =>
      makeUser({ firstName: `Parcial ${index}`, licenciaNum: `LIC-0001-${index}` })
    );
    const exactFolio = makeUser({ firstName: 'Folio exacto', folio: '0001' });

    const results = filterUsers([...partialMatches, exactFolio], '0001');

    expect(results).toEqual([exactFolio]);
  });

  test('matches a historical unpadded folio with a padded query', () => {
    const historicalUser = makeUser({ folio: '1' });

    expect(filterUsers([historicalUser], '0001')).toEqual([historicalUser]);
  });

  test('requires a complete license number', () => {
    const exactLicense = makeUser({ licenciaNum: '04-000112' });
    const accidentalMatch = makeUser({ firstName: 'Otra', gafeteNum: 'PRE-04-000112-X' });

    expect(filterUsers([accidentalMatch, exactLicense], '04-000112')).toEqual([exactLicense]);
    expect(filterUsers([exactLicense], '000112')).toEqual([]);
  });

  test('requires a complete badge number and returns only exact matches', () => {
    const exactBadge = makeUser({ gafeteNum: 'GAF-1234' });
    const accidentalMatch = makeUser({ firstName: 'Otra', gafeteNum: 'PRE-GAF-1234-X' });

    expect(filterUsers([accidentalMatch, exactBadge], 'GAF-1234')).toEqual([exactBadge]);
    expect(filterUsers([exactBadge], '1234')).toEqual([]);
  });

  test('requires a complete phone number and returns only exact matches', () => {
    const exactPhone = makeUser({ phoneMx: '3121234567' });
    const accidentalMatch = makeUser({ firstName: 'Otra', phoneMx: '312123456789' });

    expect(filterUsers([accidentalMatch, exactPhone], '3121234567')).toEqual([exactPhone]);
    expect(filterUsers([exactPhone], '312123')).toEqual([]);
  });

  test('keeps partial matching for names', () => {
    const namedUser = makeUser({ firstName: 'Alejandro' });

    expect(filterUsers([namedUser], 'Ale')).toEqual([namedUser]);
  });
});
