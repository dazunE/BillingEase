import * as DocumentPicker from "expo-document-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ExpenseForm, bodyFrom, type ExpenseDraft } from "@/components/ExpenseForm";
import { Icon } from "@/components/Icon";
import { Button, Card, Footer, H1, IconButton, Row, Sub, useToast } from "@/components/ui";
import { ApiFailure, problem, type PickedFile } from "@/lib/api";
import { useOutSetup, useRefreshAll, useToday } from "@/lib/queries";
import { useSession } from "@/lib/session";
import { color, font } from "@/theme";

type Stage = "pick" | "sending" | "reading" | "manual" | "failed";

/** Longest side of a receipt photo we send: plenty to read, well under the 10 MB limit. */
const MAX_SIDE = 1800;

/** Makes a camera photo small enough to send quickly. PDFs go as they are. */
async function prepare(f: PickedFile, width?: number, height?: number): Promise<PickedFile> {
  if (!f.type.startsWith("image/") || Platform.OS === "web") return f;
  const big = Math.max(width ?? 0, height ?? 0);
  const resize = big > MAX_SIDE ? [width! >= height! ? { resize: { width: MAX_SIDE } } : { resize: { height: MAX_SIDE } }] : [];
  const r = await ImageManipulator.manipulateAsync(f.uri, resize, { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG });
  return { uri: r.uri, name: f.name.replace(/\.\w+$/, "") + ".jpg", type: "image/jpeg" };
}

