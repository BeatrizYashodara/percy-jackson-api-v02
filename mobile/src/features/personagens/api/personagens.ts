import { isAxiosError, isCancel, type AxiosAdapter, type AxiosError, type AxiosInstance } from 'axios';
import { API_URL } from '../../../config/api.ts';
import { apiClient, createApiClient, isValidApiUrl, normalizeApiUrl } from '../../../lib/apiClient.ts';
import type { Personagem } from '../types/personagem.ts';
import type { PersonagemFormData } from '../schemas/personagemFormSchema.ts';

export type CreatePersonagemPayload = {
  nome: string;
  descricao: string;
  idade?: number;
  data_nascimento?: string;
  poderes?: string;
  raca?: string;
  parentesco_divino?: string;
};

export function createPersonagemPayload(values: PersonagemFormData): CreatePersonagemPayload {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== null && value !== ''),
  ) as CreatePersonagemPayload;
}

export class ApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function parsePersonagem(value: unknown): Personagem {
  if (!value || typeof value !== 'object') throw new ApiError('O servidor retornou dados inválidos.');
  const item = value as Record<string, unknown>;
  const textFields = ['data_nascimento', 'poderes', 'raca', 'parentesco_divino', 'imagem', 'imagem_url'];
  if (
    !Number.isInteger(item.id) || (item.id as number) < 1 ||
    typeof item.nome !== 'string' || typeof item.descricao !== 'string' ||
    !(item.idade === null || (Number.isInteger(item.idade) && (item.idade as number) >= 0)) ||
    textFields.some((field) => item[field] !== null && typeof item[field] !== 'string')
  ) throw new ApiError('O servidor retornou dados inválidos.');
  return item as Personagem;
}

function validationMessage(error: AxiosError): string | null {
  const data = error.response?.data;
  if (!data || typeof data !== 'object') return null;
  const errors = (data as { errors?: unknown }).errors;
  if (!errors || typeof errors !== 'object') return null;
  for (const messages of Object.values(errors)) {
    if (Array.isArray(messages) && typeof messages[0] === 'string') return messages[0];
  }
  return null;
}

export function readableApiError(error: unknown): Error {
  if (error instanceof ApiError || isCancel(error)) return error;
  if (!isAxiosError(error)) return new ApiError('Não foi possível processar a resposta da API.');

  const status = error.response?.status;
  if (status === 404) return new ApiError('Este personagem não foi encontrado.', status);
  if (status === 422) {
    return new ApiError(validationMessage(error) || 'Confira os campos informados e tente novamente.', status);
  }
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new ApiError('O servidor demorou para responder. Tente novamente.');
  }
  if (!error.response || error.code === 'ERR_NETWORK') {
    return new ApiError('Não foi possível conectar à API. Verifique sua conexão e tente novamente.');
  }
  if (status && status >= 500) {
    return new ApiError('O servidor não conseguiu atender à solicitação. Tente novamente.', status);
  }
  return new ApiError('Não foi possível concluir a solicitação. Tente novamente.', status);
}

function buildPersonagensApi(client: AxiosInstance, baseUrl: string) {
  async function get(path: string, signal?: AbortSignal): Promise<unknown> {
    if (!isValidApiUrl(baseUrl)) throw new ApiError('A conexão com o servidor ainda não foi configurada.');
    try {
      return (await client.get(path, { signal })).data;
    } catch (error) {
      throw readableApiError(error);
    }
  }

  async function post(path: string, body: unknown): Promise<unknown> {
    if (!isValidApiUrl(baseUrl)) throw new ApiError('A conexão com o servidor ainda não foi configurada.');
    try {
      return (await client.post(path, body)).data;
    } catch (error) {
      throw readableApiError(error);
    }
  }

  async function patch(path: string, body: unknown): Promise<unknown> {
    if (!isValidApiUrl(baseUrl)) throw new ApiError('A conexão com o servidor ainda não foi configurada.');
    try {
      return (await client.patch(path, body)).data;
    } catch (error) {
      throw readableApiError(error);
    }
  }

  return {
    async list(signal?: AbortSignal): Promise<Personagem[]> {
      const data = await get('/personagens', signal);
      if (!Array.isArray(data)) throw new ApiError('O servidor retornou uma lista inválida.');
      return data.map(parsePersonagem);
    },
    async show(id: number, signal?: AbortSignal): Promise<Personagem> {
      return parsePersonagem(await get(`/personagens/${id}`, signal));
    },
    async create(values: PersonagemFormData): Promise<Personagem> {
      return parsePersonagem(await post('/personagens', createPersonagemPayload(values)));
    },
    async update(id: number, values: PersonagemFormData): Promise<Personagem> {
      return parsePersonagem(await patch(`/personagens/${id}`, createPersonagemPayload(values)));
    },
  };
}

export function createPersonagensApi(baseUrl: string, adapter?: AxiosAdapter, timeoutMs?: number) {
  const normalized = normalizeApiUrl(baseUrl);
  return buildPersonagensApi(createApiClient(normalized, adapter, timeoutMs), normalized);
}

export function photoUrl(personagem: Personagem, baseUrl = API_URL): string | null {
  const value = personagem.imagem_url || (personagem.imagem ? `storage/${personagem.imagem}` : null);
  if (!value) return null;
  try {
    const backend = `${baseUrl.replace(/\/+$/, '').replace(/\/api$/, '')}/`;
    const url = new URL(value, backend);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export const personagensApi = buildPersonagensApi(apiClient, API_URL);
