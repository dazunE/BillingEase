import { useRouter } from "expo-router";
import { Linking, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { Icon } from "@/components/Icon";
import { Button, Card, IconButton, Label, Row, Screen, Sub } from "@/components/ui";
import { API_URL } from "@/lib/api";
import { useSession } from "@/lib/session";
import { color, font } from "@/theme";

const COUNTRY = { uk: "United Kingdom", lk: "Sri Lanka", us: "United States" } as const;

export default function Me() {
  const router = useRouter();
  const { me, business, pickBusiness, faceId, setFaceId, signOut, push } = useSession();
  return (
    <Screen padBottom={40} header={
      <Row style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10 }}>
        <IconButton name="back" label="Back" onPress={() => router.back()} />
        <Text style={s.title}>You and your business</Text>
        <View style={{ width: 44 }} />
      </Row>
    }>
      <View style={{ gap: 10 }}>
        <Label>Business</Label>
        <Card style={{ paddingVertical: 4 }}>
          {(me?.businesses ?? []).map((b, i, all) => (
            <Pressable key={b.id} accessibilityRole="button" accessibilityState={{ selected: b.id === business?.id }}
              onPress={async () => { if (b.id !== business?.id) { await pickBusiness(b.id); router.replace("/(tabs)"); } }}
              style={[s.row, i === all.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{b.name}</Text>
                <Sub>{COUNTRY[b.country]}</Sub>
              </View>
              {b.id === business?.id ? <Icon name="check" stroke={color.violetInk} width={2.6} /> : null}
            </Pressable>
          ))}
        </Card>
      </View>

      <View style={{ gap: 10 }}>
        <Label>Security</Label>
        <Card style={{ paddingVertical: 4 }}>
          <View style={[s.row, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{faceId.label}</Text>
              <Sub>{faceId.available ? "To open the app, and before you mark money as paid out" : `${faceId.label} isn’t set up on this phone`}</Sub>
            </View>
            <Switch accessibilityLabel={faceId.label} value={faceId.on} disabled={!faceId.available} onValueChange={setFaceId}
              trackColor={{ true: color.violetInk, false: "#CBC7D3" }} thumbColor="#FFFFFF" />
          </View>
        </Card>
      </View>

      <Card onPress={() => router.push("/notifications")} label="Notifications">
        <Row>
          <Icon name="bell" />
          <View style={{ flex: 1 }}>
            <Text style={s.name}>Notifications</Text>
            <Sub>{push.on ? `On · ${push.kinds.length} kinds` : "Off on this phone"}</Sub>
          </View>
          <Icon name="chev" stroke={color.faint} />
        </Row>
      </Card>

      <Card onPress={() => Linking.openURL(API_URL.replace(/\/app-api$/, "") + "/app")} label="Open BillingEase on the web">
        <Row>
          <Icon name="web" />
          <View style={{ flex: 1 }}>
            <Text style={s.name}>Open BillingEase on the web</Text>
            <Sub>Reports, tax returns, payroll, branding, people and access</Sub>
          </View>
          <Icon name="chev" stroke={color.faint} />
        </Row>
      </Card>

      <View style={{ gap: 6 }}>
        <Sub style={{ textAlign: "center" }}>Signed in as {me?.user.email}</Sub>
        <Button title="Sign out of this phone" kind="line" onPress={signOut} />
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { flex: 1, textAlign: "center", fontFamily: font.bold, fontSize: 16, color: color.ink },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 60, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: color.line },
  name: { fontFamily: font.semi, fontSize: 15, color: color.ink },
});
