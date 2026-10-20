import { ActivityIndicator, Alert, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { CharacterPhoto } from '../components/CharacterPhoto';
import { RequestState } from '../components/RequestState';
import { photoUrl } from '../api/personagens';
import { useDeletePersonagemMutation, usePersonagemQuery } from '../hooks/usePersonagensQueries';
import { colors } from '../../../theme';

function Field({ label, value }: { label: string; value: string | null }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value || 'Não informado'}</Text></View>;
}

type CharacterDetailScreenProps = {
  id: number;
  onBack: () => void;
  onEdit: () => void;
  onDeleted: () => void;
};

export function CharacterDetailScreen({ id, onBack, onEdit, onDeleted }: CharacterDetailScreenProps) {
  const { data, error, isFetching, isPending, refetch } = usePersonagemQuery(id);
  const deleteMutation = useDeletePersonagemMutation();
  const [webConfirmationVisible, setWebConfirmationVisible] = useState(false);
  const reload = () => { void refetch(); };

  const deleteCharacter = async () => {
    setWebConfirmationVisible(false);
    try {
      await deleteMutation.mutateAsync(id);
      Alert.alert('Personagem excluído', 'O personagem foi excluído com sucesso.');
      onDeleted();
    } catch {
      // A mensagem tratada pela camada da API é exibida na tela.
    }
  };

  const requestDelete = () => {
    deleteMutation.reset();
    if (Platform.OS === 'web') {
      setWebConfirmationVisible(true);
      return;
    }

    Alert.alert(
      'Excluir personagem?',
      `Esta ação excluirá ${data?.nome ?? 'este personagem'} permanentemente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => { void deleteCharacter(); } },
      ],
    );
  };

  return <View style={styles.screen}>
    <View style={styles.topBar}>
      <Pressable accessibilityRole="button" accessibilityLabel="Voltar para personagens" disabled={deleteMutation.isPending} onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>‹  Personagens</Text>
      </Pressable>
    </View>
    {data ? <ScrollView contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={reload} tintColor={colors.ink} />}>
      {error && <RequestState error={error.message} onRetry={reload} />}
      <CharacterPhoto uri={photoUrl(data)} name={data.nome} large />
      <Text style={styles.race}>{data.raca || 'Raça não informada'}</Text>
      <Text style={styles.title} accessibilityRole="header">{data.nome}</Text>
      {deleteMutation.error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{deleteMutation.error.message}</Text> : null}
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" disabled={deleteMutation.isPending} onPress={onEdit} style={({ pressed }) => [styles.editButton, pressed && styles.buttonPressed, deleteMutation.isPending && styles.buttonDisabled]}>
          <Text style={styles.editButtonText}>Editar</Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={deleteMutation.isPending} onPress={requestDelete} style={({ pressed }) => [styles.deleteButton, pressed && styles.buttonPressed, deleteMutation.isPending && styles.buttonDisabled]}>
          {deleteMutation.isPending ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.deleteButtonText}>Excluir</Text>}
        </Pressable>
      </View>
      <Text style={styles.description}>{data.descricao}</Text>
      <View style={styles.fields}>
        <Field label="Parentesco divino" value={data.parentesco_divino} />
        <Field label="Idade" value={data.idade === null ? null : `${data.idade} anos`} />
        <Field label="Nascimento" value={data.data_nascimento?.split('-').reverse().join('/') ?? null} />
        <Field label="Poderes" value={data.poderes} />
      </View>
    </ScrollView> : <RequestState loading={isPending} error={error?.message} onRetry={reload} />}
    <Modal animationType="fade" transparent visible={webConfirmationVisible} onRequestClose={() => setWebConfirmationVisible(false)}>
      <View style={styles.modalBackdrop}>
        <View accessibilityRole="alert" accessibilityViewIsModal style={styles.modalCard}>
          <Text style={styles.modalTitle}>Excluir personagem?</Text>
          <Text style={styles.modalText}>Esta ação excluirá {data?.nome ?? 'este personagem'} permanentemente.</Text>
          <View style={styles.modalActions}>
            <Pressable accessibilityRole="button" accessibilityLabel="Cancelar exclusão" onPress={() => setWebConfirmationVisible(false)} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Confirmar exclusão do personagem" onPress={() => { void deleteCharacter(); }} style={styles.confirmDeleteButton}>
              <Text style={styles.deleteButtonText}>Excluir</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { backgroundColor: colors.ink, paddingHorizontal: 12 },
  back: { padding: 14, alignSelf: 'flex-start' },
  backText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  content: { padding: 22, paddingBottom: 40, gap: 16, width: '100%', maxWidth: 760, alignSelf: 'center' },
  race: { color: colors.accent, fontSize: 14, fontWeight: '700', marginTop: 8 },
  title: { color: colors.ink, fontSize: 32, fontWeight: '700' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  editButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 20, borderRadius: 12, backgroundColor: colors.accent },
  editButtonText: { color: colors.surface, fontSize: 15, fontWeight: '700' },
  deleteButton: { minHeight: 44, minWidth: 90, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, borderRadius: 12, backgroundColor: colors.error },
  deleteButtonText: { color: colors.surface, fontSize: 15, fontWeight: '700' },
  buttonPressed: { opacity: 0.78 },
  buttonDisabled: { opacity: 0.55 },
  error: { padding: 12, borderRadius: 10, color: '#FFFFFF', backgroundColor: colors.error, lineHeight: 20, fontWeight: '600' },
  description: { fontSize: 16, color: colors.muted, lineHeight: 26 },
  fields: { backgroundColor: colors.surface, borderRadius: 18, paddingHorizontal: 20, borderWidth: 1, borderColor: colors.line },
  field: { paddingVertical: 18, gap: 6 },
  label: { color: colors.accent, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  value: { fontSize: 16, lineHeight: 24, color: colors.ink },
  modalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(23, 47, 59, 0.62)' },
  modalCard: { width: '100%', maxWidth: 440, padding: 24, gap: 14, borderRadius: 18, backgroundColor: colors.surface },
  modalTitle: { color: colors.ink, fontSize: 22, fontWeight: '700' },
  modalText: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  modalActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 18, borderWidth: 1, borderColor: colors.line, borderRadius: 12 },
  cancelButtonText: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  confirmDeleteButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 18, borderRadius: 12, backgroundColor: colors.error },
});
