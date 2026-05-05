import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableWithoutFeedback,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

// ─── Renkler ─────────────────────────────────────────────────────────────────
const C = {
  bg:           '#0D1117',
  card:         '#161B22',
  cardDone:     '#0d2818',
  accent:       '#2ea043',
  accentLight:  '#3fb950',
  text:         '#E6EDF3',
  subtext:      '#7D8590',
  border:       '#30363D',
  tabBar:       '#161B22',
};

// ─── Başlangıç alışkanlıkları ─────────────────────────────────────────────────
const DEFAULT_HABITS = [
  { id: '1', emoji: '🏃', title: 'Egzersiz' },
  { id: '2', emoji: '📖', title: 'Kitap Oku' },
  { id: '3', emoji: '🧘', title: 'Meditasyon' },
];

const STORAGE_KEY = 'newhabit_habits';

// ─── Türkçe tarih ─────────────────────────────────────────────────────────────
function formatDate(date) {
  const days   = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
}

// ─── Tek Kart ─────────────────────────────────────────────────────────────────
function HabitCard({ habit, onToggle }) {
  const scale     = useSharedValue(1);
  const bgOpacity = useSharedValue(habit.completed ? 1 : 0);

  useEffect(() => {
    bgOpacity.value = withTiming(habit.completed ? 1 : 0, { duration: 250 });
  }, [habit.completed]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 12, stiffness: 200 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };
  const handlePress = () => {
    onToggle(habit.id);
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View
        style={[
          styles.card,
          habit.completed && styles.cardDone,
          animStyle,
        ]}
      >
        {/* Sol: emoji */}
        <Text style={styles.emoji}>{habit.emoji}</Text>

        {/* Orta: isim */}
        <Text style={[styles.habitTitle, habit.completed && styles.habitTitleDone]}>
          {habit.title}
        </Text>

        {/* Sağ: tamamlandı çemberi */}
        <View style={[styles.circle, habit.completed && styles.circleDone]}>
          {habit.completed && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

// ─── Ana Ekran ─────────────────────────────────────────────────────────────────
function HomeScreen() {
  const [habits, setHabits] = useState([]);

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        setHabits(JSON.parse(raw));
      } else {
        const init = DEFAULT_HABITS.map(h => ({ ...h, completed: false }));
        setHabits(init);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(init));
      }
    } catch (e) {
      const init = DEFAULT_HABITS.map(h => ({ ...h, completed: false }));
      setHabits(init);
    }
  };

  const toggleHabit = useCallback(async (id) => {
    setHabits(prev => {
      const updated = prev.map(h =>
        h.id === id ? { ...h, completed: !h.completed } : h
      );
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const completed = habits.filter(h => h.completed).length;
  const total     = habits.length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Başlık */}
      <View style={styles.header}>
        <Text style={styles.dateText}>{formatDate(new Date())}</Text>
        <Text style={styles.progressText}>
          {completed}/{total} tamamlandı
        </Text>
      </View>

      {/* Kart listesi */}
      <FlatList
        data={habits}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <HabitCard habit={item} onToggle={toggleHabit} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// ─── İstatistik Ekranı ────────────────────────────────────────────────────────
function StatsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={styles.statsCenter}>
        <Text style={styles.statsEmoji}>📊</Text>
        <Text style={styles.statsTitle}>İstatistikler</Text>
        <Text style={styles.statsSubtitle}>Yakında burada tüm verilerin olacak.</Text>
      </View>
    </SafeAreaView>
  );
}

// ─── Tab Navigasyon ───────────────────────────────────────────────────────────
const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor:   C.accentLight,
          tabBarInactiveTintColor: C.subtext,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ focused, color, size }) => {
            const icon = route.name === 'Bugün' ? (focused ? '🏠' : '🏠') : (focused ? '📊' : '📊');
            return <Text style={{ fontSize: 20 }}>{icon}</Text>;
          },
        })}
      >
        <Tab.Screen name="Bugün"     component={HomeScreen} />
        <Tab.Screen name="İstatistik" component={StatsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// ─── Stiller ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  dateText: {
    fontSize: 22,
    fontWeight: '700',
    color: C.text,
    marginBottom: 4,
  },
  progressText: {
    fontSize: 14,
    color: C.accent,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 12,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  cardDone: {
    backgroundColor: C.cardDone,
    borderColor: C.accent,
  },
  emoji: {
    fontSize: 28,
    marginRight: 14,
  },
  habitTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: C.text,
  },
  habitTitleDone: {
    color: C.accentLight,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: C.subtext,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: {
    borderColor: C.accent,
    backgroundColor: C.accent,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  tabBar: {
    backgroundColor: C.tabBar,
    borderTopColor: C.border,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  statsCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  statsEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: C.text,
    marginBottom: 8,
  },
  statsSubtitle: {
    fontSize: 14,
    color: C.subtext,
    textAlign: 'center',
  },
});
