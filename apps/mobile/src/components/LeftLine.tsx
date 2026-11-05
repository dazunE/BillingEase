import { Text, View } from "react-native";
import type { leftAfter } from "@/lib/budgets";
import { font, tone as tones } from "@/theme";

/** What a category's budget has left, and what this expense does to it. */
export function LeftLine({ line }: { line: ReturnType<typeof leftAfter> }) {
  if (!line) return null;
  const t = tones[line.tone === "late" ? "late" : line.tone === "warn" ? "warn" : "ok"];
  return (
    <View accessibilityLiveRegion="polite" style={{ padding: 10, borderRadius: 14, backgroundColor: t.bg, gap: 6 }}>
      <Text style={{ fontFamily: font.semi, fontSize: 13, color: t.fg }}>{line.text}</Text>
      <View style={{ flexDirection: "row", height: 5, borderRadius: 99, overflow: "hidden", backgroundColor: "rgba(24,22,31,0.1)" }}>
        <View style={{ width: `${line.before}%`, backgroundColor: t.fg, opacity: 0.5 }} />
        <View style={{ width: `${Math.max(0, line.after - line.before)}%`, backgroundColor: t.fg }} />
      </View>
    </View>
  );
}
