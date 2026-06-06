import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../services/context";
import { socketService } from "../services/socketService";

const API = "https://zuno.ng/api";

export default function AlertsScreen() {
  const { artisanToken } = useAuth();
  const [alerts,     setAlerts]     = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clearing,   setClearing]   = useState(false);

  useEffect(() => {
    fetchAlerts();

    const unsub = socketService.onJobAlert((job: any) => {
      console.log("[Alerts] Realtime alert received:", job.job_id);
      setAlerts(prev => {
        const exists = prev.find(a => String(a.id) === String(job.job_id));
        if (exists) return prev;
        return [{
          id:         job.job_id,
          title:      job.title || job.category,
          message:    job.message,
          lga:        job.lga,
          budget:     job.budget,
          type:       "job",
          read:       false,
          created_at: new Date().toLocaleTimeString(),
        }, ...prev];
      });
    });

    const interval = setInterval(fetchAlerts, 60000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const fetchAlerts = async () => {
    try {
      const res  = await fetch(`${API}/artisan/alerts`, {
        headers: { Authorization: `Bearer ${artisanToken}` },
      });
      const data = await res.json();
      setAlerts(Array.isArray(data.alerts) ? data.alerts : Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  };

  const deleteAlert = (id: any) => {
    Alert.alert("Delete Alert", "Remove this alert?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          setAlerts(prev => prev.filter(a => a.id !== id));
          try {
            await fetch(`${API}/artisan/alerts/${id}`, {
              method:  "DELETE",
              headers: { Authorization: `Bearer ${artisanToken}` },
            });
          } catch {}
        },
      },
    ]);
  };

  const clearAll = () => {
    Alert.alert("Clear All Alerts", "Remove all your alerts permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All", style: "destructive",
        onPress: async () => {
          setClearing(true);
          setAlerts([]);
          try {
            await fetch(`${API}/artisan/alerts/clear/all`, {
              method:  "DELETE",
              headers: { Authorization: `Bearer ${artisanToken}` },
            });
          } catch {}
          setClearing(false);
        },
      },
    ]);
  };

  const iconFor  = (t: string) => t === "job" ? "🔔" : t === "accepted" ? "✅" : t === "warning" ? "⚠️" : "ℹ️";
  const colorFor = (t: string) => t === "job" ? "#f97316" : t === "accepted" ? "#22c55e" : t === "warning" ? "#facc15" : "#3b82f6";
  const unread   = alerts.filter(a => !a.read).length;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0d0d0d" />
      <View style={s.header}>
        <Text style={s.title}>Alerts</Text>
        <View style={s.headerRight}>
          {unread > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeTxt}>{unread > 99 ? "99+" : unread} new</Text>
            </View>
          )}
          {alerts.length > 0 && (
            <TouchableOpacity style={s.clearBtn} onPress={clearAll} disabled={clearing}>
              {clearing
                ? <ActivityIndicator color="#ef4444" size="small" />
                : <Text style={s.clearBtnTxt}>🗑 Clear All</Text>
              }
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />}>

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator color="#f97316" size="large" />
            <Text style={s.loadingTxt}>Loading alerts...</Text>
          </View>
        ) : alerts.length === 0 ? (
          <View style={s.center}>
            <Text style={s.emptyEmoji}>🔕</Text>
            <Text style={s.emptyTitle}>No Alerts Yet</Text>
            <Text style={s.emptySub}>Go online to start receiving job alerts near you.</Text>
          </View>
        ) : (
          alerts.map((a, i) => (
            <View key={a.id ?? i} style={s.cardWrap}>
              <View style={[s.card, !a.read && s.cardUnread]}>
                <View style={[s.iconBox, { backgroundColor: colorFor(a.type) + "22" }]}>
                  <Text style={s.iconTxt}>{iconFor(a.type)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.cardTop}>
                    <Text style={s.alertTitle}>{a.title || a.service || a.category || "New Alert"}</Text>
                    {!a.read && <View style={s.dot} />}
                  </View>
                  <Text style={s.alertMsg}>{a.message || a.description || ""}</Text>
                  {(a.lga || a.budget) && (
                    <Text style={s.alertMeta}>
                      {a.lga ? `📍 ${a.lga}` : ""}
                      {a.budget ? `  ·  ₦${Number(a.budget).toLocaleString()}` : ""}
                    </Text>
                  )}
                  <Text style={s.alertTime}>{a.time || a.created_at || ""}</Text>
                </View>
                <TouchableOpacity style={s.deleteBtn} onPress={() => deleteAlert(a.id)}>
                  <Text style={s.deleteBtnTxt}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {alerts.length > 0 && (
          <View style={s.footer}>
            <Text style={s.footerTxt}>⚡ Realtime · Tap ✕ to delete</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: "#0d0d0d" },
  header:       { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#1e1e1e", flexDirection: "row", alignItems: "center" },
  title:        { color: "#fff", fontSize: 22, fontWeight: "900", flex: 1 },
  headerRight:  { flexDirection: "row", alignItems: "center", gap: 8 },
  badge:        { backgroundColor: "#f97316", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeTxt:     { color: "#fff", fontSize: 12, fontWeight: "700" },
  clearBtn:     { backgroundColor: "rgba(239,68,68,0.12)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" },
  clearBtnTxt:  { color: "#ef4444", fontSize: 12, fontWeight: "700" },
  center:       { alignItems: "center", paddingTop: 80, paddingHorizontal: 30, gap: 12 },
  loadingTxt:   { color: "#888", fontSize: 14 },
  emptyEmoji:   { fontSize: 48 },
  emptyTitle:   { color: "#fff", fontSize: 18, fontWeight: "800" },
  emptySub:     { color: "#888", textAlign: "center", lineHeight: 20, fontSize: 14 },
  cardWrap:     { paddingHorizontal: 16, paddingTop: 10 },
  card:         { flexDirection: "row", padding: 16, backgroundColor: "#1a1a1a", borderRadius: 14, borderWidth: 1, borderColor: "#2a2a2a", gap: 12, alignItems: "center" },
  cardUnread:   { borderLeftWidth: 3, borderLeftColor: "#f97316" },
  cardTop:      { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  iconBox:      { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  iconTxt:      { fontSize: 20 },
  alertTitle:   { color: "#fff", fontWeight: "700", fontSize: 14, flex: 1 },
  dot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: "#f97316" },
  alertMsg:     { color: "#aaa", fontSize: 13, lineHeight: 18, marginBottom: 4 },
  alertMeta:    { color: "#22c55e", fontSize: 12, marginBottom: 4 },
  alertTime:    { color: "#555", fontSize: 12 },
  deleteBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: "#ef4444", alignItems: "center", justifyContent: "center" },
  deleteBtnTxt: { color: "#fff", fontSize: 14, fontWeight: "900" },
  footer:       { margin: 16, marginTop: 20, backgroundColor: "#1a1a1a", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#2a2a2a" },
  footerTxt:    { color: "#555", fontSize: 12, lineHeight: 18, textAlign: "center" },
});