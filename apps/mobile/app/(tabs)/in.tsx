import type { InvoiceRow } from "@billingease/contracts";
import { currencyDigits, parseMoney } from "@billingease/core";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button, Card, Chip, Chips, ErrorNote, Field, H1, Label, Loading, Row, Screen, Sheet, Stack, Sub, Tag, useToast } from "@/components/ui";
import { problem } from "@/lib/api";
import { shortDate } from "@/lib/dates";
import { money, shortMoney } from "@/lib/money";
import { useHome, useInvoices, useToday, useWrite } from "@/lib/queries";
import { useOffline } from "@/lib/offline";
import { useSession } from "@/lib/session";
import { color, font, type Tone } from "@/theme";

type Filter = "all" | "late" | "unpaid" | "draft" | "paid";
const FILTERS: [Filter, string][] = [["all", "All"], ["late", "Late"], ["unpaid", "Due"], ["draft", "Drafts"], ["paid", "Paid"]];
const STATE: Record<InvoiceRow["shown"], [string, Tone]> = {
  late: ["Late", "late"], sent: ["Due", "warn"], part_paid: ["Part paid", "warn"], paid: ["Paid", "ok"], draft: ["Draft", "plain"], void: ["Void", "plain"],
};

export default function ComingIn() {
  const router = useRouter();
  const params = useLocalSearchParams<{ status?: string }>();
  const [filter, setFilter] = useState<Filter>((FILTERS.find(([k]) => k === params.status)?.[0]) ?? "all");
  const [open, setOpen] = useState<string | null>(null);
  const [paying, setPaying] = useState<InvoiceRow | null>(null);
  const { api, business } = useSession();
  const toast = useToast();
  const q = useInvoices(filter);
  const home = useHome();
  const { write } = useOffline();
  const remind = useWrite((inv: InvoiceRow) => write("remind", { params: { id: inv.id }, body: { email: true } }, `Reminder to ${inv.customerName} about ${inv.number}`));
  const send = useWrite((id: string) => api("issueInvoice", { params: { id }, body: { email: true } }));
  const cur = home.data?.currency ?? "GBP";
  const c = home.data?.comingIn;

  return (
    <Screen
      refreshing={q.isRefetching} onRefresh={() => { q.refetch(); home.refetch(); }}
      header={
        <Row style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10, justifyContent: "space-between" }}>
          <H1>Coming in</H1>
          <Button title="Invoice" icon="plus" small onPress={() => router.push("/invoice")} />
        </Row>
      }
    >
      {c ? (
        <View style={{ flexDirection: "row", gap: 6 }}>
          <Stat label="Late" value={shortMoney(c.late, cur)} sub={`${c.lateCount} invoice${c.lateCount === 1 ? "" : "s"}`} bg={color.redTint} />
          <Stat label="On the way" value={shortMoney(c.onTheWay, cur)} sub={home.data?.period.label ?? ""} bg={color.violetTint} />
          <Stat label="Received" value={shortMoney(c.received, cur)} sub={home.data?.period.label ?? ""} bg={color.ink} dark />
        </View>
      ) : null}

      <Chips>
        {FILTERS.map(([k, l]) => (
          <Chip key={k} title={l} on={filter === k} count={k === "all" ? undefined : q.data?.counts[k === "unpaid" ? "unpaid" : k]} onPress={() => { setFilter(k); setOpen(null); }} />
        ))}
      </Chips>

      {q.isLoading ? <Loading /> : q.error ? <ErrorNote message={problem(q.error)} onRetry={() => q.refetch()} /> : (
        <Card style={{ paddingVertical: 4 }}>
          {q.data?.invoices.length === 0 ? (
            <Sub style={{ textAlign: "center", paddingVertical: 18 }}>{filter === "late" ? "Nothing is late. Nice." : "Nothing here yet."}</Sub>
          ) : q.data?.invoices.map((inv, i, all) => {
            const [word, tone] = STATE[inv.shown];
            const sel = open === inv.id;
            const owed = inv.shown !== "paid" && inv.shown !== "draft" && inv.shown !== "void";
            return (
              <View key={inv.id} style={[s.rowWrap, i === all.length - 1 && { borderBottomWidth: 0 }]}>
                <Pressable accessibilityRole="button" accessibilityState={{ expanded: sel }} onPress={() => setOpen(sel ? null : inv.id)} style={s.row}>
                  <View style={[s.ic, { backgroundColor: tone === "late" ? color.redTint : tone === "ok" ? color.greenTint : color.violetTint }]}>
                    <Text style={s.icText}>{inv.customerName.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text numberOfLines={1} style={s.who}>{inv.customerName}</Text>
                    <Row gap={6}>
                      <Tag title={inv.shown === "late" ? `${inv.daysLate} days late` : word} kind={tone} />
                      <Sub numberOfLines={1} style={{ flexShrink: 1 }}>{inv.number ?? "Draft"} · {inv.shown === "paid" ? "paid" : inv.shown === "draft" ? "not sent" : `due ${shortDate(inv.dueDate)}`}</Sub>
                    </Row>
                  </View>
                  <Text style={s.amt}>{money(owed ? inv.open : inv.total, inv.currency, "never")}</Text>
                </Pressable>
                {sel ? (
                  <View style={{ paddingLeft: 52, paddingBottom: 14, gap: 10 }}>
                    <Sub>{inv.summary || "Invoice"} · {money(inv.total, inv.currency)} total{inv.paid ? `, ${money(inv.paid, inv.currency)} received` : ""}{inv.remindersSent ? ` · ${inv.remindersSent} reminder${inv.remindersSent === 1 ? "" : "s"} sent` : ""}</Sub>
                    <Row gap={8} style={{ flexWrap: "wrap" }}>
                      {owed ? <Button title="Record payment" small onPress={() => setPaying(inv)} /> : null}
                      {owed ? <Button title="Remind" small kind="ghost" busy={remind.isPending && remind.variables?.id === inv.id}
                        onPress={async () => { try { const r = await remind.mutateAsync(inv); toast(r.queued ? "Reminder saved on this phone · sent when you’re back online" : r.result.emailed ? `Reminder emailed to ${inv.customerName}` : "Reminder ready"); } catch (e) { toast(problem(e)); } }} /> : null}
                      {inv.shown === "draft" ? <Button title="Send now" small busy={send.isPending && send.variables === inv.id}
                        onPress={async () => { try { const r = await send.mutateAsync(inv.id); toast(`${r.number ?? "Invoice"} ${r.emailed ? "emailed" : "sent"}`); } catch (e) { toast(problem(e)); } }} /> : null}
                    </Row>
                  </View>
                ) : null}
              </View>
            );
          })}
        </Card>
      )}
      {paying ? <PaymentSheet inv={paying} lk={business?.country === "lk"} onClose={() => setPaying(null)} /> : null}
    </Screen>
  );
}

