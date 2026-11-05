import type { Me } from "@billingease/contracts";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import { ApiFailure, call, fileForm, upload, type CallOpts, type PickedFile, type UploadName } from "./api";
import { Platform } from "react-native";
import { biometricsAvailable, checkBiometrics } from "./biometrics";
import { KEYS, storage } from "./storage";
import type { AppEndpointName } from "@billingease/contracts";

export type Stage = "starting" | "signedOut" | "pickBusiness" | "locked" | "ready";
type Business = Me["businesses"][number];

type Session = {
  stage: Stage;
  me: Me | null;
  business: Business | null;
  faceId: { on: boolean; available: boolean; label: string };
  /** Email and password. Returns a ticket when two-step sign-in is on. */
  signIn(email: string, password: string): Promise<{ ticket: string } | null>;
  finishTwoStep(ticket: string, code: string): Promise<void>;
  pickBusiness(id: string): Promise<void>;
  signOut(): Promise<void>;
  unlock(): Promise<boolean>;
  setFaceId(on: boolean): Promise<void>;
  /** Face ID before money is marked as paid out. True to go ahead. */
  confirm(reason: string): Promise<boolean>;
  /** Sends a photo or file (with any other form fields) to an upload endpoint. */
  send<N extends UploadName>(name: N, file: PickedFile, fields?: Record<string, string>): ReturnType<typeof upload<N>>;
  /** Calls the API as the signed-in person in the chosen business. */
  api<N extends AppEndpointName>(name: N, opts?: CallOpts<N>): ReturnType<typeof call<N>>;
};

const Ctx = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [stage, setStage] = useState<Stage>("starting");
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [faceId, setFaceIdState] = useState({ on: false, available: false, label: "Face ID" });
  const authRef = useRef({ token: null as string | null, businessId: null as string | null });
  authRef.current = { token, businessId };

  const clear = useCallback(async () => {
    await storage.set(KEYS.token, null);
    await storage.set(KEYS.business, null);
    setToken(null); setMe(null); setBusinessId(null);
    qc.clear();
    setStage("signedOut");
  }, [qc]);

  /** After a session token: who is this, and which business. */
  const begin = useCallback(async (t: string, lockFirst: boolean) => {
    const who = await call("me", {}, { token: t, businessId: null });
    const saved = await storage.get(KEYS.business);
    const pick = who.businesses.find((b) => b.id === saved) ?? (who.businesses.length === 1 ? who.businesses[0] : null);
    setToken(t); setMe(who); setBusinessId(pick?.id ?? null);
    const bio = await biometricsAvailable();
    const pref = await storage.get(KEYS.faceId);
    const on = bio.ok && pref !== "off";
    setFaceIdState({ on, available: bio.ok, label: bio.label });
    if (!pick) setStage("pickBusiness");
    else setStage(lockFirst && on ? "locked" : "ready");
  }, []);

  // On launch: a saved session opens behind Face ID.
  useEffect(() => {
    (async () => {
      const t = await storage.get(KEYS.token);
      if (!t) { setStage("signedOut"); return; }
      try { await begin(t, true); } catch (e) {
        if (e instanceof ApiFailure && e.status === 401) await clear();
        else { setToken(t); setStage("signedOut"); }
      }
    })();
  }, [begin, clear]);

  // Back from the background: lock again straight away.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "background" && faceId.on) setStage((st) => (st === "ready" ? "locked" : st));
    });
    return () => sub.remove();
  }, [faceId.on]);

  const api = useCallback(<N extends AppEndpointName>(name: N, opts: CallOpts<N> = {}) => {
    const sent = authRef.current;
    return call(name, opts, sent).catch(async (e) => {
      // The session ran out or was ended elsewhere: back to sign-in. Only for the session this
      // request carried, so a late answer from before signing in can't end a new session.
      if (e instanceof ApiFailure && e.status === 401 && sent.token && sent.token === authRef.current.token) await clear();
      throw e;
    });
  }, [clear]);

  const value = useMemo<Session>(() => ({
    stage, me, faceId,
    business: me?.businesses.find((b) => b.id === businessId) ?? null,
    async signIn(email, password) {
      const r = await call("signIn", { body: { email, password } }, { token: null, businessId: null });
      if ("ticket" in r) return { ticket: r.ticket };
      await storage.set(KEYS.token, r.token);
      await begin(r.token, false);
      return null;
    },
    async finishTwoStep(ticket, code) {
      const r = await call("twoStep", { body: { ticket, code } }, { token: null, businessId: null });
      await storage.set(KEYS.token, r.token);
      await begin(r.token, false);
    },
    async pickBusiness(id) {
      await storage.set(KEYS.business, id);
      setBusinessId(id);
      qc.clear();
      setStage("ready");
    },
    async signOut() {
      try { await call("signOut", {}, authRef.current); } catch { /* signed out here either way */ }
      await clear();
    },
    async unlock() {
      const ok = await checkBiometrics("Open BillingEase");
      if (ok) setStage("ready");
      return ok;
    },
    async setFaceId(on) {
      if (on && !(await checkBiometrics(`Turn on ${faceId.label}`))) return;
      await storage.set(KEYS.faceId, on ? "on" : "off");
      setFaceIdState((f) => ({ ...f, on }));
    },
    async confirm(reason) {
      if (!faceId.on) return true;
      return checkBiometrics(reason);
    },
    api,
    async send(name, file, fields) {
      const form = await fileForm(file, fields, Platform.OS === "web");
      return upload(name, form, authRef.current);
    },
  }), [stage, me, faceId, businessId, begin, clear, api, qc]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useSession outside SessionProvider");
  return s;
}
