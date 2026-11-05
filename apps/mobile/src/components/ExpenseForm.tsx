import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Chip, Chips, Field, Label, Row, Stack, Sub } from "@/components/ui";
import { quickCategories } from "@/lib/categories";
import { addDays, shortDate } from "@/lib/dates";
import type { ExpenseDraft } from "@/lib/expense";
export { bodyFrom, draftFrom, type ExpenseDraft } from "@/lib/expense";
import { useOutSetup, useToday } from "@/lib/queries";
import { color, font } from "@/theme";

/** Who, how much, VAT, when, category and how it was paid. */
export function ExpenseForm({ value, onChange, readDate }: { value: ExpenseDraft; onChange: (d: ExpenseDraft) => void; readDate?: string | null }) {
  const setup = useOutSetup();
  const today = useToday();
  const s = setup.data;
  const set = (patch: Partial<ExpenseDraft>) => onChange({ ...value, ...patch });
  const cats = quickCategories(s?.categories ?? []);
  const methods = s?.payMethods ?? ["Card", "Bank transfer", "Cash"];
  // Keep the chosen category first so it's in view.
  const ordered = value.categoryId ? [...cats.filter((c) => c.id === value.categoryId), ...cats.filter((c) => c.id !== value.categoryId)] : cats;
  const [showAllCats, setShowAllCats] = useState(false);
  useEffect(() => { if (!value.method && methods[0]) set({ method: methods[0] }); }, [methods[0]]); // eslint-disable-line react-hooks/exhaustive-deps
  const dates = Array.from(new Set([readDate, value.spentOn, today, addDays(today, -1)].filter(Boolean) as string[]));
  return (
    <Stack gap={14}>
      <Field label="Who you paid" value={value.payee} onChangeText={(t) => set({ payee: t })} autoCapitalize="words" />
      <Row gap={10} style={{ alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}><Field label={`Amount paid (${s?.currency ?? ""})`} value={value.gross} onChangeText={(t) => set({ gross: t })} keyboardType="decimal-pad" style={{ fontFamily: font.head, fontSize: 22 }} /></View>
        {s?.vatRegistered ? <View style={{ width: 130 }}><Field label="VAT in it" value={value.vat} onChangeText={(t) => set({ vat: t })} keyboardType="decimal-pad" /></View> : null}
      </Row>
      <Stack gap={8}>
        <Label>When</Label>
        <Row gap={8} style={{ flexWrap: "wrap" }}>
          {dates.map((d) => <Chip key={d} small title={d === today ? "Today" : d === addDays(today, -1) ? "Yesterday" : shortDate(d)} on={value.spentOn === d} onPress={() => set({ spentOn: d })} />)}
        </Row>
      </Stack>
      <Stack gap={8}>
        <Row style={{ justifyContent: "space-between" }}><Label>Category</Label><Sub>{s?.categorySource}</Sub></Row>
        {showAllCats ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <Chip title="Sort later" on={value.categoryId === null} onPress={() => set({ categoryId: null })} />
            {ordered.map((c) => <Chip key={c.id} title={c.name} on={value.categoryId === c.id} onPress={() => { set({ categoryId: c.id }); setShowAllCats(false); }} />)}
          </View>
        ) : (
          <Chips>
            {ordered.slice(0, 6).map((c) => <Chip key={c.id} title={c.name} on={value.categoryId === c.id} onPress={() => set({ categoryId: c.id })} />)}
            <Chip title="All categories…" onPress={() => setShowAllCats(true)} />
          </Chips>
        )}
      </Stack>
      <Stack gap={8}>
        <Label>Paid by</Label>
        <Row gap={8} style={{ flexWrap: "wrap" }}>
          {methods.slice(0, 4).map((m) => <Chip key={m} small title={m} on={value.method === m} onPress={() => set({ method: m })} />)}
        </Row>
      </Stack>
      {s?.businessUse ? (
        <Stack gap={8}>
          <View><Label>Business use</Label><Sub>The personal share stays out of your books</Sub></View>
          <Row gap={8}>
            {[100, 75, 50, 25].map((p) => <Chip key={p} small title={`${p}%`} on={value.bizPct === p} onPress={() => set({ bizPct: p })} />)}
          </Row>
        </Stack>
      ) : null}
      {value.vat && s?.vatRegistered ? <Text style={{ fontFamily: font.body, fontSize: 12.5, color: color.muted }}>VAT you can reclaim goes on your next return.</Text> : null}
    </Stack>
  );
}
