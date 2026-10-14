/** Shared bits for the home page demo. Sample businesses live in "@/content/site/samples". */

export const L_ICONS = {
  doc: "M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M8 13h8M8 17h5",
  bill: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
  people: "M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 20v-1a4 4 0 0 0-3-3.8",
  clock: "M12 8v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  sort: "M4 6h16M4 12h10M4 18h6",
  camera: "M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7",
};

/** Percentage for a bar segment, never thinner than 2%. */
export const pct = (a: number, t: number) => Math.max(2, Math.round((a / t) * 100));
