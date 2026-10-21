import type { QueryClient } from '@tanstack/react-query';

import type { Personagem } from '../types/personagem.ts';
import { personagensQueryKeys } from './queryKeys.ts';

export async function cacheSavedPersonagem(queryClient: QueryClient, personagem: Personagem) {
  queryClient.setQueryData(personagensQueryKeys.detail(personagem.id), personagem);
  await queryClient.invalidateQueries({ queryKey: personagensQueryKeys.list(), exact: true });
}

export async function cacheDeletedPersonagem(queryClient: QueryClient, id: number) {
  queryClient.removeQueries({ queryKey: personagensQueryKeys.detail(id), exact: true });
  await queryClient.invalidateQueries({ queryKey: personagensQueryKeys.list(), exact: true });
}
