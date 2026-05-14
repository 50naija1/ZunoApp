import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { io as socketIO } from "socket.io-client";
import { useAuth } from "./context";
import { setupNotificationListeners, setupPushNotifications } from "./notifications";

const API        = "https://zuno.ng/api";
const SOCKET_URL = "https://zuno.ng";

const SKILLS = [
  "AC Technician","Electrician","Plumber","Cleaner","Carpenter",
  "Painter","Tiler","Welder","Auto Mechanic","Generator Repair",
  "Fumigation","Locksmith","Electronics Repair","Gardener",
  "Washing Machine Repair","Refrigerator Repair","TV Mounting",
  "Microwave Repair","Borehole / Water","CCTV / Security",
  "Roof Repair","Inverter / Solar","Other",
];

const LGAS = [
  "Lekki","Victoria Island","Ikoyi","Ajah","Ikeja","Surulere",
  "Yaba","Gbagada","Magodo","Ojodu","Ikorodu","Mushin",
  "Oshodi","Agege","Apapa","Badagry","Epe","Alimosho",
  "Kosofe","Shomolu","Other",
];

// ─── Beep ─────────────────────────────────────────────────────────────────────
async function playBeep() {
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });
    const { sound } = await Audio.Sound.createAsync(
      { uri: "https://zuno.ng/beep.wav" },
      { shouldPlay: true, volume: 1.0 }
    );
    setTimeout(() => sound.unloadAsync().catch(() => {}), 3000);
  } catch {}
}

