import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import dayjs from 'dayjs';

const MOCK_HISTORY = [
  { id: 'h1', riderName: 'Alice Johnson', pickup: '123 Market St', dropoff: '456 Castro St', fare: 14.50, distance: 3.2, duration: 12, date: new Date(Date.now() - 3600000).toISOString() },
  { id: 'h2', riderName: 'Bob Smith', pickup: 'Union Square', dropoff: 'Mission District', fare: 22.80, distance: 5.1, duration: 18, date: new Date(Date.now() - 7200000).toISOString() },
  { id: 'h3', riderName: 'Carol Davis', pickup: 'Fishermans Wharf', dropoff: 'Haight-Ashbury', fare: 19.30, distance: 4.3, duration: 15, date: new Date(Date.now() - 86400000).toISOString() },
];

export default function DriverHistoryScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trip History</Text>
        <Text style={styles.subtitle}>{MOCK_HISTORY.length} completed trips</Text>
      </View>
      <FlatList
        data={MOCK_HISTORY}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.avatar}><Text style={{ fontSize: 18 }}>👤</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.riderName}>{item.riderName}</Text>
                <Text style={styles.date}>{dayjs(item.date).format('MMM D, h:mm A')}</Text>
              </View>
              <Text style={styles.fare}>${(item.fare * 0.8).toFixed(2)}</Text>
            </View>
            <View style={styles.routeBox}>
              <Text style={styles.routeText} numberOfLines={1}>📍 {item.pickup}</Text>
              <Text style={styles.routeText} numberOfLines={1}>🏁 {item.dropoff}</Text>
            </View>
            <View style={styles.meta}>
              <Text style={styles.metaText}>{item.distance} km · {item.duration} min · Fare: ${item.fare.toFixed(2)}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 20, paddingTop: 56, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#F3F4F6' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' },
  riderName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  date: { fontSize: 12, color: '#9CA3AF' },
  fare: { fontSize: 17, fontWeight: '800', color: '#059669' },
  routeBox: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 8, gap: 4, marginBottom: 8 },
  routeText: { fontSize: 12, color: '#374151' },
  meta: {},
  metaText: { fontSize: 12, color: '#9CA3AF' },
});
