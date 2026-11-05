import type { Employee, PayLine, PayrollDue } from "@billingease/contracts";
import { currencyDigits, parseMoney, ukCheck } from "@billingease/core";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { Amount, Button, Card, ErrorNote, Field, Footer, H1, IconButton, Loading, Row, Sub, Tag, useToast } from "@/components/ui";
import { problem } from "@/lib/api";
import { shortDate } from "@/lib/dates";
import { CURRENCY_OF, fit, money } from "@/lib/money";
import { useRefreshAll, useToday } from "@/lib/queries";
import { useSession } from "@/lib/session";
import { color, font } from "@/theme";

type UkFigures = { gross: string; paye: string; eeNi: string; erNi: string; pensionEe: string; pensionEr: string };
const UK_FIELDS: [keyof UkFigures, string][] = [["gross", "Gross pay"], ["paye", "PAYE"], ["eeNi", "Employee NI"], ["erNi", "Employer NI"], ["pensionEe", "Pension (theirs)"], ["pensionEr", "Pension (yours)"]];

/** This month's payroll: work it out (Sri Lanka) or record it (UK), approve, then pay what it owes. */
export default function Payroll() {
  const router = useRouter();
  const { api, business, confirm } = useSession();
  const toast = useToast();
  const refresh = useRefreshAll();
  const today = useToday();
  const b = business?.id ?? "none";
  const cur = CURRENCY_OF[business?.country ?? "uk"];
  const digits = currencyDigits(cur);
  const W = (n: number) => money(n, cur, "never");
  const asText = (n: number) => (n / 10 ** digits).toFixed(digits);

  const ov = useQuery({ queryKey: [b, "payroll"], queryFn: () => api("payroll") });
  const o = ov.data;
  const full = o?.mode === "full";
  // The month to show: a draft still to approve, else the newest approved month that still owes
  // something (stay on it until it's paid), else nothing yet: offer next month.
  const newestApproved = o?.runs.filter((r) => r.status === "approved").sort((x, y) => y.month.localeCompare(x.month))[0];
  const [startNext, setStartNext] = useState(false);
  const current = o && !startNext ? o.runs.find((r) => r.status === "draft") ?? (newestApproved && !newestApproved.settled ? newestApproved : null) : null;
  const lastApproved = o?.runs.find((r) => r.status === "approved" && r.id !== current?.id) ?? null;
  const detail = useQuery({ queryKey: [b, "payRun", current?.id], queryFn: () => api("payRun", { params: { id: current!.id } }), enabled: !!current });
  const last = useQuery({ queryKey: [b, "payRun", lastApproved?.id], queryFn: () => api("payRun", { params: { id: lastApproved!.id } }), enabled: !!lastApproved && !current && o?.mode === "records" });
  const run = detail.data;

  const active = (o?.employees ?? []).filter((e) => !e.endedOn || e.endedOn >= today);
  const [overtime, setOvertime] = useState<Record<string, string>>({});
  const [uk, setUk] = useState<Record<string, UkFigures>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  // UK: start from last month's figures from the payroll software, else a rough check.
  useEffect(() => {
    if (o?.mode !== "records" || current || Object.keys(uk).length) return;
    if (lastApproved && !last.data) return;
    const prev = new Map((last.data?.lines ?? []).map((l) => [l.employeeId, l]));
    setUk(Object.fromEntries(active.map((e) => {
      const p = prev.get(e.id);
      const c = p ?? ukCheck(e.basic, e.taxCode ?? "1257L", e.pension);
      return [e.id, { gross: asText(c.gross), paye: asText(c.paye), eeNi: asText(c.eeNi), erNi: asText(c.erNi), pensionEe: asText(c.pensionEe), pensionEr: asText(c.pensionEr) }];
    })));
  }, [o, current, last.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const reload = async () => { await ov.refetch(); await detail.refetch(); refresh(); setStartNext(false); };
  async function act(key: string, fn: () => Promise<unknown>, done: string, faceReason?: string) {
    if (faceReason && !(await confirm(faceReason))) return;
    setBusy(key); setError(null);
    try { await fn(); await reload(); toast(done); } catch (e) { setError(problem(e)); } finally { setBusy(null); }
  }

  const ukLines = () => active.map((e) => {
    const f = uk[e.id];
    const m = (k: keyof UkFigures) => parseMoney(f?.[k] ?? "0", digits) ?? 0;
    return { employeeId: e.id, gross: m("gross"), paye: m("paye"), eeNi: m("eeNi"), erNi: m("erNi"), pensionEe: m("pensionEe"), pensionEr: m("pensionEr") };
  });
  const lkLines = (lines: PayLine[]) => lines.map((l) => ({ employeeId: l.employeeId, overtime: overtime[l.employeeId] != null ? parseMoney(overtime[l.employeeId], digits) ?? 0 : l.overtime }));
  const otChanged = run?.lines.some((l) => overtime[l.employeeId] != null && (parseMoney(overtime[l.employeeId], digits) ?? 0) !== l.overtime);

  const otherDues = (o?.open ?? []).filter((d) => d.runId !== current?.id);
  const footer = useMemo(() => {
    if (!o || !active.length) return null;
    if (!current) {
      return full
        ? <Button title={`Work out ${o.next.label} for ${active.length} ${active.length === 1 ? "person" : "people"}`} busy={busy === "create"}
            onPress={() => act("create", () => api("createPayRun", { body: { month: o.next.month, payDate: o.next.payDate, lines: active.map((e) => ({ employeeId: e.id, overtime: 0 })) } }), `${o.next.label} worked out`)} />
        : <Button title={`Record ${o.next.label} pay run`} busy={busy === "create"}
            onPress={() => act("create", () => api("createPayRun", { body: { month: o.next.month, payDate: o.next.payDate, lines: ukLines() } }), `${o.next.label} recorded`)} />;
    }
    if (run?.status === "approved" && !o.next.exists) {
      // Paying last month's EPF or HMRC can come after next month's pay day: start it anyway.
      return full
        ? <Button title={`Start ${o.next.label}`} kind="ghost" busy={busy === "create"}
            onPress={() => act("create", () => api("createPayRun", { body: { month: o.next.month, payDate: o.next.payDate, lines: active.map((e) => ({ employeeId: e.id, overtime: 0 })) } }), `${o.next.label} worked out`)} />
        // UK: the figures come from the payroll software, so open the form for next month.
        : <Button title={`Record ${o.next.label}`} kind="ghost" onPress={() => { setUk({}); setStartNext(true); }} />;
    }
    if (run?.status === "draft") {
      return (
        <>
          {full && otChanged ? <Button title="Work it out again with the overtime" kind="ghost" busy={busy === "update"}
            onPress={() => act("update", () => api("updatePayRun", { params: { id: run.id }, body: { month: run.month, payDate: run.payDate, lines: lkLines(run.lines) } }), "Updated").then(() => setOvertime({}))} /> : null}
          <Button title="Approve" icon="face" kind="dark" busy={busy === "approve"} disabled={!!otChanged}
            onPress={() => act("approve", () => api("approvePayRun", { params: { id: run.id } }), `${run.label} approved`, `Approve ${run.label}`)} />
        </>
      );
    }
    return null;
  }, [o, current, run, busy, uk, overtime, otChanged]); // eslint-disable-line react-hooks/exhaustive-deps

  const totals = run ?? null;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.bg }}>
      <Row style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <IconButton name="back" label="Back" onPress={() => router.back()} />
        <Text style={s.title}>{o ? (current ? current.label : o.next.label) : "Payroll"}</Text>
        <View style={{ width: 44 }} />
      </Row>
      {ov.isLoading ? <Loading /> : ov.error ? <View style={{ padding: 16 }}><ErrorNote message={problem(ov.error)} onRetry={() => ov.refetch()} /></View> : o ? (
        <>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
            {!active.length ? (
              <Card style={{ gap: 10, alignItems: "center", paddingVertical: 28 }}>
                <View style={[s.ic, { width: 56, height: 56, backgroundColor: color.amberTint }]}><Icon name="people" size={26} /></View>
                <H1 style={{ fontSize: 20 }}>No one on payroll yet</H1>
                <Sub style={{ textAlign: "center" }}>Add people and their pay on the web once. After that, each month’s run takes a minute here.</Sub>
              </Card>
            ) : (
              <>
                <View style={s.hero}>
                  <Row style={{ justifyContent: "space-between" }}>
                    <Text style={s.heroLabel}>{(current?.people ?? active.length)} {(current?.people ?? active.length) === 1 ? "person" : "people"} · pay day {shortDate(current?.payDate ?? o.next.payDate)}</Text>
                    <Tag title={!current ? (full ? "To work out" : "Not recorded") : current.status === "draft" ? "To check" : current.settled ? "All paid" : "Approved"} kind={!current || current.status === "draft" ? "warn" : current.settled ? "ok" : "ai"} />
                  </Row>
                  {totals ? (
                    <>
                      <Amount size={fit(W(totals.net), 40, 12)} style={{ color: color.violet }}>{W(totals.net)}</Amount>
                      <Text style={s.heroNote}>Net pay{totals.status === "approved" ? "" : " to approve"}</Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                        {(full
                          ? [["Gross pay", totals.gross], ["EPF 8% + APIT held back", totals.epfEe + totals.apit], ["You add: EPF 12% + ETF 3%", totals.epfEr + totals.etf], ["Total cost", totals.cost]]
                          : [["Gross pay", totals.gross], ["PAYE + NI held back", totals.paye + totals.eeNi], ["To HMRC", totals.paye + totals.eeNi + totals.erNi], ["Pensions", totals.pensionEe + totals.pensionEr]]
                        ).map(([l, v]) => (
                          <View key={l as string} style={s.part}><Text style={s.partLabel}>{l}</Text><Amount size={16} style={{ color: "#FFFFFF" }}>{W(v as number)}</Amount></View>
                        ))}
                      </View>
                    </>
                  ) : (
                    <Text style={s.heroNote}>{full ? "BillingEase works out EPF, ETF, APIT and net pay from each person’s basic pay and allowances." : "Enter what your payroll software worked out. BillingEase keeps the records; the software reports to HMRC."}</Text>
                  )}
                </View>

                {/* People */}
                {run ? (
                  <Card style={{ paddingVertical: 4 }}>
                    {run.lines.map((l, i) => {
                      const sel = open === l.id;
                      return (
                        <View key={l.id} style={[s.row, i === run.lines.length - 1 && { borderBottomWidth: 0 }]}>
                          <Pressable accessibilityRole="button" accessibilityState={{ expanded: sel }} onPress={() => setOpen(sel ? null : l.id)} style={s.person}>
                            <View style={[s.ic, { backgroundColor: color.amberTint }]}><Text style={s.icText}>{l.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("")}</Text></View>
                            <View style={{ flex: 1 }}><Text style={s.name}>{l.name}</Text><Sub>{l.job ?? ""}</Sub></View>
                            <View style={{ alignItems: "flex-end" }}><Text style={s.amt}>{W(l.net)}</Text><Sub>net</Sub></View>
                          </Pressable>
                          {sel ? <Breakdown l={l} full={full} W={W} /> : null}
                          {full && run.status === "draft" ? (
                            <Row style={{ paddingLeft: 52, paddingBottom: 10 }}>
                              <Sub style={{ flex: 1 }}>Overtime this month</Sub>
                              <View style={{ width: 130 }}><Field value={overtime[l.employeeId] ?? asText(l.overtime)} onChangeText={(t) => setOvertime((x) => ({ ...x, [l.employeeId]: t }))} keyboardType="decimal-pad" accessibilityLabel={`Overtime for ${l.name}`} style={{ minHeight: 40 }} /></View>
                            </Row>
                          ) : null}
                        </View>
                      );
                    })}
                  </Card>
                ) : !full ? (
                  active.map((e) => <UkForm key={e.id} e={e} f={uk[e.id]} onChange={(f) => setUk((x) => ({ ...x, [e.id]: f }))} />)
                ) : (
                  <Card style={{ paddingVertical: 4 }}>
                    {active.map((e, i) => (
                      <Row key={e.id} style={[s.person, i === active.length - 1 ? null : { borderBottomWidth: 1, borderBottomColor: color.line }]}>
                        <View style={[s.ic, { backgroundColor: color.amberTint }]}><Text style={s.icText}>{e.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("")}</Text></View>
                        <View style={{ flex: 1 }}><Text style={s.name}>{e.name}</Text><Sub>{e.job ?? ""}</Sub></View>
                        <Text style={s.amt}>{W(e.basic + e.allowances.reduce((a, x) => a + x.amount, 0))}</Text>
                      </Row>
                    ))}
                  </Card>
                )}

                {/* What the run owes */}
                {run?.status === "approved" ? <Dues title={full ? "To pay" : "To pay staff, HMRC and the pension"} dues={run.dues} W={W} busy={busy}
                  onPay={(d) => act(d.id, () => api("payPayrollDue", { params: { id: d.id }, body: { paidOn: today, method: "Bank transfer" } }), `${d.label} marked paid`, `Mark ${d.label} paid`)} /> : null}
                {otherDues.length ? <Dues title="Still to pay from earlier months" dues={otherDues} W={W} busy={busy}
                  onPay={(d) => act(d.id, () => api("payPayrollDue", { params: { id: d.id }, body: { paidOn: today, method: "Bank transfer" } }), `${d.label} marked paid`, `Mark ${d.label} paid`)} /> : null}
                {error ? <Text style={s.err}>{error}</Text> : null}
                <Sub style={{ textAlign: "center" }}>{full ? "EPF, ETF and APIT figures follow the rules in BillingEase and haven’t been checked against the IRD yet." : "BillingEase keeps the records; your payroll software sends the RTI submission to HMRC."}</Sub>
              </>
            )}
          </ScrollView>
          {footer ? <Footer>{footer}</Footer> : null}
        </>
      ) : null}
    </SafeAreaView>
  );
}

