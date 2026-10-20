import { zodResolver } from '@hookform/resolvers/zod';
import { ReactNode, useMemo } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Controller, Control, FieldPath, useForm } from 'react-hook-form';

import { colors } from '../../../theme';
import {
  EMPTY_PERSONAGEM_FORM_VALUES,
  personagemFormSchema,
  PersonagemFormData,
  PersonagemFormInput,
} from '../schemas/personagemFormSchema';

type PersonagemFormProps = {
  initialValues?: Partial<PersonagemFormInput>;
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: PersonagemFormData) => void | Promise<void>;
  onCancel?: () => void;
};

type FormFieldProps = TextInputProps & {
  control: Control<PersonagemFormInput, unknown, PersonagemFormData>;
  label: string;
  name: FieldPath<PersonagemFormInput>;
  hint?: ReactNode;
};

function FormField({ control, label, name, hint, style, ...inputProps }: FormFieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
        <View style={styles.field}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            {...inputProps}
            accessibilityLabel={label}
            accessibilityHint={typeof hint === 'string' ? hint : undefined}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            placeholderTextColor={colors.muted}
            style={[styles.input, inputProps.multiline && styles.multilineInput, style]}
          />
          {hint ? <Text style={styles.hint}>{hint}</Text> : null}
          {error ? (
            <Text accessibilityLiveRegion="polite" style={styles.error}>
              {error.message}
            </Text>
          ) : null}
        </View>
      )}
    />
  );
}

export function PersonagemForm({
  initialValues,
  submitting = false,
  submitLabel = 'Salvar personagem',
  onSubmit,
  onCancel,
}: PersonagemFormProps) {
  const defaultValues = useMemo(
    () => ({ ...EMPTY_PERSONAGEM_FORM_VALUES, ...initialValues }),
    [initialValues],
  );
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<PersonagemFormInput, unknown, PersonagemFormData>({
    defaultValues,
    resolver: zodResolver(personagemFormSchema),
  });
  const isBusy = submitting || isSubmitting;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <FormField
            autoCapitalize="words"
            autoComplete="name"
            control={control}
            editable={!isBusy}
            label="Nome *"
            name="nome"
            placeholder="Ex.: Percy Jackson"
            returnKeyType="next"
          />
          <FormField
            control={control}
            editable={!isBusy}
            label="Descrição *"
            multiline
            name="descricao"
            numberOfLines={5}
            placeholder="Descreva o personagem"
            textAlignVertical="top"
          />
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <FormField
                control={control}
                editable={!isBusy}
                inputMode="numeric"
                keyboardType="number-pad"
                label="Idade"
                name="idade"
                placeholder="Ex.: 16"
              />
            </View>
            <View style={styles.rowItem}>
              <FormField
                autoCapitalize="none"
                control={control}
                editable={!isBusy}
                hint="Formato: AAAA-MM-DD"
                label="Data de nascimento"
                name="data_nascimento"
                placeholder="2000-08-18"
              />
            </View>
          </View>
          <FormField
            control={control}
            editable={!isBusy}
            label="Poderes"
            multiline
            name="poderes"
            numberOfLines={3}
            placeholder="Liste os poderes do personagem"
            textAlignVertical="top"
          />
          <FormField
            autoCapitalize="words"
            control={control}
            editable={!isBusy}
            label="Raça"
            name="raca"
            placeholder="Ex.: Semideus"
          />
          <FormField
            autoCapitalize="words"
            control={control}
            editable={!isBusy}
            label="Parentesco divino"
            name="parentesco_divino"
            placeholder="Ex.: Poseidon"
          />

          <View style={styles.actions}>
            {onCancel ? (
              <Pressable
                accessibilityRole="button"
                disabled={isBusy}
                onPress={onCancel}
                style={({ pressed }) => [
                  styles.button,
                  styles.cancelButton,
                  pressed && styles.buttonPressed,
                  isBusy && styles.buttonDisabled,
                ]}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              disabled={isBusy}
              onPress={handleSubmit(onSubmit)}
              style={({ pressed }) => [
                styles.button,
                styles.submitButton,
                pressed && styles.buttonPressed,
                isBusy && styles.buttonDisabled,
              ]}
            >
              {isBusy ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.submitButtonText}>{submitLabel}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, padding: 20 },
  card: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 720,
    padding: 20,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  field: { marginBottom: 18 },
  label: { marginBottom: 7, color: colors.ink, fontSize: 15, fontWeight: '700' },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: colors.background,
    color: colors.ink,
    fontSize: 16,
  },
  multilineInput: { minHeight: 112 },
  hint: { marginTop: 6, color: colors.muted, fontSize: 12 },
  error: { marginTop: 6, color: colors.error, fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  rowItem: { flexGrow: 1, flexBasis: 220 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 12 },
  button: {
    minHeight: 48,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  submitButton: { backgroundColor: colors.accent },
  submitButtonText: { color: colors.surface, fontSize: 16, fontWeight: '700' },
  cancelButton: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  cancelButtonText: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  buttonPressed: { opacity: 0.78 },
  buttonDisabled: { opacity: 0.55 },
});
