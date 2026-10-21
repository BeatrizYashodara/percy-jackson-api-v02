import assert from 'node:assert/strict';
import test from 'node:test';
import { QueryClient } from '@tanstack/react-query';

import { cacheDeletedPersonagem, cacheSavedPersonagem } from '../src/features/personagens/api/cache.ts';
import { personagensQueryKeys } from '../src/features/personagens/api/queryKeys.ts';
import type { Personagem } from '../src/features/personagens/types/personagem.ts';

const personagem: Personagem = {
  id: 7, nome: 'Percy', descricao: 'Semideus', idade: 16,
  data_nascimento: null, poderes: null, raca: null,
  parentesco_divino: null, imagem: null, imagem_url: null,
};

function seededClient() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(personagensQueryKeys.list(), [personagem]);
  return client;
}

test('cadastro e edição atualizam o detalhe e invalidam a listagem', async () => {
  const client = seededClient();
  const atualizado = { ...personagem, nome: 'Percy Jackson' };

  await cacheSavedPersonagem(client, atualizado);

  assert.deepEqual(client.getQueryData(personagensQueryKeys.detail(7)), atualizado);
  assert.equal(client.getQueryState(personagensQueryKeys.list())?.isInvalidated, true);
  client.clear();
});

test('exclusão remove o detalhe e invalida a listagem', async () => {
  const client = seededClient();
  client.setQueryData(personagensQueryKeys.detail(7), personagem);

  await cacheDeletedPersonagem(client, 7);

  assert.equal(client.getQueryData(personagensQueryKeys.detail(7)), undefined);
  assert.equal(client.getQueryState(personagensQueryKeys.list())?.isInvalidated, true);
  client.clear();
});
