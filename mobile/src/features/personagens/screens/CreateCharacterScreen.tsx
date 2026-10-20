import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../theme';
import { PersonagemForm } from '../components/PersonagemForm';
import { useCreatePersonagemMutation } from '../hooks/usePersonagensQueries';
import type { PersonagemFormData } from '../schemas/personagemFormSchema';

type CreateCharacterScreenProps = {
  onBack: () => void;
  onCreated: (id: number) => void;
};

export function CreateCharacterScreen({ onBack, onCreated }: CreateCharacterScreenProps) {
  const mutation = useCreatePersonagemMutation();

  const submit = async (values: PersonagemFormData) => {
    mutation.reset();
    try {
      const personagem = await mutation.mutateAsync(values);
      Alert.alert('Personagem cadastrado', `${personagem.nome} foi cadastrado com sucesso.`);
      onCreated(personagem.id);
    } catch {
      // A mensagem tratada pela camada da API é exibida abaixo do cabeçalho.
    }
  };

  return <View style={styles.screen}>
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Voltar para personagens" disabled={mutation.isPending} onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>‹  Personagens</Text>
      </Pressable>
      <Text accessibilityRole="header" style={styles.title}>Novo personagem</Text>
      <Text style={styles.subtitle}>Preencha os dados obrigatórios para adicionar um personagem.</Text>
      {mutation.error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{mutation.error.message}</Text> : null}
    </View>
    <PersonagemForm onCancel={onBack} onSubmit={submit} submitLabel="Cadastrar personagem" submitting={mutation.isPending} />
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
});
