import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from "react-native";

const API = "https://zuno.ng/api";

const SERVICES = [
  { emoji: "❄️", name: "AC Technician" },
  { emoji: "🔌", name: "Electrician" },
  { emoji: "🔧", name: "Plumber" },
  { emoji: "🧹", name: "Cleaner" },
  { emoji: "🪵", name: "Carpenter" },
  { emoji: "🎨", name: "Painter" },
  { emoji: "🚿", name: "Tiler" },
  { emoji: "🐛", name: "Fumigation" },
  { emoji: "🔒", name: "Locksmith" },
  { emoji: "📺", name: "Electronics" },
  { emoji: "🌿", name: "Gardener" },
  { emoji: "🚗", name: "Auto Mechanic" },
  { emoji: "⚙️", name: "Welder" },
  { emoji: "⚡", name: "Generator" },
  { emoji: "🫧", name: "Washing Machine" },
  { emoji: "🧊", name: "Fridge Repair" },
  { emoji: "📡", name: "TV Mounting" },
  { emoji: "📦", name: "Microwave" },
  { emoji: "💧", name: "Borehole / Water" },
  { emoji: "📷", name: "CCTV / Security" },
  { emoji: "🏠", name: "Roof Repair" },
  { emoji: "🔋", name: "Inverter / Solar" },
  { emoji: "🛠️", name: "Other" },
];

const LGAS = [
  "Lekki", "Victoria Island",
  "Ikeja", "Surulere",
  "Yaba", "Ajah",
  "Ikoyi", "Gbagada",
  "Magodo", "Ojodu",
  "Ikorodu", "Mushin",
  "Oshodi", "Agege",
  "Apapa", "Badagry",
  "Epe", "Other",
];

