import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
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
import { useAuth } from "../services/context";
import { setupNotificationListeners, setupPushNotifications } from "../services/notificationService";
import { socketService } from "../services/socketService";

const API = "https://zuno.ng/api";

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
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });
    const { sound } = await Audio.Sound.createAsync(
      { uri: "https://zuno.ng/beep.wav" },
      { shouldPlay: true, volume: 1.0 }
    );
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
      }
    });
  } catch (e) {
    console.warn("[Beep] Failed to play:", e);
  }
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

// ─── Support Menu ─────────────────────────────────────────────────────────────
function SupportMenu({ visible, onClose, onLiveChat }: {
  visible: boolean; onClose: () => void; onLiveChat: () => void;
}) {
  const items = [
    {
      icon: "help-circle-outline" as const,
      label: "FAQ",
      sub: "Frequently asked questions",
      action: () => { onClose(); Linking.openURL("https://zuno.ng/help"); },
    },
    {
      icon: "document-text-outline" as const,
      label: "Terms & Conditions",
      sub: "Our terms of use",
      action: () => { onClose(); Linking.openURL("https://zuno.ng/terms"); },
    },
    {
      icon: "chatbubble-ellipses-outline" as const,
      label: "Live Chat Support",
      sub: "Chat with our support team",
      action: () => { onClose(); onLiveChat(); },
    },
    {
      icon: "logo-whatsapp" as const,
      label: "WhatsApp Support",
      sub: "Message us on WhatsApp",
      action: () => { onClose(); Linking.openURL("https://zuno.ng/whatsapp"); },
    },
  ];

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={sm.overlay} activeOpacity={1} onPress={onClose}>
        <View style={sm.sheet}>
          <View style={sm.sheetHandle} />
          <Text style={sm.sheetTitle}>How can we help?</Text>
          {items.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[sm.item, i === items.length - 1 && { borderBottomWidth: 0 }]}
              onPress={item.action}
              activeOpacity={0.75}>
              <View style={[sm.iconBox, item.icon === "logo-whatsapp" && { backgroundColor: "rgba(37,211,102,0.12)" }]}>
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={item.icon === "logo-whatsapp" ? "#25D366" : "#f97316"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={sm.itemLabel}>{item.label}</Text>
                <Text style={sm.itemSub}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#444" />
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Active Job Warning Modal ─────────────────────────────────────────────────
function ActiveJobWarningModal({ visible, onStayOffline, onGoOnline }: {
  visible: boolean; onStayOffline: () => void; onGoOnline: () => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={aw.overlay}>
        <View style={aw.sheet}>
          <Text style={aw.emoji}>⚠️</Text>
          <Text style={aw.title}>Active Job In Progress</Text>
          <Text style={aw.sub}>
            You still have an active job assigned to you.{"\n\n"}
            <Text style={{ color: "#ef4444", fontWeight: "700" }}>
              Repeated no-shows or abandoned jobs may lead to temporary account suspension.
            </Text>
          </Text>
          <TouchableOpacity style={aw.onlineBtn} onPress={onGoOnline} activeOpacity={0.85}>
            <Text style={aw.onlineBtnTxt}>Go Online Anyway</Text>
          </TouchableOpacity>
          <TouchableOpacity style={aw.offlineBtn} onPress={onStayOffline} activeOpacity={0.85}>
            <Text style={aw.offlineBtnTxt}>Stay Offline</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Artisan Dashboard ────────────────────────────────────────────────────────
function ArtisanDashboard({ artisan, token }: any) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { refreshArtisanData } = useAuth();

  const [online,           setOnline]           = useState<boolean>(
    artisan?.availability_toggle === 1 || artisan?.availability_toggle === true
  );
  const [alerts,           setAlerts]           = useState<any[]>([]);
  const [refreshing,       setRefreshing]       = useState(false);
  const [togglingOnline,   setTogglingOnline]   = useState(false);
  const [pendingJob,       setPendingJob]       = useState<any | null>(null);
  const [acceptedInfo,     setAcceptedInfo]     = useState<any | null>(null);
  const [showBell,         setShowBell]         = useState(false);
  const [showSupportMenu,  setShowSupportMenu]  = useState(false);
  const [activeSnooze,     setActiveSnooze]     = useState<number | null>(null);
  const [showActiveJobWarn, setShowActiveJobWarn] = useState(false);

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

    const unsubJobAlert = socketService.onJobAlert((job: any) => {
      const jid = String(job.job_id || job.id);
      if (seenJobIds.current.has(jid)) return;
      seenJobIds.current.add(jid);
      setPendingJob(job);
      startBeep();
      setAlerts(prev => [{ ...job, id: jid, status: "pending" }, ...prev]);
    });

    fetchAlerts();
    setupPushNotifications(token).catch(() => {});
    const removeSub = setupNotificationListeners((_jobId: any) => { fetchAlerts(); });

    return () => {
      unsubJobAlert();
      removeSub();
      stopBeep();
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
        setOnline(false);
        setActiveSnooze(null);
        socketService.emitToggle(artisan.id, 0);
        fetch(`${API}/artisan/availability`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ is_online: false }),
        }).catch(() => {});
        AsyncStorage.setItem("zuno_active_job", String(jobId)).catch(() => {});
        fetchAlerts();
      }
    } catch {}
    setPendingJob(null);
  };

  const handleDecline = () => { stopBeep(); setPendingJob(null); };

  const toggleOnline = async (val: boolean) => {
    if (val) {
      const activeJob = await AsyncStorage.getItem("zuno_active_job").catch(() => null);
      if (activeJob) { setShowActiveJobWarn(true); return; }
    }
    await _doToggleOnline(val);
  };

  const _doToggleOnline = async (val: boolean) => {
    setOnline(val);
    setActiveSnooze(null);
    if (snoozeTimer.current) { clearTimeout(snoozeTimer.current); snoozeTimer.current = null; }
    setTogglingOnline(true);
    socketService.emitToggle(artisan.id, val ? 1 : 0);
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
    if (hours === 0) { _doToggleOnline(false); setActiveSnooze(null); return; }
    setOnline(false);
    setActiveSnooze(hours);
    socketService.emitToggle(artisan.id, 0);
    fetch(`${API}/artisan/availability`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_online: false }),
    }).catch(() => {});
    snoozeTimer.current = setTimeout(() => {
      setOnline(true);
      setActiveSnooze(null);
      socketService.emitToggle(artisan.id, 1);
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

  const photoUri      = artisan?.profile_photo || artisan?.photo || null;
  const unreadCount   = alerts.filter((a: any) => a.status === "pending" || !a.read).length;
  const topBarPadding = insets.top + 12;

  return (
    <View style={d.root}>
      <StatusBar barStyle="light-content" backgroundColor="#f97316" translucent />
      {pendingJob && <JobAlertPopup job={pendingJob} onAccept={handleAccept} onDecline={handleDecline} />}
      {showBell   && <NotificationBell alerts={alerts} onClose={() => setShowBell(false)} />}
      <SupportMenu visible={showSupportMenu} onClose={() => setShowSupportMenu(false)} onLiveChat={() => router.push("/support")} />
      <ActiveJobWarningModal
        visible={showActiveJobWarn}
        onStayOffline={() => setShowActiveJobWarn(false)}
        onGoOnline={() => {
          setShowActiveJobWarn(false);
          AsyncStorage.removeItem("zuno_active_job").catch(() => {});
          _doToggleOnline(true);
        }}
      />
      <View style={[d.topBar, { paddingTop: topBarPadding }]}>
        <View style={d.topBarLeft}>
          <Text style={d.topBarBrand}>Zuno</Text>
          <TouchableOpacity style={d.supportBtn} onPress={() => setShowSupportMenu(true)} activeOpacity={0.75}>
            <Ionicons name="chatbubble-ellipses" size={18} color="#f97316" />
            <Text style={d.supportBtnTxt}>Support ▾</Text>
          </TouchableOpacity>
        </View>
        <View style={d.topBarRight}>
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
        <View style={d.card}>
          <View style={d.cardRow}>
            <Text style={d.cardTitle}>Availability Status</Text>
            <Switch value={online} onValueChange={toggleOnline} trackColor={{ false: "#333", true: "#22c55e" }} thumbColor="#fff" disabled={togglingOnline} />
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
              <TouchableOpacity key={hrs} style={[d.snoozeBtn, activeSnooze === hrs && hrs > 0 && d.snoozeBtnActive]} onPress={() => snooze(hrs)}>
                <Text style={[d.snoozeTxt, activeSnooze === hrs && hrs > 0 && d.snoozeTxtActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
  const { loginArtisan, artisanToken, artisanData } = useAuth();
  const [tab,           setTab]           = useState<"register" | "login">("register");
  const [regStep,       setRegStep]       = useState<1 | 2 | 3>(1);
  const [form,          setForm]          = useState({ name: "", phone: "", email: "", skill: "", lga: "", password: "" });
  const [loginForm,     setLoginForm]     = useState({ email: "", password: "" });
  const [loading,       setLoading]       = useState(false);
  const [message,       setMessage]       = useState("");
  const [msgOk,         setMsgOk]         = useState(true);
  const [showSkill,     setShowSkill]     = useState(false);
  const [showLga,       setShowLga]       = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [profilePhoto,  setProfilePhoto]  = useState<any>(null);
  const [workPhotos,    setWorkPhotos]    = useState<any[]>([]);

  if (artisanToken) {
    return <ArtisanDashboard artisan={artisanData} token={artisanToken} />;
  }

  // ── Step 1 → Step 2 ──────────────────────────────────────────────────────
  const goToStep2 = () => {
    if (!form.name || !form.phone || !form.email || !form.skill || !form.lga || !form.password) {
      setMessage("Please fill all required fields."); setMsgOk(false); return;
    }
    if (form.password.length < 6) {
      setMessage("Password must be at least 6 characters."); setMsgOk(false); return;
    }
    if (!termsAccepted) {
      setMessage("Please agree to the Terms of Use and Privacy Policy."); setMsgOk(false); return;
    }
    setMessage(""); setRegStep(2);
  };

  // ── Step 2 → Step 3 ──────────────────────────────────────────────────────
  const goToStep3 = () => {
    if (!profilePhoto) {
      setMessage("Please upload your profile photo."); setMsgOk(false); return;
    }
    setMessage(""); setRegStep(3);
  };

  // ── Pick profile photo ────────────────────────────────────────────────────
  const pickProfilePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { setMessage("Camera roll permission needed."); setMsgOk(false); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setProfilePhoto(result.assets[0]);
      setMessage("");
    }
  };

  // ── Pick work photos ──────────────────────────────────────────────────────
  const pickWorkPhotos = async () => {
    if (workPhotos.length >= 10) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { setMessage("Camera roll permission needed."); setMsgOk(false); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true, quality: 0.8,
    });
    if (!result.canceled) {
      const remaining = 10 - workPhotos.length;
      setWorkPhotos(prev => [...prev, ...result.assets.slice(0, remaining)]);
    }
  };

  // ── Submit registration ───────────────────────────────────────────────────
  const handleRegister = async () => {
    if (workPhotos.length === 0) {
      setMessage("Please upload at least 1 work photo."); setMsgOk(false); return;
    }
    setLoading(true); setMessage("");
    try {
      const formData = new FormData();
      formData.append("full_name", form.name);
      formData.append("phone",     form.phone);
      formData.append("email",     form.email);
      formData.append("password",  form.password);
      formData.append("category",  form.skill);
      formData.append("lga",       form.lga);

      if (profilePhoto) {
        const ext = profilePhoto.uri.split(".").pop() || "jpg";
        formData.append("profile_photo", { uri: profilePhoto.uri, name: `profile.${ext}`, type: `image/${ext}` } as any);
      }
      workPhotos.forEach((photo, i) => {
        const ext = photo.uri.split(".").pop() || "jpg";
        formData.append("work_photos", { uri: photo.uri, name: `work_${i}.${ext}`, type: `image/${ext}` } as any);
      });

      const res  = await fetch(`${API}/artisan/register`, { method: "POST", body: formData });
      const data = await res.json();

      if (data.success) {
        setMessage(data.message || "Account created! Please login.");
        setMsgOk(true);
        setTab("login");
        setRegStep(1);
        setProfilePhoto(null);
        setWorkPhotos([]);
        setForm({ name: "", phone: "", email: "", skill: "", lga: "", password: "" });
        setTermsAccepted(false);
      } else {
        setMessage(data.message || "Registration failed. Please try again.");
        setMsgOk(false);
      }
    } catch {
      setMessage("Could not connect. Check your internet.");
      setMsgOk(false);
    }
    setLoading(false);
  };

  // ── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      setMessage("Please enter email and password."); setMsgOk(false); return;
    }
    setLoading(true); setMessage("");
    try {
      const res  = await fetch(`${API}/artisan/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (data.success && data.token) { loginArtisan(data.token, data.artisan); }
      else { setMessage(data.message || "Login failed."); setMsgOk(false); }
    } catch { setMessage("Could not connect. Check your internet."); setMsgOk(false); }
    setLoading(false);
  };

  // ── Picker modal (skill / LGA) ────────────────────────────────────────────
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

  // ── Step indicator ────────────────────────────────────────────────────────
  const StepBar = () => (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
      {([1, 2, 3] as const).map((n, idx) => (
        <View key={n} style={{ flexDirection: "row", alignItems: "center", flex: n < 3 ? 1 : undefined }}>
          <View style={{ alignItems: "center" }}>
            <View style={{
              width: 30, height: 30, borderRadius: 15,
              backgroundColor: regStep >= n ? "#f97316" : "#222",
              borderWidth: 2, borderColor: regStep >= n ? "#f97316" : "#444",
              alignItems: "center", justifyContent: "center",
            }}>
              <Text style={{ color: regStep > n ? "#fff" : regStep === n ? "#fff" : "#555", fontSize: 12, fontWeight: "800" }}>
                {regStep > n ? "✓" : String(n)}
              </Text>
            </View>
            <Text style={{ color: regStep >= n ? "#f97316" : "#555", fontSize: 10, fontWeight: "700", marginTop: 3 }}>
              {n === 1 ? "Info" : n === 2 ? "Photo" : "Work"}
            </Text>
          </View>
          {n < 3 && (
            <View style={{ flex: 1, height: 2, backgroundColor: regStep > n ? "#f97316" : "#333", marginHorizontal: 6, marginBottom: 14 }} />
          )}
        </View>
      ))}
    </View>
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
            <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => { setTab(t); setMessage(""); setRegStep(1); }}>
              <Text style={[s.tabTxt, tab === t && s.tabTxtActive]}>{t === "register" ? "Register" : "Login"}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.form}>

          {/* ══════════════ REGISTER TAB ══════════════ */}
          {tab === "register" && (
            <>
              <StepBar />

              {/* ── STEP 1: Basic Info ── */}
              {regStep === 1 && (
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
                  <TextInput style={s.input} placeholder="Password (min 6 characters)" placeholderTextColor="#aaa" secureTextEntry value={form.password} onChangeText={v => setForm({ ...form, password: v })} />
                  <TouchableOpacity style={s.termsRow} onPress={() => setTermsAccepted(!termsAccepted)} activeOpacity={0.8}>
                    <View style={[s.checkbox, termsAccepted && s.checkboxChecked]}>
                      {termsAccepted && <Text style={s.checkmark}>✓</Text>}
                    </View>
                    <Text style={s.termsTxt}>
                      I agree to Zuno's{" "}
                      <Text style={s.termsLink} onPress={() => Linking.openURL("https://zuno.ng/terms")}>Terms of Use</Text>
                      {" "}and{" "}
                      <Text style={s.termsLink} onPress={() => Linking.openURL("https://zuno.ng/privacy-policy")}>Privacy Policy</Text>
                    </Text>
                  </TouchableOpacity>
                  {!!message && <Text style={[s.msg, { color: msgOk ? "#22c55e" : "#ef4444" }]}>{message}</Text>}
                  <TouchableOpacity style={s.btnOrange} onPress={goToStep2} activeOpacity={0.85}>
                    <Text style={s.btnTxt}>Continue → Add Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setTab("login"); setMessage(""); }}>
                    <Text style={s.switchTxt}>Already have an account? <Text style={{ color: "#f97316" }}>Login here</Text></Text>
                  </TouchableOpacity>
                </>
              )}

              {/* ── STEP 2: Profile Photo ── */}
              {regStep === 2 && (
                <>
                  <Text style={{ color: "#fff", fontSize: 17, fontWeight: "800", textAlign: "center", marginBottom: 6 }}>
                    Profile Photo <Text style={{ color: "#f97316" }}>★ Required</Text>
                  </Text>
                  <Text style={{ color: "#888", fontSize: 13, textAlign: "center", marginBottom: 20, lineHeight: 20 }}>
                    Clients trust artisans with real photos. Use a clear face photo.
                  </Text>
                  <TouchableOpacity
                    onPress={pickProfilePhoto}
                    activeOpacity={0.8}
                    style={{ borderWidth: 2, borderColor: "rgba(249,115,22,0.5)", borderStyle: "dashed", borderRadius: 16, padding: 28, alignItems: "center", backgroundColor: "rgba(249,115,22,0.03)", marginBottom: 16 }}>
                    {profilePhoto ? (
                      <>
                        <Image source={{ uri: profilePhoto.uri }} style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: "#f97316", marginBottom: 10 }} />
                        <Text style={{ color: "#22c55e", fontWeight: "700", fontSize: 14 }}>✅ Photo selected!</Text>
                        <Text style={{ color: "#888", fontSize: 12, marginTop: 4 }}>Tap to change</Text>
                      </>
                    ) : (
                      <>
                        <Text style={{ fontSize: 52, marginBottom: 10 }}>📸</Text>
                        <Text style={{ color: "#f97316", fontWeight: "700", fontSize: 15 }}>Tap to upload your photo</Text>
                        <Text style={{ color: "#888", fontSize: 12, marginTop: 6 }}>JPG or PNG, max 5MB</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  {!!message && <Text style={[s.msg, { color: msgOk ? "#22c55e" : "#ef4444" }]}>{message}</Text>}
                  <TouchableOpacity style={s.btnOrange} onPress={goToStep3} activeOpacity={0.85}>
                    <Text style={s.btnTxt}>Continue → Add Work Photos</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.btnBack} onPress={() => { setRegStep(1); setMessage(""); }} activeOpacity={0.85}>
                    <Text style={s.btnBackTxt}>← Back</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* ── STEP 3: Work Photos ── */}
              {regStep === 3 && (
                <>
                  <Text style={{ color: "#fff", fontSize: 17, fontWeight: "800", textAlign: "center", marginBottom: 6 }}>
                    Work Photos <Text style={{ color: "#f97316" }}>★ Required</Text>
                  </Text>
                  <Text style={{ color: "#888", fontSize: 13, textAlign: "center", marginBottom: 20, lineHeight: 20 }}>
                    Upload at least 1 photo of past work. More photos = more trust = more clients!
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                    {workPhotos.map((photo, i) => (
                      <View key={i} style={{ width: 90, height: 90, borderRadius: 10, overflow: "hidden" }}>
                        <Image source={{ uri: photo.uri }} style={{ width: 90, height: 90 }} />
                        <TouchableOpacity
                          onPress={() => setWorkPhotos(prev => prev.filter((_, idx) => idx !== i))}
                          style={{ position: "absolute", top: 3, right: 3, backgroundColor: "rgba(0,0,0,0.75)", borderRadius: 10, width: 22, height: 22, alignItems: "center", justifyContent: "center" }}>
                          <Text style={{ color: "#fff", fontSize: 12, fontWeight: "800" }}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                    {workPhotos.length < 10 && (
                      <TouchableOpacity
                        onPress={pickWorkPhotos}
                        activeOpacity={0.8}
                        style={{ width: 90, height: 90, borderRadius: 10, borderWidth: 2, borderColor: "rgba(249,115,22,0.4)", borderStyle: "dashed", backgroundColor: "rgba(249,115,22,0.03)", alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontSize: 28, color: "#f97316" }}>+</Text>
                        <Text style={{ color: "#f97316", fontSize: 11, marginTop: 2 }}>Add Photos</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={{ color: "#888", fontSize: 12, textAlign: "right", marginBottom: 12 }}>{workPhotos.length} / 10 photos</Text>
                  {!!message && <Text style={[s.msg, { color: msgOk ? "#22c55e" : "#ef4444" }]}>{message}</Text>}
                  <TouchableOpacity style={s.btnOrange} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Create Account →</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity style={s.btnBack} onPress={() => { setRegStep(2); setMessage(""); }} activeOpacity={0.85}>
                    <Text style={s.btnBackTxt}>← Back</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}

          {/* ══════════════ LOGIN TAB ══════════════ */}
          {tab === "login" && (
            <>
              <Text style={s.fieldLabel}>EMAIL</Text>
              <TextInput style={s.input} placeholder="your@email.com" placeholderTextColor="#aaa" keyboardType="email-address" autoCapitalize="none" value={loginForm.email} onChangeText={v => setLoginForm({ ...loginForm, email: v })} />
              <Text style={s.fieldLabel}>PASSWORD</Text>
              <TextInput style={s.input} placeholder="Your password" placeholderTextColor="#aaa" secureTextEntry value={loginForm.password} onChangeText={v => setLoginForm({ ...loginForm, password: v })} />
              {!!message && <Text style={[s.msg, { color: msgOk ? "#22c55e" : "#ef4444" }]}>{message}</Text>}
              <TouchableOpacity style={s.btnOrange} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
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

const aw = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center", padding: 24 },
  sheet:        { backgroundColor: "#1a1a1a", borderRadius: 24, padding: 28, width: "100%", borderWidth: 1.5, borderColor: "#f97316", alignItems: "center" },
  emoji:        { fontSize: 52, marginBottom: 14 },
  title:        { color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 10, textAlign: "center" },
  sub:          { color: "#888", fontSize: 14, lineHeight: 22, textAlign: "center", marginBottom: 24 },
  onlineBtn:    { width: "100%", backgroundColor: "rgba(249,115,22,0.15)", borderRadius: 14, paddingVertical: 16, alignItems: "center", marginBottom: 10, borderWidth: 1.5, borderColor: "#f97316" },
  onlineBtnTxt: { color: "#f97316", fontWeight: "800", fontSize: 16 },
  offlineBtn:   { width: "100%", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#333" },
  offlineBtnTxt:{ color: "#888", fontWeight: "600", fontSize: 15 },
});

const d = StyleSheet.create({
  root:           { flex: 1, backgroundColor: "#0a0a0a" },
  topBar:         { backgroundColor: "#f97316", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16 },
  topBarLeft:     { flexDirection: "row", alignItems: "center", gap: 12 },
  topBarRight:    { flexDirection: "row", alignItems: "center", gap: 12 },
  topBarBrand:    { color: "#fff", fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  supportBtn:     { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#fff", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  supportBtnTxt:  { color: "#f97316", fontSize: 13, fontWeight: "800", letterSpacing: 0.2 },
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

const sm = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet:      { backgroundColor: "#1a1a1a", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 36, paddingTop: 12 },
  sheetHandle:{ width: 40, height: 4, backgroundColor: "#333", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  sheetTitle: { color: "#888", fontSize: 11, fontWeight: "800", letterSpacing: 1.5, paddingHorizontal: 20, marginBottom: 8 },
  item:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#222", gap: 14 },
  iconBox:    { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(249,115,22,0.12)", alignItems: "center", justifyContent: "center" },
  itemLabel:  { color: "#fff", fontSize: 15, fontWeight: "700" },
  itemSub:    { color: "#666", fontSize: 12, marginTop: 2 },
});

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: "#0a0a0a" },
  header:          { alignItems: "center", paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20 },
  headerIcon:      { width: 60, height: 60, borderRadius: 16, backgroundColor: "#f97316", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  headerTitle:     { color: "#fff", fontSize: 26, fontWeight: "bold" },
  headerSub:       { color: "#888", fontSize: 14, marginTop: 4, textAlign: "center" },
  tabRow:          { flexDirection: "row", marginHorizontal: 20, backgroundColor: "#161616", borderRadius: 12, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: "#222" },
  tab:             { flex: 1, paddingVertical: 13, alignItems: "center", borderRadius: 10 },
  tabActive:       { backgroundColor: "#f97316" },
  tabTxt:          { color: "#555", fontWeight: "bold", fontSize: 15 },
  tabTxtActive:    { color: "#fff" },
  form:            { paddingHorizontal: 20, paddingBottom: 50 },
  row2:            { flexDirection: "row", marginBottom: 4 },
  fieldLabel:      { color: "#888", fontSize: 11, fontWeight: "bold", letterSpacing: 0.8, marginBottom: 6, marginTop: 4 },
  input:           { backgroundColor: "#fff", borderRadius: 12, padding: 14, color: "#000", fontSize: 15, marginBottom: 14, borderWidth: 1, borderColor: "#ddd" },
  dropdown:        { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: "#ddd", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dropVal:         { color: "#000", fontSize: 15 },
  dropPh:          { color: "#aaa", fontSize: 15 },
  btnOrange:       { backgroundColor: "#f97316", borderRadius: 14, paddingVertical: 17, alignItems: "center", marginTop: 8, marginBottom: 10 },
  btnTxt:          { color: "#fff", fontWeight: "bold", fontSize: 16 },
  btnBack:         { backgroundColor: "transparent", borderRadius: 14, paddingVertical: 15, alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: "#333" },
  btnBackTxt:      { color: "#888", fontWeight: "bold", fontSize: 15 },
  switchTxt:       { color: "#888", textAlign: "center", fontSize: 14 },
  msg:             { textAlign: "center", marginBottom: 12, fontSize: 14 },
  overlay:         { flex: 1, backgroundColor: "rgba(0,0,0,0.78)", justifyContent: "flex-end" },
  sheet:           { backgroundColor: "#161616", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "70%", paddingBottom: 30 },
  sheetHdr:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#222" },
  sheetHdrTxt:     { color: "#fff", fontSize: 16, fontWeight: "bold" },
  sheetItem:       { padding: 16, borderBottomWidth: 1, borderBottomColor: "#1e1e1e" },
  sheetItemTxt:    { color: "#fff", fontSize: 15 },
  termsRow:        { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 16, padding: 12, backgroundColor: "rgba(249,115,22,0.06)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(249,115,22,0.2)" },
  checkbox:        { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: "#f97316", backgroundColor: "transparent", alignItems: "center", justifyContent: "center", marginTop: 1, flexShrink: 0 },
  checkboxChecked: { backgroundColor: "#f97316" },
  checkmark:       { color: "#fff", fontSize: 14, fontWeight: "900" },
  termsTxt:        { color: "#ccc", fontSize: 13, lineHeight: 20, flex: 1 },
  termsLink:       { color: "#f97316", fontWeight: "700" },
});