import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const API = "https://zuno.ng/api";

// ── How notifications appear when app is in foreground ──
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

// ── Register device and send FCM token to your server ──
export async function setupPushNotifications(artisanToken: string): Promise<void> {
  if (!Device.isDevice) return;

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("job_alerts", {
        name:             "Job Alerts",
        importance:       Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor:       "#f97316",
        enableVibrate:    true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }

    // ── Resolve EAS project ID (required by newer Expo SDK) ──
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      throw new Error("[Push] EAS Project ID not found. Check your app.json / eas.json.");
    }

    const { data: pushToken } = await Notifications.getExpoPushTokenAsync({ projectId });

    await fetch(`${API}/artisan/fcm-token`, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${artisanToken}`,
      },
      body: JSON.stringify({ fcm_token: pushToken }),
    });

    console.log("[Push] Registered:", pushToken);
  } catch (err) {
    console.log("[Push] Setup error:", err);
  }
}

// ── Listen for notification taps (app in background or closed) ──
export function setupNotificationListeners(
  onJobAlert: (jobId: string) => void
): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data as Record<string, unknown>;
    if (data?.job_id) {
      onJobAlert(String(data.job_id));
    }
  });

  return () => sub.remove();
}