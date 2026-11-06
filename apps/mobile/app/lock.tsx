import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon, Logo } from "@/components/Icon";
import { useSession } from "@/lib/session";
import { color, font } from "@/theme";

/** Locked: Face ID starts by itself; the phone's passcode is its fallback. */
export default function Lock() {
  const { unlock, business, me, faceId, signOut } = useSession();
  const [state, setState] = useState<"idle" | "asking" | "failed">("idle");
  const ask = useCallback(async () => {
    setState("asking");
    const ok = await unlock();
    if (!ok) setState("failed");
  }, [unlock]);
  useEffect(() => { ask(); }, [ask]);

  return (
    <SafeAreaView style={s.wrap}>
      <View style={{ alignItems: "center", gap: 12, marginTop: 60 }}>
        <Logo size={56} light />
        <Text style={s.biz}>{business?.name ?? "BillingEase"}</Text>
        <Text style={s.who}>{me?.user.name}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Unlock with ${faceId.label}`} onPress={ask} style={s.face}>
        <View style={s.faceBox}><Icon name="face" size={64} stroke="#FFFFFF" width={1.4} /></View>
        <Text style={s.faceText}>{state === "asking" ? "Looking for you…" : state === "failed" ? "Didn’t work. Tap to try again" : `Tap to unlock with ${faceId.label}`}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={signOut} style={{ padding: 12 }}>
        <Text style={s.out}>Sign out of this phone</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#0E0D12", alignItems: "center", justifyContent: "space-between", paddingBottom: 24 },
  biz: { fontFamily: font.head, fontSize: 22, color: "#FFFFFF", letterSpacing: -0.5 },
  who: { fontFamily: font.body, fontSize: 14, color: "rgba(255,255,255,0.65)" },
  face: { alignItems: "center", gap: 16 },
  faceBox: { width: 110, height: 110, borderRadius: 32, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  faceText: { fontFamily: font.semi, fontSize: 16, color: "#FFFFFF" },
  out: { fontFamily: font.semi, fontSize: 15, color: "rgba(255,255,255,0.8)" },
});
