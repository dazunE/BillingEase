import { PUSH_KINDS, type PushKind } from "@billingease/contracts";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { KEYS, storage } from "./storage";

export const KIND_LABELS: Record<PushKind, [string, string]> = {
  paid: ["Money in", "When a customer pays"],
  late: ["Late invoices", "The day one goes late"],
  payroll: ["Payroll", "When a run is ready, and EPF, ETF, APIT or HMRC dates"],
  accountant: ["Your accountant", "Requests and messages"],
  deadlines: ["Tax deadlines", "A week before each one"],
  drafts: ["Drafts to check", "When a receipt or statement has been read"],
  budgets: ["Budgets", "At 80%, when one goes over, and Mondays"],
};
export const ALL_KINDS: PushKind[] = [...PUSH_KINDS];

/** Phones only: the web build (for testing) and simulators can't get push notifications. */
export const pushPossible = () => Platform.OS !== "web" && Device.isDevice;

/** Show notifications while the app is open too. */
export function setUpPush() {
  if (Platform.OS === "web") return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: true }),
  });
  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", { name: "BillingEase", importance: Notifications.AndroidImportance.DEFAULT }).catch(() => {});
  }
}

export type PushState = { on: boolean; kinds: PushKind[]; token: string | null };

export async function savedPush(): Promise<PushState> {
  const [token, kinds] = await Promise.all([storage.get(KEYS.pushToken), storage.get(KEYS.pushKinds)]);
  return { on: !!token, token, kinds: kinds ? (JSON.parse(kinds) as PushKind[]).filter((k) => ALL_KINDS.includes(k)) : ALL_KINDS };
}

/**
 * Asks the phone for permission and an Expo push token. Throws a plain-words Error when it can't
 * (permission refused, no Expo project ID, a simulator).
 */
export async function getPushToken(): Promise<string> {
  if (!pushPossible()) throw new Error("Notifications only work on a phone, not in a browser or simulator.");
  const have = await Notifications.getPermissionsAsync();
  const asked = have.granted ? have : await Notifications.requestPermissionsAsync();
  if (!asked.granted) throw new Error("Notifications are off for BillingEase. Turn them on in your phone’s Settings.");
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) throw new Error("This build of the app has no Expo project ID, so it can’t get notifications.");
  return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
}

export async function rememberPush(token: string | null, kinds: PushKind[]) {
  await storage.set(KEYS.pushToken, token);
  await storage.set(KEYS.pushKinds, JSON.stringify(kinds));
}
