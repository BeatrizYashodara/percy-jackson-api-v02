import { router, useLocalSearchParams } from 'expo-router';

import { RequestState } from '../../../features/personagens/components/RequestState';
import { EditCharacterScreen } from '../../../features/personagens/screens/EditCharacterScreen';

export default function EditCharacter() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const characterId = Number(id);
  const back = () => router.canGoBack() ? router.back() : router.replace('/');

  if (!Number.isSafeInteger(characterId) || characterId < 1) {
    return <RequestState error="Este personagem não foi encontrado." onRetry={back} />;
  }

  return <EditCharacterScreen
    id={characterId}
    onBack={back}
    onUpdated={(updatedId) => router.replace({ pathname: '/personagens/[id]', params: { id: updatedId } })}
  />;
}
