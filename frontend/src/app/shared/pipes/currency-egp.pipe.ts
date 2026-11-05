import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyEgp',
  standalone: true
})
export class CurrencyEgpPipe implements PipeTransform {
  transform(value: number | null | undefined, showSymbol = true): string {
    if (value === null || value === undefined || isNaN(value)) {
      return showSymbol ? 'EGP 0.00' : '0.00';
    }

    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(value));

    const sign = value < 0 ? '-' : '';
    return showSymbol ? `${sign}EGP ${formatted}` : `${sign}${formatted}`;
  }
}
