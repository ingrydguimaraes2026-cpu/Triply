import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { StatusBar } from '../../src/ui/StatusBar'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BriefcaseBusiness, ChevronRight, LogOut, UserPlus, Users } from 'lucide-react-native'
import { useViagemAtual } from '../../src/dados/viagemAtual'
import { useSessao } from '../../src/lib/sessao'
import { supabase } from '../../src/lib/supabase'
import { Malinha } from '../../src/ui/Malinha'
import { Avatar, Cartao, IconeQuadrado, TituloDaTela } from '../../src/ui/pecas'
import { cor } from '../../theme'

// Perfil: quem sou, quantas viagens e com quantas pessoas, e o botão de sair.
export default function Perfil() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { sessao, ehConvidado } = useSessao()
  const { viagens, meuId } = useViagemAtual()
  const eu = viagens.flatMap((v) => v.membros).find((m) => m.id === meuId)
  const nome = eu?.nome ?? sessao?.user.email?.split('@')[0] ?? 'Viajante'
  const companheiros = new Set(viagens.flatMap((v) => v.membros.map((m) => m.id)).filter((id) => id !== meuId)).size

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 40, gap: 16 }}>
        <TituloDaTela titulo="Perfil" />

        <Cartao className="flex-row items-center gap-4 p-5">
          <Avatar nome={nome} indice={5} tamanho={64} />
          <View className="flex-1">
            <Text className="font-display text-[24px] text-texto">{nome}</Text>
            <Text className="font-body text-[13px] text-suave">{ehConvidado ? 'Convidado, ainda sem conta' : sessao?.user.email}</Text>
          </View>
        </Cartao>

        <View className="flex-row gap-2.5">
          <Numero Icone={BriefcaseBusiness} valor={viagens.length} rotulo={viagens.length === 1 ? 'viagem' : 'viagens'} />
          <Numero Icone={Users} valor={companheiros} rotulo={companheiros === 1 ? 'companheiro' : 'companheiros'} />
        </View>

        <View className="items-center gap-2 py-4">
          <Malinha tamanho={96} />
          <Text className="text-center font-body text-[14px] text-corpo">A Malinha guarda tudo da viagem pra vocês.</Text>
        </View>

        {ehConvidado ? (
          <Pressable onPress={() => router.push('/criar-conta')} className="active:opacity-90">
            <Cartao className="flex-row items-center gap-3 p-4">
              <IconeQuadrado>
                <UserPlus size={20} color={cor.couro} />
              </IconeQuadrado>
              <View className="flex-1">
                <Text className="font-body-bold text-[15px] text-texto">Criar conta</Text>
                <Text className="font-body text-[12px] text-suave">Pra não perder o acesso às viagens</Text>
              </View>
              <ChevronRight size={20} color={cor.suave} />
            </Cartao>
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => {
            const sairDeVez = async () => {
              await supabase.auth.signOut()
              router.replace('/boas-vindas')
            }
            if (!ehConvidado) return sairDeVez()
            // Convidado sem conta que sai não consegue voltar: avisa antes
            const aviso = 'Você está como convidado. Se sair, perde o acesso às viagens.'
            if (Platform.OS === 'web') {
              if (window.confirm(`${aviso} Sair mesmo assim?`)) sairDeVez()
            } else {
              Alert.alert('Sair sem conta?', aviso, [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sair', style: 'destructive', onPress: sairDeVez },
              ])
            }
          }}
          className="active:opacity-90"
        >
          <Cartao className="flex-row items-center gap-3 p-4">
            <IconeQuadrado>
              <LogOut size={20} color={cor.vermelho} />
            </IconeQuadrado>
            <Text className="flex-1 font-body-bold text-[15px] text-vermelho">Sair da conta</Text>
            <ChevronRight size={20} color={cor.suave} />
          </Cartao>
        </Pressable>
      </ScrollView>
    </View>
  )
}

function Numero({ Icone, valor, rotulo }: { Icone: typeof Users; valor: number; rotulo: string }) {
  return (
    <Cartao className="flex-1 gap-3 p-4">
      <IconeQuadrado>
        <Icone size={22} color={cor.couro} />
      </IconeQuadrado>
      <View>
        <Text className="font-display text-[26px] text-texto">{valor}</Text>
        <Text className="font-body text-[13px] text-suave">{rotulo}</Text>
      </View>
    </Cartao>
  )
}
