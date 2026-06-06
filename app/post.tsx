import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { io as socketIO } from "socket.io-client";

const API        = "https://zuno.ng/api";
const SOCKET_URL = "https://zuno.ng";

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

// ─── Star Rating Component ────────────────────────────────────────────────────
function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 8, justifyContent: "center", marginVertical: 16 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <TouchableOpacity key={i} onPress={() => onChange(i)} activeOpacity={0.7}>
          <Ionicons
            name={i <= value ? "star" : "star-outline"}
            size={40}
            color={i <= value ? "#f59e0b" : "#444"}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Rating Modal ─────────────────────────────────────────────────────────────
function RatingModal({
  visible,
  artisanName,
  jobId,
  artisanId,
  onClose,
}: {
  visible: boolean;
  artisanName: string;
  jobId: number;
  artisanId: number;
  onClose: () => void;
}) {
  const [stars,     setStars]     = useState(0);
  const [comment,   setComment]   = useState("");
  const [sending,   setSending]   = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (stars === 0) {
      Alert.alert("Rating Required", "Please select a star rating before submitting.");
      return;
    }
    setSending(true);
    try {
      const res  = await fetch(`${API}/jobs/review`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id:     jobId,
          client_id:  0,
          artisan_id: artisanId,
          rating:     stars,
          comment:    comment.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
      } else {
        Alert.alert("Error", data.message || "Could not submit review. Please try again.");
      }
    } catch {
      Alert.alert("Error", "No internet connection. Please try again.");
    }
    setSending(false);
  };

  const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent!"];

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={rm.overlay}>
        <View style={rm.sheet}>
          <View style={rm.handle} />
          {submitted ? (
            <View style={rm.successBox}>
              <View style={rm.successIcon}>
                <Ionicons name="star" size={48} color="#f59e0b" />
              </View>
              <Text style={rm.successTitle}>Thank You! 🎉</Text>
              <Text style={rm.successSub}>
                Your review helps other customers find great artisans on Zuno.
              </Text>
              <TouchableOpacity style={rm.doneBtn} onPress={onClose} activeOpacity={0.85}>
                <Text style={rm.doneBtnTxt}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={rm.title}>Rate Your Experience</Text>
              <Text style={rm.sub}>How was your job with{"\n"}<Text style={rm.artisanName}>{artisanName}</Text>?</Text>
              <StarRating value={stars} onChange={setStars} />
              {stars > 0 && <Text style={rm.ratingLabel}>{ratingLabels[stars]}</Text>}
              <TextInput
                style={rm.commentInput}
                placeholder="Leave a comment (optional)..."
                placeholderTextColor="#555"
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={3}
                maxLength={300}
              />
              <TouchableOpacity
                style={[rm.submitBtn, (stars === 0 || sending) && rm.submitBtnOff]}
                onPress={handleSubmit}
                disabled={stars === 0 || sending}
                activeOpacity={0.85}>
                {sending
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={rm.submitBtnTxt}>Submit Review →</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity style={rm.skipBtn} onPress={onClose}>
                <Text style={rm.skipBtnTxt}>Skip for now</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Post Job Screen ─────────────────────────────────────────────────────
export default function PostJobScreen() {
  const router = useRouter();
  const [step,                  setStep]                  = useState(1);
  const [job,                   setJob]                   = useState({
    service: "", location: "", lga: "",
    title: "", description: "", budget: "", name: "", phone: "",
  });
  const [loading,               setLoading]               = useState(false);
  const [posted,                setPosted]                = useState(false);
  const [notified,              setNotified]              = useState(0);
  const [alertRound,            setAlertRound]            = useState(1);
  const [cancelConfirm,         setCancelConfirm]         = useState(false);
  const [error,                 setError]                 = useState("");
  const [acceptedArtisan,       setAcceptedArtisan]       = useState<any>(null);

  // ── Artisan cancellation state ────────────────────────────────────────────
  const [jobCancelledByArtisan, setJobCancelledByArtisan] = useState(false);
  const [cancelledReason,       setCancelledReason]       = useState("");

  // ── Rating state ──────────────────────────────────────────────────────────
  const [showRating,            setShowRating]            = useState(false);
  const [ratingJobId,           setRatingJobId]           = useState(0);
  const [ratingArtisan,         setRatingArtisan]         = useState<any>(null);

  const socketRef  = useRef<any>(null);
  const counterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const round2Ref  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const round3Ref  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      if (counterRef.current) clearInterval(counterRef.current);
      if (round2Ref.current)  clearTimeout(round2Ref.current);
      if (round3Ref.current)  clearTimeout(round3Ref.current);
    };
  }, []);

  const stopCounter = () => {
    if (counterRef.current) { clearInterval(counterRef.current); counterRef.current = null; }
  };

  const validateStep1 = () => {
    if (!job.service)  { setError("Please select a service.");    return false; }
    if (!job.location) { setError("Please enter your location."); return false; }
    if (!job.lga)      { setError("Please select your LGA.");     return false; }
    setError(""); return true;
  };

  const validateStep2 = () => {
    if (!job.title) { setError("Please enter a job title.");       return false; }
    if (!job.name)  { setError("Please enter your name.");         return false; }
    if (!job.phone) { setError("Please enter your phone number."); return false; }
    setError(""); return true;
  };

  const postJob = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/jobs/post`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service:      job.service,
          category:     job.service,
          location:     job.location,
          lga:          job.lga,
          title:        job.title || job.service,
          description:  job.description,
          budget:       job.budget || "0",
          name:         job.name,
          phone:        job.phone,
          client_name:  job.name,
          client_phone: job.phone,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || `Server error (${res.status}). Please try again.`);
        setLoading(false);
        return;
      }

      const jobId    = data.job_id || data.jobId || data.job?.id || data.id;
      const clientId = data.client_id || data.clientId || 0;

      // ── Connect socket ────────────────────────────────────────────────────
      const socket = socketIO(SOCKET_URL, {
        transports: ["websocket"],
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        if (clientId) socket.emit("client_join", String(clientId));
        if (jobId)    socket.emit("job_room",    String(jobId));
      });

      // ── Artisan accepts the job ───────────────────────────────────────────
      socket.on("job_accepted", (payload: any) => {
        const artisan = payload.artisan || payload;
        stopCounter();
        setAcceptedArtisan({ ...artisan, job_id: jobId });
        // Do NOT disconnect — keep listening for job_completed / job_cancelled_by_artisan
      });

      // ── Artisan marks job complete → show rating popup ────────────────────
      socket.on("job_completed", (payload: any) => {
        const completedJobId     = payload.job_id || jobId;
        const completedArtisanId = payload.artisan_id;
        setRatingJobId(completedJobId);
        setRatingArtisan({
          id:        completedArtisanId || acceptedArtisan?.id,
          full_name: acceptedArtisan?.full_name || "Your Artisan",
        });
        setShowRating(true);
        socket.disconnect();
      });

      // ── Artisan cancels the job → show cancellation screen ────────────────
      socket.on("job_cancelled_by_artisan", (payload: any) => {
        stopCounter();
        setCancelledReason(payload.reason || "");
        setJobCancelledByArtisan(true);
        setAcceptedArtisan(null);
        socket.disconnect();
      });

      setLoading(false);
      setPosted(true);

      // ── Poll real notified count from backend every 5 seconds ────────────
      counterRef.current = setInterval(async () => {
        try {
          const r = await fetch(`${API}/jobs/status/${jobId}`);
          const d = await r.json();
          if (d.success && d.job?.notified_count !== undefined) {
            setNotified(d.job.notified_count);
          }
        } catch {}
      }, 5000);

      round2Ref.current = setTimeout(() => setAlertRound(2), 300000);
      round3Ref.current = setTimeout(() => setAlertRound(3), 600000);

    } catch {
      setError("Could not connect. Please check your internet and try again.");
      setLoading(false);
    }
  };

  // ── RATING SCREEN ─────────────────────────────────────────────────────────
  if (showRating) {
    return (
      <View style={s.root}>
        <StatusBar barStyle="light-content" />
        <RatingModal
          visible={showRating}
          artisanName={ratingArtisan?.full_name || "Your Artisan"}
          jobId={ratingJobId}
          artisanId={ratingArtisan?.id || 0}
          onClose={() => { setShowRating(false); router.replace("/"); }}
        />
      </View>
    );
  }

  // ── ARTISAN CANCELLED SCREEN ──────────────────────────────────────────────
  if (jobCancelledByArtisan) {
    return (
      <View style={[s.root, { justifyContent: "center", alignItems: "center", padding: 28 }]}>
        <StatusBar barStyle="light-content" />
        <View style={s.cancelledIconBox}>
          <Text style={{ fontSize: 52 }}>😔</Text>
        </View>
        <Text style={s.cancelledTitle}>Artisan Cancelled</Text>
        <Text style={s.cancelledSub}>
          The artisan was unable to complete your job request.
        </Text>
        {!!cancelledReason && (
          <View style={s.cancelledReasonBox}>
            <Text style={s.cancelledReasonLabel}>REASON</Text>
            <Text style={s.cancelledReasonTxt}>{cancelledReason}</Text>
          </View>
        )}
        <TouchableOpacity
          style={s.btnOrange}
          onPress={() => {
            setJobCancelledByArtisan(false);
            setCancelledReason("");
            setPosted(false);
            setStep(1);
            setAlertRound(1);
            setNotified(0);
            setError("");
          }}
          activeOpacity={0.85}>
          <Text style={s.btnOrangeTxt}>Request Another Artisan →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.backLink} onPress={() => router.replace("/")}>
          <Text style={s.backLinkTxt}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── ACCEPTED SCREEN ───────────────────────────────────────────────────────
  if (acceptedArtisan) {
    const photoUri = acceptedArtisan.profile_photo
      ? (acceptedArtisan.profile_photo.startsWith("http")
          ? acceptedArtisan.profile_photo
          : `https://zuno.ng${acceptedArtisan.profile_photo}`)
      : null;

    const waNum  = (acceptedArtisan.phone || "").replace(/\D/g, "").replace(/^0/, "");
    const waMsg  = encodeURIComponent(
      `Hello ${acceptedArtisan.full_name?.split(" ")[0]}, I posted a job on Zuno for ${job.service || "a service"}. Are you on your way?`
    );
    const waLink = `https://wa.me/234${waNum}?text=${waMsg}`;

    return (
      <View style={[s.root, { justifyContent: "center", padding: 24 }]}>
        <StatusBar barStyle="light-content" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 40 }}>
          <View style={s.acceptedHeader}>
            <View style={s.acceptedIconBox}>
              <Ionicons name="checkmark-circle" size={56} color="#22c55e" />
            </View>
            <Text style={s.acceptedTitle}>Artisan Found! 🎉</Text>
            <Text style={s.acceptedSub}>
              An artisan has accepted your{"\n"}
              <Text style={{ color: "#f97316", fontWeight: "800" }}>{job.service || "service"}</Text> request
            </Text>
          </View>

          <View style={s.acceptedCard}>
            <View style={s.artisanRow}>
              {photoUri
                ? <Image source={{ uri: photoUri }} style={s.artisanPhoto} resizeMode="cover" />
                : (
                  <View style={[s.artisanPhoto, s.artisanPhotoFallback]}>
                    <Ionicons name="person" size={36} color="#fff" />
                  </View>
                )
              }
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={s.artisanName}>{acceptedArtisan.full_name || "Your Artisan"}</Text>
                <Text style={s.artisanCategory}>{acceptedArtisan.category || job.service}</Text>
                <Text style={s.artisanLga}>📍 {acceptedArtisan.lga || job.lga || "Lagos"}</Text>
                {acceptedArtisan.rating > 0 && (
                  <Text style={s.artisanRating}>
                    ★ {Number(acceptedArtisan.rating).toFixed(1)}{"  "}·{"  "}
                    {acceptedArtisan.jobs_completed ?? 0} jobs done
                  </Text>
                )}
              </View>
            </View>
            <View style={s.phoneDisplay}>
              <Ionicons name="call" size={16} color="#22c55e" />
              <Text style={s.phoneDisplayTxt}>{acceptedArtisan.phone || "—"}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={s.callBtn}
            onPress={() => Linking.openURL(`tel:${acceptedArtisan.phone}`)}
            activeOpacity={0.85}>
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={s.callBtnTxt}>
              Call {acceptedArtisan.full_name?.split(" ")[0] || "Artisan"} Now
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.waBtn}
            onPress={() => Linking.openURL(waLink)}
            activeOpacity={0.85}>
            <Text style={s.waBtnEmoji}>💬</Text>
            <Text style={s.waBtnTxt}>
              WhatsApp {acceptedArtisan.full_name?.split(" ")[0] || "Artisan"}
            </Text>
            <Ionicons name="arrow-forward" size={14} color="#25D366" />
          </TouchableOpacity>

          <View style={s.waitingRatingNote}>
            <Ionicons name="time-outline" size={16} color="#f97316" />
            <Text style={s.waitingRatingTxt}>
              {"  "}When the artisan marks the job complete, you will be asked to rate them.
            </Text>
          </View>

          <Text style={s.acceptedNote}>
            ℹ️ Keep this screen open to receive the rating prompt after job completion
          </Text>

          <TouchableOpacity style={s.doneBtn} onPress={() => router.replace("/")}>
            <Text style={s.doneBtnTxt}>Back to Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── CANCEL CONFIRM ────────────────────────────────────────────────────────
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
          socketRef.current?.disconnect();
          stopCounter();
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

  // ── SCANNING SCREEN ───────────────────────────────────────────────────────
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

  // ── MAIN FORM ─────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      <View style={s.topBar}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.topBarTitle}>Post a Job</Text>
        <Text style={s.topBarLogo}>Zu<Text style={{ textDecorationLine: "line-through" }}>n</Text>o</Text>
      </View>

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

        {/* ── STEP 1 ── */}
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
            {!!error && <Text style={s.errorTxt}>{error}</Text>}
            <TouchableOpacity style={s.btnOrange} onPress={() => { if (validateStep1()) setStep(2); }}>
              <Text style={s.btnOrangeTxt}>Continue →</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── STEP 2 ── */}
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

        {/* ── STEP 3 ── */}
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
                <Text style={{ color: "#fff", fontWeight: "700" }}>your area</Text> will receive an instant live alert.
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