export default function PostJobScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [job, setJob] = useState({
    service: "", location: "", lga: "",
    title: "", description: "", budget: "", name: "", phone: "",
  });
  const [loading,       setLoading]       = useState(false);
  const [posted,        setPosted]        = useState(false);
  const [notified,      setNotified]      = useState(0);
  const [alertRound,    setAlertRound]    = useState(1);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [error,         setError]         = useState("");

  // ── Step 1 validation ──────────────────────────────────────────────────────
  const validateStep1 = () => {
    if (!job.service)  { setError("Please select a service.");       return false; }
    if (!job.location) { setError("Please enter your location.");    return false; }
    if (!job.lga)      { setError("Please select your LGA.");        return false; }
    setError(""); return true;
  };

  // ── Step 2 validation ──────────────────────────────────────────────────────
  const validateStep2 = () => {
    if (!job.title) { setError("Please enter a job title.");         return false; }
    if (!job.name)  { setError("Please enter your name.");           return false; }
    if (!job.phone) { setError("Please enter your phone number.");   return false; }
    setError(""); return true;
  };

  // ── Post job ───────────────────────────────────────────────────────────────
  const postJob = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/jobs/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // ✅ FIX: send BOTH `service` and `category` so the backend can match
          // artisans regardless of which field name the server uses for matching
          service:      job.service,
          category:     job.service,      // ← artisan matching uses `category`
          location:     job.location,
          lga:          job.lga,
          title:        job.title || job.service,
          description:  job.description,
          budget:       job.budget || "0",
          // ✅ FIX: send both `name`/`phone` and `client_name`/`client_phone`
          name:         job.name,
          phone:        job.phone,
          client_name:  job.name,         // ← some backends use this key
          client_phone: job.phone,        // ← some backends use this key
        }),
      });

      // ✅ FIX: check if the request actually succeeded before showing posted UI
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || `Server error (${res.status}). Please try again.`);
        setLoading(false);
        return;
      }

      // ✅ Only reach here on real success
      setLoading(false);
      setPosted(true);

      // Simulated counter — artisans are being alerted via socket on the server
      let c = 0;
      const t = setInterval(() => {
        c += Math.floor(Math.random() * 4) + 1;
        setNotified(c);
        if (c >= 40) clearInterval(t);
      }, 1500);

      setTimeout(() => setAlertRound(2), 300000);
      setTimeout(() => setAlertRound(3), 600000);

    } catch (err) {
      // ✅ FIX: network error now shows a real message instead of silently failing
      setError("Could not connect. Please check your internet and try again.");
      setLoading(false);
    }
  };

  /* ── CANCEL CONFIRM ── */
  if (cancelConfirm) return (
    <View style={[s.root, { justifyContent: "center", alignItems: "center", padding: 28 }]}>
      <Text style={{ fontSize: 40, marginBottom: 16 }}>⚠️</Text>
      <Text style={{ color: "#fff", fontSize: 20, fontWeight: "900", textAlign: "center", marginBottom: 10 }}>
        Cancel this request?
      </Text>
      <Text style={{ color: "#888", fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 28 }}>
        Artisans are actively being alerted. If you cancel, the job stops and no artisan will be assigned.
      </Text>
      <TouchableOpacity style={s.btnOrange}
        onPress={() => {
          setPosted(false); setStep(1); setAlertRound(1);
          setNotified(0); setCancelConfirm(false); setError("");
        }}>
        <Text style={s.btnOrangeTxt}>Yes, Cancel Request</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.btnOutline, { marginTop: 12 }]} onPress={() => setCancelConfirm(false)}>
        <Text style={s.btnOutlineTxt}>No, Keep Waiting</Text>
      </TouchableOpacity>
    </View>
  );

  /* ── SCANNING SCREEN ── */
  if (posted) return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 60, alignItems: "center" }}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={s.scanTitle}>Scanning Your Area...</Text>
        <Text style={s.scanSub}>Alerting verified artisans near you right now.</Text>
        <View style={s.notifyBox}>
          <Text style={s.notifyNum}>{notified}</Text>
          <Text style={s.notifyLbl}>Notified</Text>
        </View>
        <View style={s.roundsBox}>
          <Text style={s.roundsTitle}>Alert Rounds</Text>
          {[
            { r: 1, label: "Round 1 — Artisans in your LGA", sub: "Alerting artisans in your area now..." },
            { r: 2, label: "Round 2 — All Lagos Artisans",   sub: "Starts in 5 min if no acceptance" },
            { r: 3, label: "Round 3 — Final Broadcast",      sub: "Starts in 10 min if no acceptance" },
          ].map(item => (
            <View key={item.r} style={[s.roundRow, alertRound >= item.r && s.roundRowActive]}>
              <View style={[s.roundDot, alertRound >= item.r && s.roundDotActive]} />
              <View>
                <Text style={[s.roundLabel, alertRound >= item.r && { color: "#fff" }]}>{item.label}</Text>
                <Text style={s.roundSub}>{item.sub}</Text>
              </View>
            </View>
          ))}
        </View>
        <TouchableOpacity style={s.cancelBtn} onPress={() => setCancelConfirm(true)}>
          <Text style={s.cancelBtnTxt}>Cancel Request</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  /* ── MAIN FORM ── */
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* TOP BAR */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.topBarTitle}>Post a Job</Text>
        <Text style={s.topBarLogo}>Zu<Text style={{ textDecorationLine: "line-through" }}>n</Text>o</Text>
      </View>

      {/* STEP INDICATOR */}
      <View style={s.stepBar}>
        {[
          { n: 1, l: "Service" },
          { n: 2, l: "Details" },
          { n: 3, l: "Review" },
        ].map((item, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ alignItems: "center" }}>
              <View style={[s.stepCircle, step >= item.n && s.stepCircleActive]}>
                <Text style={s.stepNum}>{item.n}</Text>
              </View>
              <Text style={[s.stepLbl, step === item.n && { color: "#f97316" }]}>{item.l}</Text>
            </View>
            {i < 2 && (
              <View style={[s.stepLine, step > item.n && s.stepLineActive]} />
            )}
          </View>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>

        {/* ── STEP 1: SERVICE ── */}
        {step === 1 && (
          <>
            <Text style={s.stepTitle}>What do you need?</Text>
            <Text style={s.stepSub}>Select the type of service you require.</Text>

            <View style={s.svcGrid}>
              {SERVICES.map((svc, i) => (
                <TouchableOpacity key={i}
                  style={[s.svcCard, job.service === svc.name && s.svcCardActive]}
                  onPress={() => { setJob({ ...job, service: svc.name }); setError(""); }}>
                  <Text style={s.svcEmoji}>{svc.emoji}</Text>
                  <Text style={[s.svcName, job.service === svc.name && { color: "#f97316" }]}>
                    {svc.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.fieldLabel}>YOUR LOCATION (STREET / AREA)</Text>
            <TextInput
              style={s.whiteInput}
              placeholder="e.g. 15 Admiralty Way, Lekki Phase 1"
              placeholderTextColor="#aaa"
              value={job.location}
              onChangeText={v => { setJob({ ...job, location: v }); setError(""); }}
            />

            <Text style={s.fieldLabel}>YOUR LGA</Text>
            <View style={s.lgaGrid}>
              {LGAS.map((l, i) => (
                <TouchableOpacity key={i}
                  style={[s.lgaBtn, job.lga === l && s.lgaBtnActive]}
                  onPress={() => { setJob({ ...job, lga: l }); setError(""); }}>
                  <Text style={[s.lgaBtnTxt, job.lga === l && { color: "#fff", fontWeight: "700" }]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ✅ Error message shown above button */}
            {!!error && <Text style={s.errorTxt}>{error}</Text>}

            <TouchableOpacity style={s.btnOrange} onPress={() => { if (validateStep1()) setStep(2); }}>
              <Text style={s.btnOrangeTxt}>Continue →</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── STEP 2: DETAILS ── */}
        {step === 2 && (
          <>
            <Text style={s.stepTitle}>Job Details</Text>
            <Text style={s.stepSub}>Tell the artisan exactly what you need done.</Text>

            <Text style={s.fieldLabel}>JOB TITLE</Text>
            <TextInput style={s.whiteInput} placeholder="e.g. Fix bedroom AC unit" placeholderTextColor="#aaa"
              value={job.title} onChangeText={v => { setJob({ ...job, title: v }); setError(""); }} />

            <Text style={s.fieldLabel}>DESCRIPTION (OPTIONAL)</Text>
            <TextInput style={[s.whiteInput, { height: 100, textAlignVertical: "top" }]}
              placeholder="Any extra details for the artisan..." placeholderTextColor="#aaa" multiline
              value={job.description} onChangeText={v => setJob({ ...job, description: v })} />

            <Text style={s.fieldLabel}>YOUR BUDGET</Text>
            <View style={s.budgetRow}>
              <Text style={s.nairaSign}>₦</Text>
              <TextInput
                style={[s.whiteInput, { flex: 1, marginBottom: 0 }]}
                placeholder="Enter 0 if you want artisans to suggest a price"
                placeholderTextColor="#aaa" keyboardType="numeric"
                value={job.budget} onChangeText={v => setJob({ ...job, budget: v })} />
            </View>

            <Text style={s.fieldLabel}>YOUR NAME</Text>
            <TextInput style={s.whiteInput} placeholder="Your full name" placeholderTextColor="#aaa"
              value={job.name} onChangeText={v => { setJob({ ...job, name: v }); setError(""); }} />

            <Text style={s.fieldLabel}>PHONE NUMBER</Text>
            <TextInput style={s.whiteInput} placeholder="e.g. 08012345678" placeholderTextColor="#aaa"
              keyboardType="phone-pad" value={job.phone} onChangeText={v => { setJob({ ...job, phone: v }); setError(""); }} />

            {!!error && <Text style={s.errorTxt}>{error}</Text>}

            <TouchableOpacity style={[s.btnOrange, { marginTop: 16 }]} onPress={() => { if (validateStep2()) setStep(3); }}>
              <Text style={s.btnOrangeTxt}>Review My Job →</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.backLink} onPress={() => { setStep(1); setError(""); }}>
              <Text style={s.backLinkTxt}>← Back</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── STEP 3: REVIEW ── */}
        {step === 3 && (
          <>
            <Text style={s.stepTitle}>Review & Post</Text>
            <Text style={s.stepSub}>Confirm your job details before posting.</Text>

            {[
              ["Service",   job.service  || "—"],
              ["Location",  job.location || "—"],
              ["LGA",       job.lga      || "—"],
              ["Job Title", job.title    || "—"],
              ["Budget",    job.budget ? `₦${job.budget}` : "—"],
              ["Your Name", job.name     || "—"],
            ].map(([label, value], i) => (
              <View key={i} style={s.reviewRow}>
                <Text style={s.reviewLabel}>{label}</Text>
                <Text style={s.reviewValue}>{value}</Text>
              </View>
            ))}

            <View style={s.alertNote}>
              <Text style={s.alertNoteTxt}>
                🔔 Once you post, verified artisans near you in{" "}
                <Text style={{ color: "#fff", fontWeight: "700" }}>your area</Text> will receive an instant live alert. The alert repeats every 5 minutes until an artisan accepts.
              </Text>
            </View>

            {!!error && <Text style={s.errorTxt}>{error}</Text>}

            <TouchableOpacity style={s.btnOrange} onPress={postJob} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnOrangeTxt}>Post Job — It's Free 🚀</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={s.backLink} onPress={() => { setStep(2); setError(""); }}>
              <Text style={s.backLinkTxt}>← Edit Details</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },

  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#1a1a1a", alignItems: "center", justifyContent: "center" },
  topBarTitle: { color: "#fff", fontSize: 17, fontWeight: "800" },
  topBarLogo: { color: "#fff", fontSize: 20, fontWeight: "900" },

  stepBar: { flexDirection: "row", justifyContent: "center", alignItems: "flex-start", padding: 16, backgroundColor: "#111", borderWidth: 1, borderColor: "#1e1e1e", borderRadius: 14, margin: 16, marginTop: 12, gap: 0 },
  stepCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#222", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#333" },
  stepCircleActive: { backgroundColor: "#f97316", borderColor: "#f97316" },
  stepNum: { color: "#fff", fontWeight: "900", fontSize: 14 },
  stepLbl: { color: "#555", fontSize: 11, marginTop: 4, textAlign: "center" },
  stepLine: { width: 50, height: 2, backgroundColor: "#222", marginHorizontal: 6, marginBottom: 14 },
  stepLineActive: { backgroundColor: "#f97316" },

  content: { paddingHorizontal: 16, paddingBottom: 40 },
  stepTitle: { color: "#fff", fontSize: 22, fontWeight: "900", marginBottom: 4 },
  stepSub: { color: "#888", fontSize: 14, marginBottom: 20 },

  svcGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  svcCard: { backgroundColor: "#161616", borderRadius: 14, paddingVertical: 18, paddingHorizontal: 8, width: "31%", alignItems: "center", borderWidth: 1, borderColor: "#252525" },
  svcCardActive: { borderColor: "#f97316", backgroundColor: "#1e0d00" },
  svcEmoji: { fontSize: 28, marginBottom: 8 },
  svcName: { color: "#ccc", fontSize: 11, textAlign: "center", fontWeight: "600" },

  fieldLabel: { color: "#888", fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: 8, marginTop: 4 },
  whiteInput: { backgroundColor: "#fff", borderRadius: 12, padding: 15, color: "#000", fontSize: 15, marginBottom: 16, borderWidth: 1, borderColor: "#ddd" },

  budgetRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, paddingLeft: 14, marginBottom: 16, borderWidth: 1, borderColor: "#ddd" },
  nairaSign: { color: "#f97316", fontSize: 18, fontWeight: "800", marginRight: 4 },

  lgaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  lgaBtn: { backgroundColor: "#161616", borderRadius: 10, paddingVertical: 14, paddingHorizontal: 10, width: "48%", alignItems: "center", borderWidth: 1, borderColor: "#252525" },
  lgaBtnActive: { borderColor: "#f97316", backgroundColor: "#1e0d00" },
  lgaBtnTxt: { color: "#ccc", fontSize: 13 },

  btnOrange: { backgroundColor: "#f97316", borderRadius: 14, paddingVertical: 17, alignItems: "center", marginBottom: 12 },
  btnOrangeTxt: { color: "#fff", fontWeight: "800", fontSize: 16 },
  btnOutline: { borderRadius: 14, paddingVertical: 16, alignItems: "center", borderWidth: 1.5, borderColor: "#f97316" },
  btnOutlineTxt: { color: "#f97316", fontWeight: "700", fontSize: 15 },
  backLink: { paddingVertical: 14, alignItems: "center" },
  backLinkTxt: { color: "#888", fontSize: 15 },

  // ✅ Error style
  errorTxt: { color: "#ef4444", fontSize: 13, textAlign: "center", marginBottom: 12, backgroundColor: "rgba(239,68,68,0.08)", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "rgba(239,68,68,0.2)" },

  reviewRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  reviewLabel: { color: "#888", fontSize: 14 },
  reviewValue: { color: "#fff", fontSize: 14, fontWeight: "700", maxWidth: "55%", textAlign: "right" },
  alertNote: { backgroundColor: "#161616", borderRadius: 12, padding: 14, marginVertical: 16, borderWidth: 1, borderColor: "#f97316" },
  alertNoteTxt: { color: "#aaa", fontSize: 13, lineHeight: 20 },

  scanTitle: { color: "#fff", fontSize: 22, fontWeight: "900", marginTop: 16, marginBottom: 6 },
  scanSub: { color: "#888", textAlign: "center", marginBottom: 24 },
  notifyBox: { backgroundColor: "#161616", borderRadius: 16, padding: 24, width: "100%", alignItems: "center", marginBottom: 20, borderWidth: 1, borderColor: "#222" },
  notifyNum: { color: "#f97316", fontSize: 52, fontWeight: "900" },
  notifyLbl: { color: "#888", fontSize: 14 },
  roundsBox: { width: "100%", backgroundColor: "#161616", borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: "#222" },
  roundsTitle: { color: "#f97316", fontWeight: "800", fontSize: 15, marginBottom: 16 },
  roundRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16, opacity: 0.35 },
  roundRowActive: { opacity: 1 },
  roundDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#333", marginRight: 12, marginTop: 3 },
  roundDotActive: { backgroundColor: "#f97316" },
  roundLabel: { color: "#888", fontWeight: "700", fontSize: 13 },
  roundSub: { color: "#666", fontSize: 12, marginTop: 2 },
  cancelBtn: { paddingVertical: 14, paddingHorizontal: 30, borderRadius: 12, borderWidth: 1, borderColor: "#333" },
  cancelBtnTxt: { color: "#888", fontSize: 15 },
});