function Breakdown({ l, full, W }: { l: PayLine; full: boolean; W: (n: number) => string }) {
  const rows: [string, number, boolean?][] = full
    ? [["Basic", l.basic], ["Allowances", l.allowances], ["Overtime", l.overtime], ["Gross", l.gross, true], ["EPF 8% (theirs)", -l.epfEe], ["APIT", -l.apit], ["Net pay", l.net, true], ["You add: EPF 12% + ETF 3%", l.epfEr + l.etf]]
    : [["Gross", l.gross, true], ["PAYE", -l.paye], ["Employee NI", -l.eeNi], ["Pension (theirs)", -l.pensionEe], ["Net pay", l.net, true], ["Employer NI + pension", l.erNi + l.pensionEr]];
  return (
    <View style={{ paddingLeft: 52, paddingBottom: 10, gap: 4 }}>
      {rows.map(([k, v, bold]) => (
        <Row key={k} style={{ justifyContent: "space-between" }}>
          <Sub>{k}</Sub><Text style={{ fontFamily: bold ? font.bold : font.body, fontSize: 14, color: color.ink, fontVariant: ["tabular-nums"] }}>{v < 0 ? "−" + W(-v) : W(v)}</Text>
        </Row>
      ))}
    </View>
  );
}

function UkForm({ e, f, onChange }: { e: Employee; f?: UkFigures; onChange: (f: UkFigures) => void }) {
  if (!f) return <Loading />;
  return (
    <Card style={{ gap: 10 }}>
      <Row><View style={[s.ic, { backgroundColor: color.amberTint }]}><Text style={s.icText}>{e.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("")}</Text></View>
        <View style={{ flex: 1 }}><Text style={s.name}>{e.name}</Text><Sub>{e.job ?? ""}{e.taxCode ? ` · ${e.taxCode}` : ""}</Sub></View></Row>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {UK_FIELDS.map(([k, label]) => (
          <View key={k} style={{ width: "48%" }}><Field label={label} value={f[k]} onChangeText={(t) => onChange({ ...f, [k]: t })} keyboardType="decimal-pad" style={{ minHeight: 44 }} /></View>
        ))}
      </View>
      <Sub>Filled in from last month (or a rough check). Change anything that’s different on your payroll software’s summary.</Sub>
    </Card>
  );
}

