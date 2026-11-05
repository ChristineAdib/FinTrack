import { CurrencyEgpPipe } from './currency-egp.pipe';

describe('CurrencyEgpPipe', () => {
  const pipe = new CurrencyEgpPipe();

  it('transforms standard positive number into EGP format', () => {
    expect(pipe.transform(12000)).toBe('EGP 12,000.00');
  });

  it('transforms decimal numbers correctly', () => {
    expect(pipe.transform(1500.5)).toBe('EGP 1,500.50');
  });

  it('handles negative values correctly', () => {
    expect(pipe.transform(-500)).toBe('-EGP 500.00');
  });

  it('handles zero gracefully', () => {
    expect(pipe.transform(0)).toBe('EGP 0.00');
  });

  it('handles null and undefined gracefully', () => {
    expect(pipe.transform(null)).toBe('EGP 0.00');
    expect(pipe.transform(undefined)).toBe('EGP 0.00');
  });
});
