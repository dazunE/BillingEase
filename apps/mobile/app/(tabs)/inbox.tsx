import type { Proposal } from "@billingease/contracts";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/Icon";
import { Button, Card, ErrorNote, H1, Loading, Row, Screen, Seg, Sub, Tag, useToast } from "@/components/ui";
import { problem } from "@/lib/api";
import { ago } from "@/lib/dates";
import { phoneRoute } from "@/lib/links";
import { useNotifications, useProposals, useWrite } from "@/lib/queries";
import { useSession } from "@/lib/session";
import { color, font } from "@/theme";

/** What approving each kind of draft does, in words. */
const APPROVE: Record<Proposal["kind"], string> = {
  "expense.create": "Check it", "bill.create": "Add the bill", "receipt.create": "Record payment",
  "bill_payment.create": "Mark bill paid", "invoice.remind": "Send reminder",
};

export default function Inbox() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { api } = useSession();
  const toast = useToast();
  const notes = useNotifications();
  const checks = useProposals();
  const pending = checks.data?.proposals ?? [];
  const [tab, setTab] = useState<"check" | "updates">(params.tab === "updates" || (!params.tab && checks.data && pending.length === 0) ? "updates" : "check");
  const read = useWrite((id: string) => api("markRead", { params: { id }, body: { read: true } }));
  const readAll = useWrite(() => api("markAllRead", {}));
  const approve = useWrite((id: string) => api("approve", { params: { id }, body: {} }));
  const reject = useWrite((id: string) => api("reject", { params: { id }, body: {} }));
  const items = notes.data?.items ?? [];
  const unread = notes.data?.unread ?? 0;

  async function quickApprove(p: Proposal) {
    if (p.kind === "expense.create") { router.push(`/check?id=${p.id}`); return; }
    try {
      const r = await approve.mutateAsync(p.id);
      toast(r.status === "failed" ? r.error ?? "That didn’t go through" : r.result?.emailed ? "Reminder emailed" : "Done");
    } catch (e) { toast(problem(e)); }
  }

  return (
    <Screen
      refreshing={notes.isRefetching || checks.isRefetching} onRefresh={() => { notes.refetch(); checks.refetch(); }}
      header={
        <Row style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10, justifyContent: "space-between" }}>
          <H1>Inbox</H1>
          {tab === "updates" && unread ? <Button title="Mark all read" small kind="ghost" busy={readAll.isPending} onPress={() => readAll.mutate(undefined)} /> : null}
        </Row>
      }
    >
      <Seg options={[["check", `To check${pending.length ? ` · ${pending.length}` : ""}`], ["updates", `Updates${unread ? ` · ${unread}` : ""}`]]} value={tab} onChange={setTab} />

      {tab === "check" ? (
        checks.isLoading ? <Loading /> : checks.error ? <ErrorNote message={problem(checks.error)} onRetry={() => checks.refetch()} /> : (
          <>
            <Sub>Receipts we read, statement lines we matched and reminders we drafted. Nothing happens until you say so.</Sub>
            {pending.length === 0 ? (
              <Card><Row><View style={[s.ic, { backgroundColor: color.greenTint }]}><Icon name="check" stroke={color.green} width={2.4} /></View><View style={{ flex: 1 }}><Text style={s.title}>You’ve checked everything</Text><Sub>Scan a receipt and it’ll show up here to check.</Sub></View></Row></Card>
            ) : pending.map((p) => (
              <Card key={p.id} style={{ gap: 12 }}>
                <Row style={{ alignItems: "flex-start" }}>
                  <View style={[s.ic, { backgroundColor: color.violetTint }]}><Icon name={p.kind === "invoice.remind" ? "mail" : p.kind.startsWith("expense") ? "expense" : p.kind.startsWith("bill") ? "bill" : "in"} /></View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Row gap={6} style={{ flexWrap: "wrap" }}>
                      <Tag title={p.agentName} kind="ai" />
                      {p.confidence != null && p.confidence < 60 ? <Tag title="Check carefully" kind="warn" /> : null}
                    </Row>
                    <Text style={s.title}>{p.title}</Text>
                    <Sub numberOfLines={3}>{p.summary}</Sub>
                  </View>
                </Row>
                <Row gap={8}>
                  <Button title={APPROVE[p.kind]} small busy={approve.isPending && approve.variables === p.id} onPress={() => quickApprove(p)} />
                  <Button title="Turn down" small kind="ghost" busy={reject.isPending && reject.variables === p.id}
                    onPress={async () => { try { await reject.mutateAsync(p.id); toast("Turned down"); } catch (e) { toast(problem(e)); } }} />
                </Row>
              </Card>
            ))}
          </>
        )
      ) : notes.isLoading ? <Loading /> : notes.error ? <ErrorNote message={problem(notes.error)} onRetry={() => notes.refetch()} /> : (
        <Card style={{ paddingVertical: 4 }}>
          {items.length === 0 ? <Sub style={{ textAlign: "center", paddingVertical: 18 }}>No updates yet. Payments, requests from your accountant and due dates show up here.</Sub> : null}
          {items.map((n, i) => (
            <Pressable key={n.id} accessibilityRole="button" accessibilityLabel={`${n.read ? "" : "New: "}${n.title}`}
              onPress={() => { if (!n.read) read.mutate(n.id); const to = phoneRoute(n.link); if (to) router.push(to as never); }}
              style={[s.row, i === items.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={[s.dot, { backgroundColor: n.read ? "transparent" : color.orange }]} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[s.note, !n.read && { fontFamily: font.bold }]}>{n.title}</Text>
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
  ic: { width: 40, height: 40, borderRadius: 99, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: font.bold, fontSize: 15.5, color: color.ink },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: color.line },
  dot: { width: 8, height: 8, borderRadius: 99, marginTop: 7 },
  note: { fontFamily: font.medium, fontSize: 15, color: color.ink },
  when: { fontFamily: font.body, fontSize: 12, color: color.faint },
});