// ─── Job Alert Popup ──────────────────────────────────────────────────────────
function JobAlertPopup({ job, onAccept, onDecline }: { job: any; onAccept: () => void; onDecline: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(300);
  const scaleAnim   = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim,   { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setSecondsLeft(s => { if (s <= 1) { clearInterval(t); onDecline(); return 0; } return s - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const mins        = Math.floor(secondsLeft / 60);
  const secs        = secondsLeft % 60;
  const timeStr     = `${mins}:${secs.toString().padStart(2, "0")}`;
  const urgentColor = secondsLeft < 60 ? "#ef4444" : "#f97316";

  return (
    <Modal transparent animationType="none" statusBarTranslucent>
      <View style={pp.overlay}>
        <Animated.View style={[pp.card, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
          <View style={pp.header}>
            <View style={pp.headerLeft}>
              <View style={pp.bellIcon}><Ionicons name="notifications" size={20} color="#f97316" /></View>
              <View>
                <Text style={pp.headerTitle}>NEW JOB NEAR YOU</Text>
                <Text style={pp.headerSub}>Alert repeating until accepted</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onDecline} style={pp.closeBtn}>
              <Ionicons name="close" size={18} color="#888" />
            </TouchableOpacity>
          </View>
          <View style={pp.grid}>
            <View style={pp.gridCell}>
              <Text style={pp.gridLabel}>SERVICE</Text>
              <Text style={pp.gridValue}>{job.category || job.title || "New Job"}</Text>
            </View>
            <View style={pp.gridCell}>
              <Text style={pp.gridLabel}>LOCATION</Text>
              <Text style={pp.gridValue}>{job.lga || job.location || "Lagos"}</Text>
            </View>
            <View style={pp.gridCell}>
              <Text style={pp.gridLabel}>DISTANCE</Text>
              <Text style={pp.gridValue}>{job.distance || "Nearby"}</Text>
            </View>
            <View style={pp.gridCell}>
              <Text style={pp.gridLabel}>BUDGET</Text>
              <Text style={[pp.gridValue, pp.budgetText]}>₦{Number(job.budget || 0).toLocaleString()}</Text>
            </View>
          </View>
          <View style={pp.timerRow}>
            <Ionicons name="time-outline" size={14} color={urgentColor} />
            <Text style={[pp.timerText, { color: urgentColor }]}>{"  "}Expires in {timeStr}</Text>
          </View>
          <View style={pp.btnRow}>
            <TouchableOpacity style={pp.acceptBtn} onPress={onAccept} activeOpacity={0.85}>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={pp.acceptBtnTxt}> ACCEPT JOB</Text>
            </TouchableOpacity>
            <TouchableOpacity style={pp.declineBtn} onPress={onDecline} activeOpacity={0.85}>
              <Ionicons name="close" size={16} color="#ef4444" />
              <Text style={pp.declineBtnTxt}> Decline</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Accepted Job Card ────────────────────────────────────────────────────────
function AcceptedJobCard({ clientName, phone, jobTitle, onDismiss }: {
  clientName: string; phone: string; jobTitle: string; onDismiss: () => void;
}) {
  const [minutesLeft, setMinutesLeft] = useState(60);

  useEffect(() => {
    const t = setInterval(() => {
      setMinutesLeft(m => { if (m <= 1) { clearInterval(t); onDismiss(); return 0; } return m - 1; });
    }, 60000);
    return () => clearInterval(t);
  }, []);

  const waNumber  = phone.replace(/\D/g, "");
  const waMessage = encodeURIComponent(`Hello, I'm your Zuno artisan for the ${jobTitle} job. I'll be with you shortly.`);
  const waLink    = `https://wa.me/234${waNumber.replace(/^0/, "")}?text=${waMessage}`;

  return (
    <View style={ac.card}>
      <View style={ac.cardTop}>
        <View style={ac.iconBox}><Ionicons name="checkmark-circle" size={22} color="#22c55e" /></View>
        <View style={{ flex: 1 }}>
          <Text style={ac.cardTitle}>Job Accepted!</Text>
          <Text style={ac.cardSub}>{jobTitle}</Text>
        </View>
        <TouchableOpacity onPress={onDismiss} style={ac.closeBtn}>
          <Ionicons name="close" size={16} color="#555" />
        </TouchableOpacity>
      </View>
      <Text style={ac.clientName}>Client: {clientName}</Text>
      <TouchableOpacity style={ac.phoneRow} onPress={() => Linking.openURL(`tel:${phone}`)}>
        <Ionicons name="call" size={18} color="#22c55e" />
        <Text style={ac.phoneNum}>{phone}</Text>
        <Text style={ac.tapHint}>Tap to call</Text>
      </TouchableOpacity>
      <TouchableOpacity style={ac.waRow} onPress={() => Linking.openURL(waLink)}>
        <Text style={ac.waEmoji}>💬</Text>
        <Text style={ac.waTxt}>Message on WhatsApp</Text>
        <Ionicons name="arrow-forward" size={14} color="#25D366" />
      </TouchableOpacity>
      <View style={ac.timerRow}>
        <Ionicons name="time-outline" size={12} color="#555" />
        <Text style={ac.timerTxt}>{"  "}Contact info hidden in {minutesLeft} min</Text>
      </View>
    </View>
  );
}

// ─── Notification Bell Dropdown ───────────────────────────────────────────────
function NotificationBell({ alerts, onClose }: { alerts: any[]; onClose: () => void }) {
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={nb.overlay} activeOpacity={1} onPress={onClose}>
        <View style={nb.dropdown}>
          <View style={nb.header}>
            <Text style={nb.headerTxt}>Notifications</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={20} color="#888" /></TouchableOpacity>
          </View>
          {alerts.length === 0 ? (
            <View style={nb.empty}>
              <Text style={nb.emptyEmoji}>🔕</Text>
              <Text style={nb.emptyTxt}>No notifications yet</Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {alerts.slice(0, 10).map((a, i) => (
                <View key={a.id ?? i} style={nb.item}>
                  <View style={nb.itemDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={nb.itemTitle}>{a.title || a.category || a.service || "Job Alert"}</Text>
                    <Text style={nb.itemSub}>
                      {a.lga || a.location || "Lagos"}
                      {a.budget ? `  ·  ₦${Number(a.budget).toLocaleString()}` : ""}
                    </Text>
                    <Text style={nb.itemTime}>{a.time || a.created_at || "Just now"}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Artisan Dashboard ────────────────────────────────────────────────────────
function ArtisanDashboard({ artisan, token }: any) {
  // ✅ FIX: Use safe area insets instead of hardcoded paddingTop: 52
  // This fixes the APK vs dev server visual difference
  const insets = useSafeAreaInsets();

  const { refreshArtisanData } = useAuth();

  const [online,         setOnline]         = useState(artisan?.is_online ?? true);
  const [alerts,         setAlerts]         = useState<any[]>([]);
  const [refreshing,     setRefreshing]     = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [pendingJob,     setPendingJob]     = useState<any | null>(null);
  const [acceptedInfo,   setAcceptedInfo]   = useState<any | null>(null);
  const [showBell,       setShowBell]       = useState(false);
  const [activeSnooze,   setActiveSnooze]   = useState<number | null>(null);

  const socketRef    = useRef<any>(null);
  const beepInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const snoozeTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenJobIds   = useRef<Set<string>>(new Set());

  const stopBeep = () => {
    if (beepInterval.current) { clearInterval(beepInterval.current); beepInterval.current = null; }
  };
  const startBeep = () => {
    stopBeep();
    playBeep();
    beepInterval.current = setInterval(playBeep, 3000);
  };

  useEffect(() => {
    if (!artisan?.id) return;
    const socket = socketIO(SOCKET_URL, { transports: ["websocket"], reconnectionAttempts: 10, reconnectionDelay: 2000 });
    socketRef.current = socket;

    socket.on("connect", () => {
      if (artisan?.id) socket.emit("artisan_online", artisan.id);
    });

    socket.on("job_alert", (job: any) => {
      const jid = String(job.job_id || job.id);
      if (seenJobIds.current.has(jid)) return;
      seenJobIds.current.add(jid);
      setPendingJob(job);
      startBeep();
      setAlerts(prev => [{ ...job, id: jid, status: "pending" }, ...prev]);
    });

    socket.on("job_taken",     () => { stopBeep(); setPendingJob(null); });
    socket.on("auto_offlined", () => { setOnline(false); });

    fetchAlerts();

    setupPushNotifications(token).catch(() => {});
    const removeSub = setupNotificationListeners((jobId) => {
      fetchAlerts();
    });

    return () => {
      removeSub();
      stopBeep();
      socket.disconnect();
      if (snoozeTimer.current) clearTimeout(snoozeTimer.current);
    };
  }, []);

  const fetchAlerts = async () => {
    try {
      const res  = await fetch(`${API}/artisan/alerts`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      let jobs: any[] = [];
      if (Array.isArray(data.alerts))    jobs = data.alerts;
      else if (Array.isArray(data.jobs)) jobs = data.jobs;
      else if (Array.isArray(data))      jobs = data;
      setAlerts(jobs);
    } catch {}
  };

  const handleAccept = async () => {
    stopBeep();
    if (!pendingJob) return;
    const jobId = pendingJob.job_id || pendingJob.id;
    try {
      const res  = await fetch(`${API}/artisan/jobs/${jobId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setAcceptedInfo({
          clientName: data.client?.full_name || data.client_name || "Client",
          phone:      data.client?.phone     || data.phone       || "",
          jobTitle:   pendingJob.category    || pendingJob.title || "Job",
        });
        fetchAlerts();
      }
    } catch {}
    setPendingJob(null);
  };

  const handleDecline = () => { stopBeep(); setPendingJob(null); };

  const toggleOnline = async (val: boolean) => {
    setOnline(val);
    setActiveSnooze(null);
    if (snoozeTimer.current) { clearTimeout(snoozeTimer.current); snoozeTimer.current = null; }
    setTogglingOnline(true);
    if (socketRef.current?.connected) {
      socketRef.current.emit("toggle_availability", { artisan_id: artisan.id, status: val ? 1 : 0 });
    }
    try {
      await fetch(`${API}/artisan/availability`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_online: val }),
      });
    } catch {}
    setTogglingOnline(false);
  };

  const snooze = (hours: number) => {
    if (snoozeTimer.current) clearTimeout(snoozeTimer.current);
    if (hours === 0) { toggleOnline(false); setActiveSnooze(null); return; }

    setOnline(false);
    setActiveSnooze(hours);

    if (socketRef.current?.connected) {
      socketRef.current.emit("toggle_availability", { artisan_id: artisan.id, status: 0 });
    }
    fetch(`${API}/artisan/availability`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_online: false }),
    }).catch(() => {});

    snoozeTimer.current = setTimeout(() => {
      setOnline(true);
      setActiveSnooze(null);
      if (socketRef.current?.connected) {
        socketRef.current.emit("toggle_availability", { artisan_id: artisan.id, status: 1 });
      }
      fetch(`${API}/artisan/availability`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_online: true }),
      }).catch(() => {});
    }, hours * 3600000);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAlerts(), refreshArtisanData()]);
    setRefreshing(false);
  };

  const photoUri    = artisan?.profile_photo || artisan?.photo || null;
  const unreadCount = alerts.filter((a: any) => a.status === "pending" || !a.read).length;

  // ✅ FIX: paddingTop now uses real device safe area, not a hardcoded guess
  const topBarPadding = insets.top + 12;

  return (
    <View style={d.root}>
      <StatusBar barStyle="light-content" backgroundColor="#f97316" translucent />

      {pendingJob && <JobAlertPopup job={pendingJob} onAccept={handleAccept} onDecline={handleDecline} />}
      {showBell   && <NotificationBell alerts={alerts} onClose={() => setShowBell(false)} />}

      {/* ✅ FIX: paddingTop uses insets.top — works correctly in both APK and dev */}
      <View style={[d.topBar, { paddingTop: topBarPadding }]}>
        <Text style={d.topBarBrand}>Zuno</Text>
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <TouchableOpacity style={d.bellBox} onPress={() => setShowBell(true)}>
            <Ionicons name="notifications-outline" size={22} color="#fff" />
            {unreadCount > 0 && (
              <View style={d.bellBadge}>
                <Text style={d.bellBadgeTxt}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={d.avatarBox}>
            {photoUri
              ? <Image source={{ uri: photoUri }} style={d.avatarImg} />
              : <Text style={d.avatarInitial}>{(artisan?.full_name || "A")[0].toUpperCase()}</Text>
            }
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />}>

        {acceptedInfo && (
          <AcceptedJobCard
            clientName={acceptedInfo.clientName}
            phone={acceptedInfo.phone}
            jobTitle={acceptedInfo.jobTitle}
            onDismiss={() => setAcceptedInfo(null)}
          />
        )}

        {/* Greet card */}
        <View style={d.greetCard}>
          <View style={{ flex: 1 }}>
            <Text style={d.greetSmall}>Good day,</Text>
            <Text style={d.greetName}>{artisan?.full_name || artisan?.name || "Artisan"}</Text>
            <Text style={d.greetSkill}>{artisan?.category || artisan?.skill || "Technician"}</Text>
            <Text style={d.greetLga}>📍 {artisan?.lga || "Lagos"}</Text>
          </View>
          <View style={d.avatarLarge}>
            {photoUri
              ? <Image source={{ uri: photoUri }} style={d.avatarLargeImg} />
              : <Ionicons name="person" size={36} color="#fff" />
            }
          </View>
        </View>

        {/* Availability */}
        <View style={d.card}>
          <View style={d.cardRow}>
            <Text style={d.cardTitle}>Availability Status</Text>
            <Switch
              value={online}
              onValueChange={toggleOnline}
              trackColor={{ false: "#333", true: "#22c55e" }}
              thumbColor="#fff"
              disabled={togglingOnline}
            />
          </View>
          <View style={[d.statusBadge, { backgroundColor: online ? "rgba(34,197,94,0.12)" : "rgba(100,100,100,0.12)" }]}>
            <View style={[d.statusDot, { backgroundColor: online ? "#22c55e" : "#666" }]} />
            <Text style={[d.statusTxt, { color: online ? "#22c55e" : "#888" }]}>
              {online ? "You are Online — Receiving job alerts actively"
                : activeSnooze ? `Snoozed ${activeSnooze}hr — Auto-resumes`
                : "You are Offline — Toggle ON to receive jobs"}
            </Text>
          </View>
          <View style={d.snoozeRow}>
            {[{ label: "⏸ Snooze 1hr", hrs: 1 }, { label: "⏸ Snooze 3hrs", hrs: 3 }, { label: "⏺ Go Offline", hrs: 0 }].map(({ label, hrs }) => (
              <TouchableOpacity
                key={hrs}
                style={[d.snoozeBtn, activeSnooze === hrs && hrs > 0 && d.snoozeBtnActive]}
                onPress={() => snooze(hrs)}>
                <Text style={[d.snoozeTxt, activeSnooze === hrs && hrs > 0 && d.snoozeTxtActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stats */}
        <View style={d.statsRow}>
          {[
            { num: artisan?.jobs_completed ?? "0",   lbl: "Jobs\nCompleted", color: "#f97316" },
            { num: artisan?.rating         ?? "0.0", lbl: "Star Rating",     color: "#facc15" },
            { num: artisan?.total_reviews  ?? "0",   lbl: "Total\nReviews",  color: "#60a5fa" },
          ].map((st, i) => (
            <View key={i} style={d.statBox}>
              <Text style={[d.statNum, { color: st.color }]}>{st.num}{i === 1 ? "★" : ""}</Text>
              <Text style={d.statLbl}>{st.lbl}</Text>
            </View>
          ))}
        </View>

        {/* Plan badge */}
        {artisan?.subscription_plan && artisan.subscription_plan !== "basic" ? (
          <View style={d.planBadgeCard}>
            <Text style={d.planBadgeEmoji}>{artisan.subscription_plan === "premium" ? "🌟" : "🏆"}</Text>
            <View style={{ flex: 1 }}>
              <Text style={d.planBadgeTitle}>{artisan.subscription_plan.toUpperCase()} PLAN</Text>
              <Text style={d.planBadgeSub}>Active subscription</Text>
            </View>
          </View>
        ) : (
          <View style={d.premiumCard}>
            <View style={{ flex: 1 }}>
              <Text style={d.premiumTitle}>Basic Plan</Text>
              <Text style={d.premiumSub}>Upgrade to receive priority job alerts</Text>
            </View>
            <TouchableOpacity style={d.upgradeBtn}>
              <Text style={d.upgradeTxt}>Upgrade →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recent Job Alerts */}
        <View style={d.section}>
          <View style={d.sectionRow}>
            <Text style={d.sectionTitle}>Recent Job Alerts</Text>
            <TouchableOpacity onPress={fetchAlerts}><Text style={d.sectionLink}>Refresh 🔄</Text></TouchableOpacity>
          </View>
          {alerts.length === 0 ? (
            <View style={d.emptyBox}>
              <Text style={d.emptyEmoji}>📋</Text>
              <Text style={d.emptyText}>No alerts yet. Toggle ON to start receiving jobs.</Text>
            </View>
          ) : alerts.slice(0, 5).map((alert: any, i: number) => (
            <View key={alert.id ?? i} style={d.alertRow}>
              <View style={d.alertDot} />
              <View style={{ flex: 1 }}>
                <Text style={d.alertTitle}>{alert.title || alert.category || alert.service || "New Job"}</Text>
                <Text style={d.alertSub}>{alert.description || alert.message || ""}</Text>
                <Text style={d.alertMeta}>📍 {alert.lga || "Lagos"}{alert.budget ? `  ·  ₦${Number(alert.budget).toLocaleString()}` : ""}</Text>
              </View>
              <Text style={d.alertTime}>{alert.time || alert.created_at || "Now"}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

// ─── Main Artisan Screen ──────────────────────────────────────────────────────
export default function ArtisanScreen() {
  const { loginArtisan, logoutArtisan, artisanToken, artisanData } = useAuth();
  const [tab,       setTab]       = useState<"register" | "login">("register");
  const [form,      setForm]      = useState({ name: "", phone: "", email: "", skill: "", lga: "", password: "" });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loading,   setLoading]   = useState(false);
  const [message,   setMessage]   = useState("");
  const [msgOk,     setMsgOk]     = useState(true);
  const [showSkill, setShowSkill] = useState(false);
  const [showLga,   setShowLga]   = useState(false);

  if (artisanToken) {
    return <ArtisanDashboard artisan={artisanData} token={artisanToken} />;
  }

  const handleRegister = async () => {
    if (!form.name || !form.phone || !form.skill || !form.lga) {
      setMessage("Please fill all required fields."); setMsgOk(false); return;
    }
    setLoading(true); setMessage("");
    try {
      const res  = await fetch(`${API}/artisan/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      setMessage(data.message || "Account created! Please login."); setMsgOk(true); setTab("login");
    } catch { setMessage("Could not connect. Check your internet."); setMsgOk(false); }
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      setMessage("Please enter email and password."); setMsgOk(false); return;
    }
    setLoading(true); setMessage("");
    try {
      const res  = await fetch(`${API}/artisan/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(loginForm) });
      const data = await res.json();
      if (data.success && data.token) { loginArtisan(data.token, data.artisan); }
      else { setMessage(data.message || "Login failed."); setMsgOk(false); }
    } catch { setMessage("Could not connect. Check your internet."); setMsgOk(false); }
    setLoading(false);
  };

  const PickerModal = ({ visible, items, onSelect, onClose }: any) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.sheetHdr}>
            <Text style={s.sheetHdrTxt}>Select</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color="#888" /></TouchableOpacity>
          </View>
          <ScrollView>
            {items.map((item: string, i: number) => (
              <TouchableOpacity key={i} style={s.sheetItem} onPress={() => { onSelect(item); onClose(); }}>
                <Text style={s.sheetItemTxt}>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      <PickerModal visible={showSkill} items={SKILLS} onSelect={(v: string) => setForm({ ...form, skill: v })} onClose={() => setShowSkill(false)} />
      <PickerModal visible={showLga}   items={LGAS}   onSelect={(v: string) => setForm({ ...form, lga: v })}   onClose={() => setShowLga(false)} />
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <View style={s.headerIcon}><Ionicons name="construct" size={28} color="#fff" /></View>
          <Text style={s.headerTitle}>Artisan Portal</Text>
          <Text style={s.headerSub}>Register or login to your artisan account</Text>
        </View>
        <View style={s.tabRow}>
          {(["register", "login"] as const).map(t => (
            <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => { setTab(t); setMessage(""); }}>
              <Text style={[s.tabTxt, tab === t && s.tabTxtActive]}>{t === "register" ? "Register" : "Login"}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={s.form}>
          {tab === "register" ? (
            <>
              <View style={s.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>FULL NAME</Text>
                  <TextInput style={s.input} placeholder="Your full name" placeholderTextColor="#aaa" value={form.name} onChangeText={v => setForm({ ...form, name: v })} />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>PHONE</Text>
                  <TextInput style={s.input} placeholder="08012345678" placeholderTextColor="#aaa" keyboardType="phone-pad" value={form.phone} onChangeText={v => setForm({ ...form, phone: v })} />
                </View>
              </View>
              <Text style={s.fieldLabel}>EMAIL</Text>
              <TextInput style={s.input} placeholder="your@email.com" placeholderTextColor="#aaa" keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={v => setForm({ ...form, email: v })} />
              <View style={s.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>YOUR SKILL</Text>
                  <TouchableOpacity style={s.dropdown} onPress={() => setShowSkill(true)}>
                    <Text style={form.skill ? s.dropVal : s.dropPh}>{form.skill || "Select skill"}</Text>
                    <Ionicons name="chevron-down" size={18} color="#888" />
                  </TouchableOpacity>
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>YOUR LGA</Text>
                  <TouchableOpacity style={s.dropdown} onPress={() => setShowLga(true)}>
                    <Text style={form.lga ? s.dropVal : s.dropPh}>{form.lga || "Select LGA"}</Text>
                    <Ionicons name="chevron-down" size={18} color="#888" />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={s.fieldLabel}>PASSWORD</Text>
              <TextInput style={s.input} placeholder="Password" placeholderTextColor="#aaa" secureTextEntry value={form.password} onChangeText={v => setForm({ ...form, password: v })} />
              {!!message && <Text style={[s.msg, { color: msgOk ? "#22c55e" : "#ef4444" }]}>{message}</Text>}
              <TouchableOpacity style={s.btnOrange} onPress={handleRegister} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Create Account →</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setTab("login"); setMessage(""); }}>
                <Text style={s.switchTxt}>Already have an account? <Text style={{ color: "#f97316" }}>Login here</Text></Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={s.fieldLabel}>EMAIL</Text>
              <TextInput style={s.input} placeholder="your@email.com" placeholderTextColor="#aaa" keyboardType="email-address" autoCapitalize="none" value={loginForm.email} onChangeText={v => setLoginForm({ ...loginForm, email: v })} />
              <Text style={s.fieldLabel}>PASSWORD</Text>
              <TextInput style={s.input} placeholder="Your password" placeholderTextColor="#aaa" secureTextEntry value={loginForm.password} onChangeText={v => setLoginForm({ ...loginForm, password: v })} />
              {!!message && <Text style={[s.msg, { color: msgOk ? "#22c55e" : "#ef4444" }]}>{message}</Text>}
              <TouchableOpacity style={s.btnOrange} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Login to Dashboard →</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setTab("register"); setMessage(""); }}>
                <Text style={s.switchTxt}>No account? <Text style={{ color: "#f97316" }}>Register here</Text></Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ac = StyleSheet.create({
  card:       { margin: 16, marginBottom: 0, backgroundColor: "#0d1f0d", borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: "#22c55e" },
  cardTop:    { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  iconBox:    { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(34,197,94,0.15)", alignItems: "center", justifyContent: "center" },
  cardTitle:  { color: "#22c55e", fontWeight: "bold", fontSize: 15 },
  cardSub:    { color: "#888", fontSize: 12 },
  closeBtn:   { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  clientName: { color: "#fff", fontWeight: "bold", fontSize: 14, marginBottom: 10 },
  phoneRow:   { flexDirection: "row", alignItems: "center", backgroundColor: "#0a2a0a", borderRadius: 12, padding: 14, marginBottom: 8, gap: 10 },
  phoneNum:   { color: "#22c55e", fontWeight: "bold", fontSize: 16, flex: 1 },
  tapHint:    { color: "#555", fontSize: 11 },
  waRow:      { flexDirection: "row", alignItems: "center", backgroundColor: "#0a2a14", borderRadius: 12, padding: 14, marginBottom: 10, gap: 10 },
  waEmoji:    { fontSize: 18 },
  waTxt:      { color: "#25D366", fontWeight: "bold", fontSize: 14, flex: 1 },
  timerRow:   { flexDirection: "row", alignItems: "center" },
  timerTxt:   { color: "#555", fontSize: 11 },
});

const pp = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", alignItems: "center", padding: 20 },
  card:         { backgroundColor: "#1a1a1a", borderRadius: 20, width: "100%", borderWidth: 2, borderColor: "#f97316", overflow: "hidden" },
  header:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#111", padding: 16 },
  headerLeft:   { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  bellIcon:     { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(249,115,22,0.15)", alignItems: "center", justifyContent: "center" },
  headerTitle:  { color: "#f97316", fontWeight: "bold", fontSize: 14, letterSpacing: 0.5 },
  headerSub:    { color: "#888", fontSize: 11, marginTop: 1 },
  closeBtn:     { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  grid:         { flexDirection: "row", flexWrap: "wrap", padding: 16, gap: 12 },
  gridCell:     { width: "47%", backgroundColor: "#111", borderRadius: 12, padding: 14 },
  gridLabel:    { color: "#666", fontSize: 10, fontWeight: "bold", letterSpacing: 0.8, marginBottom: 6 },
  gridValue:    { color: "#fff", fontWeight: "bold", fontSize: 15 },
  budgetText:   { color: "#22c55e" },
  timerRow:     { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingBottom: 14 },
  timerText:    { fontWeight: "bold", fontSize: 13 },
  btnRow:       { flexDirection: "row", padding: 16, paddingTop: 4, gap: 10 },
  acceptBtn:    { flex: 1, backgroundColor: "#22c55e", borderRadius: 12, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  acceptBtnTxt: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  declineBtn:   { flex: 1, backgroundColor: "rgba(239,68,68,0.1)", borderRadius: 12, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#ef4444" },
  declineBtnTxt:{ color: "#ef4444", fontWeight: "bold", fontSize: 15 },
});

const nb = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  dropdown:   { position: "absolute", top: 96, right: 16, width: 300, backgroundColor: "#1a1a1a", borderRadius: 16, borderWidth: 1, borderColor: "#333", overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  header:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#2a2a2a" },
  headerTxt:  { color: "#fff", fontWeight: "bold", fontSize: 15 },
  empty:      { alignItems: "center", padding: 28, gap: 8 },
  emptyEmoji: { fontSize: 32 },
  emptyTxt:   { color: "#888", fontSize: 13 },
  item:       { flexDirection: "row", padding: 14, borderBottomWidth: 1, borderBottomColor: "#222", gap: 10, alignItems: "flex-start" },
  itemDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: "#f97316", marginTop: 5 },
  itemTitle:  { color: "#fff", fontWeight: "bold", fontSize: 13, marginBottom: 2 },
  itemSub:    { color: "#22c55e", fontSize: 12 },
  itemTime:   { color: "#555", fontSize: 11, marginTop: 2 },
});

const d = StyleSheet.create({
  root:           { flex: 1, backgroundColor: "#0a0a0a" },
  // ✅ paddingTop is set dynamically via insets in the component, not hardcoded
  topBar:         { backgroundColor: "#f97316", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16 },
  topBarBrand:    { color: "#fff", fontSize: 22, fontWeight: "bold" },
  bellBox:        { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  bellBadge:      { position: "absolute", top: -2, right: -2, backgroundColor: "#ef4444", borderRadius: 8, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center" },
  bellBadgeTxt:   { color: "#fff", fontSize: 9, fontWeight: "bold" },
  avatarBox:      { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarImg:      { width: 40, height: 40 },
  avatarInitial:  { color: "#fff", fontWeight: "bold", fontSize: 18 },
  greetCard:      { flexDirection: "row", alignItems: "center", backgroundColor: "#161616", margin: 16, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#222" },
  greetSmall:     { color: "#888", fontSize: 13 },
  greetName:      { color: "#fff", fontSize: 22, fontWeight: "bold" },
  greetSkill:     { color: "#f97316", fontSize: 13, fontWeight: "600", marginTop: 2 },
  greetLga:       { color: "#888", fontSize: 12, marginTop: 2 },
  avatarLarge:    { width: 64, height: 64, borderRadius: 32, backgroundColor: "#f97316", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarLargeImg: { width: 64, height: 64 },
  card:           { backgroundColor: "#161616", margin: 16, marginTop: 0, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "#222" },
  cardRow:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cardTitle:      { color: "#fff", fontSize: 16, fontWeight: "bold" },
  statusBadge:    { borderRadius: 10, padding: 12, flexDirection: "row", alignItems: "center" },
  statusDot:      { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusTxt:      { fontSize: 13, fontWeight: "600", flex: 1 },
  snoozeRow:      { flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" },
  snoozeBtn:      { backgroundColor: "#222", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: "#333" },
  snoozeBtnActive:{ backgroundColor: "rgba(249,115,22,0.1)", borderColor: "#f97316" },
  snoozeTxt:      { color: "#888", fontSize: 12, fontWeight: "bold" },
  snoozeTxtActive:{ color: "#f97316" },
  statsRow:       { flexDirection: "row", gap: 10, marginHorizontal: 16, marginTop: 0 },
  statBox:        { flex: 1, backgroundColor: "#161616", borderRadius: 14, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "#222" },
  statNum:        { fontSize: 22, fontWeight: "bold" },
  statLbl:        { color: "#888", fontSize: 10, marginTop: 4, textAlign: "center" },
  planBadgeCard:  { flexDirection: "row", alignItems: "center", backgroundColor: "#0d2e1a", margin: 16, marginTop: 10, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#22c55e", gap: 12 },
  planBadgeEmoji: { fontSize: 28 },
  planBadgeTitle: { color: "#22c55e", fontWeight: "bold", fontSize: 15 },
  planBadgeSub:   { color: "#888", fontSize: 12 },
  premiumCard:    { flexDirection: "row", alignItems: "center", backgroundColor: "#1a0800", margin: 16, marginTop: 10, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "#f97316" },
  premiumTitle:   { color: "#f97316", fontSize: 16, fontWeight: "bold" },
  premiumSub:     { color: "#888", fontSize: 12, marginTop: 2 },
  upgradeBtn:     { backgroundColor: "#f97316", borderRadius: 20, paddingHorizontal: 18, paddingVertical: 10 },
  upgradeTxt:     { color: "#fff", fontWeight: "bold", fontSize: 13 },
  section:        { paddingHorizontal: 16, paddingTop: 20 },
  sectionRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle:   { color: "#fff", fontSize: 17, fontWeight: "bold" },
  sectionLink:    { color: "#f97316", fontSize: 13 },
  emptyBox:       { backgroundColor: "#161616", borderRadius: 14, padding: 28, alignItems: "center", borderWidth: 1, borderColor: "#222" },
  emptyEmoji:     { fontSize: 36, marginBottom: 8 },
  emptyText:      { color: "#888", textAlign: "center", fontSize: 13, lineHeight: 20 },
  alertRow:       { flexDirection: "row", alignItems: "flex-start", padding: 14, backgroundColor: "#161616", borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: "#222", gap: 10 },
  alertDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: "#f97316", marginTop: 5 },
  alertTitle:     { color: "#fff", fontWeight: "bold", fontSize: 14, marginBottom: 2 },
  alertSub:       { color: "#888", fontSize: 12, lineHeight: 18 },
  alertMeta:      { color: "#22c55e", fontSize: 12, marginTop: 4 },
  alertTime:      { color: "#555", fontSize: 11 },
});

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: "#0a0a0a" },
  header:       { alignItems: "center", paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20 },
  headerIcon:   { width: 60, height: 60, borderRadius: 16, backgroundColor: "#f97316", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  headerTitle:  { color: "#fff", fontSize: 26, fontWeight: "bold" },
  headerSub:    { color: "#888", fontSize: 14, marginTop: 4, textAlign: "center" },
  tabRow:       { flexDirection: "row", marginHorizontal: 20, backgroundColor: "#161616", borderRadius: 12, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: "#222" },
  tab:          { flex: 1, paddingVertical: 13, alignItems: "center", borderRadius: 10 },
  tabActive:    { backgroundColor: "#f97316" },
  tabTxt:       { color: "#555", fontWeight: "bold", fontSize: 15 },
  tabTxtActive: { color: "#fff" },
  form:         { paddingHorizontal: 20, paddingBottom: 50 },
  row2:         { flexDirection: "row", marginBottom: 4 },
  fieldLabel:   { color: "#888", fontSize: 11, fontWeight: "bold", letterSpacing: 0.8, marginBottom: 6, marginTop: 4 },
  input:        { backgroundColor: "#fff", borderRadius: 12, padding: 14, color: "#000", fontSize: 15, marginBottom: 14, borderWidth: 1, borderColor: "#ddd" },
  dropdown:     { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: "#ddd", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dropVal:      { color: "#000", fontSize: 15 },
  dropPh:       { color: "#aaa", fontSize: 15 },
  btnOrange:    { backgroundColor: "#f97316", borderRadius: 14, paddingVertical: 17, alignItems: "center", marginTop: 8, marginBottom: 16 },
  btnTxt:       { color: "#fff", fontWeight: "bold", fontSize: 16 },
  switchTxt:    { color: "#888", textAlign: "center", fontSize: 14 },
  msg:          { textAlign: "center", marginBottom: 12, fontSize: 14 },
  overlay:      { flex: 1, backgroundColor: "rgba(0,0,0,0.78)", justifyContent: "flex-end" },
  sheet:        { backgroundColor: "#161616", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "70%", paddingBottom: 30 },
  sheetHdr:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#222" },
  sheetHdrTxt:  { color: "#fff", fontSize: 16, fontWeight: "bold" },
  sheetItem:    { padding: 16, borderBottomWidth: 1, borderBottomColor: "#1e1e1e" },
  sheetItemTxt: { color: "#fff", fontSize: 15 },
});