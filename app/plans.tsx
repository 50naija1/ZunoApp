import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useAuth } from "./context";

const PLANS = [
  {
    name: "Basic",
    price: "₦1,500",
    period: "/mo",
    desc: "Profile listed on Zuno · Receive job notifications · Basic profile visible to clients",
    btnText: "Pay Basic ₦1,500 →",
    btnStyle: "outline",
    popular: false,
  },
  {
    name: "Standard",
    price: "₦3,000",
    period: "/mo",
    desc: "Everything in Basic · ✅ Verified badge · Portfolio photos · Mid-search placement",
    btnText: "Upgrade to Standard →",
    btnStyle: "orange",
    popular: true,
  },
  {
    name: "Pro",
    price: "₦5,000",
    period: "/mo",
    desc: "Everything in Standard · 🏆 Pro badge · Featured placement · Priority alerts 2 mins early · Top search results",
    btnText: "Upgrade to Pro →",
    btnStyle: "outline",
    popular: false,
  },
  {
    name: "Premium",
    price: "₦8,000",
    period: "/mo",
    desc: "Everything in Pro · 🌟 Homepage spotlight · Social media feature · First to receive ALL Lagos jobs · Dedicated profile URL",
    btnText: "Upgrade to Premium →",
    btnStyle: "orange",
    popular: false,
  },
];

export default function PlansScreen() {
  const { artisanData } = useAuth();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#f97316" />

      {/* Orange header like website */}
      <View style={styles.header}>
        <Text style={styles.headerTag}>PLANS</Text>
        <Text style={styles.headerTitle}>Choose Your Plan</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>

        {/* Current plan */}
        {artisanData?.subscription_plan && (
          <View style={styles.currentPlan}>
            <Text style={styles.currentPlanText}>
              Current Plan: {artisanData.subscription_plan.toUpperCase()}
            </Text>
          </View>
        )}

        {PLANS.map((plan, i) => (
          <View key={i} style={[styles.planCard, plan.popular && styles.planCardPopular]}>
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>POPULAR</Text>
              </View>
            )}
            <View style={styles.planTop}>
              <Text style={styles.planName}>{plan.name}</Text>
              <View style={styles.planPriceRow}>
                <Text style={styles.planPrice}>{plan.price}</Text>
                <Text style={styles.planPeriod}>{plan.period}</Text>
              </View>
            </View>
            <Text style={styles.planDesc}>{plan.desc}</Text>
            <TouchableOpacity
              style={[
                styles.planBtn,
                plan.btnStyle === "orange" && styles.planBtnOrange,
              ]}>
              <Text style={[
                styles.planBtnText,
                plan.btnStyle === "orange" && styles.planBtnTextOrange,
              ]}>
                {plan.btnText}
              </Text>
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
    backgroundColor: "#f97316",
    paddingTop: 52, paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTag: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "700", letterSpacing: 1.5 },
  headerTitle: { color: "white", fontSize: 28, fontWeight: "900", marginTop: 4 },
  currentPlan: {
    backgroundColor: "#1a1a1a", borderRadius: 12,
    padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: "#f97316",
  },
  currentPlanText: { color: "#f97316", fontWeight: "700", fontSize: 14 },
  planCard: {
    backgroundColor: "#1a1a1a", borderRadius: 16,
    padding: 20, marginBottom: 14,
    borderWidth: 1, borderColor: "#2a2a2a",
  },
  planCardPopular: { borderColor: "#f97316", borderWidth: 1.5 },
  popularBadge: {
    backgroundColor: "#f97316", borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4,
    alignSelf: "flex-start", marginBottom: 12,
  },
  popularText: { color: "white", fontSize: 11, fontWeight: "800" },
  planTop: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 10,
  },
  planName: { color: "white", fontSize: 20, fontWeight: "900" },
  planPriceRow: { flexDirection: "row", alignItems: "baseline" },
  planPrice: { color: "#f97316", fontSize: 22, fontWeight: "900" },
  planPeriod: { color: "#888", fontSize: 13, marginLeft: 2 },
  planDesc: { color: "#888", fontSize: 13, lineHeight: 20, marginBottom: 16 },
  planBtn: {
    borderWidth: 1, borderColor: "#444",
    borderRadius: 12, paddingVertical: 14,
    alignItems: "center",
  },
  planBtnOrange: { backgroundColor: "#f97316", borderColor: "#f97316" },
  planBtnText: { color: "#aaa", fontWeight: "700", fontSize: 14 },
  planBtnTextOrange: { color: "white" },
});