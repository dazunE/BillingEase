import type { BudgetKind, BudgetStatus } from "@billingease/contracts";
import { currencyDigits, parseMoney } from "@billingease/core";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { Amount, Bar, Button, Card, Chip, Chips, ErrorNote, Field, H1, H2, IconButton, Label, Loading, Row, Screen, Sheet, Stack, Sub, Tag, useToast } from "@/components/ui";
import { problem } from "@/lib/api";
import { suggest } from "@/lib/budgets";
import { CURRENCY_OF, fit, money } from "@/lib/money";
import { useBudgets, useOutSetup, useRefreshAll } from "@/lib/queries";
import { useSession } from "@/lib/session";
import { color, font, type Tone } from "@/theme";

const STATE: Record<BudgetStatus["state"], [string, Tone]> = {
  ok: ["On track", "ok"], fast: ["Ahead of pace", "warn"], nearly: ["Nearly used", "warn"], over: ["Over", "late"],
  behind: ["Behind", "plain"], on_track: ["On track", "ok"], on_course: ["On course", "ok"], met: ["Reached", "ok"],
};
const barColor = (s: BudgetStatus) => (s.state === "over" ? "#C2412F" : s.state === "nearly" || s.state === "fast" ? "#E0A100" : color.orange);
type Editing = { id: string | null; kind: BudgetKind; categoryId: string | null; amount: string; name: string };

