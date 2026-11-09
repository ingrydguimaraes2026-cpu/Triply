import { RefreshControl } from 'react-native'
import { cor } from '../../theme'

// "Puxar pra atualizar": arrastar a tela pra baixo busca tudo de novo no banco.
// Uso: <ScrollView refreshControl={puxarPraAtualizar(carga)}>, com a `carga` do useCarregar.
// Serve pra ver na hora o que a galera lançou no celular dela.
export function puxarPraAtualizar({ atualizando, recarregar }: { atualizando: boolean; recarregar: () => void }) {
  return <RefreshControl refreshing={atualizando} onRefresh={recarregar} tintColor={cor.couro} colors={[cor.couro]} />
}
