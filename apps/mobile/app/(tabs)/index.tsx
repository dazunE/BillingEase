import type { HomeSummary, NeedsItem, PeriodKey } from "@billingease/contracts";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ALL_KINDS, pushPossible } from "@/lib/push";
import { KEYS, storage } from "@/lib/storage";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Icon, type IconName } from "@/components/Icon";
import { Amount, Bar, Button, Card, ErrorNote, H2, Loading, Row, Screen, Seg, Stack, Sub, Tag, useToast } from "@/components/ui";
import { API_URL, problem } from "@/lib/api";
import { ago, greeting, shortDate } from "@/lib/dates";
import { fit, money, shortMoney } from "@/lib/money";
import { useBills, useBudgets, useHome, useToday, useWrite } from "@/lib/queries";
import { useSession } from "@/lib/session";
import { color, font } from "@/theme";

const NEEDS_ICON: Record<NeedsItem["kind"], IconName> = {
  late: "clock", draft: "invoice", bill: "bill", uncategorised: "expense", tax_id: "warn", vat_number: "warn", vat_threshold: "warn",
};
const NEEDS_TINT: Record<NeedsItem["tone"], string> = { late: color.redTint, due: color.amberTint, info: color.violetTint, neutral: color.chip };

/** The web app's address, for things the phone leaves to the web. */
const WEB = API_URL.replace(/\/app-api$/, "");

export default function Home() {
  const router = useRouter();
  const { me, business, api, confirm } = useSession();
  const [period, setPeriod] = useState<PeriodKey | undefined>(undefined);
  const q = useHome(period);
  const bills = useBills();
  const toast = useToast();
  const today = useToday();
  const remind = useWrite((id: string) => api("remind", { params: { id }, body: { email: true } }));
  const send = useWrite((id: string) => api("issueInvoice", { params: { id }, body: { email: true } }));
  const payBill = useWrite((b: { id: string; amount: number }) => api("payBill", { params: { id: b.id }, body: { amount: b.amount, paidOn: today, method: "Bank transfer" } }));

  const h = q.data;
  const first = (me?.user.name ?? "").split(" ")[0];

  async function act(n: NeedsItem) {
    const id = n.id.replace(/^[a-z]+-/, "");
    try {
      if (n.kind === "late" && n.id !== "late-more") { const r = await remind.mutateAsync(id); toast(r.emailed ? "Reminder emailed" : "Reminder ready to send"); }
      else if (n.kind === "draft") { await send.mutateAsync(id); toast("Invoice sent"); }
      else if (n.kind === "bill") {
        const b = bills.data?.bills.find((x) => x.id === id);
        if (!b) { router.push("/out?tab=bills"); return; }
        if (!(await confirm(`Mark ${b.supplierName} paid`))) return;
        await payBill.mutateAsync({ id, amount: b.left });
        toast(`${b.supplierName} marked paid`);
      } else if (n.kind === "uncategorised") router.push("/out");
      else if (n.kind === "late") router.push("/in?status=late");
      else Linking.openURL(WEB + n.href);
    } catch (e) { toast(problem(e)); }
  }
  const actLabel = (n: NeedsItem) => ({ late: n.id === "late-more" ? "See all late" : "Remind", draft: "Send it", bill: "Mark paid", uncategorised: "Sort them" } as Record<string, string>)[n.kind] ?? "Open on the web";

  return (
    <Screen
      refreshing={q.isRefetching} onRefresh={() => q.refetch()}
      header={
        <Row style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10 }}>
          <Pressable accessibilityRole="button" accessibilityLabel={`${business?.name ?? "Business"}: switch business or open settings`} onPress={() => router.push("/me")} style={{ flex: 1 }}>
            <Sub style={{ fontFamily: font.semi }}>{greeting()}{first ? `, ${first}` : ""}</Sub>
            <Row gap={6}>
              <Text numberOfLines={1} style={s.biz}>{business?.name}</Text>
              <Icon name="down" size={18} width={2.2} />
            </Row>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Account and settings" onPress={() => router.push("/me")} style={s.avatar}>
            <Text style={s.avatarText}>{(me?.user.name ?? "?").split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}</Text>
          </Pressable>
        </Row>
      }
    >
      {q.isLoading ? <Loading /> : q.error ? <ErrorNote message={problem(q.error)} onRetry={() => q.refetch()} /> : h ? (
        <>
          <Hero h={h} onPeriod={setPeriod} />
          <AskForPush />

          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            {([
              ["Scan", "camera", "/scan", color.ink, color.violet],
              ["Invoice", "invoice", "/invoice", color.violetTint, color.ink],
              ["Money out", "expense", "/record?dir=out", color.orangeTint, color.ink],
              ["Money in", "in", "/record?dir=in", color.greenTint, color.ink],
            ] as const).map(([label, icon, href, bg, fg]) => (
              <Pressable key={label} accessibilityRole="button" onPress={() => router.push(href)} style={s.quick}>
                <View style={[s.quickIc, { backgroundColor: bg }]}><Icon name={icon} size={24} stroke={fg} /></View>
                <Text style={s.quickText}>{label}</Text>
              </Pressable>
            ))}
          </View>

          <Stack>
            <Row style={{ justifyContent: "space-between" }}>
              <H2>Needs you{h.needs.length ? <Text style={{ fontFamily: font.bold, fontSize: 14, color: color.muted }}>  · {h.needs.length}</Text> : null}</H2>
            </Row>
            {h.needs.length === 0 ? (
              <Card><Row><View style={[s.needIc, { backgroundColor: color.greenTint }]}><Icon name="check" stroke={color.green} width={2.4} /></View><View style={{ flex: 1 }}><Text style={s.needTitle}>All clear</Text><Sub>Nothing needs you right now.</Sub></View></Row></Card>
            ) : h.needs.slice(0, 5).map((n) => (
              <Card key={n.id} style={{ gap: 12 }}>
                <Row style={{ alignItems: "flex-start" }}>
                  <View style={[s.needIc, { backgroundColor: NEEDS_TINT[n.tone] }]}><Icon name={NEEDS_ICON[n.kind]} /></View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={s.needTitle}>{n.title}</Text>
                    <Sub numberOfLines={2}>{n.body}</Sub>
                  </View>
                  {n.amount != null ? <Text style={s.needAmt}>{money(n.amount, h.currency, "never")}</Text> : null}
                </Row>
                <Button title={actLabel(n)} small kind={n.kind === "late" || n.kind === "draft" || n.kind === "bill" ? "primary" : "ghost"} style={{ alignSelf: "flex-start" }}
                  busy={(remind.isPending && remind.variables === n.id.slice(5)) || (send.isPending && send.variables === n.id.slice(6))} onPress={() => act(n)} />
              </Card>
            ))}
          </Stack>

          <BudgetsCard currency={h.currency} />

          <PeriodCard h={h} />

          {h.activity.length ? (
            <Stack>
              <H2>Lately</H2>
              <Card style={{ paddingVertical: 4 }}>
                {h.activity.slice(0, 5).map((a, i) => (
                  <Row key={a.id} style={[s.act, i === Math.min(4, h.activity.length - 1) && { borderBottomWidth: 0 }]}>
                    <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: color.violet }} />
                    <View style={{ flex: 1 }}><Text style={s.actText}>{a.message}</Text><Sub>{ago(a.createdAt)}</Sub></View>
                  </Row>
                ))}
              </Card>
            </Stack>
          ) : null}
          <Pressable accessibilityRole="link" onPress={() => Linking.openURL(WEB + "/app")} style={{ alignItems: "center", paddingVertical: 8 }}>
            <Row gap={8}><Icon name="web" size={16} stroke={color.muted} /><Text style={{ fontFamily: font.semi, fontSize: 14, color: color.muted }}>Reports, tax and settings are on the web</Text></Row>
          </Pressable>
        </>
      ) : null}
    </Screen>
  );
}

