export function formatPlural(
  count = 0 as number,
  {
    singular,
    plural,
  }: {
    singular: string;
    plural: string;
  },
  {
    includeCount = true,
  }: {
    includeCount?: boolean;
  },
) {
  const word = count === 1 ? singular : plural;

  return includeCount ? `${count} ${word}` : word;
}

export function formatPrice(amount: number, { showZeroAsNumber = false } = {}) {
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  });

  if (amount === 0 && !showZeroAsNumber) return "Free";
  return formatter.format(amount).split("US")[1];
}
