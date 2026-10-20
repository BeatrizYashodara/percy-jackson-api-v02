import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AxiosError, CanceledError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { personagensQueryKeys } from '../src/features/personagens/api/queryKeys.ts';
import { createPersonagensApi, photoUrl } from '../src/features/personagens/api/personagens.ts';
import type { Personagem } from '../src/features/personagens/types/personagem.ts';

const character: Personagem = {
  id: 7, nome: 'Personagem de teste', descricao: 'Registro de teste',
  idade: null, data_nascimento: null, raca: null, parentesco_divino: null,
  poderes: null, imagem: null, imagem_url: null,
};

function success(data: unknown, inspect?: (config: InternalAxiosRequestConfig) => void): AxiosAdapter {
  return async (config) => {
    inspect?.(config);
    return { data, status: 200, statusText: 'OK', headers: {}, config };
  };
}

function failure(status: number, data?: unknown): AxiosAdapter {
  return async (config) => {
    const response = { data, status, statusText: 'Error', headers: {}, config };
    throw new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, undefined, response);
  };
}

test('list uses centralized Axios configuration and normalizes the API URL', async () => {
  const adapter = success([character], (config) => {
    assert.equal(config.baseURL, 'http://api.test/api');
    assert.equal(config.url, '/personagens');
    assert.equal(config.timeout, 15000);
    assert.equal(config.headers.get('Accept'), 'application/json');
    assert.ok(config.signal);
  });
  assert.deepEqual(
    await createPersonagensApi('http://api.test/api///', adapter).list(new AbortController().signal),
    [character],
  );
});

test('details use their own endpoint and query keys are stable', async () => {
  const api = createPersonagensApi('http://api.test/api', success(
    { ...character, idade: 0, data_nascimento: '2000-02-29' },
    (config) => assert.equal(config.url, '/personagens/7'),
  ));
  assert.equal((await api.show(7)).idade, 0);
  assert.deepEqual(personagensQueryKeys.list(), ['personagens', 'list']);
  assert.deepEqual(personagensQueryKeys.detail(7), ['personagens', 'detail', 7]);
});

test('an empty API list stays empty', async () => {
  assert.deepEqual(await createPersonagensApi('http://api.test/api', success([])).list(), []);
});

test('HTTP, validation and network errors have readable messages', async () => {
  await assert.rejects(createPersonagensApi('http://api.test/api', failure(404)).show(7), /não foi encontrado/);
  await assert.rejects(createPersonagensApi('http://api.test/api', failure(500)).list(), /servidor não conseguiu/);
  await assert.rejects(
    createPersonagensApi('http://api.test/api', failure(422, { errors: { nome: ['O nome já está em uso.'] } })).list(),
    /nome já está em uso/,
  );
  const network: AxiosAdapter = async (config) => { throw new AxiosError('Network Error', 'ERR_NETWORK', config); };
  await assert.rejects(createPersonagensApi('http://api.test/api', network).list(), /Não foi possível conectar/);
});

test('invalid response contracts are rejected', async () => {
  for (const payload of ['<html>Error</html>', { data: [character] }, [{ ...character, idade: 'Imortal' }], [null]]) {
    await assert.rejects(createPersonagensApi('http://api.test/api', success(payload)).list(), /inválid/);
  }
});

test('missing configuration does not make a request', async () => {
  const adapter: AxiosAdapter = async () => { assert.fail('Axios should not run'); };
  await assert.rejects(createPersonagensApi('', adapter).list(), /não foi configurada/);
});

test('timeouts are readable and cancellation reaches Axios', async () => {
  const timeout: AxiosAdapter = async (config) => { throw new AxiosError('timeout', 'ECONNABORTED', config); };
  await assert.rejects(createPersonagensApi('http://api.test/api', timeout).list(), /demorou para responder/);

  const waiting: AxiosAdapter = (config) => new Promise((_resolve, reject) => {
    const cancel = () => reject(new CanceledError('canceled', config));
    const signal = config.signal;
    if (signal?.aborted) cancel();
    else signal?.addEventListener?.('abort', cancel, { once: true });
  });
  const controller = new AbortController();
  const result = createPersonagensApi('http://api.test/api', waiting).list(controller.signal);
  controller.abort();
  await assert.rejects(result, { code: 'ERR_CANCELED' });
});

test('photo URLs use the backend, preserve absolute URLs and allow no photo', () => {
  const base = 'http://192.168.1.100:8000/api';
  assert.equal(photoUrl(character, base), null);
  assert.equal(photoUrl({ ...character, imagem: 'personagens/foto.jpg' }, base),
    'http://192.168.1.100:8000/storage/personagens/foto.jpg');
  assert.equal(photoUrl({ ...character, imagem_url: '/storage/personagens/foto.jpg' }, base),
    'http://192.168.1.100:8000/storage/personagens/foto.jpg');
  assert.equal(photoUrl({ ...character, imagem_url: 'https://photos.test/foto.jpg' }, base),
    'https://photos.test/foto.jpg');
  assert.equal(photoUrl({ ...character, imagem_url: 'javascript:alert(1)' }, base), null);
});
