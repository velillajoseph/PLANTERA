const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function formatMoney(amount: number): string {
  return moneyFormatter.format(amount);
}