function Hero({ h, onPeriod }: { h: HomeSummary; onPeriod: (p: PeriodKey) => void }) {
  const c = h.currency;
  const keep = money(h.keep, c, "never");
  const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);
  return (
    <View style={s.hero}>
      <Seg dark options={h.periods.map((p) => [p.key, p.label.replace("This year of assessment", "Year so far").replace("This tax year", "Tax year")] as [PeriodKey, string])} value={h.period.key} onChange={onPeriod} />
      <View style={{ gap: 4 }}>
        <Text style={s.heroLabel}>Yours to keep · {h.period.label}</Text>
        <Amount size={fit(keep, 46, 11)} style={{ color: color.violet }}>{keep}</Amount>
        <Text style={s.heroNote}>{h.keep > 0 && h.tax.share > 0 ? `After about ${money(h.tax.share, c, "never")} ${h.tax.label} (estimate)` : h.keep > 0 ? `No ${h.tax.label} expected yet` : `No profit yet, so no ${h.tax.label}`}</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Tile label="Coming in" dot={color.violet} value={money(h.comingIn.total, c, "never")} note={`${shortMoney(h.comingIn.onTheWay, c)} on the way`}
          a={pct(h.comingIn.received, h.comingIn.total)} b={100 - pct(h.comingIn.received, h.comingIn.total)} colorA={color.violet} colorB="rgba(185,163,255,0.4)" empty={h.comingIn.total === 0} />
        <Tile label="Going out" dot={color.orange} value={money(h.goingOut.total, c, "never")} note={`${shortMoney(h.goingOut.toPay, c)} still to pay`}
          a={pct(h.goingOut.paid, h.goingOut.total)} b={100 - pct(h.goingOut.paid, h.goingOut.total)} colorA={color.orange} colorB="rgba(224,117,45,0.4)" empty={h.goingOut.total === 0} />
      </View>
    </View>
  );
}

