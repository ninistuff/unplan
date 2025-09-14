import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from "expo-image-picker";
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth, UserProfile } from "../lib/auth";
import { t } from "../lib/i18n";
import { useTheme } from "../lib/ThemeProvider";



export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateProfile, signOut } = useAuth();
  const { theme, themeMode, textSize, setThemeMode, setTextSize } = useTheme();
  const profile = user?.profile;
  const insets = useSafeAreaInsets();
  const lang = (profile?.language ?? 'en') as 'en' | 'ro';

  const [local, setLocal] = useState<UserProfile>(
    profile ?? {
      name: "",
      dob: undefined,
      language: 'en',
      units: 'metric',
      avatarUri: undefined,
      theme: 'auto',
      textSize: 'medium',
      preferences: {
        activity: "relaxed",
        disabilities: {
          wheelchair: false,
          reducedMobility: false,
          lowVision: false,
          hearingImpairment: false,
          sensorySensitivity: false,
          strollerFriendly: false,
        },
        interests: [],
      },
    }
  );

  const nameInputRef = useRef<TextInput | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);

  const age = useMemo(() => (local.dob ? calcAge(local.dob) : null), [local.dob]);

  // No need to sync - we'll use themeMode and textSize directly from ThemeProvider

  // Auto-save when leaving the screen
  const latestValues = useRef({ local, themeMode, textSize, userProfile: user?.profile });
  latestValues.current = { local, themeMode, textSize, userProfile: user?.profile };

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // This runs when the screen loses focus (user navigates away)
        const { local: currentLocal, themeMode: currentThemeMode, textSize: currentTextSize, userProfile } = latestValues.current;

        if (userProfile) {
          const profileToSave = {
            ...currentLocal,
            theme: currentThemeMode,
            textSize: currentTextSize
          };

          if (JSON.stringify(profileToSave) !== JSON.stringify(userProfile)) {
            updateProfile(profileToSave).catch(error => {
              console.error('Failed to auto-save profile:', error);
            });
          }
        }
      };
    }, [updateProfile])
  );

  const onPickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
      if (!res.canceled && res.assets && res.assets[0]?.uri) {
        const uri = res.assets[0].uri;
        setLocal((prev) => ({ ...prev, avatarUri: uri }));
      }
    } catch {}
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1 }}>
        {/* Custom Header with Back Arrow */}
        <View style={{
          paddingTop: (insets.top || 0) + 16,
          paddingBottom: 16,
          paddingHorizontal: 16,
          backgroundColor: theme.colors.background,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
            hitSlop={8}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={theme.colors.text}
            />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, gap: 16, paddingTop: 16, paddingBottom: (insets.bottom || 0) + 120 }}>

          <Section title={''}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ position: 'relative', marginRight: 16, marginTop: 8 }}>
                <Image source={local.avatarUri ? { uri: local.avatarUri } : undefined} style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#e5e7eb' }} />
                <Pressable onPress={onPickAvatar} accessibilityLabel={lang==='ro' ? 'Schimbă poza' : 'Change photo'} style={{ position: 'absolute', right: -6, bottom: -6, width: 32, height: 32, borderRadius: 16, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}>
                  <Ionicons name={Platform.OS === 'ios' ? ('camera' as any) : ('camera-outline' as any)} size={16} color="#111827" />
                </Pressable>
              </View>
              <View style={{ flex: 1, paddingLeft: 16 }}>
                {editingName ? (
                  <TextInput ref={nameInputRef} value={local.name} onChangeText={(v)=>setLocal({ ...local, name: v })} onBlur={()=>setEditingName(false)} placeholder={t(lang,'name')} style={{ fontSize: 18, fontWeight: '700', color: '#0f172a', borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 10, paddingVertical: Platform.select({ ios: 10, default: 8 }), borderRadius: 8, minWidth: 160, maxWidth: '80%' }} />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a' }} numberOfLines={1}>
                      {local.name || (lang==='ro' ? 'Fără nume' : 'No name')}
                    </Text>
                    <Pressable onPress={()=>{ setEditingName(true); setTimeout(()=> nameInputRef.current?.focus?.(), 0); }} hitSlop={8} style={{ marginLeft: 6 }} accessibilityLabel={lang==='ro' ? 'Editează numele' : 'Edit name'}>
                      <Ionicons name={Platform.OS === 'ios' ? ('create' as any) : ('create-outline' as any)} size={16} color="#64748b" />
                    </Pressable>
                  </View>
                )}

                {/* Age/DOB Section with explanation */}
                <View style={{ marginTop: 8, padding: 12, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a', flex: 1 }}>
                      {lang==='ro' ? '🎂 Vârsta/Data nașterii' : '🎂 Age/Date of birth'}
                    </Text>
                    <Pressable onPress={()=>setShowDobPicker(true)} hitSlop={8} style={{ padding: 4 }} accessibilityLabel={lang==='ro' ? 'Editează vârsta' : 'Edit age'}>
                      <Ionicons name={Platform.OS === 'ios' ? ('create' as any) : ('create-outline' as any)} size={16} color="#10b981" />
                    </Pressable>
                  </View>

                  {age != null ? (
                    <View style={{ marginBottom: 8 }}>
                      <Text style={{ fontSize: 18, fontWeight: '700', color: '#10b981' }}>
                        {lang==='ro' ? `${age} ani` : `${age} years old`}
                      </Text>
                      {local.dob && (
                        <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                          {lang==='ro' ? 'Născut în' : 'Born'} {new Date(local.dob).getFullYear()}
                        </Text>
                      )}
                    </View>
                  ) : (
                    <View style={{ marginBottom: 8 }}>
                      <Text style={{ fontSize: 14, color: '#ef4444', fontWeight: '600' }}>
                        {lang==='ro' ? 'Vârsta nu este setată' : 'Age not set'}
                      </Text>
                    </View>
                  )}

                  <Text style={{ fontSize: 12, color: '#64748b', lineHeight: 16 }}>
                    {lang==='ro'
                      ? '💡 Pentru recomandări potrivite vârstei tale'
                      : '💡 For age-appropriate recommendations'
                    }
                  </Text>
                </View>
                {showDobPicker ? (
                  <DateTimePicker value={parseIso(local.dob || toIso(new Date(1995,0,1)))} mode="date" display={Platform.OS === 'ios' ? 'inline' : 'default'} onChange={(_e: DateTimePickerEvent, d?: Date)=>{ if (Platform.OS === 'android') setShowDobPicker(false); if (d) setLocal({ ...local, dob: toIso(d) }); }} />
                ) : null}


              </View>
            </View>

            {/* Note: DOB field is inline above */}
          </Section>





          {/* Language Selection */}
          <Section title={lang==='ro' ? 'Limbă' : 'Language'}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={() => setLocal(prev => ({ ...prev, language: 'ro' }))}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: local.language === 'ro' ? '#10b981' : '#f3f4f6',
                  borderWidth: 1,
                  borderColor: local.language === 'ro' ? '#10b981' : '#e5e7eb',
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center'
                }}
              >
                <Text style={{ fontSize: 18, marginRight: 8 }}>🇷🇴</Text>
                <Text style={{
                  color: local.language === 'ro' ? 'white' : '#111827',
                  fontWeight: '600',
                  fontSize: 16
                }}>
                  Română
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setLocal(prev => ({ ...prev, language: 'en' }))}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: local.language === 'en' ? '#10b981' : '#f3f4f6',
                  borderWidth: 1,
                  borderColor: local.language === 'en' ? '#10b981' : '#e5e7eb',
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center'
                }}
              >
                <Text style={{ fontSize: 18, marginRight: 8 }}>🇬🇧</Text>
                <Text style={{
                  color: local.language === 'en' ? 'white' : '#111827',
                  fontWeight: '600',
                  fontSize: 16
                }}>
                  English
                </Text>
              </Pressable>
            </View>
          </Section>

          {/* Theme Selection */}
          <Section title={lang==='ro' ? '🎨 Tema aplicației' : '🎨 App Theme'}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() => setThemeMode('light')}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: themeMode === 'light' ? theme.colors.accent : theme.colors.surface,
                  borderWidth: 1,
                  borderColor: themeMode === 'light' ? theme.colors.accent : theme.colors.border,
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 20, marginBottom: 4 }}>☀️</Text>
                <Text style={{
                  color: themeMode === 'light' ? 'white' : theme.colors.text,
                  fontWeight: '600',
                  fontSize: theme.textSizes.xs,
                  textAlign: 'center'
                }}>
                  {lang==='ro' ? 'Luminos' : 'Light'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setThemeMode('dark')}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: themeMode === 'dark' ? theme.colors.accent : theme.colors.surface,
                  borderWidth: 1,
                  borderColor: themeMode === 'dark' ? theme.colors.accent : theme.colors.border,
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 20, marginBottom: 4 }}>🌙</Text>
                <Text style={{
                  color: themeMode === 'dark' ? 'white' : theme.colors.text,
                  fontWeight: '600',
                  fontSize: theme.textSizes.xs,
                  textAlign: 'center'
                }}>
                  {lang==='ro' ? 'Întunecat' : 'Dark'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setThemeMode('auto')}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: themeMode === 'auto' ? theme.colors.accent : theme.colors.surface,
                  borderWidth: 1,
                  borderColor: themeMode === 'auto' ? theme.colors.accent : theme.colors.border,
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 20, marginBottom: 4 }}>🔄</Text>
                <Text style={{
                  color: themeMode === 'auto' ? 'white' : theme.colors.text,
                  fontWeight: '600',
                  fontSize: theme.textSizes.xs,
                  textAlign: 'center'
                }}>
                  Auto
                </Text>
              </Pressable>
            </View>
            <Text style={{ fontSize: 12, color: '#64748b', marginTop: 8, textAlign: 'center' }}>
              {lang==='ro'
                ? 'Auto se adaptează la setările sistemului'
                : 'Auto adapts to system settings'
              }
            </Text>
          </Section>

          {/* Text Size Selection */}
          <Section title={lang==='ro' ? '📝 Mărimea textului' : '📝 Text Size'}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() => setTextSize('small')}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: textSize === 'small' ? theme.colors.accent : theme.colors.surface,
                  borderWidth: 1,
                  borderColor: textSize === 'small' ? theme.colors.accent : theme.colors.border,
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 16, marginBottom: 4 }}>Aa</Text>
                <Text style={{
                  color: textSize === 'small' ? 'white' : theme.colors.text,
                  fontWeight: '600',
                  fontSize: theme.textSizes.xs,
                  textAlign: 'center'
                }}>
                  {lang==='ro' ? 'Mic' : 'Small'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setTextSize('medium')}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: textSize === 'medium' ? theme.colors.accent : theme.colors.surface,
                  borderWidth: 1,
                  borderColor: textSize === 'medium' ? theme.colors.accent : theme.colors.border,
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 18, marginBottom: 4 }}>Aa</Text>
                <Text style={{
                  color: textSize === 'medium' ? 'white' : theme.colors.text,
                  fontWeight: '600',
                  fontSize: theme.textSizes.xs,
                  textAlign: 'center'
                }}>
                  {lang==='ro' ? 'Mediu' : 'Medium'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setTextSize('large')}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: textSize === 'large' ? theme.colors.accent : theme.colors.surface,
                  borderWidth: 1,
                  borderColor: textSize === 'large' ? theme.colors.accent : theme.colors.border,
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 20, marginBottom: 4 }}>Aa</Text>
                <Text style={{
                  color: textSize === 'large' ? 'white' : theme.colors.text,
                  fontWeight: '600',
                  fontSize: theme.textSizes.xs,
                  textAlign: 'center'
                }}>
                  {lang==='ro' ? 'Mare' : 'Large'}
                </Text>
              </Pressable>
            </View>
            <Text style={{ fontSize: 12, color: '#64748b', marginTop: 8, textAlign: 'center' }}>
              {lang==='ro'
                ? 'Pentru o citire mai confortabilă și accesibilitate îmbunătățită'
                : 'For more comfortable reading and improved accessibility'
              }
            </Text>
          </Section>





          <Pressable onPress={async()=>{ try{ await signOut(); } catch{} }} style={{ borderWidth: 1, borderColor: '#ef4444', paddingVertical: 12, borderRadius: 10 }}>
            <Text style={{ color: '#ef4444', textAlign: 'center', fontWeight: '700', fontSize: 16 }}>{lang==='ro' ? 'Deconectare' : 'Sign out'}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: 12 }}>
      {title ? <Text style={{ fontSize: theme.textSizes.lg, fontWeight: "700", color: theme.colors.text }}>{title}</Text> : null}
      {children}
    </View>
  );
}






function calcAge(iso: string) {
  const [y, m, d] = iso.split("-").map((s) => parseInt(s, 10));
  if (!y || !m || !d) return null;
  const today = new Date();
  let age = today.getFullYear() - y;
  const mm = today.getMonth() + 1;
  const dd = today.getDate();
  if (mm < m || (mm === m && dd < d)) age--;
  return age;
}

function toIso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function parseIso(s: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return new Date(1995,0,1);
  return new Date(Number(m[1]), Number(m[2])-1, Number(m[3]));
}
