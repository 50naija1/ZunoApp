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
import { useAuth } from "./context";

const API = "https://zuno.ng/api";

export default function JobsScreen() {
  const { artisanToken } = useAuth();
  const [jobs,       setJobs]       = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting,  setAccepting]  = useState<string | null>(null);
  const [clearing,   setClearing]   = useState(false);

  // ── Only fetch when token is available ──────────────────────────────────────
  useEffect(() => {
    if (!artisanToken) {
      setLoading(false);
      return;
    }
    fetchJobs();
    const interval = setInterval(fetchJobs, 10000);
    return () => clearInterval(interval);
  }, [artisanToken]); // re-runs when token becomes available

  const fetchJobs = async () => {
    if (!artisanToken) return; // guard — never send a null token
    try {
      const res  = await fetch(`${API}/artisan/alerts`, {
        headers: { Authorization: `Bearer ${artisanToken}` },
      });
      if (res.status === 401) {
        // Token invalid or expired — stop silently, don't crash
        setJobs([]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setJobs(data.alerts || data.jobs || []);
    } catch {
      // Network error — keep existing jobs on screen
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  };

  const acceptJob = async (jobId: string) => {
    if (!artisanToken) return;
    setAccepting(jobId);
    try {
      const res  = await fetch(`${API}/artisan/jobs/${jobId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${artisanToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert("✅ Job Accepted!", data.message || "You accepted this job. Contact the client now.");
        fetchJobs();
      } else {
        Alert.alert("Could not accept", data.message || "This job may no longer be available.");
      }
    } catch {
      Alert.alert("Error", "No internet connection. Please try again.");
    }
    setAccepting(null);
  };

  // ── Delete single job alert ──────────────────────────────────────────────────
  const deleteJob = (id: any) => {
    Alert.alert("Delete Job", "Remove this job from your list?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          setJobs(prev => prev.filter(j => j.id !== id));
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

  // ── Clear all job history ────────────────────────────────────────────────────
  const clearAll = () => {
    Alert.alert("Clear All Jobs", "Remove all job history permanently?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All", style: "destructive",
        onPress: async () => {
          setClearing(true);
          setJobs([]);
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

  const pendingJobs  = jobs.filter(j => j.status !== "accepted");
  const acceptedJobs = jobs.filter(j => j.status === "accepted");

  // ── No token — show friendly message instead of blank screen ────────────────
  if (!artisanToken) {
    return (
      <View style={s.root}>
        <StatusBar barStyle="light-content" backgroundColor="#f97316" />
        <View style={s.header}>
          <View>
            <Text style={s.headerTag}>MY JOBS</Text>
            <Text style={s.headerTitle}>Job Alerts</Text>
          </View>
        </View>
        <View style={s.center}>
          <Text style={s.emptyEmoji}>🔒</Text>
          <Text style={s.emptyTitle}>Not Logged In</Text>
          <Text style={s.emptySub}>Please log in as an artisan to see your job alerts.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#f97316" />

      <View style={s.header}>
        <View>
          <Text style={s.headerTag}>MY JOBS</Text>
          <Text style={s.headerTitle}>Job Alerts</Text>
        </View>
        <View style={s.headerRight}>
          {jobs.length > 0 && (
            <TouchableOpacity style={s.clearBtn} onPress={clearAll} disabled={clearing}>
              {clearing
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.clearBtnTxt}>🗑 Clear</Text>
              }
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.refreshBtn} onPress={onRefresh}>
            <Text style={s.refreshTxt}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />}>

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator color="#f97316" size="large" />
            <Text style={s.loadingTxt}>Loading jobs...</Text>
          </View>
        ) : jobs.length === 0 ? (
          <View style={s.center}>
            <Text style={s.emptyEmoji}>📋</Text>
            <Text style={s.emptyTitle}>No Job Alerts Yet</Text>
            <Text style={s.emptySub}>Make sure your availability is ON to receive job alerts near you.</Text>
          </View>
        ) : (
          <>
            {pendingJobs.length > 0 && (
              <>
                <Text style={s.sectionLabel}>NEW ALERTS</Text>
                {pendingJobs.map((job: any, i: number) => (
                  <View key={job.id ?? i} style={[s.card, s.cardNew]}>
                    <View style={s.cardTop}>
                      <Text style={s.jobTitle}>{job.title || job.service || job.category || "New Job"}</Text>
                      <View style={s.badgeNew}><Text style={s.badgeNewTxt}>NEW</Text></View>
                      <TouchableOpacity style={s.deleteBtn} onPress={() => deleteJob(job.id)}>
                        <Text style={s.deleteBtnTxt}>✕</Text>
                      </TouchableOpacity>
                    </View>
                    {!!job.description && <Text style={s.jobDesc}>{job.description}</Text>}
                    <View style={s.metaRow}>
                      {!!job.lga && <Text style={s.metaItem}>📍 {job.lga}</Text>}
                      {!!job.budget && <Text style={s.metaBudget}>₦{Number(job.budget).toLocaleString()}</Text>}
                    </View>
                    <Text style={s.jobTime}>{job.created_at || job.time || "Just now"}</Text>
                    <TouchableOpacity
                      style={s.acceptBtn}
                      onPress={() => acceptJob(job.id)}
                      disabled={accepting === String(job.id)}
                      activeOpacity={0.85}>
                      {accepting === String(job.id)
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={s.acceptBtnTxt}>✅ Accept Job →</Text>
                      }
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}

            {acceptedJobs.length > 0 && (
              <>
                <Text style={s.sectionLabel}>ACCEPTED</Text>
                {acceptedJobs.map((job: any, i: number) => (
                  <View key={job.id ?? i} style={[s.card, s.cardAccepted]}>
                    <View style={s.cardTop}>
                      <Text style={s.jobTitle}>{job.title || job.service || job.category || "Job"}</Text>
                      <View style={s.badgeAccepted}><Text style={s.badgeAcceptedTxt}>✓ Accepted</Text></View>
                      <TouchableOpacity style={s.deleteBtnGreen} onPress={() => deleteJob(job.id)}>
                        <Text style={s.deleteBtnTxt}>✕</Text>
                      </TouchableOpacity>
                    </View>
                    {!!job.description && <Text style={s.jobDesc}>{job.description}</Text>}
                    <View style={s.metaRow}>
                      {!!job.lga && <Text style={s.metaItem}>📍 {job.lga}</Text>}
                      {!!job.budget && <Text style={s.metaBudget}>₦{Number(job.budget).toLocaleString()}</Text>}
                    </View>
                    {!!job.phone && (
                      <View style={s.phoneRow}>
                        <Text style={s.phoneIcon}>📞</Text>
                        <Text style={s.phoneNum}>{job.phone}</Text>
                      </View>
                    )}
                    <Text style={s.jobTime}>{job.created_at || job.time || "Just now"}</Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: "#111" },
  header:          { backgroundColor: "#f97316", paddingTop: 52, paddingBottom: 18, paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  headerTag:       { color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  headerTitle:     { color: "#fff", fontSize: 28, fontWeight: "900", marginTop: 2 },
  headerRight:     { flexDirection: "row", gap: 8, alignItems: "center" },
  clearBtn:        { backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  clearBtnTxt:     { color: "#fff", fontSize: 12, fontWeight: "700" },
  refreshBtn:      { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  refreshTxt:      { color: "#fff", fontSize: 13, fontWeight: "600" },
  center:          { alignItems: "center", paddingTop: 80, paddingHorizontal: 30, gap: 12 },
  loadingTxt:      { color: "#888", fontSize: 14 },
  emptyEmoji:      { fontSize: 48 },
  emptyTitle:      { color: "#fff", fontSize: 18, fontWeight: "800" },
  emptySub:        { color: "#888", textAlign: "center", lineHeight: 20, fontSize: 14 },
  sectionLabel:    { color: "#555", fontSize: 11, fontWeight: "800", letterSpacing: 1.5, marginHorizontal: 16, marginTop: 20, marginBottom: 6 },
  card:            { marginHorizontal: 16, marginTop: 8, borderRadius: 16, padding: 16, borderWidth: 1 },
  cardNew:         { backgroundColor: "#1a1a1a", borderColor: "#f97316" },
  cardAccepted:    { backgroundColor: "#0d1a0d", borderColor: "#22c55e" },
  cardTop:         { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  jobTitle:        { color: "#fff", fontWeight: "800", fontSize: 16, flex: 1 },
  badgeNew:        { backgroundColor: "#f97316", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeNewTxt:     { color: "#fff", fontSize: 11, fontWeight: "800" },
  badgeAccepted:   { backgroundColor: "rgba(34,197,94,0.15)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeAcceptedTxt:{ color: "#22c55e", fontSize: 11, fontWeight: "700" },
  deleteBtn:       { width: 28, height: 28, borderRadius: 14, backgroundColor: "#ef4444", alignItems: "center", justifyContent: "center" },
  deleteBtnGreen:  { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(239,68,68,0.8)", alignItems: "center", justifyContent: "center" },
  deleteBtnTxt:    { color: "#fff", fontSize: 12, fontWeight: "900" },
  jobDesc:         { color: "#aaa", fontSize: 13, lineHeight: 20, marginBottom: 10 },
  metaRow:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  metaItem:        { color: "#888", fontSize: 13 },
  metaBudget:      { color: "#22c55e", fontSize: 15, fontWeight: "800" },
  phoneRow:        { flexDirection: "row", alignItems: "center", backgroundColor: "#0a2a0a", borderRadius: 10, padding: 10, marginBottom: 8, gap: 8 },
  phoneIcon:       { fontSize: 16 },
  phoneNum:        { color: "#22c55e", fontWeight: "700", fontSize: 15 },
  jobTime:         { color: "#555", fontSize: 12, marginBottom: 12 },
  acceptBtn:       { backgroundColor: "#f97316", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  acceptBtnTxt:    { color: "#fff", fontWeight: "800", fontSize: 15 },
});