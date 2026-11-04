import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";

/** Face ID, Touch ID or fingerprint, when the phone has one set up. Never on the web build. */
export async function biometricsAvailable(): Promise<{ ok: boolean; label: string }> {
  if (Platform.OS === "web") return { ok: false, label: "Face ID" };
  const [hw, enrolled, types] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
  ]);
  const face = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
  const label = Platform.OS === "ios" ? (face ? "Face ID" : "Touch ID") : face ? "face unlock" : "fingerprint";
  return { ok: hw && enrolled, label };
}

/** Asks for Face ID (or the phone's passcode as its fallback). True when it's the owner. */
export async function checkBiometrics(reason: string): Promise<boolean> {
  if (Platform.OS === "web") return true;
  const r = await LocalAuthentication.authenticateAsync({ promptMessage: reason, cancelLabel: "Cancel", disableDeviceFallback: false });
  return r.success;
}
