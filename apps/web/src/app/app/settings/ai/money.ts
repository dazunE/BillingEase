/** Vertex AI bills in US dollars; costs are kept in millionths of a dollar. */
export function usd(micros: number): string {
  const d = micros / 1_000_000;
  return `US$${d < 1 && d > 0 ? d.toFixed(3) : d.toFixed(2)}`;
}
