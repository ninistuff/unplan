# DEPENDENCIES

Scop
Documentează dependențele marcate ca peer sau aparent nefolosite, dar necesare.

## react-dom
De ce există
Necesitat de Expo Web prin react-native-web. Fără react-dom, randarea pe web e imposibilă.

Cum verifici
`expo start --web` pornește fără erori când react-dom este instalat.

## @react-navigation/*
De ce există
expo-router se bazează pe pachete din React Navigation ca peer deps. Unele apar ca dependențe directe pentru a fixa versiuni compatibile.

Pachete posibile
@react-navigation/native
@react-navigation/bottom-tabs
@react-navigation/elements
react-native-safe-area-context
react-native-screens

Cum verifici
Navigarea în app pornește. `npx expo-doctor` nu raportează versiuni incompatibile.

## Întreținere
Când faci update la Expo sau expo-router, verifică notele de versiune React Navigation. Sincronizează versiunile ca să eviți avertismente la runtime.
