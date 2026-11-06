import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold } from "@expo-google-fonts/dm-sans";
import { Sora_600SemiBold, Sora_700Bold } from "@expo-google-fonts/sora";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OfflineProvider } from "@/lib/offline";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ToastProvider, useToast } from "@/components/ui";
import { SessionProvider, useSession, type Stage } from "@/lib/session";
import { phoneRoute } from "@/lib/links";
import { setUpPush } from "@/lib/push";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { color } from "@/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});
setUpPush();

/** Where each session stage belongs. Anything inside the app needs "ready". */
const HOME_OF: Record<Exclude<Stage, "starting" | "ready">, string> = { signedOut: "sign-in", pickBusiness: "businesses", locked: "lock" };

/**
 * Tapping a push notification opens the screen it's about, in the business it's from. If the app
 * is locked, it waits until it's unlocked.
 */
function PushTaps() {
  const { stage, business, me, pickBusiness } = useSession();
  const router = useRouter();
  const last = Platform.OS === "web" ? null : Notifications.useLastNotificationResponse();
  const [done, setDone] = useState<string | null>(null);
  useEffect(() => {
    if (!last || stage !== "ready") return;
    const id = last.notification.request.identifier;
    if (done === id) return;
    setDone(id);
    const data = last.notification.request.content.data as { link?: string | null; businessId?: string };
    (async () => {
      if (data.businessId && data.businessId !== business?.id && me?.businesses.some((b) => b.id === data.businessId)) await pickBusiness(data.businessId);
      router.push((phoneRoute(data.link ?? null) ?? "/inbox?tab=updates") as never);
    })();
  }, [last, stage]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function Gate() {
  const { stage } = useSession();
  const segments = useSegments();
  const router = useRouter();
  useEffect(() => {
    if (stage === "starting") return;
    SplashScreen.hideAsync().catch(() => {});
    const at = segments[0] ?? "";
    if (stage === "ready") {
      if (at === "sign-in" || at === "lock" || at === "businesses" || at === "") router.replace("/(tabs)");
      return;
    }
    const want = HOME_OF[stage];
    if (at !== want) router.replace(`/${want}`);
  }, [stage, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="sign-in" options={{ animation: "fade" }} />
      <Stack.Screen name="lock" options={{ animation: "fade" }} />
      <Stack.Screen name="businesses" />
      <Stack.Screen name="record" options={{ presentation: "modal" }} />
      <Stack.Screen name="invoice" options={{ presentation: "modal" }} />
      <Stack.Screen name="me" />
      <Stack.Screen name="scan" options={{ presentation: "modal" }} />
      <Stack.Screen name="check" options={{ presentation: "modal" }} />
      <Stack.Screen name="import" options={{ presentation: "modal" }} />
      <Stack.Screen name="payroll" />
      <Stack.Screen name="budgets" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="outbox" />
    </Stack>
  );
}

/** What the screens last showed is kept on the phone for a week, so they open without signal. */
const WEEK = 7 * 24 * 60 * 60_000;
const persister = createAsyncStoragePersister({ storage: AsyncStorage, key: "be.cache" });

function Offline({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  return <OfflineProvider onSynced={(n) => toast(`Saved ${n} change${n === 1 ? "" : "s"} made offline`)}>{children}</OfflineProvider>;
}

export default function Root() {
  const [fonts] = useFonts({ Sora_600SemiBold, Sora_700Bold, DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold });
  const [qc] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, gcTime: WEEK, retry: 1, networkMode: "offlineFirst" },
    // Writes always run: offline, write() keeps them on the phone itself (React Query would pause them).
    mutations: { networkMode: "always" } } }));
  if (!fonts) return <View style={{ flex: 1, backgroundColor: color.bg }} />;
  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider client={qc} persistOptions={{ persister, maxAge: WEEK, buster: "1" }}>
        <SessionProvider onSignOut={() => persister.removeClient()}>
          <ToastProvider>
            <Offline>
              <StatusBar style="dark" />
              <Gate />
              <PushTaps />
            </Offline>
          </ToastProvider>
        </SessionProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
