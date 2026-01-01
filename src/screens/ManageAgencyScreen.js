import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebaseConfig";

// Enable LayoutAnimation on Android
if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const ManageAgencyScreen = () => {
  const router = useRouter();
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const result = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.role === "agency") {
          result.push({
            id: docSnap.id,
            status: data.status || "pending",
            ...data,
          });
        }
      });

      // Sort: Pending first
      result.sort((a, b) => (a.status === 'pending' ? -1 : 1));
      setAgencies(result);
    } catch {
      Alert.alert("Error", "Failed to fetch agencies.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatusLocal = (id, status) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAgencies((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  };

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await updateDoc(doc(db, "users", id), { status: "approved" });
      updateStatusLocal(id, "approved");
    } catch {
      Alert.alert("Error", "Unable to approve agency.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(id);
    try {
      await updateDoc(doc(db, "users", id), { status: "rejected" });
      updateStatusLocal(id, "rejected");
    } catch {
      Alert.alert("Error", "Unable to reject agency.");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Helper for Badge Styles
  const getStatusStyle = (status) => {
    switch (status) {
      case "approved":
        return { bg: "#E8F5E9", text: "#2E7D32" }; // Green
      case "rejected":
        return { bg: "#FFEBEE", text: "#D32F2F" }; // Red
      default:
        return { bg: "#FFF8E1", text: "#F57C00" }; // Orange/Yellow
    }
  };

  const renderItem = ({ item }) => {
    const isExpanded = expandedId === item.id;
    const statusStyle = getStatusStyle(item.status);
    const displayName = item.agencyName || "Unnamed Agency";

    return (
      <View style={styles.cardContainer}>
        {/* Main Row */}
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => toggleExpand(item.id)}
          activeOpacity={0.7} // <--- FIXED HERE
        >
          <View style={styles.avatarContainer}>
            {/* Avatar Placeholder */}
            <View style={[styles.avatar, styles.placeholderAvatar]}>
              <Text style={styles.avatarText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.agencyName} numberOfLines={1}>
              {displayName}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="#999"
          />
        </TouchableOpacity>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.divider} />
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{item.email || "N/A"}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>License No:</Text>
              <Text style={styles.value}>{item.licenseNo || "N/A"}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Website:</Text>
              <Text style={[styles.value, { color: '#648DDB' }]}>{item.companyUrl || "N/A"}</Text>
            </View>

            {/* Actions */}
            {item.status === "pending" && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={() => handleReject(item.id)}
                  disabled={actionLoading === item.id}
                >
                  <Text style={styles.rejectText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => handleApprove(item.id)}
                  disabled={actionLoading === item.id}
                >
                  {actionLoading === item.id ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.approveText}>Approve</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agencies Management</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#648DDB" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={agencies}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No agencies found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  backButton: { padding: 5 },

  listContent: { padding: 15, paddingBottom: 40 },

  /* Card Style */
  cardContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
  },

  /* Avatar */
  avatarContainer: { marginRight: 15 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  placeholderAvatar: {
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 20, fontWeight: "bold", color: "#648DDB" },

  /* Info */
  infoContainer: { flex: 1, justifyContent: "center" },
  agencyName: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 4 },
  
  /* Status Badges */
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: { fontSize: 10, fontWeight: "bold" },

  /* Expanded Section */
  expandedContent: {
    paddingHorizontal: 15,
    paddingBottom: 15,
    backgroundColor: "#FAFAFA",
  },
  divider: {
    height: 1,
    backgroundColor: "#EEE",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  label: {
    width: 90,
    fontSize: 14,
    color: "#888",
    fontWeight: "500",
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },

  /* Buttons */
  actionRow: {
    flexDirection: "row",
    marginTop: 15,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  approveBtn: { backgroundColor: "#648DDB" },
  rejectBtn: { backgroundColor: "#FFEBEE", borderWidth: 1, borderColor: "#FFCDD2" },
  
  approveText: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
  rejectText: { color: "#D32F2F", fontWeight: "bold", fontSize: 14 },

  /* Empty State */
  emptyContainer: { alignItems: "center", marginTop: 80 },
  emptyText: { color: "#999", fontSize: 16 },
});

export default ManageAgencyScreen;