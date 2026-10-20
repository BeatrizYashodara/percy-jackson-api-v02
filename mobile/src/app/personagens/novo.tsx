import { router } from 'expo-router';

import { CreateCharacterScreen } from '../../features/personagens/screens/CreateCharacterScreen';

export default function NewCharacter() {
  const back = () => router.canGoBack() ? router.back() : router.replace('/');

  return <CreateCharacterScreen
    onBack={back}
    onCreated={(id) => router.replace({ pathname: '/personagens/[id]', params: { id } })}
  />;
}
