import { Linking, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../services/context";

const WHATSAPP_NUMBER = "2349164096900"; // 234 = Nigeria country code

const PLANS = [
  {
    key:     "basic",
    name:    "Basic",
    price:   "₦1,500",
    period:  "/mo",
    color:   "#aaa",
    emoji:   "🔓",
    features: [
      "Profile listed on Zuno",
      "Receive job notifications",
      "Basic profile visible to clients",
    ],
    btnText: "Subscribe – Basic ₦1,500",
    style:   "outline",
    popular: false,
  },
  {
    key:     "standard",
    name:    "Standard",
    price:   "₦3,000",
    period:  "/mo",
    color:   "#60a5fa",
    emoji:   "✅",
    features: [
      "Everything in Basic",
      "✅ Verified badge on profile",
      "Portfolio photos",
      "Mid-search placement",
    ],
    btnText: "Upgrade to Standard ₦3,000",
    style:   "blue",
    popular: true,
  },
  {
    key:     "pro",
    name:    "Pro",
    price:   "₦5,000",
    period:  "/mo",
    color:   "#a78bfa",
    emoji:   "🏆",
    features: [
      "Everything in Standard",
      "🏆 Pro badge on profile",
      "Featured placement in search",
      "Priority alerts — 2 mins early",
      "Top search results",
    ],
    btnText: "Upgrade to Pro ₦5,000",
    style:   "purple",
    popular: false,
  },
  {
    key:     "premium",
    name:    "Premium",
    price:   "₦8,000",
    period:  "/mo",
    color:   "#f97316",
    emoji:   "🌟",
    features: [
      "Everything in Pro",
      "🌟 Homepage spotlight",
      "Social media feature",
      "First to receive ALL Lagos jobs",
      "Dedicated profile URL",
    ],
    btnText: "Upgrade to Premium ₦8,000",
    style:   "orange",
    popular: false,
  },
];

const BTN_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  outline: { bg: "transparent",  border: "#444",    text: "#aaa"     },
  blue:    { bg: "#1e3a5f",      border: "#60a5fa", text: "#60a5fa"  },
  purple:  { bg: "#2e1a5f",      border: "#a78bfa", text: "#a78bfa"  },
  orange:  { bg: "#f97316",      border: "#f97316", text: "#fff"     },
};

