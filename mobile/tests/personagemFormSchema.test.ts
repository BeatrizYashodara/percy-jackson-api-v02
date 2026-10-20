import assert from 'node:assert/strict';
import test from 'node:test';

import { personagemFormSchema } from '../src/features/personagens/schemas/personagemFormSchema.ts';

const validCharacter = {
  nome: 'Percy Jackson',
  descricao: 'Filho de Poseidon',
  idade: '16',
  data_nascimento: '2000-08-18',
  poderes: 'Hidrocinese',
  raca: 'Semideus',
  parentesco_divino: 'Poseidon',
};

test('normaliza os dados válidos para o formato esperado pela API', () => {
  const result = personagemFormSchema.parse({
    ...validCharacter,
    nome: '  Percy Jackson  ',
    idade: '016',
  });

  assert.equal(result.nome, 'Percy Jackson');
  assert.equal(result.idade, 16);
  assert.equal(result.data_nascimento, '2000-08-18');
});

test('converte campos opcionais vazios em null', () => {
  const result = personagemFormSchema.parse({
    ...validCharacter,
    idade: '',
    data_nascimento: '',
    poderes: ' ',
    raca: '',
    parentesco_divino: '',
  });

  assert.equal(result.idade, null);
  assert.equal(result.data_nascimento, null);
  assert.equal(result.poderes, null);
  assert.equal(result.raca, null);
  assert.equal(result.parentesco_divino, null);
});

test('exige nome e descrição', () => {
  const result = personagemFormSchema.safeParse({
    ...validCharacter,
    nome: ' ',
    descricao: '',
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.deepEqual(
      result.error.issues.map((issue) => issue.path[0]),
      ['nome', 'descricao'],
    );
  }
});

test('rejeita idade negativa, decimal, não numérica ou acima do limite do banco', () => {
  for (const idade of ['-1', '1.5', 'dezesseis', '2147483648']) {
    const result = personagemFormSchema.safeParse({ ...validCharacter, idade });
    assert.equal(result.success, false, `A idade ${idade} deveria ser inválida`);
  }
});

test('aceita datas reais no formato YYYY-MM-DD', () => {
  const result = personagemFormSchema.safeParse({
    ...validCharacter,
    data_nascimento: '2000-02-29',
  });

  assert.equal(result.success, true);
});

test('rejeita formato ou data de nascimento inexistente', () => {
  for (const data_nascimento of ['18/08/2000', '2001-02-29', '2000-13-01']) {
    const result = personagemFormSchema.safeParse({
      ...validCharacter,
      data_nascimento,
    });
    assert.equal(result.success, false, `A data ${data_nascimento} deveria ser inválida`);
  }
});

test('respeita o limite de 255 caracteres da API', () => {
  for (const field of ['nome', 'raca', 'parentesco_divino'] as const) {
    const result = personagemFormSchema.safeParse({
      ...validCharacter,
      [field]: 'a'.repeat(256),
    });
    assert.equal(result.success, false, `O campo ${field} deveria ser inválido`);
  }
});
