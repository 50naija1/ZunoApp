import { AppState, AppStateStatus } from "react-native";
import { io, Socket } from "socket.io-client";

const SERVER = "https://zuno.ng";

let socket:      Socket | null = null;
let currentId:   string | number | null = null;
let appStateSub: any = null;

// ── Job alert callbacks ───────────────────────────────────────────────────────
const callbacks = new Set<(job: any) => void>();

// ── Account update callbacks (suspend, unsuspend, verified, plan_updated) ─────
const accountCallbacks = new Set<(update: any) => void>();

// ── Job cancelled by artisan callbacks ───────────────────────────────────────
const jobCancelCallbacks = new Set<(data: any) => void>();

export const socketService = {

  connect(artisanId: string | number) {
    currentId = artisanId;
    this._startSocket(artisanId);
    this._watchAppState();
  },

  _startSocket(artisanId: string | number) {
    if (socket && socket.connected) return;

    // Clean up old socket if exists
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }

    socket = io(SERVER, {
      transports:           ["websocket"],
      reconnection:         true,
      reconnectionAttempts: Infinity,
      reconnectionDelay:    1000,
      reconnectionDelayMax: 5000,
      timeout:              20000,  // connection timeout
      pingTimeout:          60000,  // keep alive — wait 60s before declaring dead
      pingInterval:         25000,  // ping server every 25s to stay alive
    });

    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket?.id);
      socket?.emit("artisan_online", artisanId);
    });

    // ── job_alert: send ack back so server knows it was delivered ──
    socket.on("job_alert", (job: any, ack: any) => {
      console.log("[Socket] job_alert received:", job);
      // Acknowledge immediately so server doesn't fall back to FCM
      if (typeof ack === "function") ack();
      callbacks.forEach(cb => cb(job));
    });

    // ── account_update: admin actions — suspend, unsuspend, verify, plan ──
    socket.on("account_update", (update: any) => {
      console.log("[Socket] account_update received:", update);
      accountCallbacks.forEach(cb => cb(update));
    });

    // ── job_cancelled_by_artisan: artisan cancelled an accepted job ──
    socket.on("job_cancelled_by_artisan", (data: any) => {
      console.log("[Socket] job_cancelled_by_artisan:", data);
      jobCancelCallbacks.forEach(cb => cb(data));
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.log("[Socket] Error:", err.message);
    });

    socket.on("reconnect", (attempt) => {
      console.log("[Socket] Reconnected after", attempt, "attempts");
      // Re-register artisan on every reconnect
      socket?.emit("artisan_online", artisanId);
    });
  },

  // Watch app state — reconnect when app comes to foreground
  _watchAppState() {
    if (appStateSub) return; // already watching

    appStateSub = AppState.addEventListener(
      "change",
      (state: AppStateStatus) => {
        if (state === "active" && currentId) {
          console.log("[Socket] App foregrounded — checking connection...");
          if (!socket || !socket.connected) {
            console.log("[Socket] Reconnecting...");
            this._startSocket(currentId);
          } else {
            // Socket still connected — re-register just in case
            socket.emit("artisan_online", currentId);
          }
        }
      }
    );
  },

  disconnect() {
    if (appStateSub) {
      appStateSub.remove();
      appStateSub = null;
    }
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }
    currentId = null;
    callbacks.clear();
    accountCallbacks.clear();
    jobCancelCallbacks.clear();
  },

  onJobAlert(callback: (job: any) => void): () => void {
    callbacks.add(callback);
    return () => callbacks.delete(callback);
  },

  // Listen for admin account actions — returns unsubscribe function
  onAccountUpdate(callback: (update: any) => void): () => void {
    accountCallbacks.add(callback);
    return () => accountCallbacks.delete(callback);
  },

  // Listen for artisan job cancellations — returns unsubscribe function
  onJobCancelled(callback: (data: any) => void): () => void {
    jobCancelCallbacks.add(callback);
    return () => jobCancelCallbacks.delete(callback);
  },

  isConnected(): boolean {
    return socket?.connected ?? false;
  },

  emitToggle(artisanId: string | number, status: 0 | 1) {
    if (socket && socket.connected) {
      socket.emit("toggle_availability", { artisan_id: artisanId, status });
    }
  },

};