/** Snap a receipt or bill; the capture agent reads it and the draft waits for you to check. */
export default function Scan() {
  const router = useRouter();
  const { api, send } = useSession();
  const toast = useToast();
  const refresh = useRefreshAll();
  const setup = useOutSetup();
  const today = useToday();
  const [stage, setStage] = useState<Stage>("pick");
  const [file, setFile] = useState<PickedFile | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [captureId, setCaptureId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ExpenseDraft>({ payee: "", gross: "", vat: "", spentOn: today, categoryId: null, method: "", bizPct: 100 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(0);
  useEffect(() => { setDraft((d) => (d.payee || d.gross ? d : { ...d, spentOn: today })); }, [today]);

  async function picked(f: PickedFile, w?: number, h?: number) {
    const ready = await prepare(f, w, h);
    setFile(ready); setError(null); setStage("sending");
    try {
      const c = await send("capture", ready);
      setCaptureId(c.id); started.current = Date.now(); setStage("reading");
    } catch (e) {
      // Reading isn't available (no Vertex AI, the agent is off, or this month's AI budget is used):
      // the photo still goes on the expense you fill in.
      if (e instanceof ApiFailure && ["ai_not_set_up", "agent_off", "agent_budget_reached"].includes(e.code)) { setNote(e.message); setStage("manual"); return; }
      setError(problem(e)); setStage("pick");
    }
  }

  async function camera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { setError("BillingEase needs the camera to snap receipts. You can turn it on in Settings, or choose a photo instead."); return; }
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!r.canceled && r.assets[0]) { const a = r.assets[0]; picked({ uri: a.uri, name: a.fileName ?? "receipt.jpg", type: a.mimeType ?? "image/jpeg" }, a.width, a.height); }
  }
  async function library() {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!r.canceled && r.assets[0]) { const a = r.assets[0]; picked({ uri: a.uri, name: a.fileName ?? "receipt.jpg", type: a.mimeType ?? "image/jpeg" }, a.width, a.height); }
  }
  async function pdf() {
    const r = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"], copyToCacheDirectory: true });
    if (!r.canceled && r.assets[0]) { const a = r.assets[0]; picked({ uri: a.uri, name: a.name, type: a.mimeType ?? "application/pdf" }); }
  }

  // While it's being read: ask every two seconds, for up to a minute and a half.
  useEffect(() => {
    if (stage !== "reading" || !captureId) return;
    const t = setInterval(async () => {
      try {
        const list = await api("captures");
        const c = list.captures.find((x) => x.id === captureId);
        if (c?.status === "done" && c.proposalId) { clearInterval(t); refresh(); router.replace(`/check?id=${c.proposalId}`); }
        else if (c?.status === "done") { clearInterval(t); setNote("We couldn’t find a receipt in that photo. Fill it in instead."); setStage("manual"); }
        else if (c?.status === "failed") { clearInterval(t); setNote(c.error ?? "We couldn’t read that one."); setStage("failed"); }
        else if (Date.now() - started.current > 90_000) {
          clearInterval(t); refresh();
          toast("Still reading. It’ll be in Inbox → To check");
          router.back();
        }
      } catch { /* try again on the next tick */ }
    }, 2000);
    return () => clearInterval(t);
  }, [stage, captureId, api, refresh, router, toast]);

  async function saveManual() {
    const body = bodyFrom(draft, setup.data?.currency ?? "GBP", !!setup.data?.vatRegistered);
    if (!body) return;
    setBusy(true); setError(null);
    try {
      const x = await api("createExpense", { body });
      if (file) {
        try { await send("uploadAttachment", file, { ownerType: "expense", ownerId: x.id }); }
        catch { toast("Saved, but the photo didn’t attach. Add it on the web."); }
      }
      refresh();
      toast(`${x.payee} saved${file ? " with its receipt" : ""}`);
      router.back();
    } catch (e) { setError(problem(e)); } finally { setBusy(false); }
  }

  async function retry() {
    if (!captureId) return;
    try { await api("retryCapture", { params: { id: captureId } }); started.current = Date.now(); setStage("reading"); }
    catch (e) { setError(problem(e)); }
  }

  const ready = !!bodyFrom(draft, setup.data?.currency ?? "GBP", !!setup.data?.vatRegistered);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: stage === "pick" ? "#0E0D12" : color.bg }}>
      <Row style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <IconButton name="close" label="Close" onPress={() => router.back()} />
        <Text style={[s.title, stage === "pick" && { color: "#FFFFFF" }]}>{stage === "manual" ? "Add the expense" : "Scan a receipt"}</Text>
        <View style={{ width: 44 }} />
      </Row>

      {stage === "pick" ? (
        <View style={{ flex: 1, padding: 20, justifyContent: "space-between" }}>
          <View style={{ gap: 12, marginTop: 24 }}>
            <View style={s.frame}><Icon name="camera" size={56} stroke={color.violet} width={1.4} /></View>
            <Text style={s.lead}>Snap the whole receipt or bill. We read the shop, the amount, the VAT and the date, and suggest a category for you to check.</Text>
            {error ? <Text style={s.err}>{error}</Text> : null}
          </View>
          <View style={{ gap: 10 }}>
            {Platform.OS !== "web" ? <Button title="Take a photo" icon="camera" onPress={camera} /> : null}
            <Button title="Choose from photos" kind="white" onPress={library} />
            <Button title="Choose a PDF or file" kind="glass" onPress={pdf} />
            <Text style={s.pickNote}>No receipt? Record it with the number pad from ＋.</Text>
          </View>
        </View>
      ) : null}

      {stage === "sending" || stage === "reading" ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 18 }}>
          {file && file.type.startsWith("image/") ? <Image source={{ uri: file.uri }} style={s.thumb} resizeMode="cover" /> : <View style={[s.thumb, { alignItems: "center", justifyContent: "center", backgroundColor: color.surface }]}><Icon name="invoice" size={40} /></View>}
          <ActivityIndicator color={color.violetInk} />
          <H1 style={{ fontSize: 22, textAlign: "center" }}>{stage === "sending" ? "Sending your receipt…" : "Reading your receipt…"}</H1>
          <Sub style={{ textAlign: "center", maxWidth: 280 }}>Usually a few seconds. You can close this; the draft will wait in Inbox → To check.</Sub>
          <Button title="Close and keep going" kind="ghost" small onPress={() => { refresh(); router.back(); }} />
        </View>
      ) : null}

      {stage === "failed" ? (
        <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 14 }}>
          <H1 style={{ fontSize: 22 }}>We couldn’t read that one</H1>
          <Sub>{note}</Sub>
          <Button title="Try reading it again" onPress={retry} />
          <Button title="Fill it in myself" kind="ghost" onPress={() => { setNote(null); setStage("manual"); }} />
        </View>
      ) : null}

      {stage === "manual" ? (
        <>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
            {note ? <Card style={{ backgroundColor: color.violetTint, borderColor: color.violetTint }}><Sub style={{ color: color.ink2 }}>{note}</Sub></Card> : null}
            {file && file.type.startsWith("image/") ? (
              <Row><Image source={{ uri: file.uri }} style={s.mini} /><Sub style={{ flex: 1 }}>The photo is attached to the expense when you save it.</Sub></Row>
            ) : null}
            <ExpenseForm value={draft} onChange={setDraft} />
            {error ? <Text style={[s.err, { color: color.red }]}>{error}</Text> : null}
          </ScrollView>
          <Footer><Button title="Save expense" onPress={saveManual} busy={busy} disabled={!ready} /></Footer>
        </>
      ) : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  title: { flex: 1, textAlign: "center", fontFamily: font.bold, fontSize: 16, color: color.ink },
  frame: { alignSelf: "center", width: 220, height: 280, borderRadius: 24, borderWidth: 3, borderColor: "rgba(185,163,255,0.6)", borderStyle: "dashed", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  lead: { fontFamily: font.body, fontSize: 15.5, lineHeight: 22, color: "rgba(255,255,255,0.85)", textAlign: "center" },
  err: { fontFamily: font.semi, fontSize: 14, color: "#FFB4A8", textAlign: "center" },
  pickNote: { fontFamily: font.body, fontSize: 13, color: "rgba(255,255,255,0.6)", textAlign: "center" },
  thumb: { width: 150, height: 200, borderRadius: 14, transform: [{ rotate: "-3deg" }] },
  mini: { width: 56, height: 74, borderRadius: 8 },
});
