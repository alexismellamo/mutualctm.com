import { describe, expect, test } from 'bun:test';
import { filterStrictIdentifierResults } from './searchResults';

describe('filterStrictIdentifierResults', () => {
  test('keeps only the exact folio when a four-digit result arrives sixth', () => {
    const results = [
      { name: 'Uno', folio: '1000' },
      { name: 'Dos', folio: null },
      { name: 'Tres', folio: '2000' },
      { name: 'Cuatro', folio: null },
      { name: 'Cinco', folio: '3000' },
      { name: 'Folio 2774', folio: '2774' },
    ];

    expect(filterStrictIdentifierResults(results, '2774')).toEqual([
      { name: 'Folio 2774', folio: '2774' },
    ]);
  });

  test('preserves API order for name searches', () => {
    const results = [{ folio: '1234' }, { folio: '0012' }];

    expect(filterStrictIdentifierResults(results, 'Ale')).toEqual(results);
  });

  test('keeps only exact license, badge, or phone matches', () => {
    const results = [
      { licenciaNum: 'PRE-04-000112-X', gafeteNum: 'OTHER' },
      { licenciaNum: '04-000112', gafeteNum: 'GAF-1' },
    ];

    expect(filterStrictIdentifierResults(results, '04-000112')).toEqual([results[1]]);

    const phoneResults = [{ phoneMx: '312123456789' }, { phoneMx: '3121234567' }];
    expect(filterStrictIdentifierResults(phoneResults, '3121234567')).toEqual([phoneResults[1]]);
    expect(filterStrictIdentifierResults(phoneResults, '312123')).toEqual([]);
  });
});
