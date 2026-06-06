import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../services/context";
import { socketService } from "../services/socketService";

const API = "https://zuno.ng/api";

const CANCEL_REASONS = [
  { icon: "⚡", label: "No electricity at location" },
  { icon: "🚪", label: "Customer was unavailable" },
  { icon: "📅", label: "Customer postponed the job" },
  { icon: "❓", label: "Wrong or invalid request" },
  { icon: "💰", label: "Price disagreement" },
  { icon: "✏️", label: "Other reason" },
];

// ─── Complete Job Modal ───────────────────────────────────────────────────────
function CompleteJobModal({ visible, jobTitle, onConfirm, onCancel }: {
  visible: boolean; jobTitle: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1, useNativeDriver: true, tension: 120, friction: 8
      }).start();
    } else {
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={m.overlay}>
        <Animated.View style={[m.sheet, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={m.emoji}>✅</Text>
          <Text style={m.title}>Mark Job as Complete?</Text>
          <Text style={m.sub}>
            This will notify the customer that <Text style={{ color: "#fff", fontWeight: "700" }}>{jobTitle}</Text> is done and prompt them to leave a review.{"\n\n"}Make sure the work is fully finished before confirming.
          </Text>
          <TouchableOpacity style={m.confirmBtn} onPress={onConfirm} activeOpacity={0.85}>
            <Text style={m.confirmBtnTxt}>✅ Yes, Job is Complete</Text>
          </TouchableOpacity>
          <TouchableOpacity style={m.cancelBtn} onPress={onCancel} activeOpacity={0.85}>
            <Text style={m.cancelBtnTxt}>Not Yet — Go Back</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Cancel Job Modal ─────────────────────────────────────────────────────────
function CancelJobModal({ visible, jobTitle, onConfirm, onClose }: {
  visible: boolean; jobTitle: string;
  onConfirm: (reason: string) => void; onClose: () => void;
}) {
  const [selected, setSelected] = useState<string>("");
  const [custom,   setCustom]   = useState("");

  const handleConfirm = () => {
    const reason = selected === "Other reason" ? custom.trim() : selected
      ? selected + (custom.trim() ? ". " + custom.trim() : "")
      : custom.trim();
    if (!reason) return;
    onConfirm(reason);
    setSelected("");
    setCustom("");
  };

  const canSubmit = selected !== "" || custom.trim() !== "";

  return (
    <Modal transparent visible={visible} animationType="slide" statusBarTranslucent>
      <View style={cm.overlay}>
        <View style={cm.sheet}>
          <View style={cm.handle} />
          <Text style={cm.emoji}>❌</Text>
          <Text style={cm.title}>Cancel This Job?</Text>
          <Text style={cm.sub}>
            Cancelling: <Text style={{ color: "#fff", fontWeight: "700" }}>{jobTitle}</Text>{"\n"}
            Please select a reason. The customer will be notified.
          </Text>

          <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
            {CANCEL_REASONS.map((r, i) => (
              <TouchableOpacity
                key={i}
                style={[cm.reasonRow, selected === r.label && cm.reasonRowSelected]}
                onPress={() => setSelected(r.label)}
                activeOpacity={0.8}>
                <View style={[cm.radio, selected === r.label && cm.radioSelected]}>
                  {selected === r.label && <View style={cm.radioDot} />}
                </View>
                <Text style={cm.reasonIcon}>{r.icon}</Text>
                <Text style={[cm.reasonTxt, selected === r.label && cm.reasonTxtSelected]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TextInput
            style={cm.textInput}
            placeholder="Describe your reason (optional)..."
            placeholderTextColor="#555"
            multiline
            numberOfLines={3}
            value={custom}
            onChangeText={setCustom}
          />

          <TouchableOpacity
            style={[cm.submitBtn, !canSubmit && cm.submitBtnOff]}
            onPress={handleConfirm}
            disabled={!canSubmit}
            activeOpacity={0.85}>
            <Text style={cm.submitBtnTxt}>Cancel This Job</Text>
          </TouchableOpacity>

          <TouchableOpacity style={cm.goBackBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={cm.goBackTxt}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Active Job Warning Modal ─────────────────────────────────────────────────
function ActiveJobWarningModal({ visible, onStayOffline, onGoOnline }: {
  visible: boolean; onStayOffline: () => void; onGoOnline: () => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={m.overlay}>
        <View style={[m.sheet, { borderColor: "#f97316" }]}>
          <Text style={m.emoji}>⚠️</Text>
          <Text style={m.title}>Active Job In Progress</Text>
          <Text style={m.sub}>
            You still have an active job. Going online may allow more job requests.{"\n\n"}
            <Text style={{ color: "#ef4444", fontWeight: "700" }}>
              Repeated no-shows or abandoned jobs may lead to temporary account suspension.
            </Text>
          </Text>
          <TouchableOpacity style={m.confirmBtn} onPress={onGoOnline} activeOpacity={0.85}>
            <Text style={m.confirmBtnTxt}>Go Online Anyway</Text>
          </TouchableOpacity>
          <TouchableOpacity style={m.cancelBtn} onPress={onStayOffline} activeOpacity={0.85}>
            <Text style={m.cancelBtnTxt}>Stay Offline</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Jobs Screen ──────────────────────────────────────────────────────────────
export default function JobsScreen() {
  const { artisanToken, artisanData, refreshArtisanData } = useAuth();
  const [jobs,         setJobs]         = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [accepting,    setAccepting]    = useState<string | null>(null);
  const [completing,   setCompleting]   = useState<string | null>(null);
  const [cancelling,   setCancelling]   = useState<string | null>(null);
  const [clearing,     setClearing]     = useState(false);

  // Modal states
  const [completeModal, setCompleteModal] = useState<{ visible: boolean; jobId: string; jobTitle: string }>({ visible: false, jobId: "", jobTitle: "" });
  const [cancelModal,   setCancelModal]   = useState<{ visible: boolean; jobId: string; jobTitle: string }>({ visible: false, jobId: "", jobTitle: "" });
  const [activeJobModal, setActiveJobModal] = useState(false);

  // Active job tracking
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isOnline,    setIsOnline]    = useState(false);
  const pendingToggleRef = useRef<boolean>(false);

  // Load active job from storage on mount
  useEffect(() => {
    AsyncStorage.getItem("zuno_active_job").then(val => {
      if (val) setActiveJobId(val);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!artisanToken) { setLoading(false); return; }
    fetchJobs();
    const unsub = socketService.onJobAlert((job: any) => {
      setJobs(prev => {
        const exists = prev.find(j => String(j.id) === String(job.job_id));
        if (exists) return prev;
        return [{
          id: job.job_id, title: job.title, category: job.category,
          lga: job.lga, budget: job.budget, status: "pending",
          created_at: new Date().toLocaleTimeString(),
        }, ...prev];
      });
    });
    const interval = setInterval(fetchJobs, 30000);
    return () => { unsub(); clearInterval(interval); };
  }, [artisanToken]);

  const fetchJobs = async () => {
    if (!artisanToken) return;
    try {
      const res  = await fetch(`${API}/artisan/alerts`, {
        headers: { Authorization: `Bearer ${artisanToken}` },
      });
      if (res.status === 401) { setJobs([]); setLoading(false); return; }
      const data = await res.json();
      setJobs(data.alerts || data.jobs || []);
    } catch {}
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
        // Set as active job
        setActiveJobId(jobId);
        await AsyncStorage.setItem("zuno_active_job", jobId);
        fetchJobs();
        await refreshArtisanData();
      }
    } catch {}
    setAccepting(null);
  };

  // ── Complete Job ──────────────────────────────────────────────────────────
  const showCompleteModal = (jobId: string, jobTitle: string) => {
    setCompleteModal({ visible: true, jobId, jobTitle });
  };

  const confirmComplete = async () => {
    const { jobId } = completeModal;
    setCompleteModal(p => ({ ...p, visible: false }));
    setCompleting(jobId);
    try {
      const res  = await fetch(`${API}/jobs/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${artisanToken}` },
        body: JSON.stringify({ job_id: jobId, artisan_id: artisanData?.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Clear active job
        setActiveJobId(null);
        await AsyncStorage.removeItem("zuno_active_job");
        fetchJobs();
        await refreshArtisanData();
      }
    } catch {}
    setCompleting(null);
  };

  // ── Cancel Job ────────────────────────────────────────────────────────────
  const showCancelModal = (jobId: string, jobTitle: string) => {
    setCancelModal({ visible: true, jobId, jobTitle });
  };

  const confirmCancelJob = async (reason: string) => {
    const { jobId } = cancelModal;
    setCancelModal(p => ({ ...p, visible: false }));
    setCancelling(jobId);
    try {
      const res  = await fetch(`${API}/jobs/artisan-cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${artisanToken}` },
        body: JSON.stringify({ job_id: jobId, artisan_id: artisanData?.id, reason }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Clear active job
        setActiveJobId(null);
        await AsyncStorage.removeItem("zuno_active_job");
        fetchJobs();
        await refreshArtisanData();
      }
    } catch {}
    setCancelling(null);
  };

  const deleteJob = (id: any) => {
    setJobs(prev => prev.filter(j => j.id !== id));
    fetch(`${API}/artisan/alerts/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${artisanToken}` },
    }).catch(() => {});
  };

  const clearAll = async () => {
    setClearing(true);
    setJobs([]);
    try {
      await fetch(`${API}/artisan/alerts/clear/all`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${artisanToken}` },
      });
    } catch {}
    setClearing(false);
  };

  const pendingJobs   = jobs.filter(j => j.status !== "accepted" && j.status !== "completed" && j.status !== "cancelled");
  const acceptedJobs  = jobs.filter(j => j.status === "accepted");
  const completedJobs = jobs.filter(j => j.status === "completed");
  const cancelledJobs = jobs.filter(j => j.status === "cancelled");

  if (!artisanToken) {
    return (
      <View style={s.root}>
        <StatusBar barStyle="light-content" backgroundColor="#f97316" />
        <View style={s.header}>
          <Text style={s.headerTag}>MY JOBS</Text>
          <Text style={s.headerTitle}>Job History</Text>
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

      {/* Modals */}
      <CompleteJobModal
        visible={completeModal.visible}
        jobTitle={completeModal.jobTitle}
        onConfirm={confirmComplete}
        onCancel={() => setCompleteModal(p => ({ ...p, visible: false }))}
      />
      <CancelJobModal
        visible={cancelModal.visible}
        jobTitle={cancelModal.jobTitle}
        onConfirm={confirmCancelJob}
        onClose={() => setCancelModal(p => ({ ...p, visible: false }))}
      />
      <ActiveJobWarningModal
        visible={activeJobModal}
        onStayOffline={() => setActiveJobModal(false)}
        onGoOnline={() => {
          setActiveJobModal(false);
          // Proceed with going online
          socketService.emitToggle(artisanData?.id, 1);
        }}
      />

      <View style={s.header}>
        <View>
          <Text style={s.headerTag}>MY JOBS</Text>
          <Text style={s.headerTitle}>Job History</Text>
        </View>
        <View style={s.headerRight}>
          {jobs.length > 0 && (
            <TouchableOpacity style={s.clearBtn} onPress={clearAll} disabled={clearing}>
              {clearing
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.clearBtnTxt}>🗑 Clear</Text>}
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
            {/* NEW ALERTS */}
            {pendingJobs.length > 0 && (
              <>
                <Text style={s.sectionLabel}>NEW ALERTS</Text>
                {pendingJobs.map((job: any, i: number) => (
                  <View key={job.id ?? i} style={[s.card, s.cardNew]}>
                    <View style={s.cardTop}>
                      <Text style={s.jobTitle}>{job.title || job.category || "New Job"}</Text>
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
                    <Text style={s.jobTime}>{job.created_at || "Just now"}</Text>
                    <TouchableOpacity
                      style={s.acceptBtn}
                      onPress={() => acceptJob(String(job.id))}
                      disabled={accepting === String(job.id)}
                      activeOpacity={0.85}>
                      {accepting === String(job.id)
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={s.acceptBtnTxt}>✅ Accept Job →</Text>}
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}

            {/* ACCEPTED — with toggle complete + cancel */}
            {acceptedJobs.length > 0 && (
              <>
                <Text style={s.sectionLabel}>ACTIVE JOBS</Text>
                {acceptedJobs.map((job: any, i: number) => (
                  <View key={job.id ?? i} style={[s.card, s.cardAccepted]}>
                    <View style={s.cardTop}>
                      <Text style={s.jobTitle}>{job.title || job.category || "Job"}</Text>
                      <View style={s.badgeAccepted}><Text style={s.badgeAcceptedTxt}>✓ Active</Text></View>
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
                    <Text style={s.jobTime}>{job.created_at || "Just now"}</Text>

                    {/* Complete Toggle Row */}
                    <View style={s.completeToggleRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.completeToggleLabel}>Mark Job Complete</Text>
                        <Text style={s.completeToggleSub}>Toggle ON when job is done</Text>
                      </View>
                      <Switch
                        value={completing === String(job.id)}
                        onValueChange={(val) => {
                          if (val) showCompleteModal(String(job.id), job.title || job.category || "Job");
                        }}
                        trackColor={{ false: "#333", true: "#22c55e" }}
                        thumbColor="#fff"
                        disabled={completing === String(job.id)}
                      />
                    </View>

                    {/* Cancel Button */}
                    <TouchableOpacity
                      style={[s.cancelJobBtn, cancelling === String(job.id) && s.cancelJobBtnOff]}
                      onPress={() => showCancelModal(String(job.id), job.title || job.category || "Job")}
                      disabled={cancelling === String(job.id)}
                      activeOpacity={0.85}>
                      {cancelling === String(job.id)
                        ? <ActivityIndicator color="#ef4444" size="small" />
                        : <Text style={s.cancelJobBtnTxt}>❌ Cancel Job</Text>}
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}

            {/* COMPLETED */}
            {completedJobs.length > 0 && (
              <>
                <Text style={s.sectionLabel}>COMPLETED</Text>
                {completedJobs.map((job: any, i: number) => (
                  <View key={job.id ?? i} style={[s.card, s.cardCompleted]}>
                    <View style={s.cardTop}>
                      <Text style={s.jobTitle}>{job.title || job.category || "Job"}</Text>
                      <View style={s.badgeCompleted}><Text style={s.badgeCompletedTxt}>✓ Done</Text></View>
                      <TouchableOpacity style={s.deleteBtnGreen} onPress={() => deleteJob(job.id)}>
                        <Text style={s.deleteBtnTxt}>✕</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={s.metaRow}>
                      {!!job.lga && <Text style={s.metaItem}>📍 {job.lga}</Text>}
                      {!!job.budget && <Text style={s.metaBudget}>₦{Number(job.budget).toLocaleString()}</Text>}
                    </View>
                    <Text style={s.jobTime}>{job.created_at || "Just now"}</Text>
                  </View>
                ))}
              </>
            )}

            {/* CANCELLED */}
            {cancelledJobs.length > 0 && (
              <>
                <Text style={s.sectionLabel}>CANCELLED</Text>
                {cancelledJobs.map((job: any, i: number) => (
                  <View key={job.id ?? i} style={[s.card, s.cardCancelled]}>
                    <View style={s.cardTop}>
                      <Text style={s.jobTitle}>{job.title || job.category || "Job"}</Text>
                      <View style={s.badgeCancelled}><Text style={s.badgeCancelledTxt}>✕ Cancelled</Text></View>
                      <TouchableOpacity style={s.deleteBtn} onPress={() => deleteJob(job.id)}>
                        <Text style={s.deleteBtnTxt}>✕</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={s.metaRow}>
                      {!!job.lga && <Text style={s.metaItem}>📍 {job.lga}</Text>}
                      {!!job.budget && <Text style={s.metaBudget}>₦{Number(job.budget).toLocaleString()}</Text>}
                    </View>
                    <Text style={s.jobTime}>{job.created_at || "Just now"}</Text>
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const m = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center", padding: 24 },
  sheet:        { backgroundColor: "#1a1a1a", borderRadius: 24, padding: 28, width: "100%", borderWidth: 1.5, borderColor: "#22c55e", alignItems: "center" },
  emoji:        { fontSize: 52, marginBottom: 14 },
  title:        { color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 10, textAlign: "center" },
  sub:          { color: "#888", fontSize: 14, lineHeight: 22, textAlign: "center", marginBottom: 24 },
  confirmBtn:   { width: "100%", backgroundColor: "#22c55e", borderRadius: 14, paddingVertical: 16, alignItems: "center", marginBottom: 10 },
  confirmBtnTxt:{ color: "#fff", fontWeight: "800", fontSize: 16 },
  cancelBtn:    { width: "100%", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#333" },
  cancelBtnTxt: { color: "#888", fontWeight: "600", fontSize: 15 },
});

const cm = StyleSheet.create({
  overlay:           { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "flex-end" },
  sheet:             { backgroundColor: "#1a1a1a", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 36, paddingHorizontal: 20, paddingTop: 12, maxHeight: "88%" },
  handle:            { width: 40, height: 4, backgroundColor: "#333", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  emoji:             { fontSize: 44, textAlign: "center", marginBottom: 10 },
  title:             { color: "#fff", fontSize: 20, fontWeight: "800", textAlign: "center", marginBottom: 6 },
  sub:               { color: "#888", fontSize: 13, lineHeight: 20, textAlign: "center", marginBottom: 16 },
  reasonRow:         { flexDirection: "row", alignItems: "center", backgroundColor: "#111", borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: "#222", gap: 12 },
  reasonRowSelected: { borderColor: "#f97316", backgroundColor: "rgba(249,115,22,0.08)" },
  radio:             { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#444", alignItems: "center", justifyContent: "center" },
  radioSelected:     { borderColor: "#f97316" },
  radioDot:          { width: 10, height: 10, borderRadius: 5, backgroundColor: "#f97316" },
  reasonIcon:        { fontSize: 18 },
  reasonTxt:         { color: "#aaa", fontSize: 14, flex: 1 },
  reasonTxtSelected: { color: "#fff", fontWeight: "700" },
  textInput:         { backgroundColor: "#111", borderRadius: 14, padding: 14, color: "#fff", fontSize: 14, borderWidth: 1, borderColor: "#333", marginTop: 8, marginBottom: 16, minHeight: 80, textAlignVertical: "top" },
  submitBtn:         { backgroundColor: "rgba(239,68,68,0.15)", borderRadius: 14, paddingVertical: 16, alignItems: "center", borderWidth: 1.5, borderColor: "#ef4444", marginBottom: 10 },
  submitBtnOff:      { opacity: 0.4 },
  submitBtnTxt:      { color: "#ef4444", fontWeight: "800", fontSize: 16 },
  goBackBtn:         { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#333" },
  goBackTxt:         { color: "#888", fontWeight: "600", fontSize: 15 },
});

const s = StyleSheet.create({
  root:              { flex: 1, backgroundColor: "#111" },
  header:            { backgroundColor: "#f97316", paddingTop: 52, paddingBottom: 18, paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  headerTag:         { color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  headerTitle:       { color: "#fff", fontSize: 28, fontWeight: "900", marginTop: 2 },
  headerRight:       { flexDirection: "row", gap: 8, alignItems: "center" },
  clearBtn:          { backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  clearBtnTxt:       { color: "#fff", fontSize: 12, fontWeight: "700" },
  refreshBtn:        { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  refreshTxt:        { color: "#fff", fontSize: 13, fontWeight: "600" },
  center:            { alignItems: "center", paddingTop: 80, paddingHorizontal: 30, gap: 12 },
  loadingTxt:        { color: "#888", fontSize: 14 },
  emptyEmoji:        { fontSize: 48 },
  emptyTitle:        { color: "#fff", fontSize: 18, fontWeight: "800" },
  emptySub:          { color: "#888", textAlign: "center", lineHeight: 20, fontSize: 14 },
  sectionLabel:      { color: "#555", fontSize: 11, fontWeight: "800", letterSpacing: 1.5, marginHorizontal: 16, marginTop: 20, marginBottom: 6 },
  card:              { marginHorizontal: 16, marginTop: 8, borderRadius: 16, padding: 16, borderWidth: 1 },
  cardNew:           { backgroundColor: "#1a1a1a", borderColor: "#f97316" },
  cardAccepted:      { backgroundColor: "#0d1a0d", borderColor: "#22c55e" },
  cardCompleted:     { backgroundColor: "#0d1a1a", borderColor: "#3b82f6" },
  cardCancelled:     { backgroundColor: "#1a0d0d", borderColor: "#ef4444" },
  cardTop:           { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  jobTitle:          { color: "#fff", fontWeight: "800", fontSize: 16, flex: 1 },
  badgeNew:          { backgroundColor: "#f97316", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeNewTxt:       { color: "#fff", fontSize: 11, fontWeight: "800" },
  badgeAccepted:     { backgroundColor: "rgba(34,197,94,0.15)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeAcceptedTxt:  { color: "#22c55e", fontSize: 11, fontWeight: "700" },
  badgeCompleted:    { backgroundColor: "rgba(59,130,246,0.15)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeCompletedTxt: { color: "#3b82f6", fontSize: 11, fontWeight: "700" },
  badgeCancelled:    { backgroundColor: "rgba(239,68,68,0.15)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeCancelledTxt: { color: "#ef4444", fontSize: 11, fontWeight: "700" },
  deleteBtn:         { width: 28, height: 28, borderRadius: 14, backgroundColor: "#ef4444", alignItems: "center", justifyContent: "center" },
  deleteBtnGreen:    { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(239,68,68,0.8)", alignItems: "center", justifyContent: "center" },
  deleteBtnTxt:      { color: "#fff", fontSize: 12, fontWeight: "900" },
  jobDesc:           { color: "#aaa", fontSize: 13, lineHeight: 20, marginBottom: 10 },
  metaRow:           { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  metaItem:          { color: "#888", fontSize: 13 },
  metaBudget:        { color: "#22c55e", fontSize: 15, fontWeight: "800" },
  phoneRow:          { flexDirection: "row", alignItems: "center", backgroundColor: "#0a2a0a", borderRadius: 10, padding: 10, marginBottom: 8, gap: 8 },
  phoneIcon:         { fontSize: 16 },
  phoneNum:          { color: "#22c55e", fontWeight: "700", fontSize: 15 },
  jobTime:           { color: "#555", fontSize: 12, marginBottom: 12 },
  acceptBtn:         { backgroundColor: "#f97316", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  acceptBtnTxt:      { color: "#fff", fontWeight: "800", fontSize: 15 },
  completeToggleRow: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#1a3a1a" },
  completeToggleLabel:{ color: "#fff", fontWeight: "800", fontSize: 14 },
  completeToggleSub: { color: "#555", fontSize: 11, marginTop: 2 },
  cancelJobBtn:      { backgroundColor: "rgba(239,68,68,0.08)", borderRadius: 12, paddingVertical: 13, alignItems: "center", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" },
  cancelJobBtnOff:   { opacity: 0.5 },
  cancelJobBtnTxt:   { color: "#ef4444", fontWeight: "800", fontSize: 14 },
});