function Dues({ title, dues, W, busy, onPay }: { title: string; dues: PayrollDue[]; W: (n: number) => string; busy: string | null; onPay: (d: PayrollDue) => void }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.section}>{title}</Text>
      <Card style={{ paddingVertical: 4 }}>
        {dues.map((d, i) => (
          <Row key={d.id} style={[s.person, i === dues.length - 1 ? null : { borderBottomWidth: 1, borderBottomColor: color.line }]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.name}>{d.label}</Text>
              <Sub>{d.payTo} · {d.paidOn ? `paid ${shortDate(d.paidOn)}` : d.daysToDue < 0 ? `${-d.daysToDue} days overdue` : `due ${shortDate(d.dueOn)}`}</Sub>
            </View>
            <View style={{ alignItems: "flex-end", gap: 6 }}>
              <Text style={s.amt}>{W(d.amount)}</Text>
              {d.paidOn ? <Tag title="Paid" kind="ok" /> : <Button title="Mark paid" small kind="ghost" busy={busy === d.id} onPress={() => onPay(d)} style={{ minHeight: 32, paddingHorizontal: 12 }} />}
            </View>
          </Row>
        ))}
      </Card>
    </View>
  );
}

const s = StyleSheet.create({
  title: { flex: 1, textAlign: "center", fontFamily: font.bold, fontSize: 16, color: color.ink },
  hero: { backgroundColor: color.ink, borderRadius: 24, padding: 18, gap: 10 },
  heroLabel: { fontFamily: font.semi, fontSize: 13, color: "rgba(255,255,255,0.7)", flexShrink: 1 },
  heroNote: { fontFamily: font.body, fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 20 },
  part: { width: "48%", padding: 10, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.08)", gap: 2 },
  partLabel: { fontFamily: font.body, fontSize: 12, color: "rgba(255,255,255,0.65)" },
  row: { borderBottomWidth: 1, borderBottomColor: color.line },
  person: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 60, paddingVertical: 10 },
  ic: { width: 40, height: 40, borderRadius: 99, alignItems: "center", justifyContent: "center" },
  icText: { fontFamily: font.bold, fontSize: 13, color: color.ink },
  name: { fontFamily: font.semi, fontSize: 15, color: color.ink },
  amt: { fontFamily: font.bold, fontSize: 15, color: color.ink, fontVariant: ["tabular-nums"] },
  section: { fontFamily: font.head, fontSize: 17, color: color.ink },
  err: { fontFamily: font.semi, fontSize: 14, color: color.red },
});

