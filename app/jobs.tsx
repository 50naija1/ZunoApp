import { useEffect, useState } from "react";
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useAuth } from "./context";

const API = "https://zuno.ng/api";

export default function JobsScreen() {
  const { artisanToken } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API}/artisan/alerts`, {
        headers: { Authorization: `Bearer ${artisanToken}` },
      });
      const data = await res.json();
      setJobs(data.alerts || data.jobs || []);
    } catch { }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Job Alerts</Text>
        <TouchableOpacity onPress={fetchJobs}>
          <Text style={styles.refresh}>Refresh 🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.center}>
            <Text style={styles.loadingText}>Loading jobs...</Text>
          </View>
        )}

        {!loading && jobs.length === 0 && (
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>No Job Alerts Yet</Text>
            <Text style={styles.emptySub}>
              Make sure your availability is ON to receive job alerts near you.
            </Text>
          </View>
        )}

        {jobs.map((job: any, i: number) => (
          <View key={i} style={styles.jobCard}>
            <View style={styles.jobTop}>
              <Text style={styles.jobTitle}>{job.title || job.service || "New Job"}</Text>
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            </View>
            <Text style={styles.jobDesc}>{job.description || "Job request near you"}</Text>
            <View style={styles.jobMeta}>
              <Text style={styles.jobLGA}>📍 {job.lga || "Lagos"}</Text>
              {job.budget ? (
                <Text style={styles.jobBudget}>₦{job.budget}</Text>
              ) : null}
            </View>
            <Text style={styles.jobTime}>{job.created_at || "Just now"}</Text>
            <TouchableOpacity style={styles.acceptBtn}>
              <Text style={styles.acceptBtnText}>Accept Job →</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  header: {
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: "#1e1e1e",
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  headerTitle: { color: "white", fontSize: 22, fontWeight: "800" },
  refresh: { color: "#f97316", fontSize: 14 },
  center: { alignItems: "center", paddingTop: 80, paddingHorizontal: 30 },
  loadingText: { color: "#888", fontSize: 15 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: "white", fontSize: 18, fontWeight: "700", marginBottom: 8 },
  emptySub: { color: "#888", fontSize: 14, textAlign: "center", lineHeight: 20 },
  jobCard: {
    backgroundColor: "#1a1a1a", marginHorizontal: 16,
    marginTop: 12, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: "#2a2a2a",
  },
  jobTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  jobTitle: { color: "white", fontWeight: "700", fontSize: 16, flex: 1 },
  newBadge: { backgroundColor: "#f9731622", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  newBadgeText: { color: "#f97316", fontSize: 11, fontWeight: "700" },
  jobDesc: { color: "#888", fontSize: 13, lineHeight: 18, marginBottom: 10 },
  jobMeta: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  jobLGA: { color: "#aaa", fontSize: 13 },
  jobBudget: { color: "#22c55e", fontSize: 13, fontWeight: "700" },
  jobTime: { color: "#555", fontSize: 12, marginBottom: 12 },
  acceptBtn: {
    backgroundColor: "#f97316", borderRadius: 10,
    paddingVertical: 12, alignItems: "center",
  },
  acceptBtnText: { color: "white", fontWeight: "700", fontSize: 14 },
});