import type { PushKind } from "@billingease/contracts";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { Card, IconButton, Row, Screen, Sub, useToast } from "@/components/ui";
import { ALL_KINDS, KIND_LABELS, pushPossible } from "@/lib/push";
import { useSession } from "@/lib/session";
import { color, font } from "@/theme";

/** Which notifications this phone gets. */
export default function NotificationSettings() {
  const router = useRouter();
  const { push, setPush } = useSession();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const kinds = push.kinds.length ? push.kinds : ALL_KINDS;

  async function change(on: boolean, next: PushKind[]) {
    setBusy(true); setError(null);
    try { await setPush(on, next); if (on && !push.on) toast("Notifications are on"); }
    catch (e) { setError(e instanceof Error ? e.message : "That didn’t work. Try again."); }
    finally { setBusy(false); }
  }
  const toggle = (k: PushKind, on: boolean) => change(true, on ? [...kinds, k] : kinds.filter((x) => x !== k));

  return (
    <Screen padBottom={40} header={
      <Row style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10 }}>
        <IconButton name="back" label="Back" onPress={() => router.back()} />
        <Text style={s.title}>Notifications</Text>
        <View style={{ width: 44 }} />
      </Row>
    }>
      <Card style={{ paddingVertical: 4 }}>
        <Row style={[s.row, { borderBottomWidth: push.on ? 1 : 0 }]}>
          <View style={{ flex: 1 }}><Text style={s.name}>Notifications on this phone</Text><Sub>{pushPossible() ? "A few a week, never marketing." : "Only on a phone: not in a browser or simulator."}</Sub></View>
          <Switch accessibilityLabel="Notifications on this phone" value={push.on} disabled={busy || !pushPossible()} onValueChange={(on) => change(on, kinds)} trackColor={{ true: color.violetInk, false: "#CBC7D3" }} thumbColor="#FFFFFF" />
        </Row>
        {push.on ? ALL_KINDS.map((k, i) => (
          <Row key={k} style={[s.row, i === ALL_KINDS.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1 }}><Text style={s.name}>{KIND_LABELS[k][0]}</Text><Sub>{KIND_LABELS[k][1]}</Sub></View>
            <Switch accessibilityLabel={KIND_LABELS[k][0]} value={kinds.includes(k)} disabled={busy} onValueChange={(on) => toggle(k, on)} trackColor={{ true: color.violetInk, false: "#CBC7D3" }} thumbColor="#FFFFFF" />
          </Row>
        )) : null}
      </Card>
      {error ? <Text style={s.err}>{error}</Text> : null}
      <Sub>Everything still shows in Inbox, whatever you choose here.</Sub>
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { flex: 1, textAlign: "center", fontFamily: font.bold, fontSize: 16, color: color.ink },
  row: { minHeight: 64, paddingVertical: 10, gap: 12, borderBottomWidth: 1, borderBottomColor: color.line },
  name: { fontFamily: font.semi, fontSize: 15, color: color.ink },
  err: { fontFamily: font.semi, fontSize: 14, color: color.red },
});
