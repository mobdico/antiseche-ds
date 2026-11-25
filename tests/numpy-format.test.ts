import { describe, expect, it } from 'vitest';
import { repr1, repr2, str1, str2 } from '../src/content/_lib/numpy-sim';

// sorties de référence copiées depuis NumPy 2.5
describe('format NumPy', () => {
  it('repr / str 2D int', () => {
    expect(repr2([[12, 15, 9], [8, 11, 14]], 'int64')).toEqual(['array([[12, 15,  9],', '       [ 8, 11, 14]])']);
    expect(str2([[12, 15, 9], [8, 11, 14]], 'int64')).toEqual(['[[12 15  9]', ' [ 8 11 14]]']);
  });
  it('float avec nan', () => {
    expect(repr2([[null, null, null], [12, 15, 9]], 'float64')).toEqual(['array([[nan, nan, nan],', '       [12., 15.,  9.]])']);
  });
  it('float décimales', () => {
    expect(repr1([12, 11, 13.33333333, 12.66666667], 'float64')).toBe('array([12.        , 11.        , 13.33333333, 12.66666667])');
    expect(str1([11.75, 13.75, 11.25], 'float64')).toBe('[11.75 13.75 11.25]');
    expect(str1([8, 11, 14], 'int64')).toBe('[ 8 11 14]');
  });
});
