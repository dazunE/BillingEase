import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet,
  Text, TextInput, View, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { color, font, radius, tone as tones, type Tone } from "@/theme";
import { Icon, type IconName } from "./Icon";

// ---- type -------------------------------------------------------------------------------

type TProps = { children: ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number };
export const H1 = ({ children, style }: TProps) => <Text accessibilityRole="header" style={[s.h1, style]}>{children}</Text>;
export const H2 = ({ children, style }: TProps) => <Text accessibilityRole="header" style={[s.h2, style]}>{children}</Text>;
export const H3 = ({ children, style, numberOfLines }: TProps) => <Text numberOfLines={numberOfLines} style={[s.h3, style]}>{children}</Text>;
export const Body = ({ children, style, numberOfLines }: TProps) => <Text numberOfLines={numberOfLines} style={[s.body, style]}>{children}</Text>;
export const Sub = ({ children, style, numberOfLines }: TProps) => <Text numberOfLines={numberOfLines} style={[s.sub, style]}>{children}</Text>;
export const Label = ({ children, style }: TProps) => <Text style={[s.label, style]}>{children}</Text>;
export const Amount = ({ children, style, size = 20 }: TProps & { size?: number }) => (
  <Text numberOfLines={1} style={[s.amount, { fontSize: size }, style]}>{children}</Text>
);

// ---- layout -----------------------------------------------------------------------------

/** A tab or flow screen: safe area, optional header, scrolling body with pull to refresh. */
export function Screen({ header, children, refreshing, onRefresh, footer, padBottom = 120, scroll = true }: {
  header?: ReactNode; children: ReactNode; refreshing?: boolean; onRefresh?: () => void; footer?: ReactNode; padBottom?: number; scroll?: boolean;
}) {
  return (
    <SafeAreaView edges={["top"]} style={s.screen}>
      {header}
      {scroll ? (
        <ScrollView
          contentContainerStyle={[s.body_, { paddingBottom: padBottom }]}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined}
        >
          {children}
        </ScrollView>
      ) : <View style={[s.body_, { flex: 1 }]}>{children}</View>}
      {footer}
    </SafeAreaView>
  );
}

export function Row({ children, style, gap = 12 }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: "row", alignItems: "center", gap }, style]}>{children}</View>;
}
export function Stack({ children, style, gap = 10 }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ gap }, style]}>{children}</View>;
}
export function Card({ children, style, onPress, label }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; label?: string }) {
  if (!onPress) return <View style={[s.card, style]}>{children}</View>;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [s.card, style, pressed && { opacity: 0.8 }]}>{children}</Pressable>;
}

/** A sticky footer for flows: one main action at the foot of the screen. */
export function Footer({ children }: { children: ReactNode }) {
  const inset = useSafeAreaInsets();
  return <View style={[s.footer, { paddingBottom: Math.max(16, inset.bottom + 8) }]}>{children}</View>;
}

// ---- controls ---------------------------------------------------------------------------

type BtnKind = "primary" | "dark" | "ghost" | "line" | "white";
export function Button({ title, onPress, kind = "primary", small, icon, disabled, busy, style, label }: {
  title: string; onPress?: () => void; kind?: BtnKind; small?: boolean; icon?: IconName; disabled?: boolean; busy?: boolean; style?: StyleProp<ViewStyle>; label?: string;
}) {
  const bg = { primary: color.violet, dark: color.ink, ghost: color.chip, line: "transparent", white: "#FFFFFF" }[kind];
  const fg = kind === "dark" ? "#FFFFFF" : color.ink;
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={label ?? title} accessibilityState={{ disabled: !!disabled || !!busy }}
      disabled={disabled || busy} onPress={onPress}
      style={({ pressed }) => [s.btn, small && s.btnSm, { backgroundColor: bg }, kind === "line" && { borderWidth: 1.5, borderColor: color.line }, (disabled || busy) && { opacity: 0.45 }, pressed && { opacity: 0.8 }, style]}
    >
      {busy ? <ActivityIndicator color={fg} /> : icon ? <Icon name={icon} size={small ? 16 : 18} stroke={fg} width={2.4} /> : null}
      <Text style={[s.btnText, small && { fontSize: 14 }, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function IconButton({ name, onPress, label, dark, badge }: { name: IconName; onPress?: () => void; label: string; dark?: boolean; badge?: number }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [s.iconBtn, dark && { backgroundColor: color.ink }, pressed && { opacity: 0.7 }]}>
      <Icon name={name} stroke={dark ? color.violet : color.ink} />
      {badge ? <View style={s.badge}><Text style={s.badgeText}>{badge}</Text></View> : null}
    </Pressable>
  );
}

export function Chip({ title, on, onPress, count, small }: { title: string; on?: boolean; onPress?: () => void; count?: number; small?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!on }} onPress={onPress}
      style={({ pressed }) => [s.chip, small && { minHeight: 32, paddingHorizontal: 12 }, on && { backgroundColor: color.ink, borderColor: color.ink }, pressed && { opacity: 0.75 }]}>
      <Text style={[s.chipText, small && { fontSize: 13 }, on && { color: "#FFFFFF" }]}>{title}{count != null ? <Text style={{ opacity: 0.7, fontSize: 12 }}>  {count}</Text> : null}</Text>
    </Pressable>
  );
}

