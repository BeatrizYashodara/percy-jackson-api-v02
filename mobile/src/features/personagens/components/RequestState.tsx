import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../theme';

type RequestStateProps = {
  loading?: boolean;
  error?: string | null;
  onRetry: () => void;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  loadingMessage?: string;
};

export function RequestState({ loading, error, onRetry, emptyActionLabel, onEmptyAction, loadingMessage = 'Carregando personagens…' }: RequestStateProps) {
  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      {loading ? <><ActivityIndicator size="large" color={colors.ink} /><Text style={styles.message}>{loadingMessage}</Text></> : <>
        <Text style={styles.title}>{error ? 'Não foi possível carregar' : 'Nenhum personagem por aqui'}</Text>
        <Text style={styles.message}>{error || 'Os personagens aparecerão aqui quando estiverem disponíveis.'}</Text>
        <Pressable accessibilityRole="button" onPress={!error && onEmptyAction ? onEmptyAction : onRetry} style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}>
          <Text style={styles.buttonText}>{error ? 'Tentar novamente' : emptyActionLabel ?? 'Atualizar'}</Text>
        </Pressable>
      </>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 28, gap: 16, alignItems: 'center', justifyContent: 'center', flexGrow: 1 },
  title: { fontSize: 20, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  message: { color: colors.muted, textAlign: 'center', lineHeight: 23, fontSize: 15 },
  button: { backgroundColor: colors.ink, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  buttonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
});
