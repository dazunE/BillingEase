import type { BottomTabBarProps } from "expo-router/js-tabs";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color, font } from "@/theme";
import { Icon, type IconName } from "./Icon";

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: "Home", icon: "home" },
  in: { label: "Coming in", icon: "in" },
  out: { label: "Going out", icon: "out" },
  inbox: { label: "Inbox", icon: "inbox" },
};

type Add = { label: string; hint: string; icon: IconName; href: string; tint: string; big?: boolean };
const ADD: Add[] = [
  { label: "Scan a receipt", hint: "We read it, you check it", icon: "camera", href: "/scan", tint: "#18161F", big: true },
  { label: "New invoice", hint: "Sent in under a minute", icon: "invoice", href: "/invoice", tint: color.violetTint, big: true },
  { label: "Record money out", hint: "Something you’ve already paid", icon: "expense", href: "/record?dir=out", tint: color.orangeTint },
  { label: "Record money in", hint: "A customer paid an invoice", icon: "in", href: "/record?dir=in", tint: color.violetTint },
  { label: "Import a bank statement", hint: "CSV or PDF from any bank", icon: "import", href: "/import", tint: color.chip },
  { label: "Payroll", hint: "This month’s pay run", icon: "people", href: "/payroll", tint: color.amberTint },
];

/** The tab bar: Home, Coming in, ＋, Going out, Inbox. Badges for late invoices and unread notifications. */
export function TabBar({ state, navigateToTab, badges }: BottomTabBarProps & { badges: Record<string, number> }) {
  const inset = useSafeAreaInsets();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const tab = (route: (typeof state.routes)[number], i: number) => {
    const t = TABS[route.name];
    if (!t) return null;
    const on = state.index === i;
    const badge = badges[route.name];
    return (
      <Pressable key={route.key} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={t.label + (badge ? `, ${badge} need you` : "")}
        onPress={() => { if (!on) navigateToTab(route.key); }} style={s.tab}>
        <Icon name={t.icon} size={24} stroke={on ? color.ink : color.muted} width={on ? 2.4 : 1.9} fill={on && route.name === "index" ? color.violet : "none"} />
        <Text style={[s.label, on && { color: color.ink, fontFamily: font.bold }]}>{t.label}</Text>
        {badge ? <View style={s.badge}><Text style={s.badgeText}>{badge}</Text></View> : null}
      </Pressable>
    );
  };
  const routes = state.routes;
  const go = (href: string) => { setOpen(false); router.push(href as never); };
  return (
    <>
      <View style={[s.bar, { paddingBottom: Math.max(10, inset.bottom) }]}>
        {routes.slice(0, 2).map((r, i) => tab(r, i))}
        <Pressable accessibilityRole="button" accessibilityLabel="Add: scan a receipt, new invoice, record money out or in" onPress={() => setOpen(true)} style={s.plus}>
          <Icon name="plus" size={28} width={2.6} />
        </Pressable>
        {routes.slice(2).map((r, i) => tab(r, i + 2))}
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable accessibilityLabel="Close" style={s.scrim} onPress={() => setOpen(false)} />
        <View style={[s.sheet, { bottom: 88 + inset.bottom / 2 }]} accessibilityViewIsModal>
          <View style={s.grab} />
          <Text accessibilityRole="header" style={s.title}>Add something</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {ADD.filter((a) => a.big).map((a) => {
              const dark = a.tint === "#18161F";
              return (
                <Pressable key={a.label} accessibilityRole="button" onPress={() => go(a.href)} style={[s.big, { backgroundColor: a.tint }]}>
                  <View style={[s.ic, { backgroundColor: dark ? color.violet : "#FFFFFF" }]}><Icon name={a.icon} size={22} /></View>
                  <View style={{ marginTop: "auto" }}>
                    <Text style={[s.bigLabel, dark && { color: "#FFFFFF" }]}>{a.label}</Text>
                    <Text style={[s.bigHint, dark && { color: "rgba(255,255,255,0.75)" }]}>{a.hint}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          {ADD.filter((a) => !a.big).map((a) => (
            <Pressable key={a.label} accessibilityRole="button" onPress={() => go(a.href)} style={s.row}>
              <View style={[s.ic, { backgroundColor: a.tint }]}><Icon name={a.icon} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowLabel}>{a.label}</Text>
                <Text style={s.rowHint}>{a.hint}</Text>
              </View>
              <Icon name="chev" stroke={color.faint} />
            </Pressable>
          ))}
        </View>
        <View style={[s.closeWrap, { bottom: Math.max(10, inset.bottom) + 2 }]} pointerEvents="box-none">
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setOpen(false)} style={[s.plus, { backgroundColor: color.ink, marginTop: 0 }]}>
            <Icon name="close" size={26} stroke="#FFFFFF" width={2.6} />
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "stretch", paddingTop: 6, paddingHorizontal: 10, backgroundColor: "rgba(255,255,255,0.97)", borderTopWidth: 1, borderTopColor: color.line },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3, minHeight: 52 },
  label: { fontFamily: font.medium, fontSize: 11.5, color: color.muted },
  badge: { position: "absolute", top: 0, left: "50%", marginLeft: 6, minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 99, backgroundColor: color.orange, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#FFFFFF" },
  badgeText: { fontFamily: font.bold, fontSize: 11, color: "#FFFFFF" },
  plus: { width: 62, height: 62, marginTop: -24, marginHorizontal: 6, borderRadius: 99, borderWidth: 4, borderColor: color.bg, backgroundColor: color.violet, alignItems: "center", justifyContent: "center", shadowColor: "#18161F", shadowOpacity: 0.22, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: color.scrim },
  sheet: { position: "absolute", left: 8, right: 8, backgroundColor: color.surface, borderRadius: 28, padding: 16, paddingTop: 10, gap: 12 },
  grab: { alignSelf: "center", width: 40, height: 5, borderRadius: 99, backgroundColor: color.line },
  title: { fontFamily: font.head, fontSize: 19, color: color.ink, paddingHorizontal: 4 },
  big: { flex: 1, minHeight: 128, borderRadius: 20, padding: 16, gap: 12 },
  bigLabel: { fontFamily: font.bold, fontSize: 16, color: color.ink },
  bigHint: { fontFamily: font.body, fontSize: 12.5, color: color.ink2 },
  ic: { width: 40, height: 40, borderRadius: 99, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 60 },
  rowLabel: { fontFamily: font.semi, fontSize: 15, color: color.ink },
  rowHint: { fontFamily: font.body, fontSize: 13, color: color.muted },
  closeWrap: { position: "absolute", left: 0, right: 0, alignItems: "center" },
});