function Tile({ label, dot, value, note, a, b, colorA, colorB, empty }: { label: string; dot: string; value: string; note: string; a: number; b: number; colorA: string; colorB: string; empty: boolean }) {
  return (
    <View style={s.tile}>
      <Row gap={6}><View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: dot }} /><Text style={s.tileLabel}>{label}</Text></Row>
      <Amount size={fit(value, 21, 10)} style={{ color: "#FFFFFF" }}>{value}</Amount>
      <Bar a={empty ? 0 : a} b={empty ? 0 : b} colorA={colorA} colorB={colorB} track="rgba(255,255,255,0.12)" height={5} />
      <Text style={s.tileNote}>{note}</Text>
    </View>
  );
}

/** Once, after signing in on a phone: offer notifications, with what they're for. */
function AskForPush() {
  const { push, setPush } = useSession();
  const toast = useToast();
  const [asked, setAsked] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => { storage.get(KEYS.pushAsked).then((v) => setAsked(v === "1")); }, []);
  if (asked || push.on || !pushPossible()) return null;
  const done = () => { storage.set(KEYS.pushAsked, "1"); setAsked(true); };
  return (
    <Card style={{ gap: 12, backgroundColor: color.violetTint, borderColor: color.violetTint }}>
      <Row style={{ alignItems: "flex-start" }}>
        <View style={[s.needIc, { backgroundColor: "#FFFFFF" }]}><Icon name="bell" /></View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={s.needTitle}>Know the moment you’re paid</Text>
          <Sub>Payments, late invoices, payroll and tax dates, and budgets. A few a week; change them any time.</Sub>
        </View>
      </Row>
      <Row gap={8}>
        <Button title="Turn on" small busy={busy} onPress={async () => {
          setBusy(true);
          try { await setPush(true, ALL_KINDS); toast("Notifications are on"); } catch (e) { toast(e instanceof Error ? e.message : "That didn’t work"); }
          finally { setBusy(false); done(); }
        }} />
        <Button title="Not now" small kind="ghost" onPress={done} />
      </Row>
    </Card>
  );
}

/** The goal, all spending, and whichever categories need a look. */
function BudgetsCard({ currency }: { currency: string }) {
  const router = useRouter();
  const q = useBudgets();
  const v = q.data;
  if (!v) return null;
  if (!v.budgets.length) {
    return (
      <Card onPress={() => router.push("/budgets")} label="Set a monthly budget">
        <Row><View style={[s.needIc, { backgroundColor: color.orangeTint }]}><Icon name="clock" /></View>
          <View style={{ flex: 1 }}><Text style={s.needTitle}>Set a monthly budget</Text><Sub>For a category, all spending, or what you want to keep.</Sub></View></Row>
      </Card>
    );
  }
  const W = (n: number) => money(n, currency, "never");
  const keep = v.budgets.find((b) => b.kind === "keep");
  const total = v.budgets.find((b) => b.kind === "spending");
  const hot = v.budgets.filter((b) => b.kind === "category" && ["over", "nearly", "fast"].includes(b.state)).sort((a, b) => b.pct - a.pct);
  const rows = [keep, total, ...hot].filter(Boolean).slice(0, 3) as typeof v.budgets;
  const shown = rows.length ? rows : v.budgets.slice(0, 3);
  const rest = v.budgets.length - shown.length;
  return (
    <Card onPress={() => router.push("/budgets")} label="Budgets" style={{ gap: 12 }}>
      <Row style={{ justifyContent: "space-between" }}><Text style={s.needTitle}>Budgets · {v.month.label.split(" ")[0]}</Text><Text style={{ fontFamily: font.semi, fontSize: 14, color: color.violetInk }}>{rest > 0 ? `${rest} more` : "All budgets"}</Text></Row>
      {shown.map((b) => (
        <View key={b.id} style={{ gap: 6 }}>
          <Row style={{ justifyContent: "space-between" }}>
            <Text style={{ fontFamily: font.semi, fontSize: 14, color: color.ink, flexShrink: 1 }} numberOfLines={1}>{b.name}</Text>
            <Text style={{ fontFamily: font.semi, fontSize: 14, color: b.state === "over" ? color.red : color.ink2, fontVariant: ["tabular-nums"] }}>
              {b.isGoal ? `${b.pct}% of ${W(b.amount)}` : b.actual <= b.amount ? `${W(b.amount - b.actual)} left` : `${W(b.actual - b.amount)} over`}
            </Text>
          </Row>
          <Bar a={b.pct} colorA={b.isGoal ? color.violetInk : b.state === "over" ? "#C2412F" : b.state === "ok" ? color.orange : "#E0A100"} height={7} />
        </View>
      ))}
    </Card>
  );
}

