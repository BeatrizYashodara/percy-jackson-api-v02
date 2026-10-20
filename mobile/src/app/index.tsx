import { router } from 'expo-router';
import { CharacterListScreen } from '../features/personagens/screens/CharacterListScreen';

export default function Index() {
  return <CharacterListScreen
    onCreate={() => router.push('/personagens/novo')}
    onSelect={(id) => router.push({ pathname: '/personagens/[id]', params: { id } })}
  />;
}
