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
