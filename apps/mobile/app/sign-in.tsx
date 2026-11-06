import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon, Logo, type IconName } from "@/components/Icon";
import { Button, Field } from "@/components/ui";
import { problem } from "@/lib/api";
import { useSession } from "@/lib/session";
import { color, font } from "@/theme";

const POINTS: [IconName, string][] = [
  ["invoice", "Send an invoice in under a minute"],
  ["expense", "Record what you spend as it happens"],
  ["in", "Mark payments the moment they land"],
  ["face", "Locked with Face ID"],
];

export default function SignIn() {
  const { signIn, finishTwoStep } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ticket, setTicket] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setBusy(true); setError(null);
    try {
      if (ticket) await finishTwoStep(ticket, code);
      else {
        const r = await signIn(email.trim(), password);
        if (r) setTicket(r.ticket);
      }
    } catch (e) {
      setError(problem(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={s.wrap}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          <View style={{ gap: 22 }}>
            <Logo size={56} light />
            <Text accessibilityRole="header" style={s.h1}>Your business,{"\n"}<Text style={{ color: color.violet }}>in your pocket.</Text></Text>
            {!ticket ? (
              <View style={{ gap: 14 }}>
                {POINTS.map(([icon, text]) => (
                  <View key={text} style={s.point}>
                    <View style={s.pointIc}><Icon name={icon} size={16} stroke={color.violet} width={2.2} /></View>
                    <Text style={s.pointText}>{text}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <View style={s.form}>
            {ticket ? (
              <>
                <Text style={s.formTitle}>Enter the code from your authenticator app</Text>
                <Field label="6-digit code, or a backup code" value={code} onChangeText={setCode} keyboardType="number-pad" autoFocus
                  textContentType="oneTimeCode" autoComplete="one-time-code" onSubmitEditing={go} error={error} />
              </>
            ) : (
              <>
                <Text style={s.formTitle}>Sign in with your BillingEase account</Text>
                <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
                  autoComplete="email" textContentType="emailAddress" />
                <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password"
                  textContentType="password" onSubmitEditing={go} error={error} />
              </>
            )}
            <Button title={ticket ? "Continue" : "Sign in"} onPress={go} busy={busy} disabled={ticket ? code.trim().length < 6 : !email || !password} />
            {ticket ? <Button title="Back" kind="ghost" small onPress={() => { setTicket(null); setCode(""); setError(null); }} /> : (
              <Text style={s.hint}>New to BillingEase? Create your account and set up your business on the web first.</Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#0E0D12" },
  body: { flexGrow: 1, justifyContent: "space-between", padding: 20, paddingTop: 32, gap: 32 },
  h1: { fontFamily: font.head, fontSize: 36, lineHeight: 40, letterSpacing: -1.2, color: "#FFFFFF" },
  point: { flexDirection: "row", alignItems: "center", gap: 12 },
  pointIc: { width: 32, height: 32, borderRadius: 99, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  pointText: { fontFamily: font.medium, fontSize: 15.5, color: "rgba(255,255,255,0.88)" },
  form: { backgroundColor: color.surface, borderRadius: 24, padding: 18, gap: 14 },
  formTitle: { fontFamily: font.bold, fontSize: 16, color: color.ink },
  hint: { fontFamily: font.body, fontSize: 13, color: color.muted, textAlign: "center" },
});