export function Chips({ children }: { children: ReactNode }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>{children}</ScrollView>;
}

export function Tag({ title, kind = "plain" }: { title: string; kind?: Tone }) {
  return <View style={[s.tag, { backgroundColor: tones[kind].bg }]}><Text style={[s.tagText, { color: tones[kind].fg }]}>{title}</Text></View>;
}

/** A segmented control. */
export function Seg<K extends string>({ options, value, onChange, dark }: { options: [K, string][]; value: K; onChange: (k: K) => void; dark?: boolean }) {
  return (
    <View accessibilityRole="tablist" style={[s.seg, dark && { backgroundColor: "rgba(255,255,255,0.1)" }]}>
      {options.map(([k, l]) => {
        const on = k === value;
        return (
          <Pressable key={k} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => onChange(k)}
            style={[s.segBtn, on && { backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } }]}>
            <Text style={[s.segText, dark && !on && { color: "rgba(255,255,255,0.75)" }]}>{l}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Field(props: TextInputProps & { label?: string; error?: string | null }) {
  const { label, error, style, ...rest } = props;
  return (
    <View style={{ gap: 6 }}>
      {label ? <Label>{label}</Label> : null}
      <TextInput placeholderTextColor={color.faint} accessibilityLabel={label ?? rest.placeholder} {...rest} style={[s.input, error ? { borderColor: color.red } : null, style]} />
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
}

/** Progress: a solid part, an optional lighter part after it. */
export function Bar({ a, b = 0, colorA, colorB, track = color.chip, height = 8 }: { a: number; b?: number; colorA: string; colorB?: string; track?: string; height?: number }) {
  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  return (
    <View style={{ flexDirection: "row", height, borderRadius: 99, overflow: "hidden", backgroundColor: track, gap: 2 }}>
      <View style={{ width: `${clamp(a)}%`, backgroundColor: colorA }} />
      {b > 0 ? <View style={{ width: `${clamp(b)}%`, backgroundColor: colorB }} /> : null}
    </View>
  );
}

export function Loading() {
  return <View style={{ paddingVertical: 48, alignItems: "center" }}><ActivityIndicator color={color.violetInk} /></View>;
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card style={{ gap: 10 }}>
      <H3>Couldn’t load this</H3>
      <Sub>{message}</Sub>
      {onRetry ? <Button title="Try again" kind="ghost" small onPress={onRetry} style={{ alignSelf: "flex-start" }} /> : null}
    </Card>
  );
}

// ---- sheets -----------------------------------------------------------------------------

export function Sheet({ open, onClose, title, sub, children }: { open: boolean; onClose: () => void; title: string; sub?: string; children: ReactNode }) {
  const inset = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <Pressable accessibilityLabel="Close" style={{ flex: 1, backgroundColor: color.scrim }} onPress={onClose} />
        <View style={[s.sheet, { paddingBottom: Math.max(24, inset.bottom + 12) }]} accessibilityViewIsModal>
          <View style={s.grab} />
          <Row>
            <View style={{ flex: 1 }}>
              <H2>{title}</H2>
              {sub ? <Sub>{sub}</Sub> : null}
            </View>
            <IconButton name="close" label="Close" onPress={onClose} />
          </Row>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ---- toasts -----------------------------------------------------------------------------

const ToastCtx = createContext<(text: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [text, setText] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inset = useSafeAreaInsets();
  const show = useCallback((t: string) => {
    setText(t);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setText(null), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {text ? (
        <View pointerEvents="none" style={[s.toastWrap, { bottom: 104 + inset.bottom / 2 }]}>
          <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={s.toast}>
            <View style={s.tick}><Icon name="check" size={14} width={3} /></View>
            <Text style={s.toastText}>{text}</Text>
          </View>
        </View>
      ) : null}
    </ToastCtx.Provider>
  );
}

const s = StyleSheet.create({
  h1: { fontFamily: font.head, fontSize: 30, letterSpacing: -1, color: color.ink },
  h2: { fontFamily: font.head, fontSize: 19, letterSpacing: -0.4, color: color.ink },
  h3: { fontFamily: font.bold, fontSize: 16, color: color.ink },
  body: { fontFamily: font.body, fontSize: 15, color: color.ink, lineHeight: 21 },
  sub: { fontFamily: font.body, fontSize: 13, color: color.muted, lineHeight: 18 },
  label: { fontFamily: font.semi, fontSize: 13, color: color.ink2 },
  amount: { fontFamily: font.head, color: color.ink, letterSpacing: -0.6, fontVariant: ["tabular-nums"] },
  screen: { flex: 1, backgroundColor: color.bg },
  body_: { paddingHorizontal: 16, paddingTop: 4, gap: 20 },
  card: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.line, borderRadius: radius.card, padding: 16 },
  footer: { paddingHorizontal: 16, paddingTop: 14, backgroundColor: color.surface, borderTopWidth: 1, borderTopColor: color.line, gap: 8 },
  btn: { minHeight: 52, paddingHorizontal: 22, borderRadius: radius.pill, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  btnSm: { minHeight: 40, paddingHorizontal: 16 },
  btnText: { fontFamily: font.bold, fontSize: 16 },
  iconBtn: { width: 44, height: 44, borderRadius: 99, backgroundColor: color.chip, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: 2, right: 0, minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 99, backgroundColor: color.orange, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: color.bg },
  badgeText: { fontFamily: font.bold, fontSize: 11, color: "#FFFFFF" },
  chip: { minHeight: 36, paddingHorizontal: 14, borderRadius: 99, borderWidth: 1, borderColor: color.line, backgroundColor: color.surface, justifyContent: "center" },
  chipText: { fontFamily: font.semi, fontSize: 14, color: color.ink },
  tag: { paddingHorizontal: 9, paddingVertical: 2, borderRadius: 99, alignSelf: "flex-start" },
  tagText: { fontFamily: font.bold, fontSize: 12 },
  seg: { flexDirection: "row", padding: 4, borderRadius: 99, backgroundColor: color.chip, gap: 2 },
  segBtn: { flex: 1, minHeight: 38, borderRadius: 99, alignItems: "center", justifyContent: "center" },
  segText: { fontFamily: font.semi, fontSize: 14, color: color.ink },
  input: { minHeight: 52, paddingHorizontal: 16, borderRadius: radius.field, borderWidth: 1.5, borderColor: color.line, backgroundColor: color.surface, fontFamily: font.body, fontSize: 16, color: color.ink },
  error: { fontFamily: font.semi, fontSize: 13, color: color.red },
  sheet: { backgroundColor: color.surface, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, padding: 16, paddingTop: 10, gap: 14, maxHeight: "88%" },
  grab: { alignSelf: "center", width: 40, height: 5, borderRadius: 99, backgroundColor: color.line },
  toastWrap: { position: "absolute", left: 0, right: 0, alignItems: "center", paddingHorizontal: 16 },
  toast: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingLeft: 14, paddingRight: 20, borderRadius: 99, backgroundColor: color.ink, maxWidth: "100%" },
  tick: { width: 24, height: 24, borderRadius: 99, backgroundColor: color.violet, alignItems: "center", justifyContent: "center" },
  toastText: { fontFamily: font.semi, fontSize: 14, color: "#FFFFFF", flexShrink: 1 },
});
