import type { Customer, Item } from "@billingease/contracts";
import { computeInvoice, currencyDigits, invoiceTitle, parseMoney, rulesFor } from "@billingease/core";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { Amount, Button, Card, Chip, ErrorNote, Field, Footer, H1, IconButton, Label, Loading, Row, Stack, Sub, useToast } from "@/components/ui";
import { problem } from "@/lib/api";
import { addDays, shortDate } from "@/lib/dates";
import { money } from "@/lib/money";
import { useBusiness, useCustomers, useItems, useToday, useWrite } from "@/lib/queries";
import { useSession } from "@/lib/session";
import { color, font } from "@/theme";

type Line = { key: string; itemId: string | null; description: string; units: number; unitPrice: number; unit: string | null; vatRateId: string | null; sscl: boolean };
type Step = "who" | "what" | "review" | "done";

/** Who → what → review → sent. */
export default function NewInvoice() {
  const router = useRouter();
  const { api } = useSession();
  const toast = useToast();
  const biz = useBusiness();
  const customers = useCustomers();
  const items = useItems();
  const today = useToday();
  const [step, setStep] = useState<Step>("who");
  const [who, setWho] = useState<Customer | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customAmt, setCustomAmt] = useState("");
  const [terms, setTerms] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ number: string | null; total: number; currency: string; emailed: boolean; draft: boolean } | null>(null);

  const b = biz.data;
  const cur = who?.currency ?? b?.currency ?? "GBP";
  const digits = currencyDigits(cur);
  const title = b ? invoiceTitle(b.country, b.vatRegistered) : "Invoice";
  const termDays = terms ?? b?.termsDays ?? 14;

  const totals = useMemo(() => {
    if (!b || !lines.length) return null;
    try {
      return computeInvoice(lines.map((l) => ({ quantityMilli: l.units * 1000, unitPrice: l.unitPrice, vatRateId: l.vatRateId, sscl: l.sscl })),
        { country: b.country, vatRegistered: b.vatRegistered, ssclRegistered: b.ssclRegistered });
    } catch { return null; }
  }, [b, lines]);

  const createCustomer = useWrite(() => api("createCustomer", { body: { name: newName.trim(), email: newEmail.trim() || null } }));
  const create = useWrite(async (send: boolean) => {
    const issueDate = today;
    const inv = await api("createInvoice", {
      body: {
        customerId: who!.id, issueDate, dueDate: addDays(issueDate, termDays), billing: "items",
        lines: lines.map((l) => ({ itemId: l.itemId, description: l.description, quantityMilli: l.units * 1000, unitPrice: l.unitPrice, vatRateId: l.vatRateId, sscl: l.sscl })),
      },
    });
    if (!send) return { number: inv.number, total: inv.total, currency: inv.currency, emailed: false, draft: true };
    const sent = await api("issueInvoice", { params: { id: inv.id }, body: { email: !!who!.email } });
    return { number: sent.number, total: sent.total, currency: sent.currency, emailed: sent.emailed, draft: false };
  });

  const addItem = (it: Item) => setLines((L) => {
    const i = L.findIndex((l) => l.itemId === it.id);
    if (i >= 0) return L.map((l, j) => (j === i ? { ...l, units: l.units + 1 } : l));
    return [...L, { key: it.id, itemId: it.id, description: it.name, units: 1, unitPrice: it.unitPrice, unit: it.unit, vatRateId: it.vatRateId, sscl: it.sscl }];
  });
  const step_ = (i: number, d: number) => setLines((L) => L.flatMap((l, j) => (j !== i ? [l] : l.units + d <= 0 ? [] : [{ ...l, units: l.units + d }])));
  const n = { who: 1, what: 2, review: 3, done: 3 }[step];
  const filtered = (customers.data?.customers ?? []).filter((c) => !q || (c.name + " " + (c.contactName ?? "") + " " + (c.email ?? "")).toLowerCase().includes(q.toLowerCase()));

  if (step === "done" && done) {
    return (
      <SafeAreaView style={[s.wrap, { justifyContent: "center", padding: 24, gap: 16, alignItems: "center" }]}>
        <View style={s.doneIc}><Icon name="check" size={46} width={2.6} /></View>
        <H1 style={{ fontSize: 26, textAlign: "center" }}>{done.draft ? "Saved as a draft" : `${done.number} is on its way`}</H1>
        <Sub style={{ fontSize: 15, textAlign: "center", maxWidth: 300 }}>
          {done.draft ? "Find it under Coming in → Drafts, and send it when you’re ready." : `${money(done.total, done.currency)} to ${who?.name}${done.emailed ? `, emailed to ${who?.email}` : ". There’s no email for them, so share the PDF from the web"}. We’ll show it under Coming in until it’s paid.`}
        </Sub>
        <View style={{ alignSelf: "stretch", gap: 10, marginTop: 12 }}>
          <Button title="See it in Coming in" onPress={() => { router.back(); router.push(done.draft ? "/in?status=draft" : "/in"); }} />
          <Button title="Another invoice" kind="line" onPress={() => { setStep("who"); setWho(null); setLines([]); setTerms(null); setDone(null); }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.wrap}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 12 }}>
        <Row>
          <IconButton name={step === "who" ? "close" : "back"} label={step === "who" ? "Close" : "Back"} onPress={() => (step === "who" ? router.back() : setStep(step === "review" ? "what" : "who"))} />
          <Text style={s.title}>{title}</Text>
          <Text style={s.count}>{n}/3</Text>
        </Row>
        <View style={{ flexDirection: "row", gap: 6 }}>{[1, 2, 3].map((i) => <View key={i} style={[s.step, i <= n && { backgroundColor: color.ink }]} />)}</View>
      </View>

      {step === "who" ? (
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          <H1 style={{ fontSize: 26 }}>Who’s it for?</H1>
          <Field placeholder="Search customers" value={q} onChangeText={setQ} />
          {adding ? (
            <Card style={{ gap: 10 }}>
              <Text style={s.h3}>New customer</Text>
              <Field placeholder="Business or person’s name" value={newName} onChangeText={setNewName} autoCapitalize="words" />
              <Field placeholder="Email for the invoice" value={newEmail} onChangeText={setNewEmail} keyboardType="email-address" autoCapitalize="none" error={error} />
              <Button title="Add and continue" busy={createCustomer.isPending} disabled={!newName.trim()} onPress={async () => {
                setError(null);
                try { const c = await createCustomer.mutateAsync(undefined); setWho(c); setAdding(false); setStep("what"); } catch (e) { setError(problem(e)); }
              }} />
            </Card>
          ) : (
            <Card onPress={() => { setAdding(true); setNewName(q); }} label="New customer">
              <Row><View style={[s.ic, { backgroundColor: color.violetTint }]}><Icon name="plus" width={2.4} /></View><Text style={s.h3}>{q ? `Add “${q}” as a customer` : "New customer"}</Text></Row>
            </Card>
          )}
          {customers.isLoading ? <Loading /> : customers.error ? <ErrorNote message={problem(customers.error)} onRetry={() => customers.refetch()} /> : (
            <Card style={{ paddingVertical: 4 }}>
              {filtered.length === 0 ? <Sub style={{ textAlign: "center", paddingVertical: 16 }}>No customers match.</Sub> : null}
              {filtered.slice(0, 30).map((c, i, all) => (
                <Pressable key={c.id} accessibilityRole="button" onPress={() => { setWho(c); setStep("what"); }} style={[s.row, i === all.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={[s.ic, { backgroundColor: color.violetTint }]}><Text style={s.icText}>{c.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={s.name}>{c.name}</Text>
                    <Sub numberOfLines={1}>{[c.contactName, c.email].filter(Boolean).join(" · ") || "No email yet"}</Sub>
                  </View>
                  <Icon name="chev" stroke={color.faint} />
                </Pressable>
              ))}
            </Card>
          )}
        </ScrollView>
      ) : null}

      {step === "what" ? (
        <>
          <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
            <View><H1 style={{ fontSize: 26 }}>What for?</H1><Sub>For {who?.name}. Tap your services, or type a line.</Sub></View>
            {items.isLoading ? <Loading /> : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {(items.data?.items ?? []).slice(0, 12).map((it) => (
                  <Chip key={it.id} title={`＋ ${it.name}  ${money(it.unitPrice, cur, "never")}`} onPress={() => addItem(it)} />
                ))}
              </View>
            )}
            {lines.length ? (
              <Card style={{ paddingVertical: 4 }}>
                {lines.map((l, i) => (
                  <Row key={l.key} style={[s.row, i === lines.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={s.name}>{l.description}</Text>
                      <Sub>{money(l.unitPrice, cur)}{l.unit ? ` a ${l.unit}` : " each"}</Sub>
                    </View>
                    <View style={s.stepper} accessibilityLabel={`Quantity of ${l.description}: ${l.units}`}>
                      <Pressable accessibilityRole="button" accessibilityLabel="One fewer" onPress={() => step_(i, -1)} style={s.stepBtn}><Text style={s.stepText}>−</Text></Pressable>
                      <Text style={s.qty}>{l.units}</Text>
                      <Pressable accessibilityRole="button" accessibilityLabel="One more" onPress={() => step_(i, 1)} style={s.stepBtn}><Text style={s.stepText}>+</Text></Pressable>
                    </View>
                    <Text style={[s.amt, { minWidth: 70, textAlign: "right" }]}>{money(l.units * l.unitPrice, cur, "never")}</Text>
                  </Row>
                ))}
              </Card>
            ) : null}
            <Card style={{ gap: 10 }}>
              <Label>Something else</Label>
              <Field placeholder="What you did" value={customDesc} onChangeText={setCustomDesc} />
              <Row gap={8}>
                <View style={{ flex: 1 }}><Field placeholder={`Amount (${cur})`} value={customAmt} onChangeText={setCustomAmt} keyboardType="decimal-pad" /></View>
                <Button title="Add" kind="dark" disabled={!customDesc.trim() || !(parseMoney(customAmt, digits) ?? 0)} onPress={() => {
                  setLines((L) => [...L, { key: `c${Date.now()}`, itemId: null, description: customDesc.trim(), units: 1, unitPrice: parseMoney(customAmt, digits) ?? 0, unit: null, vatRateId: null, sscl: true }]);
                  setCustomDesc(""); setCustomAmt("");
                }} />
              </Row>
            </Card>
          </ScrollView>
          <Footer>
            <Row>
              <View style={{ flex: 1 }}>
                <Sub>{lines.length ? `${lines.length} line${lines.length === 1 ? "" : "s"}${totals && totals.vat + totals.sscl > 0 ? ", with tax" : ""}` : "Nothing added yet"}</Sub>
                <Amount size={24}>{money(totals?.total ?? 0, cur)}</Amount>
              </View>
              <Button title="Review" disabled={!lines.length} onPress={() => setStep("review")} />
            </Row>
          </Footer>
        </>
      ) : null}

      {step === "review" && who && totals ? (
        <>
          <ScrollView contentContainerStyle={s.body}>
            <Card style={{ padding: 20, gap: 14 }}>
              <Row style={{ alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}><Text style={s.bizName}>{b?.name}</Text><Sub>{title}</Sub></View>
                <View style={s.dueTag}><Text style={s.dueText}>{termDays === 0 ? "Due on receipt" : `Due ${shortDate(addDays(today, termDays))}`}</Text></View>
              </Row>
              <View><Sub style={{ fontFamily: font.semi }}>To</Sub><Text style={s.name}>{who.name}</Text>{who.email ? <Sub>{who.email}</Sub> : null}</View>
              <View style={{ borderTopWidth: 1, borderTopColor: color.line }}>
                {lines.map((l, i) => (
                  <Row key={l.key} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: color.chip }}>
                    <Text style={[s.line, { flex: 1 }]}>{l.description} <Text style={{ color: color.muted }}>× {l.units}</Text></Text>
                    <Text style={s.amt}>{money(totals.lines[i].net, cur)}</Text>
                  </Row>
                ))}
              </View>
              <Stack gap={6}>
                {totals.sscl || totals.vat ? <Row style={{ justifyContent: "space-between" }}><Sub>Subtotal</Sub><Text style={s.line}>{money(totals.net, cur)}</Text></Row> : null}
                {totals.sscl ? <Row style={{ justifyContent: "space-between" }}><Sub>SSCL {(rulesFor(b!.country).ssclBps / 100).toFixed(1)}%</Sub><Text style={s.line}>{money(totals.sscl, cur)}</Text></Row> : null}
                {totals.vatByRate.map((v) => <Row key={v.vatRateId} style={{ justifyContent: "space-between" }}><Sub>VAT {v.label}</Sub><Text style={s.line}>{money(v.vat, cur)}</Text></Row>)}
                <Row style={{ justifyContent: "space-between", paddingTop: 6 }}><Text style={s.h3}>Total</Text><Amount size={24}>{money(totals.total, cur)}</Amount></Row>
              </Stack>
            </Card>
            <Stack gap={8}>
              <Label>Payment due in</Label>
              <Row gap={8} style={{ flexWrap: "wrap" }}>
                {[0, 7, 14, 30].map((d) => <Chip key={d} title={d === 0 ? "On receipt" : `${d} days`} on={termDays === d} onPress={() => setTerms(d)} />)}
              </Row>
            </Stack>
            {error ? <Text style={s.error}>{error}</Text> : null}
          </ScrollView>
          <Footer>
            <Button title={who.email ? `Send ${money(totals.total, cur)} to ${who.email}` : "Send (no email on file)"} icon="send" busy={create.isPending && create.variables === true}
              onPress={async () => { setError(null); try { const d = await create.mutateAsync(true); setDone(d); setStep("done"); toast(`${d.number} ${d.emailed ? "emailed" : "sent"}`); } catch (e) { setError(problem(e)); } }} />
            <Button title="Save as a draft" kind="ghost" small busy={create.isPending && create.variables === false}
              onPress={async () => { setError(null); try { const d = await create.mutateAsync(false); setDone(d); setStep("done"); } catch (e) { setError(problem(e)); } }} />
          </Footer>
        </>
      ) : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: color.bg },
  body: { padding: 16, gap: 18, paddingBottom: 40 },
  title: { flex: 1, textAlign: "center", fontFamily: font.bold, fontSize: 16, color: color.ink },
  count: { width: 44, textAlign: "right", fontFamily: font.body, fontSize: 13, color: color.muted },
  step: { flex: 1, height: 4, borderRadius: 99, backgroundColor: color.line },
  h3: { fontFamily: font.bold, fontSize: 16, color: color.ink },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 60, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: color.line },
  ic: { width: 40, height: 40, borderRadius: 99, alignItems: "center", justifyContent: "center" },
  icText: { fontFamily: font.bold, fontSize: 13, color: color.ink },
  name: { fontFamily: font.semi, fontSize: 15, color: color.ink },
  amt: { fontFamily: font.bold, fontSize: 14.5, color: color.ink, fontVariant: ["tabular-nums"] },
  line: { fontFamily: font.body, fontSize: 14, color: color.ink, fontVariant: ["tabular-nums"] },
  stepper: { flexDirection: "row", alignItems: "center", borderRadius: 99, backgroundColor: color.chip, padding: 3 },
  stepBtn: { width: 32, height: 32, borderRadius: 99, backgroundColor: color.surface, alignItems: "center", justifyContent: "center" },
  stepText: { fontFamily: font.bold, fontSize: 18, color: color.ink },
  qty: { minWidth: 28, textAlign: "center", fontFamily: font.bold, fontSize: 15, color: color.ink },
  bizName: { fontFamily: font.head, fontSize: 16, color: color.ink },
  dueTag: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99, backgroundColor: color.violetTint },
  dueText: { fontFamily: font.bold, fontSize: 12, color: "#4B2FC2" },
  doneIc: { width: 96, height: 96, borderRadius: 99, backgroundColor: color.violet, alignItems: "center", justifyContent: "center" },
  error: { fontFamily: font.semi, fontSize: 14, color: color.red },
});