export default function PlansScreen() {
  const { artisanData } = useAuth();
  const currentPlan = artisanData?.subscription_plan || "basic";

  const openWhatsApp = (plan: typeof PLANS[0]) => {
    const msg = encodeURIComponent(
      `Hello Zuno! 👋\n\nI want to subscribe to the *${plan.name} Plan* (${plan.price}/mo).\n\nMy details:\n- Name: ${artisanData?.full_name || "—"}\n- Phone: ${artisanData?.phone || "—"}\n- Category: ${artisanData?.category || "—"}\n- LGA: ${artisanData?.lga || "—"}\n\nPlease confirm my subscription. Thank you!`
    );
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`);
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#f97316" />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTag}>SUBSCRIPTION PLANS</Text>
        <Text style={s.headerTitle}>Choose Your Plan</Text>
        <Text style={s.headerSub}>
          Tap any plan to subscribe via WhatsApp instantly
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* Current plan banner */}
        <View style={s.currentBanner}>
          <Text style={s.currentLeft}>Current Plan</Text>
          <View style={s.currentRight}>
            <Text style={s.currentPlanName}>
              {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
            </Text>
            {currentPlan !== "basic" && artisanData?.subscription_expiry && (
              <Text style={s.currentExpiry}>
                Expires: {new Date(artisanData.subscription_expiry).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
              </Text>
            )}
          </View>
        </View>

        {PLANS.map((plan) => {
          const isActive = currentPlan === plan.key;
          const btn      = BTN_COLORS[plan.style];

          return (
            <View
              key={plan.key}
              style={[
                s.card,
                plan.popular && s.cardPopular,
                isActive && { borderColor: plan.color, borderWidth: 2 },
              ]}>

              {plan.popular && !isActive && (
                <View style={[s.popularBadge, { backgroundColor: plan.color }]}>
                  <Text style={s.popularText}>MOST POPULAR</Text>
                </View>
              )}

              {isActive && (
                <View style={[s.activeBadge, { backgroundColor: plan.color }]}>
                  <Text style={s.activeText}>✓ YOUR CURRENT PLAN</Text>
                </View>
              )}

              {/* Plan top row */}
              <View style={s.cardTop}>
                <View style={s.cardLeft}>
                  <Text style={s.planEmoji}>{plan.emoji}</Text>
                  <Text style={s.planName}>{plan.name}</Text>
                </View>
                <View style={s.priceBox}>
                  <Text style={[s.planPrice, { color: plan.color }]}>{plan.price}</Text>
                  <Text style={s.planPeriod}>{plan.period}</Text>
                </View>
              </View>

              {/* Features */}
              <View style={s.featureList}>
                {plan.features.map((f, i) => (
                  <View key={i} style={s.featureRow}>
                    <View style={[s.featureDot, { backgroundColor: plan.color }]} />
                    <Text style={s.featureText}>{f}</Text>
                  </View>
                ))}
              </View>

              {/* CTA button */}
              <TouchableOpacity
                style={[
                  s.btn,
                  { backgroundColor: btn.bg, borderColor: btn.border },
                  isActive && s.btnDisabled,
                ]}
                onPress={() => !isActive && openWhatsApp(plan)}
                disabled={isActive}>
                <Text style={[s.btnText, { color: isActive ? "#666" : btn.text }]}>
                  {isActive ? "✓ Active Plan" : `💬 ${plan.btnText}`}
                </Text>
              </TouchableOpacity>

            </View>
          );
        })}

        {/* Footer note */}
        <View style={s.footNote}>
          <Text style={s.footNoteText}>
            💬 Plans are activated via WhatsApp. Send your payment proof and our team will upgrade you instantly.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: "#111" },
  header:          { backgroundColor: "#f97316", paddingTop: 52, paddingBottom: 24, paddingHorizontal: 20 },
  headerTag:       { color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  headerTitle:     { color: "#fff", fontSize: 30, fontWeight: "900", marginTop: 4 },
  headerSub:       { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 6 },
  currentBanner:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#1a1a1a", borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#2a2a2a" },
  currentLeft:     { color: "#888", fontSize: 12 },
  currentRight:    { alignItems: "flex-end" },
  currentPlanName: { color: "#f97316", fontSize: 16, fontWeight: "900" },
  currentExpiry:   { color: "#666", fontSize: 11, marginTop: 2 },
  card:            { backgroundColor: "#1a1a1a", borderRadius: 18, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: "#2a2a2a" },
  cardPopular:     { borderColor: "#60a5fa55" },
  popularBadge:    { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, alignSelf: "flex-start", marginBottom: 12 },
  popularText:     { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  activeBadge:     { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, alignSelf: "flex-start", marginBottom: 12, opacity: 0.9 },
  activeText:      { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  cardTop:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  cardLeft:        { flexDirection: "row", alignItems: "center", gap: 8 },
  planEmoji:       { fontSize: 26 },
  planName:        { color: "#fff", fontSize: 22, fontWeight: "900" },
  priceBox:        { alignItems: "flex-end" },
  planPrice:       { fontSize: 24, fontWeight: "900" },
  planPeriod:      { color: "#888", fontSize: 12 },
  featureList:     { marginBottom: 16, gap: 8 },
  featureRow:      { flexDirection: "row", alignItems: "center", gap: 8 },
  featureDot:      { width: 6, height: 6, borderRadius: 3 },
  featureText:     { color: "#ccc", fontSize: 13, flex: 1 },
  btn:             { borderWidth: 1.5, borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  btnDisabled:     { borderColor: "#333", backgroundColor: "#1a1a1a" },
  btnText:         { fontWeight: "700", fontSize: 14 },
  footNote:        { backgroundColor: "#1a1a1a", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#2a2a2a", marginTop: 4 },
  footNoteText:    { color: "#888", fontSize: 13, lineHeight: 20, textAlign: "center" },
});