import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/Icon";
import { Button, Card, IconButton, Row, Screen, Sub, Tag } from "@/components/ui";
import { ago } from "@/lib/dates";
import { useOffline } from "@/lib/offline";
import { color, font } from "@/theme";

/** What's waiting on this phone to be saved, and anything the server turned down. */
export default function OutboxScreen() {
  const router = useRouter();
  const o = useOffline();
  const all = [...o.failed, ...o.waiting];
  return (
    <Screen padBottom={40} header={
      <Row style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10 }}>
        <IconButton name="back" label="Back" onPress={() => router.back()} />
        <Text style={s.title}>Saved on this phone</Text>
        <View style={{ width: 44 }} />
      </Row>
    }>
      <Sub>{o.online ? "Changes you made without signal are sent to BillingEase in the order you made them." : "There’s no signal. What you record is kept here and sent, in order, when there is."}</Sub>
      {all.length === 0 ? (
        <Card><Row><View style={[s.ic, { backgroundColor: color.greenTint }]}><Icon name="check" stroke={color.green} width={2.4} /></View><Text style={s.name}>Everything is saved</Text></Row></Card>
      ) : (
        <Card style={{ paddingVertical: 4 }}>
          {all.map((i, n) => (
            <View key={i.id} style={[s.row, n === all.length - 1 && { borderBottomWidth: 0 }]}>
              <Row style={{ alignItems: "flex-start" }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={s.name}>{i.label}</Text>
                  <Row gap={6}><Tag title={i.error ? "Not saved" : "Waiting"} kind={i.error ? "late" : "plain"} /><Sub>{ago(i.at)}</Sub></Row>
                  {i.error ? <Sub style={{ color: color.red }}>{i.error}</Sub> : null}
                </View>
              </Row>
              {i.error ? (
                <Row gap={8}>
                  <Button title="Try again" small onPress={() => o.retry(i.id)} />
                  <Button title="Don’t save it" small kind="ghost" onPress={() => o.discard(i.id)} />
                </Row>
              ) : null}
            </View>
          ))}
        </Card>
      )}
      {o.online && o.waiting.length ? <Button title={o.syncing ? "Saving…" : "Save now"} busy={o.syncing} onPress={() => o.syncNow()} /> : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { flex: 1, textAlign: "center", fontFamily: font.bold, fontSize: 16, color: color.ink },
  row: { paddingVertical: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: color.line },
  ic: { width: 40, height: 40, borderRadius: 99, alignItems: "center", justifyContent: "center" },
  name: { fontFamily: font.semi, fontSize: 15, color: color.ink },
});
