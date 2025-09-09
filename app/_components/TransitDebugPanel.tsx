// app/components/TransitDebugPanel.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { getTransitStatus, testOTPConnection, getSetupInstructions } from '../../utils/transitConfig';
import { planTransitRoute } from '../../utils/transitRouter';

interface TransitDebugPanelProps {
  visible?: boolean;
  onClose?: () => void;
}

export default function TransitDebugPanel({ visible = false, onClose }: TransitDebugPanelProps) {
  const [status, setStatus] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  useEffect(() => {
    if (visible) {
      loadStatus();
    }
  }, [visible]);

  const loadStatus = () => {
    const transitStatus = getTransitStatus();
    setStatus(transitStatus);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResults(null);
    
    try {
      const result = await testOTPConnection();
      setTestResults(result);
    } catch (error) {
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setTesting(false);
    }
  };

  const testRouting = async () => {
    setTesting(true);
    
    try {
      // Test with Bucharest coordinates
      const from = { lat: 44.4268, lon: 26.1025 };
      const to = { lat: 44.4378, lon: 26.0969 };
      
      const result = await planTransitRoute(from, to);
      
      Alert.alert(
        'Route Test Result',
        `Legs: ${result.legs.length}\n` +
        `Duration: ${Math.round(result.totalDuration / 60)} min\n` +
        `Distance: ${Math.round(result.totalDistance)}m\n` +
        `Error: ${result.error || 'None'}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Route Test Failed',
        error instanceof Error ? error.message : 'Unknown error',
        [{ text: 'OK' }]
      );
    } finally {
      setTesting(false);
    }
  };

  const showSetupInstructions = () => {
    const instructions = getSetupInstructions();
    Alert.alert('Setup Instructions', instructions, [{ text: 'OK' }]);
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        <View style={styles.header}>
          <Text style={styles.title}>Transit Debug Panel</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Status Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Configuration Status</Text>
            {status && (
              <View>
                <Text style={styles.statusItem}>
                  OTP Configured: {status.otpConfigured ? '✅ Yes' : '❌ No'}
                </Text>
                <Text style={styles.statusItem}>
                  OTP URL: {status.otpUrl || 'Not set'}
                </Text>
                <Text style={styles.statusItem}>
                  Fallback Available: {status.fallbackAvailable ? '✅ Yes' : '❌ No'}
                </Text>
                <Text style={styles.statusItem}>
                  Max Walk Distance: {status.config.maxWalkDistance}m
                </Text>
                <Text style={styles.statusItem}>
                  Request Timeout: {status.config.requestTimeout}ms
                </Text>
              </View>
            )}
          </View>

          {/* Test Results Section */}
          {testResults && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Connection Test Results</Text>
              <Text style={styles.statusItem}>
                Success: {testResults.success ? '✅ Yes' : '❌ No'}
              </Text>
              {testResults.responseTime && (
                <Text style={styles.statusItem}>
                  Response Time: {testResults.responseTime}ms
                </Text>
              )}
              {testResults.error && (
                <Text style={[styles.statusItem, styles.errorText]}>
                  Error: {testResults.error}
                </Text>
              )}
            </View>
          )}

          {/* Actions Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            
            <TouchableOpacity 
              style={styles.button} 
              onPress={loadStatus}
            >
              <Text style={styles.buttonText}>Refresh Status</Text>
            </TouchableOpacity>

            {status?.otpConfigured && (
              <TouchableOpacity 
                style={[styles.button, testing && styles.buttonDisabled]} 
                onPress={testConnection}
                disabled={testing}
              >
                <Text style={styles.buttonText}>
                  {testing ? 'Testing...' : 'Test OTP Connection'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[styles.button, testing && styles.buttonDisabled]} 
              onPress={testRouting}
              disabled={testing}
            >
              <Text style={styles.buttonText}>
                {testing ? 'Testing...' : 'Test Route Planning'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={showSetupInstructions}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Setup Instructions
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  panel: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 18,
    color: '#666',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  statusItem: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
  errorText: {
    color: '#d32f2f',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
});

