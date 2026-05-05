import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();

const HABITS = [
  { id: '1', title: 'Exercise' },
  { id: '2', title: 'Read' },
  { id: '3', title: 'Meditate' },
];

export default function App() {
  const [habits, setHabits] = useState([]);

  // Load habits from AsyncStorage
  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      const stored = await AsyncStorage.getItem('habits');
      if (stored !== null) {
        setHabits(JSON.parse(stored));
      } else {
        // Initialize with default habits
        const initial = HABITS.map(h => ({ ...h, completed: false }));
        setHabits(initial);
        await AsyncStorage.setItem('habits', JSON.stringify(initial));
      }
    } catch (e) {
      console.error('Failed to load habits', e);
    }
  };

  const saveHabits = async (updatedHabits) => {
    setHabits(updatedHabits);
    try {
      await AsyncStorage.setItem('habits', JSON.stringify(updatedHabits));
    } catch (e) {
      console.error('Failed to save habits', e);
    }
  };

  const toggleHabit = (id) => {
    setHabits(prevHabits => {
      const updated = prevHabits.map(h =>
        h.id === id ? { ...h, completed: !h.completed } : h
      );
      saveHabits(updated);
      return updated;
    });
  };

  const renderHabit = ({ item }) => {
    const scaleAnim = new Animated.Value(1);
    const onPressIn = () => {
      Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
    };
    const onPressOut = () => {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    };
    const onPress = () => {
      toggleHabit(item.id);
    };

    return (
      <Animated.View
        style={[styles.habitCard, { transform: [{ scale: scaleAnim }] }]}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
      >
        <Text style={[styles.habitTitle, item.completed && styles.completed]}>
          {item.title}
        </Text>
      </Animated.View>
    );
  };

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
        }}
      >
        <Stack.Screen name="Home" options={{ title: 'Habits' }}>
          {() => (
            <View style={styles.container}>
              <FlatList
                data={habits}
                keyExtractor={item => item.id}
                renderItem={renderHabit}
                contentContainerStyle={styles.listContent}
              />
            </View>
          )}
        </Stack.Screen>
        <Stack.Screen name="Statistics" options={{ title: 'Statistics' }}>
          {() => (
            <View style={styles.container}>
              <Text style={styles.statsText}>Statistics placeholder</Text>
            </View>
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  habitCard: {
    backgroundColor: '#111',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitTitle: {
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
  },
  completed: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  statsText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 40,
  },
});
