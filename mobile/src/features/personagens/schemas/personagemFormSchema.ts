import { z } from 'zod';

const MAX_DATABASE_INTEGER = 2_147_483_647;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function isValidIsoDate(value: string): boolean {
  if (value === '') {
    return true;
  }

  const match = ISO_DATE_PATTERN.exec(value);

  if (!match) {
    return false;
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === '' ? null : value));

const optionalLimitedText = z
  .string()
  .trim()
  .max(255, 'Use no máximo 255 caracteres.')
  .transform((value) => (value === '' ? null : value));

export const personagemFormSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, 'Informe o nome.')
    .max(255, 'Use no máximo 255 caracteres.'),
  descricao: z.string().trim().min(1, 'Informe a descrição.'),
  idade: z
    .string()
    .trim()
    .refine((value) => value === '' || /^\d+$/.test(value), {
      message: 'Informe uma idade inteira e não negativa.',
    })
    .refine(
      (value) => value === '' || Number(value) <= MAX_DATABASE_INTEGER,
      { message: 'A idade informada é muito alta.' },
    )
    .transform((value) => (value === '' ? null : Number(value))),
  data_nascimento: z
    .string()
    .trim()
    .refine(isValidIsoDate, {
      message: 'Use uma data válida no formato AAAA-MM-DD.',
    })
    .transform((value) => (value === '' ? null : value)),
  poderes: optionalText,
  raca: optionalLimitedText,
  parentesco_divino: optionalLimitedText,
});

export type PersonagemFormInput = z.input<typeof personagemFormSchema>;
export type PersonagemFormData = z.output<typeof personagemFormSchema>;

export const EMPTY_PERSONAGEM_FORM_VALUES: PersonagemFormInput = {
  nome: '',
  descricao: '',
  idade: '',
  data_nascimento: '',
  poderes: '',
  raca: '',
  parentesco_divino: '',
};
