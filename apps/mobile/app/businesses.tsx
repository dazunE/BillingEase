import { Text, View } from "react-native";
import { Icon } from "@/components/Icon";
import { Body, Button, Card, H1, Row, Screen, Sub } from "@/components/ui";
import { useSession } from "@/lib/session";
import { color, font } from "@/theme";

const COUNTRY = { uk: "United Kingdom", lk: "Sri Lanka", us: "United States" } as const;
const ROLE = { owner: "Owner", accountant: "Accountant", admin: "Office admin" } as const;

/** Signed in to several businesses: pick the one to work in. */
export default function Businesses() {
  const { me, pickBusiness, signOut, business } = useSession();
  const list = me?.businesses ?? [];
  return (
    <Screen padBottom={40}>
      <View style={{ gap: 6, paddingTop: 16 }}>
        <H1>Which business?</H1>
        <Sub>You can switch any time from Home.</Sub>
      </View>
      {list.length === 0 ? (
        <Card style={{ gap: 8 }}>
          <Body>There’s no business on this account yet. Set one up on the web, then come back.</Body>
        </Card>
      ) : null}
      <View style={{ gap: 10 }}>
        {list.map((b) => (
          <Card key={b.id} onPress={() => pickBusiness(b.id)} label={`Work in ${b.name}`}>
            <Row>
              <View style={{ width: 44, height: 44, borderRadius: 99, backgroundColor: color.ink, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontFamily: font.bold, color: color.violet }}>{b.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: font.bold, fontSize: 16, color: color.ink }}>{b.name}</Text>
                <Sub>{COUNTRY[b.country]} · {ROLE[b.role]}</Sub>
              </View>
              {business?.id === b.id ? <Icon name="check" stroke={color.violetInk} width={2.6} /> : <Icon name="chev" stroke={color.faint} />}
            </Row>
          </Card>
        ))}
      </View>
      <Button title="Sign out" kind="line" onPress={signOut} />
    </Screen>
  );
}
