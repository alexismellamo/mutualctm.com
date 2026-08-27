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

  test('preserves API order when the query is not exactly four digits', () => {
    const results = [{ folio: '1234' }, { folio: '0012' }];

    expect(filterStrictIdentifierResults(results, '12')).toEqual(results);
  });

  test('keeps only exact license or badge matches', () => {
    const results = [
      { licenciaNum: 'PRE-04-000112-X', gafeteNum: 'OTHER' },
      { licenciaNum: '04-000112', gafeteNum: 'GAF-1' },
    ];

    expect(filterStrictIdentifierResults(results, '04-000112')).toEqual([results[1]]);
  });
});
