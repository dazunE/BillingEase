import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button, Card, ErrorNote, H1, Loading, Row, Screen, Sub } from "@/components/ui";
import { problem } from "@/lib/api";
import { ago } from "@/lib/dates";
import { phoneRoute } from "@/lib/links";
import { useNotifications, useWrite } from "@/lib/queries";
import { useSession } from "@/lib/session";
import { color, font } from "@/theme";

export default function Inbox() {
  const router = useRouter();
  const { api } = useSession();
  const q = useNotifications();
  const read = useWrite((id: string) => api("markRead", { params: { id }, body: { read: true } }));
  const readAll = useWrite(() => api("markAllRead", {}));
  const items = q.data?.items ?? [];
  return (
    <Screen
      refreshing={q.isRefetching} onRefresh={() => q.refetch()}
      header={
        <Row style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10, justifyContent: "space-between" }}>
          <H1>Inbox</H1>
          {q.data?.unread ? <Button title="Mark all read" small kind="ghost" busy={readAll.isPending} onPress={() => readAll.mutate(undefined)} /> : null}
        </Row>
      }
    >
      {q.isLoading ? <Loading /> : q.error ? <ErrorNote message={problem(q.error)} onRetry={() => q.refetch()} /> : (
        <Card style={{ paddingVertical: 4 }}>
          {items.length === 0 ? <Sub style={{ textAlign: "center", paddingVertical: 18 }}>No updates yet. Payments, requests from your accountant and due dates show up here.</Sub> : null}
          {items.map((n, i) => (
            <Pressable key={n.id} accessibilityRole="button" accessibilityLabel={`${n.read ? "" : "New: "}${n.title}`}
              onPress={() => { if (!n.read) read.mutate(n.id); const to = phoneRoute(n.link); if (to) router.push(to as never); }}
              style={[s.row, i === items.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={[s.dot, { backgroundColor: n.read ? "transparent" : color.orange }]} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[s.title, !n.read && { fontFamily: font.bold }]}>{n.title}</Text>
                {n.body ? <Sub>{n.body}</Sub> : null}
                <Text style={s.when}>{ago(n.createdAt)}</Text>
              </View>
            </Pressable>
          ))}
        </Card>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: color.line },
  dot: { width: 8, height: 8, borderRadius: 99, marginTop: 7 },
  title: { fontFamily: font.medium, fontSize: 15, color: color.ink },
  when: { fontFamily: font.body, fontSize: 12, color: color.faint },
});