// ─── Rating Modal Styles ──────────────────────────────────────────────────────
const rm = StyleSheet.create({
  overlay:      { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.7)" },
  sheet:        { backgroundColor: "#111", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, paddingBottom: 44 },
  handle:       { width: 40, height: 4, backgroundColor: "#333", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  title:        { color: "#fff", fontSize: 22, fontWeight: "900", textAlign: "center", marginBottom: 6 },
  sub:          { color: "#888", fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 4 },
  artisanName:  { color: "#f97316", fontWeight: "800" },
  ratingLabel:  { color: "#f59e0b", fontSize: 16, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  commentInput: { backgroundColor: "#1e1e1e", borderRadius: 12, padding: 14, color: "#fff", fontSize: 15, borderWidth: 1, borderColor: "#2a2a2a", marginBottom: 16, minHeight: 80, textAlignVertical: "top" },
  submitBtn:    { backgroundColor: "#f97316", borderRadius: 14, paddingVertical: 16, alignItems: "center", marginBottom: 10 },
  submitBtnOff: { backgroundColor: "#333" },
  submitBtnTxt: { color: "#fff", fontWeight: "800", fontSize: 16 },
  skipBtn:      { paddingVertical: 12, alignItems: "center" },
  skipBtnTxt:   { color: "#555", fontSize: 14 },
  successBox:   { alignItems: "center", gap: 12, paddingVertical: 20 },
  successIcon:  { width: 88, height: 88, borderRadius: 44, backgroundColor: "rgba(245,158,11,0.12)", alignItems: "center", justifyContent: "center" },
  successTitle: { color: "#fff", fontSize: 24, fontWeight: "900" },
  successSub:   { color: "#888", fontSize: 14, lineHeight: 22, textAlign: "center" },
  doneBtn:      { backgroundColor: "#f97316", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 48, marginTop: 8 },
  doneBtnTxt:   { color: "#fff", fontWeight: "800", fontSize: 16 },
});

// ─── Main Styles ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:                { flex: 1, backgroundColor: "#0a0a0a" },
  topBar:              { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  backBtn:             { width: 36, height: 36, borderRadius: 18, backgroundColor: "#1a1a1a", alignItems: "center", justifyContent: "center" },
  topBarTitle:         { color: "#fff", fontSize: 17, fontWeight: "800" },
  topBarLogo:          { color: "#fff", fontSize: 20, fontWeight: "900" },
  stepBar:             { flexDirection: "row", justifyContent: "center", alignItems: "flex-start", padding: 16, backgroundColor: "#111", borderWidth: 1, borderColor: "#1e1e1e", borderRadius: 14, margin: 16, marginTop: 12, gap: 0 },
  stepCircle:          { width: 34, height: 34, borderRadius: 17, backgroundColor: "#222", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#333" },
  stepCircleActive:    { backgroundColor: "#f97316", borderColor: "#f97316" },
  stepNum:             { color: "#fff", fontWeight: "900", fontSize: 14 },
  stepLbl:             { color: "#555", fontSize: 11, marginTop: 4, textAlign: "center" },
  stepLine:            { width: 50, height: 2, backgroundColor: "#222", marginHorizontal: 6, marginBottom: 14 },
  stepLineActive:      { backgroundColor: "#f97316" },
  content:             { paddingHorizontal: 16, paddingBottom: 40 },
  stepTitle:           { color: "#fff", fontSize: 22, fontWeight: "900", marginBottom: 4 },
  stepSub:             { color: "#888", fontSize: 14, marginBottom: 20 },
  svcGrid:             { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  svcCard:             { backgroundColor: "#161616", borderRadius: 14, paddingVertical: 18, paddingHorizontal: 8, width: "31%", alignItems: "center", borderWidth: 1, borderColor: "#252525" },
  svcCardActive:       { borderColor: "#f97316", backgroundColor: "#1e0d00" },
  svcEmoji:            { fontSize: 28, marginBottom: 8 },
  svcName:             { color: "#ccc", fontSize: 11, textAlign: "center", fontWeight: "600" },
  fieldLabel:          { color: "#888", fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: 8, marginTop: 4 },
  whiteInput:          { backgroundColor: "#fff", borderRadius: 12, padding: 15, color: "#000", fontSize: 15, marginBottom: 16, borderWidth: 1, borderColor: "#ddd" },
  budgetRow:           { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, paddingLeft: 14, marginBottom: 16, borderWidth: 1, borderColor: "#ddd" },
  nairaSign:           { color: "#f97316", fontSize: 18, fontWeight: "800", marginRight: 4 },
  lgaGrid:             { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  lgaBtn:              { backgroundColor: "#161616", borderRadius: 10, paddingVertical: 14, paddingHorizontal: 10, width: "48%", alignItems: "center", borderWidth: 1, borderColor: "#252525" },
  lgaBtnActive:        { borderColor: "#f97316", backgroundColor: "#1e0d00" },
  lgaBtnTxt:           { color: "#ccc", fontSize: 13 },
  btnOrange:           { backgroundColor: "#f97316", borderRadius: 14, paddingVertical: 17, alignItems: "center", marginBottom: 12 },
  btnOrangeTxt:        { color: "#fff", fontWeight: "800", fontSize: 16 },
  btnOutline:          { borderRadius: 14, paddingVertical: 16, alignItems: "center", borderWidth: 1.5, borderColor: "#f97316" },
  btnOutlineTxt:       { color: "#f97316", fontWeight: "700", fontSize: 15 },
  backLink:            { paddingVertical: 14, alignItems: "center" },
  backLinkTxt:         { color: "#888", fontSize: 15 },
  errorTxt:            { color: "#ef4444", fontSize: 13, textAlign: "center", marginBottom: 12, backgroundColor: "rgba(239,68,68,0.08)", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "rgba(239,68,68,0.2)" },
  reviewRow:           { flexDirection: "row", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  reviewLabel:         { color: "#888", fontSize: 14 },
  reviewValue:         { color: "#fff", fontSize: 14, fontWeight: "700", maxWidth: "55%", textAlign: "right" },
  alertNote:           { backgroundColor: "#161616", borderRadius: 12, padding: 14, marginVertical: 16, borderWidth: 1, borderColor: "#f97316" },
  alertNoteTxt:        { color: "#aaa", fontSize: 13, lineHeight: 20 },
  scanTitle:           { color: "#fff", fontSize: 22, fontWeight: "900", marginTop: 16, marginBottom: 6 },
  scanSub:             { color: "#888", textAlign: "center", marginBottom: 24 },
  notifyBox:           { backgroundColor: "#161616", borderRadius: 16, padding: 24, width: "100%", alignItems: "center", marginBottom: 20, borderWidth: 1, borderColor: "#222" },
  notifyNum:           { color: "#f97316", fontSize: 52, fontWeight: "900" },
  notifyLbl:           { color: "#888", fontSize: 14 },
  roundsBox:           { width: "100%", backgroundColor: "#161616", borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: "#222" },
  roundsTitle:         { color: "#f97316", fontWeight: "800", fontSize: 15, marginBottom: 16 },
  roundRow:            { flexDirection: "row", alignItems: "flex-start", marginBottom: 16, opacity: 0.35 },
  roundRowActive:      { opacity: 1 },
  roundDot:            { width: 12, height: 12, borderRadius: 6, backgroundColor: "#333", marginRight: 12, marginTop: 3 },
  roundDotActive:      { backgroundColor: "#f97316" },
  roundLabel:          { color: "#888", fontWeight: "700", fontSize: 13 },
  roundSub:            { color: "#666", fontSize: 12, marginTop: 2 },
  cancelBtn:           { paddingVertical: 14, paddingHorizontal: 30, borderRadius: 12, borderWidth: 1, borderColor: "#333" },
  cancelBtnTxt:        { color: "#888", fontSize: 15 },
  // ── Artisan cancelled screen ──
  cancelledIconBox:    { width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(239,68,68,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 20, borderWidth: 2, borderColor: "rgba(239,68,68,0.3)" },
  cancelledTitle:      { color: "#fff", fontSize: 24, fontWeight: "900", marginBottom: 8, textAlign: "center" },
  cancelledSub:        { color: "#888", fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 20 },
  cancelledReasonBox:  { width: "100%", backgroundColor: "#1a1a1a", borderRadius: 14, padding: 16, marginBottom: 28, borderWidth: 1, borderColor: "#333" },
  cancelledReasonLabel:{ color: "#555", fontSize: 10, fontWeight: "800", letterSpacing: 1.2, marginBottom: 6 },
  cancelledReasonTxt:  { color: "#f97316", fontSize: 14, lineHeight: 22, fontStyle: "italic" },
  // ── Accepted screen ──
  acceptedHeader:      { alignItems: "center", marginBottom: 24 },
  acceptedIconBox:     { width: 90, height: 90, borderRadius: 45, backgroundColor: "rgba(34,197,94,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 2, borderColor: "#22c55e" },
  acceptedTitle:       { color: "#fff", fontSize: 26, fontWeight: "900", marginBottom: 6 },
  acceptedSub:         { color: "#888", fontSize: 15, textAlign: "center", lineHeight: 22 },
  acceptedCard:        { backgroundColor: "#161616", borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: "#222" },
  artisanRow:          { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  artisanPhoto:        { width: 70, height: 70, borderRadius: 35, backgroundColor: "#f97316" },
  artisanPhotoFallback:{ alignItems: "center", justifyContent: "center" },
  artisanName:         { color: "#fff", fontSize: 18, fontWeight: "900", marginBottom: 3 },
  artisanCategory:     { color: "#f97316", fontSize: 13, fontWeight: "700", marginBottom: 3 },
  artisanLga:          { color: "#888", fontSize: 12, marginBottom: 3 },
  artisanRating:       { color: "#f59e0b", fontSize: 12, fontWeight: "600" },
  phoneDisplay:        { flexDirection: "row", alignItems: "center", backgroundColor: "#0d2e1a", borderRadius: 10, padding: 12, gap: 8 },
  phoneDisplayTxt:     { color: "#22c55e", fontWeight: "800", fontSize: 15 },
  callBtn:             { backgroundColor: "#22c55e", borderRadius: 14, paddingVertical: 17, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 },
  callBtnTxt:          { color: "#fff", fontWeight: "900", fontSize: 16 },
  waBtn:               { backgroundColor: "#0a2a14", borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16, borderWidth: 1, borderColor: "#25D366" },
  waBtnEmoji:          { fontSize: 20 },
  waBtnTxt:            { color: "#25D366", fontWeight: "800", fontSize: 15, flex: 1, textAlign: "center" },
  waitingRatingNote:   { flexDirection: "row", alignItems: "flex-start", backgroundColor: "rgba(249,115,22,0.08)", borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "rgba(249,115,22,0.2)", gap: 8 },
  waitingRatingTxt:    { color: "#f97316", fontSize: 13, lineHeight: 20, flex: 1 },
  acceptedNote:        { color: "#555", fontSize: 12, textAlign: "center", marginBottom: 24 },
  doneBtn:             { borderRadius: 14, paddingVertical: 15, alignItems: "center", borderWidth: 1, borderColor: "#333" },
  doneBtnTxt:          { color: "#888", fontWeight: "700", fontSize: 15 },
});