import { Alert, Platform } from 'react-native';

export function confirmDiscard(onConfirm: () => void) {
  const message = 'As alterações ainda não foram salvas. Deseja descartá-las?';
  if (Platform.OS === 'web') {
    if (globalThis.confirm(message)) onConfirm();
    return;
  }
  Alert.alert('Descartar alterações?', message, [
    { text: 'Continuar editando', style: 'cancel' },
    { text: 'Descartar', style: 'destructive', onPress: onConfirm },
  ]);
}
