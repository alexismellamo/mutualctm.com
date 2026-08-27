import { describe, expect, test } from 'bun:test';
import { prioritizeExactFolio } from './searchResults';

describe('prioritizeExactFolio', () => {
  test('keeps only the exact folio when a four-digit result arrives sixth', () => {
    const results = [
      { name: 'Uno', folio: '1000' },
      { name: 'Dos', folio: null },
      { name: 'Tres', folio: '2000' },
      { name: 'Cuatro', folio: null },
      { name: 'Cinco', folio: '3000' },
      { name: 'Folio 2774', folio: '2774' },
    ];

    expect(prioritizeExactFolio(results, '2774')).toEqual([{ name: 'Folio 2774', folio: '2774' }]);
  });

  test('preserves API order when the query is not exactly four digits', () => {
    const results = [{ folio: '1234' }, { folio: '0012' }];

    expect(prioritizeExactFolio(results, '12')).toEqual(results);
  });
});
