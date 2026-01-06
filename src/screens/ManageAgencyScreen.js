import { Ionicons } from "@expo/vector-icons";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { db } from "../../firebaseConfig";

// Enable LayoutAnimation on Android
if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const ManageAgencyScreen = () => {
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
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

        setAgencies(result);
      } catch {
        Alert.alert("Error", "Failed to fetch agencies.");
      } finally {
        setLoading(false);
      }
    };

    fetchAgencies();
  }, []);

  const updateStatusLocal = (id, status) => {
    LayoutAnimation.configureNext(
      LayoutAnimation.Presets.easeInEaseOut
    );
    setAgencies((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status } : a
      )
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
    LayoutAnimation.configureNext(
      LayoutAnimation.Presets.easeInEaseOut
    );
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "approved":
        return styles.statusApproved;
      case "rejected":
        return styles.statusRejected;
      default:
        return styles.statusPending;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Agency Registration</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1976d2" />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
          {agencies.map((agency) => (
            <View key={agency.id} style={styles.card}>
              <TouchableOpacity
                style={styles.dropdownHeader}
                onPress={() => toggleExpand(agency.id)}
              >
                <Ionicons name="business" size={24} color="#1976d2" />
                <Text style={styles.agencyName}>
                  {agency.agencyName || "Unnamed Agency"}
                </Text>

                <View
                  style={[
                    styles.statusBadge,
                    getStatusStyle(agency.status),
                  ]}
                >
                  <Text style={styles.statusText}>
                    {agency.status.toUpperCase()}
                  </Text>
                </View>
              </TouchableOpacity>

              {expandedId === agency.id && (
                <View style={styles.detailsPanel}>
                  <View style={styles.detailRow}>
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color="#555"
                    />
                    <Text style={styles.detailText}>
                      {agency.email || "-"}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons
                      name="document-text-outline"
                      size={18}
                      color="#555"
                    />
                    <Text style={styles.detailText}>
                      {agency.licenseNo || "-"}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons
                      name="link-outline"
                      size={18}
                      color="#555"
                    />
                    <Text style={styles.detailText}>
                      {agency.companyUrl || "-"}
                    </Text>
                  </View>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[
                        styles.button,
                        styles.approveBtn,
                        agency.status !== "pending" && styles.disabledBtn,
                      ]}
                      disabled={agency.status !== "pending"}
                      onPress={() => handleApprove(agency.id)}
                    >
                      <Text style={styles.buttonText}>Approve</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.button,
                        styles.rejectBtn,
                        agency.status !== "pending" && styles.disabledBtn,
                      ]}
                      disabled={agency.status !== "pending"}
                      onPress={() => handleReject(agency.id)}
                    >
                      <Text style={styles.buttonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    padding: 16,
  },

  /* Header */
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#000",
    letterSpacing: 0.4,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 14,
    elevation: 2,
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  agencyName: {
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  statusPending: { backgroundColor: "#fbc02d" },
  statusApproved: { backgroundColor: "#2e7d32" },
  statusRejected: { backgroundColor: "#c62828" },

  detailsPanel: {
    padding: 16,
    backgroundColor: "#F5F8FE",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 10,
    fontSize: 15,
    color: "#333",
  },

  actionsRow: {
    flexDirection: "row",
    marginTop: 12,
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  approveBtn: { backgroundColor: "#28a745" },
  rejectBtn: { backgroundColor: "#e53935" },
  disabledBtn: { opacity: 0.4 },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default ManageAgencyScreen;
