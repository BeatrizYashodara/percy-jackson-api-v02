import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef } from 'react';
import { personagensApi } from '../api/personagens';
import { personagensQueryKeys } from '../api/queryKeys';

const listKey = personagensQueryKeys.list();

function useQueryFocus(queryKey: QueryKey, refetch: () => Promise<unknown>) {
  const queryClient = useQueryClient();
  const firstFocus = useRef(true);

  useFocusEffect(useCallback(() => {
    if (firstFocus.current) firstFocus.current = false;
    else void refetch();

    return () => { void queryClient.cancelQueries({ queryKey, exact: true }); };
  }, [queryClient, queryKey, refetch]));
}

export function usePersonagensQuery() {
  const query = useQuery({
    queryKey: listKey,
    queryFn: ({ signal }) => personagensApi.list(signal),
  });
  useQueryFocus(listKey, query.refetch);
  return query;
}

export function usePersonagemQuery(id: number) {
  const queryKey = useMemo(() => personagensQueryKeys.detail(id), [id]);
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => personagensApi.show(id, signal),
  });
  useQueryFocus(queryKey, query.refetch);
  return query;
}

export function useCreatePersonagemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: personagensApi.create,
    onSuccess: async (personagem) => {
      queryClient.setQueryData(personagensQueryKeys.detail(personagem.id), personagem);
      await queryClient.invalidateQueries({ queryKey: listKey, exact: true });
    },
  });
}