/** Monthly budgets: limits for categories and all spending, a Coming in target, a Yours to keep goal. */
export default function Budgets() {
  const router = useRouter();
  const { api, business } = useSession();
  const toast = useToast();
  const refresh = useRefreshAll();
  const q = useBudgets();
  const setup = useOutSetup();
  const v = q.data;
  const cur = setup.data?.currency ?? CURRENCY_OF[business?.country ?? "uk"];
  const digits = currencyDigits(cur);
  const W = (n: number) => money(n, cur, "never");
  const [edit, setEdit] = useState<Editing | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const asText = (n: number) => String(Math.round(n / 10 ** digits));
  const open = (s: BudgetStatus) => { setError(null); setEdit({ id: s.id, kind: s.kind, categoryId: s.categoryId, amount: asText(s.amount), name: s.name }); };
  const startNew = (kind: BudgetKind = "category", categoryId: string | null = null, amount = 0, name = "") =>
    { setError(null); setEdit({ id: null, kind, categoryId, amount: amount ? asText(amount) : "", name }); };

  async function save() {
    if (!edit) return;
    const amount = parseMoney(edit.amount, digits);
    if (!amount || amount <= 0) { setError("Enter an amount more than 0"); return; }
    setBusy(true); setError(null);
    try {
      await api("saveBudget", { body: { kind: edit.kind, categoryId: edit.kind === "category" ? edit.categoryId : null, amount } });
      setEdit(null); refresh(); toast(`Budget set · ${W(amount)} a month`);
    } catch (e) { setError(problem(e)); } finally { setBusy(false); }
  }
  async function remove() {
    if (!edit?.id) return;
    setBusy(true);
    try { await api("removeBudget", { params: { id: edit.id } }); setEdit(null); refresh(); toast(`${edit.name} budget removed`); }
    catch (e) { setError(problem(e)); } finally { setBusy(false); }
  }
  async function setAlerts(patch: Partial<{ alerts: boolean; weekly: boolean }>) {
    if (!v) return;
    try { await api("budgetSettings", { body: { ...v.settings, ...patch } }); refresh(); } catch (e) { toast(problem(e)); }
  }

  const goals = v?.budgets.filter((s) => s.isGoal) ?? [];
  const total = v?.budgets.find((s) => s.kind === "spending");
  const cats = (v?.budgets.filter((s) => s.kind === "category") ?? []).sort((a, b) => b.pct - a.pct);
  const hot = cats.filter((s) => s.state === "over" || s.state === "nearly").length;
  const have = new Set(v?.budgets.map((s) => s.kind));
  const current = edit?.id ? v?.budgets.find((s) => s.id === edit.id) : undefined;
  const freeCats = (setup.data?.categories ?? []).filter((c) => c.scope === "business" && !c.capital && !cats.some((s) => s.categoryId === c.id));

  return (
    <Screen padBottom={40} refreshing={q.isRefetching} onRefresh={() => q.refetch()} header={
      <Row style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10 }}>
        <IconButton name="back" label="Back" onPress={() => router.back()} />
        <H1 style={{ flex: 1, fontSize: 24 }}>Budgets</H1>
        <Button title="Add" icon="plus" small onPress={() => startNew()} />
      </Row>
    }>
      {q.isLoading ? <Loading /> : q.error ? <ErrorNote message={problem(q.error)} onRetry={() => q.refetch()} /> : v ? (
        <>
          <Stack gap={8}>
            <Row style={{ justifyContent: "space-between" }}><Text style={s.month}>{v.month.label.split(" ")[0]}</Text><Sub>Day {v.month.day} of {v.month.days} · the same every month</Sub></Row>
            <Bar a={v.month.pace} colorA={color.ink} height={6} />
          </Stack>

          {v.budgets.length === 0 ? (
            <Card style={{ gap: 10 }}>
              <H2>Set your first budget</H2>
              <Sub>A monthly limit for a category or all your spending, or a goal for what comes in and what you keep. We’ll tell you at 80% and if one goes over.</Sub>
              <Row gap={8} style={{ flexWrap: "wrap" }}>
                <Button title="A category" small onPress={() => startNew("category")} />
                <Button title="All spending" small kind="ghost" onPress={() => startNew("spending", null, 0, "All spending")} />
                <Button title="Yours to keep" small kind="ghost" onPress={() => startNew("keep", null, 0, "Yours to keep goal")} />
              </Row>
            </Card>
          ) : null}

          {goals.length ? (
            <View style={s.hero}>
              {goals.map((g) => (
                <Pressable key={g.id} accessibilityRole="button" accessibilityLabel={`${g.name}: ${W(g.actual)} of ${W(g.amount)}. Change it`} onPress={() => open(g)} style={{ gap: 8 }}>
                  <Row style={{ justifyContent: "space-between" }}><Text style={s.heroLabel}>{g.name}</Text><Tag title={STATE[g.state][0]} kind={g.state === "behind" ? "plain" : "ok"} /></Row>
                  <Row gap={8} style={{ alignItems: "baseline" }}>
                    <Amount size={fit(W(g.actual), 30, 10)} style={{ color: g.kind === "keep" ? color.violet : "#FFFFFF" }}>{W(g.actual)}</Amount>
                    <Text style={s.heroOf}>of {W(g.amount)}</Text>
                  </Row>
                  <Bar a={g.pct} b={g.pctWithExtra - g.pct} colorA={g.kind === "keep" ? color.violet : "#FFFFFF"} colorB="rgba(255,255,255,0.3)" track="rgba(255,255,255,0.12)" height={10} />
                  <Text style={s.heroNote}>{g.state === "met" ? `Reached, ${W(g.actual - g.amount)} above the goal` : g.extra ? `${W(g.extra)} more on the way` : `${W(Math.max(0, g.amount - g.actual))} to go`}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {total ? (
            <Card onPress={() => open(total)} label="All spending. Change it" style={{ gap: 10 }}>
              <Row style={{ justifyContent: "space-between" }}><Text style={s.h3}>All spending</Text><Tag title={STATE[total.state][0]} kind={STATE[total.state][1]} /></Row>
              <Row gap={8} style={{ alignItems: "baseline" }}><Amount size={26}>{W(total.actual)}</Amount><Sub>spent of {W(total.amount)}</Sub></Row>
              <Bar a={total.pct} b={total.pctWithExtra - total.pct} colorA={barColor(total)} colorB="#F2B48A" />
              <Sub>{total.actual <= total.amount ? `${W(total.amount - total.actual)} left` : `${W(total.actual - total.amount)} over`}{total.extra ? ` · ${W(total.extra)} more already due this month` : ""}</Sub>
            </Card>
          ) : null}

          {cats.length || v.ideas.length ? (
            <Stack>
              <Row style={{ justifyContent: "space-between" }}><H2>By category</H2>{cats.length ? <Sub>{hot ? `${hot} need${hot === 1 ? "s" : ""} a look` : "All on track"}</Sub> : null}</Row>
              {cats.length ? (
                <Card style={{ paddingVertical: 4 }}>
                  {cats.map((c, i) => (
                    <Pressable key={c.id} accessibilityRole="button" accessibilityLabel={`${c.name}: ${W(c.actual)} of ${W(c.amount)}. Change it`} onPress={() => open(c)} style={[s.cat, i === cats.length - 1 && { borderBottomWidth: 0 }]}>
                      <Row gap={8}><Text style={[s.name, { flex: 1 }]} numberOfLines={1}>{c.name}</Text><Tag title={STATE[c.state][0]} kind={STATE[c.state][1]} /></Row>
                      <Bar a={c.pct} colorA={barColor(c)} />
                      <Row style={{ justifyContent: "space-between" }}>
                        <Sub><Text style={{ fontFamily: font.bold, color: color.ink }}>{W(c.actual)}</Text> of {W(c.amount)}</Sub>
                        <Text style={[s.left, c.state === "over" && { color: color.red }]}>{c.actual <= c.amount ? `${W(c.amount - c.actual)} left` : `${W(c.actual - c.amount)} over`}</Text>
                      </Row>
                    </Pressable>
                  ))}
                </Card>
              ) : null}
              {v.ideas.length ? (
                <Stack gap={8}>
                  <Label>Add a budget for</Label>
                  <Chips>
                    {v.ideas.map((i) => <Chip key={i.categoryId} title={`＋ ${i.name}${i.lastMonth ? `  ${W(i.lastMonth)} last month` : ""}`} onPress={() => startNew("category", i.categoryId, suggest(i.lastMonth || i.thisMonth, cur), i.name)} />)}
                  </Chips>
                </Stack>
              ) : null}
            </Stack>
          ) : null}

          <Stack>
            <H2>Alerts</H2>
            <Card style={{ paddingVertical: 4 }}>
              <Row style={s.toggle}><View style={{ flex: 1 }}><Text style={s.name}>At 80% and when one goes over</Text><Sub>A notification as a limit gets close, and when it’s passed</Sub></View>
                <Switch accessibilityLabel="Alerts at 80% and when over" value={v.settings.alerts} onValueChange={(on) => setAlerts({ alerts: on })} trackColor={{ true: color.violetInk, false: "#CBC7D3" }} thumbColor="#FFFFFF" /></Row>
              <Row style={[s.toggle, { borderBottomWidth: 0 }]}><View style={{ flex: 1 }}><Text style={s.name}>Weekly summary</Text><Sub>Mondays at 8:00, one notification for every budget</Sub></View>
                <Switch accessibilityLabel="Weekly summary" value={v.settings.weekly} onValueChange={(on) => setAlerts({ weekly: on })} trackColor={{ true: color.violetInk, false: "#CBC7D3" }} thumbColor="#FFFFFF" /></Row>
            </Card>
            <Sub>While you record an expense, the category’s budget shows what’s left.</Sub>
          </Stack>
        </>
      ) : null}

      {edit ? (
        <Sheet open onClose={() => setEdit(null)} title={edit.id ? edit.name : "New budget"} sub={current?.official ?? (edit.id ? undefined : "Every month, from this month")}>
          {!edit.id ? (
            <Stack gap={8}>
              <Label>What for</Label>
              <Row gap={8} style={{ flexWrap: "wrap" }}>
                {([["category", "A category"], ["spending", "All spending"], ["income", "Coming in"], ["keep", "Yours to keep"]] as const).map(([k, l]) => (
                  <Chip key={k} title={have.has(k) && k !== "category" ? `${l} (set)` : l} on={edit.kind === k}
                    onPress={() => (have.has(k) && k !== "category" ? open(v!.budgets.find((x) => x.kind === k)!) : setEdit({ ...edit, kind: k, categoryId: null, name: l }))} />
                ))}
              </Row>
              {edit.kind === "category" ? (
                <Chips>{freeCats.map((c) => <Chip key={c.id} title={c.name} on={edit.categoryId === c.id} onPress={() => setEdit({ ...edit, categoryId: c.id, name: c.name })} />)}</Chips>
              ) : null}
            </Stack>
          ) : null}
          <Field label={edit.kind === "income" || edit.kind === "keep" ? `Monthly goal (${cur})` : `Monthly limit (${cur})`} value={edit.amount} onChangeText={(t) => setEdit({ ...edit, amount: t })}
            keyboardType="number-pad" style={{ fontFamily: font.head, fontSize: 26, minHeight: 60 }} error={error} />
          {current ? (
            <Card style={{ backgroundColor: color.bg, borderColor: color.bg, gap: 6 }}>
              <Row style={{ justifyContent: "space-between" }}><Sub>{current.isGoal ? "So far this month" : "Spent this month"}</Sub><Text style={s.fig}>{W(current.actual)} · {current.pct}%</Text></Row>
              {current.lastMonth != null ? <Row style={{ justifyContent: "space-between" }}><Sub>Last month</Sub><Text style={s.fig}>{W(current.lastMonth)}</Text></Row> : null}
              <Row style={{ justifyContent: "space-between" }}><Sub>At this pace by the {v?.month.days}th</Sub><Text style={s.fig}>{W(current.projected)}</Text></Row>
            </Card>
          ) : null}
          {current?.lastMonth ? <Row gap={8}><Chip small title={`Last month ${W(suggest(current.lastMonth, cur))}`} onPress={() => setEdit({ ...edit, amount: asText(suggest(current.lastMonth!, cur)) })} /></Row> : null}
          <Button title={edit.id ? "Save" : "Add budget"} onPress={save} busy={busy} disabled={edit.kind === "category" && !edit.categoryId} />
          {edit.id ? <Button title="Remove this budget" kind="ghost" small onPress={remove} disabled={busy} /> : null}
        </Sheet>
      ) : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  month: { fontFamily: font.bold, fontSize: 15, color: color.ink },
  hero: { backgroundColor: color.ink, borderRadius: 24, padding: 18, gap: 18 },
  heroLabel: { fontFamily: font.semi, fontSize: 13, color: "rgba(255,255,255,0.7)" },
  heroOf: { fontFamily: font.body, fontSize: 14, color: "rgba(255,255,255,0.65)" },
  heroNote: { fontFamily: font.body, fontSize: 13, color: "rgba(255,255,255,0.75)" },
  h3: { fontFamily: font.bold, fontSize: 16, color: color.ink },
  cat: { paddingVertical: 14, gap: 8, borderBottomWidth: 1, borderBottomColor: color.line },
  name: { fontFamily: font.semi, fontSize: 15, color: color.ink },
  left: { fontFamily: font.semi, fontSize: 13, color: color.ink2 },
  toggle: { minHeight: 64, paddingVertical: 10, gap: 12, borderBottomWidth: 1, borderBottomColor: color.line },
  fig: { fontFamily: font.semi, fontSize: 14, color: color.ink, fontVariant: ["tabular-nums"] },
});
