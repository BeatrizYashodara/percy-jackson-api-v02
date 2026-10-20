export const personagensQueryKeys = {
  all: ['personagens'] as const,
  list: () => [...personagensQueryKeys.all, 'list'] as const,
  detail: (id: number) => [...personagensQueryKeys.all, 'detail', id] as const,
};