function PeriodCard({ h }: { h: HomeSummary }) {
  const p = h.periodCard;
  if (!p) return null;
  const c = h.currency;
  const due = (days: number, date: string) => (days < 0 ? `${-days} days overdue` : days === 0 ? "Due today" : `Due ${shortDate(date)} · in ${days} days`);
  if (p.kind === "quarter") {
    const prev = p.previous;
    return (
      <Card style={{ gap: 12 }}>
        <Sub style={{ fontFamily: font.semi }}>Making Tax Digital</Sub>
        {prev ? (
          <Row style={{ justifyContent: "space-between" }}>
            <Text style={s.needTitle}>{prev.label} update</Text>
            <Tag title={due(prev.daysToDue, prev.due)} kind={prev.daysToDue < 7 ? "warn" : "plain"} />
          </Row>
        ) : null}
        <View style={{ flexDirection: "row", gap: 6 }}>
          {([["Income", p.current.income, color.violetTint, color.ink], ["Expenses", p.current.expenses, color.orangeTint, color.ink], ["Profit", p.current.profit, color.ink, color.violet]] as const).map(([l, v, bg, fg]) => (
            <View key={l} style={{ flex: 1, padding: 10, borderRadius: 12, backgroundColor: bg, gap: 2 }}>
              <Text style={{ fontFamily: font.semi, fontSize: 11.5, color: bg === color.ink ? color.violetTint : color.ink2 }}>{l}</Text>
              <Amount size={15} style={{ color: fg }}>{shortMoney(v, c)}</Amount>
            </View>
          ))}
        </View>
        <Sub>{p.current.label} so far · update due {shortDate(p.current.due)}</Sub>
      </Card>
    );
  }
  const cur = p.previous ?? p.current;
  return (
    <Card style={{ gap: 10 }}>
      <Sub style={{ fontFamily: font.semi }}>{p.title}</Sub>
      <Row style={{ justifyContent: "space-between" }}>
        <Text style={s.needTitle}>{cur.label} return</Text>
        <Tag title={due(cur.daysToDue, cur.due)} kind={cur.daysToDue < 7 ? "warn" : "plain"} />
      </Row>
      <Row style={{ justifyContent: "space-between" }}>
        <Sub>{p.vat ? "VAT to pay" : "SSCL"}{p.sscl && p.vat ? " (with SSCL)" : ""}</Sub>
        <Amount size={18}>{money(cur.vatPayable + (p.sscl ? cur.sscl : 0), c, "never")}</Amount>
      </Row>
    </Card>
  );
}

const s = StyleSheet.create({
  biz: { fontFamily: font.head, fontSize: 22, letterSpacing: -0.6, color: color.ink, flexShrink: 1 },
  avatar: { width: 44, height: 44, borderRadius: 99, backgroundColor: color.ink, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: font.bold, fontSize: 15, color: color.violet },
  hero: { backgroundColor: color.ink, borderRadius: 24, padding: 18, gap: 14 },
  heroLabel: { fontFamily: font.semi, fontSize: 13, color: "rgba(255,255,255,0.7)" },
  heroNote: { fontFamily: font.body, fontSize: 13.5, color: "rgba(255,255,255,0.75)" },
  tile: { flex: 1, padding: 12, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.08)", gap: 8 },
  tileLabel: { fontFamily: font.semi, fontSize: 13, color: "rgba(255,255,255,0.8)" },
  tileNote: { fontFamily: font.body, fontSize: 12, color: "rgba(255,255,255,0.65)" },
  quick: { alignItems: "center", gap: 8, width: 80 },
  quickIc: { width: 56, height: 56, borderRadius: 99, alignItems: "center", justifyContent: "center" },
  quickText: { fontFamily: font.semi, fontSize: 12.5, color: color.ink },
  needIc: { width: 40, height: 40, borderRadius: 99, alignItems: "center", justifyContent: "center" },
  needTitle: { fontFamily: font.bold, fontSize: 15.5, color: color.ink },
  needAmt: { fontFamily: font.bold, fontSize: 15, color: color.ink, fontVariant: ["tabular-nums"] },
  act: { alignItems: "flex-start", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: color.line },
  actText: { fontFamily: font.body, fontSize: 14, color: color.ink, lineHeight: 19 },
});
