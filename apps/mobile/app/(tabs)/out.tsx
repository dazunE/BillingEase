import type { Bill, Expense } from "@billingease/contracts";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/Icon";
import { Button, Card, ErrorNote, H1, IconButton, Loading, Row, Screen, Seg, Sheet, Sub, Tag, useToast } from "@/components/ui";
import { problem } from "@/lib/api";
import { monthStart, shortDate } from "@/lib/dates";
import { money, shortMoney } from "@/lib/money";
import { useBills, useExpenses, useHome, useOutSetup, useToday, useWrite } from "@/lib/queries";
import { useSession } from "@/lib/session";
import { color, font } from "@/theme";

export default function GoingOut() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<"spent" | "bills">(params.tab === "bills" ? "bills" : "spent");
  const [sorting, setSorting] = useState<Expense | null>(null);
  const { api, confirm } = useSession();
  const toast = useToast();
  const home = useHome();
  const today = useToday();
  const from = monthStart(today);
  const exp = useExpenses(from);
  const bills = useBills();
  const pay = useWrite((b: Bill) => api("payBill", { params: { id: b.id }, body: { amount: b.left, paidOn: today, method: "Bank transfer" } }));
  const cur = home.data?.currency ?? "GBP";
  const g = home.data?.goingOut;
  const unsorted = exp.data?.expenses.filter((x) => !x.categoryId).length ?? 0;

  return (
    <Screen
      refreshing={exp.isRefetching || bills.isRefetching} onRefresh={() => { exp.refetch(); bills.refetch(); home.refetch(); }}
      header={
        <Row style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10, justifyContent: "space-between" }}>
          <H1>Going out</H1>
          <Row gap={8}>
            <IconButton name="import" label="Import a bank statement" onPress={() => router.push("/import")} />
            <Button title="Money out" icon="plus" small onPress={() => router.push("/record?dir=out")} />
          </Row>
        </Row>
      }
    >
      {g ? (
        <View style={{ flexDirection: "row", gap: 6 }}>
          <Stat label="Spent" value={shortMoney(exp.data?.totals.businessShare ?? g.paid, cur)} sub={`Since ${shortDate(from)}`} bg={color.orangeTint} />
          <Stat label="Bills to pay" value={shortMoney(bills.data?.totals.open ?? 0, cur)} sub={`${bills.data?.totals.openCount ?? 0} open`} bg={color.surface} border />
          <Stat label="Due soon" value={shortMoney(g.dueSoon, cur)} sub={`${g.dueSoonCount} in 7 days`} bg={color.ink} dark />
        </View>
      ) : null}

      <Seg options={[["spent", "Spent"], ["bills", `Bills${bills.data?.totals.openCount ? ` · ${bills.data.totals.openCount}` : ""}`]]} value={tab} onChange={setTab} />

      {tab === "spent" ? (
        exp.isLoading ? <Loading /> : exp.error ? <ErrorNote message={problem(exp.error)} onRetry={() => exp.refetch()} /> : (
          <>
            {unsorted ? (
              <View style={s.banner}><Icon name="warn" stroke={color.amber} /><Text style={s.bannerText}>{unsorted} need{unsorted === 1 ? "s" : ""} a category. Tap one to sort it.</Text></View>
            ) : null}
            <Card style={{ paddingVertical: 4 }}>
              {exp.data?.expenses.length === 0 ? <Sub style={{ textAlign: "center", paddingVertical: 18 }}>Nothing spent yet this month.</Sub> : null}
              {exp.data?.expenses.map((x, i, all) => (
                <Pressable key={x.id} accessibilityRole="button" accessibilityLabel={`${x.payee}, ${money(x.businessShare, cur)}. Change category`} onPress={() => setSorting(x)}
                  style={[s.row, i === all.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={[s.ic, { backgroundColor: color.orangeTint }]}><Icon name={/travel|car|vehicle/i.test(x.categoryName ?? "") ? "car" : "expense"} size={18} /></View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text numberOfLines={1} style={s.who}>{x.payee}</Text>
                    <Row gap={6}>
                      {!x.categoryId ? <Tag title="Needs a category" kind="warn" /> : null}
                      <Sub numberOfLines={1} style={{ flexShrink: 1 }}>{x.categoryName ?? "No category"} · {shortDate(x.spentOn)}{x.bizPct < 100 ? ` · ${x.bizPct}% business` : ""}</Sub>
                    </Row>
                  </View>
                  <Text style={s.amt}>{money(x.businessShare, cur, "never")}</Text>
                </Pressable>
              ))}
            </Card>
          </>
        )
      ) : bills.isLoading ? <Loading /> : bills.error ? <ErrorNote message={problem(bills.error)} onRetry={() => bills.refetch()} /> : (
        <Card style={{ paddingVertical: 4 }}>
          {bills.data?.bills.length === 0 ? <Sub style={{ textAlign: "center", paddingVertical: 18 }}>No bills waiting.</Sub> : null}
          {bills.data?.bills.map((b, i, all) => {
            const late = b.daysToDue < 0;
            return (
              <View key={b.id} style={[s.row, i === all.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={[s.ic, { backgroundColor: late ? color.redTint : color.orangeTint }]}><Icon name="bill" size={18} /></View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text numberOfLines={1} style={s.who}>{b.supplierName}</Text>
                  <Row gap={6}>
                    <Tag title={late ? `${-b.daysToDue} days overdue` : b.daysToDue === 0 ? "Due today" : `Due ${shortDate(b.dueDate)}`} kind={late ? "late" : b.due === "due_soon" ? "warn" : "plain"} />
                    <Sub numberOfLines={1} style={{ flexShrink: 1 }}>{b.description}</Sub>
                  </Row>
                </View>
                <View style={{ alignItems: "flex-end", gap: 6 }}>
                  <Text style={s.amt}>{money(b.left, b.currency, "never")}</Text>
                  <Button title="Mark paid" small kind="ghost" busy={pay.isPending && pay.variables?.id === b.id} style={{ minHeight: 32, paddingHorizontal: 12 }}
                    onPress={async () => {
                      if (!(await confirm(`Mark ${b.supplierName} paid`))) return;
                      try { await pay.mutateAsync(b); toast(`${b.supplierName} marked paid · ${money(b.left, b.currency)}`); } catch (e) { toast(problem(e)); }
                    }} />
                </View>
              </View>
            );
          })}
        </Card>
      )}
      {sorting ? <CategorySheet x={sorting} onClose={() => setSorting(null)} /> : null}
    </Screen>
  );
}

function Stat({ label, value, sub, bg, dark, border }: { label: string; value: string; sub: string; bg: string; dark?: boolean; border?: boolean }) {
  const fg = dark ? "#FFFFFF" : color.ink;
  return (
    <View style={{ flex: 1, padding: 12, borderRadius: 16, backgroundColor: bg, gap: 4, borderWidth: border ? 1 : 0, borderColor: color.line }}>
      <Text style={{ fontFamily: font.semi, fontSize: 12, color: fg, opacity: 0.8 }}>{label}</Text>
      <Text numberOfLines={1} style={{ fontFamily: font.head, fontSize: 18, color: fg, letterSpacing: -0.5 }}>{value}</Text>
      <Text numberOfLines={1} style={{ fontFamily: font.body, fontSize: 11.5, color: fg, opacity: 0.75 }}>{sub}</Text>
    </View>
  );
}

/** Pick the HMRC or Inland Revenue category for an expense. */
function CategorySheet({ x, onClose }: { x: Expense; onClose: () => void }) {
  const { api } = useSession();
  const toast = useToast();
  const setup = useOutSetup();
  const save = useWrite((categoryId: string) => api("categoriseExpense", { params: { id: x.id }, body: { categoryId } }));
  const cats = (setup.data?.categories ?? []).filter((c) => c.scope === "business");
  return (
    <Sheet open onClose={onClose} title={x.payee} sub={setup.data?.categorySource ?? "Pick a category"}>
      {setup.isLoading ? <Loading /> : (
        <ScrollView style={{ maxHeight: 420 }}>
          {cats.map((c) => {
            const on = c.id === x.categoryId;
            return (
              <Pressable key={c.id} accessibilityRole="button" accessibilityState={{ selected: on }} style={s.catRow}
                onPress={async () => { try { await save.mutateAsync(c.id); toast(`${x.payee} moved to ${c.name}`); onClose(); } catch (e) { toast(problem(e)); } }}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.who, on && { fontFamily: font.bold }]}>{c.name}</Text>
                  <Sub>{c.official}{!c.allowable ? " · not allowable" : ""}</Sub>
                </View>
                {on ? <Icon name="check" stroke={color.violetInk} width={2.6} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </Sheet>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 64, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: color.line },
  ic: { width: 40, height: 40, borderRadius: 99, alignItems: "center", justifyContent: "center" },
  who: { fontFamily: font.semi, fontSize: 15, color: color.ink },
  amt: { fontFamily: font.bold, fontSize: 15, color: color.ink, fontVariant: ["tabular-nums"] },
  banner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 16, backgroundColor: color.amberTint },
  bannerText: { flex: 1, fontFamily: font.semi, fontSize: 14, color: color.amber },
  catRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: color.line },
});
