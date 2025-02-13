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

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDate(date: Date | string | number) {
  if (!date) return "Invalid Date"; // Handle undefined/null values
  const parsedDate = new Date(date);

  if (isNaN(parsedDate.getTime())) {
    return "Invalid Date"; // Handle invalid date values
  }

  return DATE_FORMATTER.format(parsedDate);
}

export function formatNumber(
  number: number,
  options?: Intl.NumberFormatOptions,
) {
  const formatter = new Intl.NumberFormat(undefined, options);
  return formatter.format(number);
}
