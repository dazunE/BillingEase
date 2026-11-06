import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ExpenseForm, bodyFrom, draftFrom, type ExpenseDraft } from "@/components/ExpenseForm";
import { Button, Card, ErrorNote, Footer, H1, IconButton, Loading, Row, Sub, Tag, useToast } from "@/components/ui";
import { problem } from "@/lib/api";
import { useOutSetup, useProposal, useRefreshAll, useToday } from "@/lib/queries";
import { useSession } from "@/lib/session";
import { useOffline } from "@/lib/offline";
import { color, font } from "@/theme";

/** One draft an agent made: check it, change it if needed, then approve or turn it down. */
export default function Check() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useSession();
  const toast = useToast();
  const { write } = useOffline();
  const refresh = useRefreshAll();
  const setup = useOutSetup();
  const today = useToday();
  const q = useProposal(id ?? "");
  const p = q.data;
  const cur = setup.data?.currency ?? "GBP";
  const [draft, setDraft] = useState<ExpenseDraft | null>(null);
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (p?.kind === "expense.create" && !draft && setup.data) setDraft(draftFrom(p.payload, cur, today)); }, [p, draft, setup.data, cur, today]);

  const editable = p?.kind === "expense.create" && p.status === "pending";
  async function approve() {
    if (!p) return;
    setBusy("approve"); setError(null);
    try {
      const payload = editable && draft ? bodyFrom(draft, cur, !!setup.data?.vatRegistered) : undefined;
      if (editable && !payload) { setError("Add who you paid and the amount."); setBusy(null); return; }
      const r = await write("approve", { params: { id: p.id }, body: payload ? { payload: { ...p.payload, ...payload } } : {} }, `Approve: ${payload?.payee ?? p.title}`);
      refresh();
      if (!r.queued && r.result.status === "failed") { setError(r.result.error ?? "That didn’t go through."); setBusy(null); return; }
      toast(r.queued ? "Saved on this phone · added when you’re back online" : p.kind === "expense.create" ? `${payload?.payee ?? "Expense"} added to Going out` : "Approved");
      router.back();
    } catch (e) { setError(problem(e)); setBusy(null); }
  }
  async function reject() {
    if (!p) return;
    setBusy("reject");
    try { await write("reject", { params: { id: p.id }, body: {} }, `Turn down: ${p.title}`); refresh(); toast("Turned down"); router.back(); }
    catch (e) { setError(problem(e)); setBusy(null); }
  }

  const source = p?.sources[0];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.bg }}>
      <Row style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <IconButton name="close" label="Close" onPress={() => router.back()} />
        <Text style={s.title}>Check this</Text>
        <View style={{ width: 44 }} />
      </Row>
      {q.isLoading || (editable && !draft) ? <Loading /> : q.error ? <View style={{ padding: 16 }}><ErrorNote message={problem(q.error)} onRetry={() => q.refetch()} /></View> : p ? (
        <>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
            <View style={{ gap: 6 }}>
              <Row gap={6} style={{ flexWrap: "wrap" }}>
                <Tag title={`Drafted by ${p.agentName}`} kind="ai" />
                {p.confidence != null ? <Tag title={p.confidence >= 85 ? "Sure" : p.confidence >= 60 ? "Fairly sure" : "Check carefully"} kind={p.confidence >= 85 ? "ok" : "warn"} /> : null}
              </Row>
              <H1 style={{ fontSize: 24 }}>{p.title}</H1>
              <Sub>{p.summary}</Sub>
              {source ? <Sub>From {source.label}{source.page ? `, page ${source.page}` : ""}</Sub> : null}
            </View>
            {p.status !== "pending" ? <Card><Sub>Already {p.status === "applied" ? "approved" : p.status}. Nothing to do.</Sub></Card> : null}
            {editable && draft ? <ExpenseForm value={draft} onChange={setDraft} readDate={(p.payload as { spentOn?: string }).spentOn ?? null} /> : null}
            {error ? <Text style={s.err}>{error}</Text> : null}
          </ScrollView>
          {p.status === "pending" ? (
            <Footer>
              <Button title={p.kind === "expense.create" ? "Add to Going out" : p.kind === "invoice.remind" ? "Send the reminder" : "Approve"} onPress={approve} busy={busy === "approve"} disabled={!!busy} />
              <Button title="Turn it down" kind="ghost" small onPress={reject} busy={busy === "reject"} disabled={!!busy} />
            </Footer>
          ) : null}
        </>
      ) : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  title: { flex: 1, textAlign: "center", fontFamily: font.bold, fontSize: 16, color: color.ink },
  err: { fontFamily: font.semi, fontSize: 14, color: color.red },
});