function Stat({ label, value, sub, bg, dark }: { label: string; value: string; sub: string; bg: string; dark?: boolean }) {
  const fg = dark ? "#FFFFFF" : color.ink;
  return (
    <View style={{ flex: 1, padding: 12, borderRadius: 16, backgroundColor: bg, gap: 4 }}>
      <Text style={{ fontFamily: font.semi, fontSize: 12, color: fg, opacity: 0.8 }}>{label}</Text>
      <Text numberOfLines={1} style={{ fontFamily: font.head, fontSize: 18, color: fg, letterSpacing: -0.5 }}>{value}</Text>
      <Text numberOfLines={1} style={{ fontFamily: font.body, fontSize: 11.5, color: fg, opacity: 0.75 }}>{sub}</Text>
    </View>
  );
}

/** What reached the bank, how they paid. */
function PaymentSheet({ inv, lk, onClose }: { inv: InvoiceRow; lk: boolean; onClose: () => void }) {
  const toast = useToast();
  const digits = currencyDigits(inv.currency);
  const [amount, setAmount] = useState((inv.open / 10 ** digits).toFixed(digits));
  const [method, setMethod] = useState("Bank transfer");
  const [cheque, setCheque] = useState("");
  const [error, setError] = useState<string | null>(null);
  const today = useToday();
  const { write } = useOffline();
  const pay = useWrite((minor: number) => write("recordPayment", {
    params: { id: inv.id },
    body: { amount: minor, receivedOn: today, method, chequeNumber: method === "Cheque" ? cheque || null : null },
  }, `${money(minor, inv.currency)} from ${inv.customerName}`));
  const minor = parseMoney(amount, digits) ?? 0;
  const part = minor > 0 && minor < inv.open;
  return (
    <Sheet open onClose={onClose} title="Record a payment" sub={`${inv.customerName} · ${inv.number ?? ""} · ${money(inv.open, inv.currency)} open`}>
      <Field label={`What reached your bank (${inv.currency})`} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" error={error}
        style={{ fontFamily: font.head, fontSize: 28, minHeight: 60 }} />
      {part ? <Tag title={`Part payment · ${money(inv.open - minor, inv.currency)} stays open`} kind="warn" /> : null}
      <Stack gap={8}>
        <Label>How they paid</Label>
        <Row gap={8} style={{ flexWrap: "wrap" }}>
          {["Bank transfer", "Card", "Cash", ...(lk ? ["Cheque"] : [])].map((m) => <Chip key={m} title={m} on={method === m} onPress={() => setMethod(m)} />)}
        </Row>
      </Stack>
      {method === "Cheque" ? <Field label="Cheque number" value={cheque} onChangeText={setCheque} keyboardType="number-pad" /> : null}
      <Button title="Save payment" busy={pay.isPending} disabled={minor <= 0 || minor > inv.open}
        onPress={async () => {
          setError(null);
          try { const r = await pay.mutateAsync(minor); toast(`${money(minor, inv.currency)} from ${inv.customerName} ${r.queued ? "· saved on this phone" : "recorded"}`); onClose(); }
          catch (e) { setError(problem(e)); }
        }} />
    </Sheet>
  );
}

const s = StyleSheet.create({
  rowWrap: { borderBottomWidth: 1, borderBottomColor: color.line },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 64, paddingVertical: 10 },
  ic: { width: 40, height: 40, borderRadius: 99, alignItems: "center", justifyContent: "center" },
  icText: { fontFamily: font.bold, fontSize: 13, color: color.ink },
  who: { fontFamily: font.semi, fontSize: 15, color: color.ink },
  amt: { fontFamily: font.bold, fontSize: 15, color: color.ink, fontVariant: ["tabular-nums"] },
});
