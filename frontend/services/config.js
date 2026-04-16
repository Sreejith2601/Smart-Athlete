import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Smart API URL resolver for dev vs production.
 *
 * How it works:
 * ─────────────
 * DEV MODE (Expo Dev Build on real device):
 *   Expo's dev server knows the host machine's LAN IP.
 *   We extract it automatically via Constants.expoGoConfig or the manifest debuggerHost.
 *   This means you NEVER have to hardcode your IP again.
 *
 * PRODUCTION:
 *   Set PRODUCTION_API_URL to your deployed server's URL.
 *
 * Android Emulator:
 *   Android emulator maps 10.0.2.2 → host machine's localhost.
 */

const PRODUCTION_API_URL = "https://your-production-server.com/api";
const DEV_PORT = 5000;

function getDevApiUrl() {
  // If it's web, always use localhost
  if (Platform.OS === "web") {
    return `http://localhost:${DEV_PORT}/api`;
  }

  // Try to get the host IP from Expo's debugger connection
  // This is the most reliable way — Expo already knows the host IP
  let hostIp = null;

  try {
    // Expo SDK 54+ with expo-constants
    const debuggerHost =
      Constants.expoGoConfig?.debuggerHost ||
      Constants.manifest2?.extra?.expoGo?.debuggerHost ||
      Constants.manifest?.debuggerHost;

    if (debuggerHost) {
      // debuggerHost is in format "192.168.x.x:8081", we just need the IP
      hostIp = debuggerHost.split(":")[0];
    }
  } catch (e) {
    console.warn("[Config] Could not auto-detect host IP:", e.message);
  }

  // Fallback for Android emulator
  if (!hostIp && Platform.OS === "android") {
    hostIp = "10.0.2.2"; // Android emulator → host machine
  }

  // Final fallback — your current LAN IP (update if network changes)
  if (!hostIp) {
    hostIp = "192.168.31.112";
    console.warn(`[Config] Using hardcoded fallback IP: ${hostIp}`);
  }

  const url = `http://${hostIp}:${DEV_PORT}/api`;
  console.log(`[Config] API Base URL resolved to: ${url}`);
  return url;
}

const isDev = __DEV__;

function getDevTrainingUrl() {
  if (Platform.OS === "web") {
    return `http://localhost:${DEV_PORT}/api/training-engine`;
  }

  const debuggerHost = Constants.expoGoConfig?.debuggerHost || Constants.manifest?.debuggerHost;
  let hostIp = debuggerHost ? debuggerHost.split(":")[0] : (Platform.OS === "android" ? "10.0.2.2" : "192.168.31.112");
  return `http://${hostIp}:${DEV_PORT}/api/training-engine`;
}

export const API_BASE_URL = isDev ? getDevApiUrl() : PRODUCTION_API_URL;
export const TRAINING_ENGINE_URL = isDev ? getDevTrainingUrl() : "https://your-production-engine.com/api";
export const DEV_API_PORT = DEV_PORT;
