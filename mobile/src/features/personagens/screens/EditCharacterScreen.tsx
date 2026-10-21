import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';

import { colors } from '../../../theme';
import { PersonagemForm } from '../components/PersonagemForm';
import { confirmDiscard } from '../components/confirmDiscard';
import { RequestState } from '../components/RequestState';
import { usePersonagemQuery, useUpdatePersonagemMutation } from '../hooks/usePersonagensQueries';
import type { PersonagemFormData, PersonagemFormInput } from '../schemas/personagemFormSchema';
import type { Personagem } from '../types/personagem';

type EditCharacterScreenProps = {
  id: number;
  onBack: () => void;
  onUpdated: (id: number) => void;
};

function formValues(personagem: Personagem): PersonagemFormInput {
  return {
    nome: personagem.nome,
    descricao: personagem.descricao,
    idade: personagem.idade === null ? '' : String(personagem.idade),
    data_nascimento: personagem.data_nascimento ?? '',
    poderes: personagem.poderes ?? '',
    raca: personagem.raca ?? '',
    parentesco_divino: personagem.parentesco_divino ?? '',
  };
}

export function EditCharacterScreen({ id, onBack, onUpdated }: EditCharacterScreenProps) {
  const characterQuery = usePersonagemQuery(id);
  const mutation = useUpdatePersonagemMutation();
  const [isDirty, setIsDirty] = useState(false);
  const requestBack = () => isDirty ? confirmDiscard(onBack) : onBack();

  const submit = async (values: PersonagemFormData) => {
    mutation.reset();
    try {
      const personagem = await mutation.mutateAsync({ id, values });
      Alert.alert('Personagem atualizado', `As alterações de ${personagem.nome} foram salvas.`);
      onUpdated(personagem.id);
    } catch {
      // A mensagem tratada pela camada da API é exibida abaixo do cabeçalho.
    }
  };

  return <View style={styles.screen}>
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Voltar para o personagem" accessibilityState={{ disabled: mutation.isPending }} disabled={mutation.isPending} onPress={requestBack} style={[styles.back, mutation.isPending && styles.disabled]}>
        <Text style={styles.backText}>‹  Personagem</Text>
      </Pressable>
      <Text accessibilityRole="header" style={styles.title}>Editar personagem</Text>
      <Text style={styles.subtitle}>Atualize os dados e salve as alterações.</Text>
      {mutation.error ? <Text accessibilityLiveRegion="assertive" accessibilityRole="alert" style={styles.error}>{mutation.error.message}</Text> : null}
    </View>
    {characterQuery.data ? (
      <PersonagemForm
        initialValues={formValues(characterQuery.data)}
        onCancel={requestBack}
        onDirtyChange={setIsDirty}
        onSubmit={submit}
        submitLabel="Salvar alterações"
        submittingLabel="Salvando…"
        submitting={mutation.isPending}
      />
    ) : (
      <RequestState
        error={characterQuery.error?.message}
        loading={characterQuery.isPending}
        loadingMessage="Carregando dados do personagem…"
        onRetry={() => { void characterQuery.refetch(); }}
      />
    )}
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: colors.ink, paddingHorizontal: 24, paddingBottom: 24, gap: 8 },
  back: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  backText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  title: { color: '#FFFFFF', fontSize: 30, fontWeight: '700' },
  subtitle: { color: '#CFDCDE', fontSize: 15, lineHeight: 22 },
  error: { marginTop: 6, padding: 12, borderRadius: 10, color: '#FFFFFF', backgroundColor: colors.error, lineHeight: 20, fontWeight: '600' },
  disabled: { opacity: 0.55 },
});
