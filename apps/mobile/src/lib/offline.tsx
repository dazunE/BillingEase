import type { BodyOf, ResponseOf } from "@billingease/contracts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import * as FileSystem from "expo-file-system/legacy";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState, Platform } from "react-native";
import { APP_ENDPOINTS } from "@billingease/contracts";
import { ApiFailure, call, fileForm, upload, type PickedFile } from "./api";
import { newKey, Outbox, type Queueable, type Queued } from "./outbox";
import { useRefreshAll } from "./queries";
import { useSession } from "./session";

type WriteOpts<N extends Queueable> = { params?: Record<string, string>; body?: BodyOf<(typeof APP_ENDPOINTS)[N]> };
/** Saved now (with the API's answer), or kept on the phone to send later. */
export type WriteResult<R = unknown> = { queued: false; result: R } | { queued: true; result?: undefined };

type Offline = {
  online: boolean;
  waiting: Queued[];
  failed: Queued[];
  syncing: boolean;
  /**
   * Saves now when there's signal, else keeps it on the phone to send later. Either way it goes
   * with one Idempotency-Key, so it's never saved twice. Throws ApiFailure when the API refuses it.
   */
  write<N extends Queueable>(name: N, opts: WriteOpts<N>, label: string): Promise<WriteResult<ResponseOf<(typeof APP_ENDPOINTS)[N]>>>;
  /** A receipt photo taken without signal: kept in the app's files, sent to be read later. */
  queueCapture(file: PickedFile, label: string): Promise<void>;
  syncNow(): Promise<void>;
  retry(id: string): Promise<void>;
  discard(id: string): Promise<void>;
};

const Ctx = createContext<Offline | null>(null);
const DIR = (FileSystem.documentDirectory ?? "") + "outbox/";
/** The outbox lives in AsyncStorage: bigger than the Keychain allows, and it holds no secrets. */
const store = {
  get: (k: string) => AsyncStorage.getItem(k),
  set: (k: string, v: string | null) => (v === null ? AsyncStorage.removeItem(k) : AsyncStorage.setItem(k, v)),
};

export function OfflineProvider({ children, onSynced }: { children: ReactNode; onSynced?: (sent: number) => void }) {
  const { me, business, stage, authFor } = useSession();
  const refresh = useRefreshAll();
  const [online, setOnline] = useState(true);
  const [items, setItems] = useState<Queued[]>([]);
  const [syncing, setSyncing] = useState(false);
  const box = useMemo(() => (me ? new Outbox(store, `be.outbox.${me.user.id}`) : null), [me?.user.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const onlineRef = useRef(online);
  onlineRef.current = online;

  useEffect(() => {
    if (!box) { setItems([]); return; }
    const off = box.subscribe(setItems);
    box.load();
    return off;
  }, [box]);

  useEffect(() => NetInfo.addEventListener((s) => setOnline(s.isConnected !== false && s.isInternetReachable !== false)), []);
  // In a browser NetInfo can miss going offline (it watches navigator.connection), so listen here too.
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    if (navigator.onLine === false) off();
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  /** Sends one queued item. Lost connection → { offline }; refusal → { message }. */
  const sendOne = useCallback(async (item: Queued) => {
    const auth = authFor(item.businessId);
    try {
      if (item.kind === "upload") {
        const form = await fileForm(item.file, {}, Platform.OS === "web");
        await upload("capture", form, auth, fetch, item.id);
        if (Platform.OS !== "web") await FileSystem.deleteAsync(item.file.uri, { idempotent: true }).catch(() => {});
      } else {
        await call(item.name, { params: item.params, body: item.body as never }, auth, fetch, item.id);
      }
    } catch (e) {
      // Still saving from an earlier try, or no connection: leave it for the next flush.
      if (e instanceof ApiFailure && (e.code === "offline" || e.code === "still_saving" || e.status >= 500)) throw { offline: true };
      throw { message: e instanceof ApiFailure ? (e.fields ? Object.values(e.fields)[0] ?? e.message : e.message) : "BillingEase couldn’t save this." };
    }
  }, [authFor]);

  const syncNow = useCallback(async () => {
    if (!box || stage !== "ready" || !onlineRef.current || !box.waiting().length) return;
    setSyncing(true);
    try {
      const r = await box.flush(sendOne);
      if (r.sent) { refresh(); onSynced?.(r.sent); }
    } finally { setSyncing(false); }
  }, [box, stage, sendOne, refresh, onSynced]);

  // Back online, back in the app, signed in: send what's waiting. And every 30s while anything waits.
  useEffect(() => { if (online) syncNow(); }, [online, stage]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => { if (s === "active") syncNow(); });
    return () => sub.remove();
  }, [syncNow]);
  useEffect(() => {
    if (!items.some((i) => !i.error)) return;
    const t = setInterval(syncNow, 30_000);
    return () => clearInterval(t);
  }, [items, syncNow]);

  const value = useMemo<Offline>(() => ({
    online, syncing,
    waiting: items.filter((i) => !i.error),
    failed: items.filter((i) => !!i.error),
    async write(name, opts, label) {
      if (!box || !business) throw new ApiFailure(0, "offline", "Sign in again to save this.");
      const item: Queued = { id: newKey(), kind: "call", name, params: opts.params, body: opts.body, businessId: business.id, label, at: new Date().toISOString() };
      if (onlineRef.current && !box.waiting().length) {
        try {
          const result = await call(name, { params: opts.params, body: opts.body as never }, authFor(business.id), fetch, item.id);
          refresh();
          return { queued: false, result } as never;
        } catch (e) {
          if (!(e instanceof ApiFailure && e.code === "offline")) throw e;
        }
      }
      // No signal (or older writes still waiting, which go first): keep it for later.
      await box.add(item);
      if (onlineRef.current) syncNow();
      return { queued: true } as never;
    },
    async queueCapture(file, label) {
      if (!box || !business) return;
      let kept = file;
      if (Platform.OS !== "web") {
        await FileSystem.makeDirectoryAsync(DIR, { intermediates: true }).catch(() => {});
        const to = DIR + `${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        await FileSystem.copyAsync({ from: file.uri, to });
        kept = { ...file, uri: to };
      }
      await box.add({ id: newKey(), kind: "upload", name: "capture", file: kept, businessId: business.id, label, at: new Date().toISOString() });
    },
    syncNow,
    async retry(id) { await box?.retry(id); await syncNow(); },
    async discard(id) {
      const it = box?.list().find((i) => i.id === id);
      if (it?.kind === "upload" && Platform.OS !== "web") await FileSystem.deleteAsync(it.file.uri, { idempotent: true }).catch(() => {});
      await box?.remove(id);
    },
  }), [online, syncing, items, box, business, authFor, refresh, syncNow]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOffline() {
  const o = useContext(Ctx);
  if (!o) throw new Error("useOffline outside OfflineProvider");
  return o;
}
/** For components that may render outside the provider (the sign-in screen). */
export function useOfflineMaybe() { return useContext(Ctx); }
