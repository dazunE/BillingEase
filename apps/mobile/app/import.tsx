import type { Statement } from "@billingease/contracts";
import { useQuery } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { Button, Card, Chip, Chips, Footer, H1, IconButton, Loading, Row, Sub, Tag, useToast } from "@/components/ui";
import { problem } from "@/lib/api";
import { shortDate } from "@/lib/dates";
import { money } from "@/lib/money";
import { useOutSetup, useProposals, useRefreshAll } from "@/lib/queries";
import { useSession } from "@/lib/session";
import { color, font, type Tone } from "@/theme";

type Filter = "all" | "check" | "matched" | "skipped";
const LINE: Record<string, [string, Tone]> = { matched: ["In your books", "ok"], proposed: ["To add", "ai"], unmatched: ["Not added", "warn"], ignored: ["Skipped", "plain"] };

/** A bank statement in: read, matched to the books, and the new lines added once you've checked them. */
export default function Import() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { api, send, business } = useSession();
  const toast = useToast();
  const refresh = useRefreshAll();
  const setup = useOutSetup();
  const proposals = useProposals();
  const [id, setId] = useState<string | null>(params.id ?? null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [off, setOff] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState(false);
  const cur = setup.data?.currency ?? "GBP";

  const recent = useQuery({ queryKey: [business?.id, "statements"], queryFn: () => api("statements"), enabled: !id });
  const st = useQuery({
    queryKey: [business?.id, "statement", id], queryFn: () => api("statement", { params: { id: id! } }), enabled: !!id,
    // Ask again every two seconds while it's still being read and matched.
    refetchInterval: (q) => (q.state.data && ["queued", "reading", "matching"].includes(q.state.data.statement.status) ? 2000 : false),
  });
  const s = st.data?.statement;
  const lines = st.data?.lines ?? [];
  useEffect(() => { if (s?.status === "done") { refresh(); } }, [s?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function pick() {
    setError(null);
    const r = await DocumentPicker.getDocumentAsync({ type: ["text/csv", "text/comma-separated-values", "application/pdf", "text/plain", "*/*"], copyToCacheDirectory: true });
    if (r.canceled || !r.assets[0]) return;
    const a = r.assets[0];
    setSending(true);
    try {
      const made = await send("uploadStatement", { uri: a.uri, name: a.name, type: a.mimeType ?? (a.name.endsWith(".pdf") ? "application/pdf" : "text/csv") });
      setId(made.id);
    } catch (e) { setError(problem(e)); } finally { setSending(false); }
  }

  const byId = useMemo(() => new Map((proposals.data?.proposals ?? []).map((p) => [p.id, p])), [proposals.data]);
  const waiting = lines.filter((l) => l.status === "proposed" && l.proposalStatus === "pending" && l.proposalId);
  const chosen = waiting.filter((l) => !off[l.id]);
  const shown = lines.filter((l) => filter === "all" || (filter === "check" ? l.status === "proposed" && l.proposalStatus === "pending" : filter === "matched" ? l.status === "matched" || (l.status === "proposed" && l.proposalStatus === "applied") : l.status === "ignored" || l.status === "unmatched"));

  async function addChosen() {
    setAdding(true);
    try {
      const r = await api("approveMany", { body: { ids: chosen.map((l) => l.proposalId!) } });
      refresh(); await st.refetch(); setOff({});
      toast(r.failed.length ? `${r.approved} added, ${r.failed.length} need a look` : `${r.approved} line${r.approved === 1 ? "" : "s"} added to your books`);
      if (r.failed.length) setError(r.failed.map((f) => `${f.title}: ${f.message}`).join("\n"));
    } catch (e) { setError(problem(e)); } finally { setAdding(false); }
  }

  const reading = s && ["queued", "reading", "matching"].includes(s.status);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.bg }}>
      <Row style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <IconButton name={id && !params.id ? "back" : "close"} label={id && !params.id ? "Back" : "Close"} onPress={() => (id && !params.id ? setId(null) : router.back())} />
        <Text style={st_.title}>Import a statement</Text>
        <View style={{ width: 44 }} />
      </Row>

      {!id ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 18 }}>
          <View style={{ gap: 6 }}>
            <H1 style={{ fontSize: 26 }}>Bring in a month in one go</H1>
            <Sub style={{ fontSize: 15 }}>Any bank’s CSV or PDF statement. Payments are matched to your invoices and bills, the rest get a category, and anything already in your books is skipped. Nothing is added until you say so.</Sub>
          </View>
          <Button title={sending ? "Sending…" : "Choose a statement"} icon="invoice" onPress={pick} busy={sending} />
          <Card style={{ backgroundColor: color.violetTint, borderColor: color.violetTint, gap: 6 }}>
            <Text style={st_.tipTitle}>From your banking app</Text>
            <Sub style={{ color: color.ink2 }}>Export a statement as CSV or PDF, save it to Files, then choose it here.</Sub>
          </Card>
          {error ? <Text style={st_.err}>{error}</Text> : null}
          {recent.data?.statements.length ? (
            <View style={{ gap: 8 }}>
              <Text style={st_.label}>Earlier statements</Text>
              <Card style={{ paddingVertical: 4 }}>
                {recent.data.statements.slice(0, 6).map((x, i, all) => (
                  <Pressable key={x.id} accessibilityRole="button" onPress={() => setId(x.id)} style={[st_.row, i === all.length - 1 && { borderBottomWidth: 0 }]}>
                    <Icon name="invoice" size={18} />
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={st_.name}>{x.filename}</Text>
                      <Sub>{x.periodFrom && x.periodTo ? `${shortDate(x.periodFrom)} – ${shortDate(x.periodTo)} · ` : ""}{x.lineCount} lines{x.counts.waiting ? ` · ${x.counts.waiting} to check` : ""}</Sub>
                    </View>
                    <Icon name="chev" stroke={color.faint} />
                  </Pressable>
                ))}
              </Card>
            </View>
          ) : null}
        </ScrollView>
      ) : !s ? <Loading /> : reading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 24 }}>
          <ActivityIndicator color={color.violetInk} />
          <H1 style={{ fontSize: 22, textAlign: "center" }}>{s.filename}</H1>
          <Sub style={{ textAlign: "center" }}>{s.status === "matching" ? "Matching to your invoices and bills…" : "Reading the lines…"}</Sub>
          <Button title="Close and keep going" kind="ghost" small onPress={() => router.back()} />
        </View>
      ) : s.status === "failed" ? (
        <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 14 }}>
          <H1 style={{ fontSize: 22 }}>We couldn’t read that statement</H1>
          <Sub>{s.error ?? "Try exporting it again as a CSV."}</Sub>
          <Button title="Try again" onPress={async () => { try { await api("retryStatement", { params: { id: s.id } }); st.refetch(); } catch (e) { setError(problem(e)); } }} />
          <Button title="Choose another file" kind="ghost" onPress={() => setId(null)} />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 30 }}>
            <View style={{ gap: 4 }}>
              <Sub style={{ fontFamily: font.semi }}>{s.filename}</Sub>
              <H1 style={{ fontSize: 22 }}>{summaryLine(s)}</H1>
              {s.balanceProblems ? <Tag title={`${s.balanceProblems} balance${s.balanceProblems === 1 ? "" : "s"} don’t add up: check the file is complete`} kind="warn" /> : null}
            </View>
            <Chips>
              {([["all", "All", lines.length], ["check", "To add", waiting.length], ["matched", "In your books", s.counts.matched], ["skipped", "Not added", s.counts.ignored + s.counts.unmatched]] as const).map(([k, l, n]) => (
                <Chip key={k} title={l} count={n} on={filter === k} onPress={() => setFilter(k)} />
              ))}
            </Chips>
            <Card style={{ paddingVertical: 4 }}>
              {shown.length === 0 ? <Sub style={{ textAlign: "center", paddingVertical: 16 }}>Nothing here.</Sub> : null}
              {shown.map((l, i) => {
                const p = l.proposalId ? byId.get(l.proposalId) : undefined;
                const pending = l.status === "proposed" && l.proposalStatus === "pending";
                const added = l.status === "proposed" && l.proposalStatus === "applied";
                const [word, tone] = added ? (["Added", "ok"] as [string, Tone]) : l.status === "proposed" && l.proposalStatus === "rejected" ? (["Turned down", "plain"] as [string, Tone]) : LINE[l.status];
                const on = pending && !off[l.id];
                return (
                  <Pressable key={l.id} accessibilityRole={pending ? "checkbox" : undefined} accessibilityState={pending ? { checked: on } : undefined}
                    disabled={!pending} onPress={() => setOff((o) => ({ ...o, [l.id]: !o[l.id] }))} style={[st_.line, i === shown.length - 1 && { borderBottomWidth: 0 }]}>
                    {pending ? <View style={[st_.box, on && { backgroundColor: color.violetInk, borderColor: color.violetInk }]}>{on ? <Icon name="check" size={14} stroke="#FFFFFF" width={3.4} /> : null}</View> : <View style={{ width: 26 }} />}
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text numberOfLines={1} style={st_.name}>{p?.title.split(" · ")[0] ?? l.description}</Text>
                      <Row gap={6} style={{ flexWrap: "wrap" }}>
                        <Tag title={word} kind={tone} />
                        <Sub numberOfLines={1} style={{ flexShrink: 1 }}>{shortDate(l.date)}{p ? ` · ${p.summary}` : l.note ? ` · ${l.note}` : ""}</Sub>
                      </Row>
                    </View>
                    <Text style={[st_.amt, { color: l.amount > 0 ? color.violetInk : color.ink }]}>{l.amount > 0 ? "+" : "−"}{money(Math.abs(l.amount), cur)}</Text>
                  </Pressable>
                );
              })}
            </Card>
            {error ? <Text style={st_.err}>{error}</Text> : null}
          </ScrollView>
          {waiting.length ? (
            <Footer>
              <Button title={`Add ${chosen.length} to your books`} onPress={addChosen} busy={adding} disabled={!chosen.length} />
              <Sub style={{ textAlign: "center" }}>Untick anything that isn’t a business cost. Change one first from Inbox → To check.</Sub>
            </Footer>
          ) : (
            <Footer><Button title="Done" kind="ghost" onPress={() => router.back()} /></Footer>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

function summaryLine(s: Statement) {
  const parts = [`${s.lineCount} lines`];
  if (s.counts.waiting) parts.push(`${s.counts.waiting} to add`);
  if (s.counts.matched) parts.push(`${s.counts.matched} already in your books`);
  return parts.join(" · ");
}

const st_ = StyleSheet.create({
  title: { flex: 1, textAlign: "center", fontFamily: font.bold, fontSize: 16, color: color.ink },
  tipTitle: { fontFamily: font.bold, fontSize: 15, color: color.ink },
  label: { fontFamily: font.semi, fontSize: 13, color: color.ink2 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 60, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: color.line },
  line: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: color.line },
  box: { width: 26, height: 26, marginTop: 2, borderRadius: 8, borderWidth: 2, borderColor: "#CBC7D3", alignItems: "center", justifyContent: "center" },
  name: { fontFamily: font.semi, fontSize: 15, color: color.ink },
  amt: { fontFamily: font.bold, fontSize: 14.5, fontVariant: ["tabular-nums"] },
  err: { fontFamily: font.semi, fontSize: 14, color: color.red },
});
