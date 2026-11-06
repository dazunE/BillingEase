import Svg, { Path } from "react-native-svg";
import { color } from "@/theme";

/** 24×24 stroke icons, the same paths as the design prototype. */
export const ICONS = {
  home: "M4 11 12 4l8 7v9h-5v-6H9v6H4z",
  in: "M12 19V5M5 12l7 7 7-7",
  out: "M12 5v14M5 12l7-7 7 7",
  inbox: "M4 13h4l2 3h4l2-3h4M5 5h14l2 8v6H3v-6z",
  plus: "M12 5v14M5 12h14",
  close: "M6 6l12 12M18 6 6 18",
  back: "M15 6l-6 6 6 6",
  chev: "m9 6 6 6-6 6",
  down: "m6 9 6 6 6-6",
  check: "m5 12 5 5 9-10",
  camera: "M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  invoice: "M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M8 13h8M8 17h5",
  expense: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
  bill: "M3 6h18v12H3zM3 10h18M7 15h3",
  bell: "M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4",
  send: "M4 12 20 4l-6 16-3-7z",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  face: "M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M9 9v1.5M15 9v1.5M12 9v4h-1M9 16c1.7 1.3 4.3 1.3 6 0",
  lock: "M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4",
  web: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  people: "M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 20v-1a4 4 0 0 0-3-3.8",
  car: "M5 16h14v-4l-2-5H7l-2 5zM5 16v2M19 16v2M7.5 13h.01M16.5 13h.01",
  warn: "M12 7v6M12 17h.01",
  import: "M12 3v12M7 10l5 5 5-5M4 17v3h16v-3",
} as const;
export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 20, stroke = color.ink, width = 2, fill = "none" }: { name: IconName; size?: number; stroke?: string; width?: number; fill?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      <Path d={ICONS[name]} />
    </Svg>
  );
}

/** The Equation mark. */
export function Logo({ size = 32, light = false }: { size?: number; light?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path d="M13 0h22a13 13 0 0 1 13 13v22a13 13 0 0 1-13 13H13A13 13 0 0 1 0 35V13A13 13 0 0 1 13 0z" fill={light ? "#FFFFFF" : color.ink} />
      <Path d="M12.5 11h23a3.5 3.5 0 0 1 0 7h-23a3.5 3.5 0 0 1 0-7z" fill={color.violet} />
      <Path d="M25.5 20.5h10a3.5 3.5 0 0 1 0 7h-10a3.5 3.5 0 0 1 0-7z" fill={color.orange} />
      <Path d="M12.5 30h6a3.5 3.5 0 0 1 0 7h-6a3.5 3.5 0 0 1 0-7z" fill={light ? color.ink : "#FFFFFF"} />
    </Svg>
  );
}
