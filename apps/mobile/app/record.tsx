import type { InvoiceRow } from "@billingease/contracts";
import { currencyDigits } from "@billingease/core";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Chip, Chips, Field, IconButton, Label, Row, Seg, Stack, Sub, useToast } from "@/components/ui";
import { problem } from "@/lib/api";
import { addDays } from "@/lib/dates";
import { CURRENCY_OF, fit, money, padDisplay, padPress, padToMinor, symbol } from "@/lib/money";
import { useInvoices, useOutSetup, useToday, useWrite } from "@/lib/queries";
import { useSession } from "@/lib/session";
import { color, font } from "@/theme";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"];
/** The categories people pick most often, first. */
const COMMON = ["travel", "office", "phone", "premises", "rent", "utilities", "cogs", "advertising", "repairs", "professional", "entertaining", "other"];

/** Money out (an expense already paid) or money in (a customer paying an invoice), number pad first. */
export default function Record() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dir?: string }>();
  const [dir, setDir] = useState<"out" | "in">(params.dir === "in" ? "in" : "out");
  const [typed, setTyped] = useState("");
  const [payee, setPayee] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [day, setDay] = useState<0 | -1>(0);
  const [method, setMethod] = useState<string | null>(null);
  const [inv, setInv] = useState<InvoiceRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { api, business } = useSession();
  const toast = useToast();
  const setup = useOutSetup();
  const today = useToday();
  const open = useInvoices("unpaid");
  const cur = setup.data?.currency ?? CURRENCY_OF[business?.country ?? "uk"];
  const curOf = dir === "in" && inv ? inv.currency : cur;
  const digits = currencyDigits(curOf);
  const minor = Math.round(padToMinor(typed) / 10 ** (2 - digits));

  const cats = useMemo(() => {
    const list = (setup.data?.categories ?? []).filter((c) => c.scope === "business" && !c.capital);
    const rank = (id: string) => { const i = COMMON.findIndex((p) => id.startsWith(p)); return i < 0 ? 99 : i; };
    return list.sort((a, b) => rank(a.id) - rank(b.id)).slice(0, 8);
  }, [setup.data]);
  const methods = dir === "out" ? (setup.data?.payMethods ?? ["Card", "Bank transfer", "Cash"]).slice(0, 4) : ["Bank transfer", "Card", "Cash", ...(business?.country === "lk" ? ["Cheque"] : [])];
  const how = method ?? methods[0];

  const saveOut = useWrite(() => api("createExpense", { body: { spentOn: addDays(today, day), payee: payee.trim(), categoryId: cat, gross: minor, method: how } }));
  const saveIn = useWrite(() => api("recordPayment", { params: { id: inv!.id }, body: { amount: minor, receivedOn: addDays(today, day), method: how } }));
  const busy = saveOut.isPending || saveIn.isPending;
  const can = minor > 0 && (dir === "out" ? payee.trim().length > 0 : !!inv && minor <= inv.open);

  async function save() {
    setError(null);
    try {
      if (dir === "out") {
        await saveOut.mutateAsync(undefined);
        toast(`${money(minor, cur)} to ${payee.trim()} saved`);
      } else {
        await saveIn.mutateAsync(undefined);
        toast(`${money(minor, curOf)} from ${inv!.customerName} recorded`);
      }
      router.back();
    } catch (e) { setError(problem(e)); }
  }

  const shown = symbol(curOf) + padDisplay(typed);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.bg }}>
      <Row style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <IconButton name="close" label="Close" onPress={() => router.back()} />
        <View style={{ flex: 1 }}><Seg options={[["out", "Money out"], ["in", "Money in"]]} value={dir} onChange={(d) => { setDir(d); setMethod(null); setInv(null); setError(null); }} /></View>
        <View style={{ width: 44 }} />
      </Row>

      <View style={{ flex: 1, paddingHorizontal: 16, gap: 14, paddingTop: 12 }}>
        <View style={{ alignItems: "center", gap: 2 }}>
          <Text style={s.eyebrow}>{dir === "out" ? "Money out" : "Money in"}</Text>
          <Text accessibilityLiveRegion="polite" numberOfLines={1} style={[s.amount, { fontSize: fit(shown, 54, 9), color: minor > 0 ? (dir === "in" ? color.violetInk : color.ink) : "#CBC7D3" }]}>{shown}</Text>
        </View>

        {dir === "out" ? (
          <Stack gap={10}>
            <Field placeholder="Who did you pay?" value={payee} onChangeText={setPayee} autoCapitalize="words" />
            <Chips>
              <Chip title="Sort later" on={cat === null} onPress={() => setCat(null)} />
              {cats.map((c) => <Chip key={c.id} title={c.name} on={cat === c.id} onPress={() => setCat(c.id)} />)}
            </Chips>
          </Stack>
        ) : (
          <Stack gap={8}>
            <Label>Which invoice?</Label>
            <Chips>
              {(open.data?.invoices ?? []).map((i) => (
                <Pressable key={i.id} accessibilityRole="button" accessibilityState={{ selected: inv?.id === i.id }}
                  onPress={() => { setInv(i); const d = currencyDigits(i.currency); setTyped(d ? (i.open / 10 ** d).toFixed(d).replace(/\.00$/, "") : String(i.open)); }}
                  style={[s.invChip, inv?.id === i.id && { backgroundColor: color.ink, borderColor: color.ink }]}>
                  <Text numberOfLines={1} style={[s.invName, inv?.id === i.id && { color: "#FFFFFF" }]}>{i.customerName}</Text>
                  <Text style={[s.invSub, inv?.id === i.id && { color: "rgba(255,255,255,0.75)" }]}>{i.number} · {money(i.open, i.currency, "never")}{i.shown === "late" ? " · late" : ""}</Text>
                </Pressable>
              ))}
            </Chips>
            {open.data && open.data.invoices.length === 0 ? <Sub>No invoices are waiting to be paid.</Sub> : null}
            {inv && minor > inv.open ? <Sub style={{ color: color.red }}>That’s more than the {money(inv.open, inv.currency)} still open.</Sub> : null}
          </Stack>
        )}

        <Row gap={8} style={{ justifyContent: "center", flexWrap: "wrap" }}>
          <Chip small title="Today" on={day === 0} onPress={() => setDay(0)} />
          <Chip small title="Yesterday" on={day === -1} onPress={() => setDay(-1)} />
          <View style={{ width: 1, height: 20, backgroundColor: color.line }} />
          {methods.slice(0, 3).map((m) => <Chip small key={m} title={m} on={how === m} onPress={() => setMethod(m)} />)}
        </Row>
        {error ? <Text style={s.error}>{error}</Text> : null}

        <View style={s.pad} accessibilityLabel="Number pad">
          {KEYS.map((k) => (
            <Pressable key={k} accessibilityRole="button" accessibilityLabel={k === "del" ? "Delete" : k === "." ? "Point" : k}
              onPress={() => setTyped((t) => (k === "." && digits === 0 ? t : padPress(t, k)))} style={({ pressed }) => [s.key, pressed && { backgroundColor: color.chip }]}>
              <Text style={s.keyText}>{k === "del" ? "⌫" : k}</Text>
            </Pressable>
          ))}
        </View>
        <Button title={dir === "out" ? "Save expense" : inv ? `Record payment for ${inv.number}` : "Pick an invoice"} onPress={save} busy={busy} disabled={!can} style={{ minHeight: 56, marginBottom: 8 }} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  eyebrow: { fontFamily: font.semi, fontSize: 13, color: color.muted },
  amount: { fontFamily: font.head, letterSpacing: -1.5, fontVariant: ["tabular-nums"] },
  invChip: { minHeight: 48, maxWidth: 220, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: color.line, backgroundColor: color.surface, justifyContent: "center" },
  invName: { fontFamily: font.semi, fontSize: 14, color: color.ink },
  invSub: { fontFamily: font.body, fontSize: 11.5, color: color.muted },
  pad: { marginTop: "auto", flexDirection: "row", flexWrap: "wrap" },
  key: { width: "33.333%", minHeight: 54, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  keyText: { fontFamily: font.headSemi, fontSize: 24, color: color.ink },
  error: { fontFamily: font.semi, fontSize: 13, color: color.red, textAlign: "center" },
});
