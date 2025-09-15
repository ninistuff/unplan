import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { generatePlans } from '../utils/generatePlansReal';

export default function DebugScreen() {
  const runTestScenarios = async () => {
    console.log('🧪 Starting real test scenarios...');
    
    const center = { lat: 44.4268, lon: 26.1025 }; // București
    
    const scenarios = [
      { name: 'A', duration: 120, transport: 'walk' as const, withWho: 'friends' as const, budget: 200 },
      { name: 'B', duration: 180, transport: 'walk' as const, withWho: 'solo' as const, budget: 100 },
      { name: 'C', duration: 240, transport: 'bike' as const, withWho: 'friends' as const, budget: 150 },
      { name: 'D', duration: 180, transport: 'public' as const, withWho: 'family' as const, budget: 120 },
      { name: 'E', duration: 120, transport: 'car' as const, withWho: 'friends' as const, budget: 80 },
      { name: 'F', duration: 300, transport: 'walk' as const, withWho: 'friends' as const, budget: 300 },
    ];
    
    for (const scenario of scenarios) {
      console.log(`\n🔬 Running scenario ${scenario.name}: ${scenario.duration}min, ${scenario.transport}, ${scenario.withWho}, ${scenario.budget} lei`);
      
      try {
        const plans = await generatePlans({
          duration: scenario.duration,
          transport: scenario.transport,
          withWho: scenario.withWho,
          budget: scenario.budget,
          center: center,
        });
        
        console.log(`✅ Scenario ${scenario.name} completed: ${plans.length} plans generated`);
      } catch (error) {
        console.error(`❌ Scenario ${scenario.name} failed:`, error);
      }
    }
    
    console.log('🏁 All test scenarios completed. Check Metro console for [Plans] logs.');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Generator Debug</Text>
        <Text style={styles.subtitle}>Real Test Scenarios</Text>
        
        <View style={styles.scenarioList}>
          <Text style={styles.scenarioText}>A: București, 120 min, walk, friends, buget 200</Text>
          <Text style={styles.scenarioText}>B: București, 180 min, walk, solo, buget 100</Text>
          <Text style={styles.scenarioText}>C: București, 240 min, bike, friends, buget 150</Text>
          <Text style={styles.scenarioText}>D: București, 180 min, public, family, buget 120</Text>
          <Text style={styles.scenarioText}>E: București, 120 min, car, friends, buget 80</Text>
          <Text style={styles.scenarioText}>F: București, 300 min, walk, friends, buget 300</Text>
        </View>
        
        <TouchableOpacity style={styles.button} onPress={runTestScenarios}>
          <Text style={styles.buttonText}>Rulează scenarii</Text>
        </TouchableOpacity>
        
        <Text style={styles.note}>
          Apasă butonul și verifică consola Metro pentru logurile [Plans].
          DEBUG_PLANS este activat.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  scenarioList: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  scenarioText: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  note: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
