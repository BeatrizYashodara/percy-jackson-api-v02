import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { PersonagemForm } from '../src/features/personagens/components/PersonagemForm';
import { CharacterListScreen } from '../src/features/personagens/screens/CharacterListScreen';
import { CharacterDetailScreen } from '../src/features/personagens/screens/CharacterDetailScreen';
import { EditCharacterScreen } from '../src/features/personagens/screens/EditCharacterScreen';
import type { Personagem } from '../src/features/personagens/types/personagem';

const mockUsePersonagensQuery = jest.fn();
const mockUsePersonagemQuery = jest.fn();
const mockCreateMutation = jest.fn();
const mockUpdateMutation = jest.fn();
const mockDeleteMutation = jest.fn();

jest.mock('../src/features/personagens/hooks/usePersonagensQueries', () => ({
  usePersonagensQuery: () => mockUsePersonagensQuery(),
  usePersonagemQuery: () => mockUsePersonagemQuery(),
  useCreatePersonagemMutation: () => mockCreateMutation(),
  useUpdatePersonagemMutation: () => mockUpdateMutation(),
  useDeletePersonagemMutation: () => mockDeleteMutation(),
}));

const personagem: Personagem = {
  id: 7, nome: 'Percy Jackson', descricao: 'Filho de Poseidon', idade: 16,
  data_nascimento: '2000-08-18', poderes: 'Hidrocinese', raca: 'Semideus',
  parentesco_divino: 'Poseidon', imagem: null, imagem_url: null,
};

const idleMutation = (overrides = {}) => ({
  error: null, isPending: false, mutateAsync: jest.fn(), reset: jest.fn(), ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockUsePersonagensQuery.mockReturnValue({ data: [personagem], error: null, isFetching: false, isPending: false, refetch: jest.fn() });
  mockUsePersonagemQuery.mockReturnValue({ data: personagem, error: null, isFetching: false, isPending: false, refetch: jest.fn() });
  mockCreateMutation.mockReturnValue(idleMutation());
  mockUpdateMutation.mockReturnValue(idleMutation());
  mockDeleteMutation.mockReturnValue(idleMutation());
});

test('renderiza loading, lista vazia e a listagem de personagens', async () => {
  mockUsePersonagensQuery.mockReturnValueOnce({ data: undefined, error: null, isFetching: true, isPending: true, refetch: jest.fn() });
  const view = await render(<CharacterListScreen onCreate={jest.fn()} onSelect={jest.fn()} />);
  expect(view.getByText('Carregando personagens…')).toBeTruthy();

  mockUsePersonagensQuery.mockReturnValueOnce({ data: [], error: null, isFetching: false, isPending: false, refetch: jest.fn() });
  await view.rerender(<CharacterListScreen onCreate={jest.fn()} onSelect={jest.fn()} />);
  expect(view.getByText('Nenhum personagem por aqui')).toBeTruthy();
  expect(view.getAllByText('Cadastrar personagem').length).toBeGreaterThan(0);

  mockUsePersonagensQuery.mockReturnValueOnce({ data: [personagem], error: null, isFetching: false, isPending: false, refetch: jest.fn() });
  await view.rerender(<CharacterListScreen onCreate={jest.fn()} onSelect={jest.fn()} />);
  expect(view.getByText('Percy Jackson')).toBeTruthy();
  expect(view.getByText('1 personagens')).toBeTruthy();
});

test('renderiza os detalhes do personagem', async () => {
  const view = await render(<CharacterDetailScreen id={7} onBack={jest.fn()} onDeleted={jest.fn()} onEdit={jest.fn()} />);
  expect(view.getByRole('header', { name: 'Percy Jackson' })).toBeTruthy();
  expect(view.getByText('Filho de Poseidon')).toBeTruthy();
  expect(view.getByText('16 anos')).toBeTruthy();
  expect(view.getByText('18/08/2000')).toBeTruthy();
});

test('valida o cadastro próximo aos campos antes de chamar a API', async () => {
  const onSubmit = jest.fn();
  const view = await render(<PersonagemForm onSubmit={onSubmit} submitLabel="Cadastrar personagem" />);
  await fireEvent.press(view.getByRole('button', { name: 'Cadastrar personagem' }));

  expect(await view.findByText('Informe o nome.')).toBeTruthy();
  expect(view.getByText('Informe a descrição.')).toBeTruthy();
  expect(onSubmit).not.toHaveBeenCalled();
});

test('mostra e bloqueia o formulário durante uma mutation', async () => {
  const view = await render(<PersonagemForm onSubmit={jest.fn()} submitLabel="Cadastrar personagem" submitting submittingLabel="Cadastrando…" />);
  expect(view.getByText('Cadastrando…')).toBeTruthy();
  expect(view.getByRole('button')).toBeDisabled();
  for (const label of ['Nome *', 'Descrição *', 'Idade', 'Data de nascimento', 'Poderes', 'Raça', 'Parentesco divino']) {
    expect(view.getByLabelText(label).props.editable).toBe(false);
  }
});

test('carrega os dados atuais no formulário de edição e exibe seu loading', async () => {
  mockUsePersonagemQuery.mockReturnValueOnce({ data: undefined, error: null, isFetching: true, isPending: true, refetch: jest.fn() });
  const view = await render(<EditCharacterScreen id={7} onBack={jest.fn()} onUpdated={jest.fn()} />);
  expect(view.getByText('Carregando dados do personagem…')).toBeTruthy();

  mockUsePersonagemQuery.mockReturnValueOnce({ data: personagem, error: null, isFetching: false, isPending: false, refetch: jest.fn() });
  await view.rerender(<EditCharacterScreen id={7} onBack={jest.fn()} onUpdated={jest.fn()} />);
  expect(view.getByDisplayValue('Percy Jackson')).toBeTruthy();
  expect(view.getByDisplayValue('16')).toBeTruthy();
  expect(view.getByDisplayValue('2000-08-18')).toBeTruthy();
});

test('exclusão exige confirmação antes de executar a mutation', async () => {
  const mutateAsync = jest.fn().mockResolvedValue(undefined);
  const onDeleted = jest.fn();
  mockDeleteMutation.mockReturnValue(idleMutation({ mutateAsync }));
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const view = await render(<CharacterDetailScreen id={7} onBack={jest.fn()} onDeleted={onDeleted} onEdit={jest.fn()} />);

  await fireEvent.press(view.getByRole('button', { name: 'Excluir' }));
  expect(mutateAsync).not.toHaveBeenCalled();
  const buttons = alert.mock.calls[0][2];
  expect(buttons?.map((button) => button.text)).toEqual(['Cancelar', 'Excluir']);

  await act(async () => { await buttons?.[1].onPress?.(); });
  await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith(7));
  expect(onDeleted).toHaveBeenCalled();
  alert.mockRestore();
});
