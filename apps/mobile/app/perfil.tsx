import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { StatusBar } from '../src/ui/StatusBar'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, BriefcaseBusiness, ChevronRight, Compass, LogOut, UserPlus, Users } from '../src/ui/icones'
import { useViagemAtual } from '../src/dados/viagemAtual'
import { useSessao } from '../src/lib/sessao'
import { supabase } from '../src/lib/supabase'
import { Norti } from '../src/ui/Norti'
import { AvisosNoCelular } from '../src/ui/AvisosNoCelular'
import { ExcluirConta } from '../src/ui/ExcluirConta'
import { esquecerEsteAparelho } from '../src/lib/avisos'
import { Avatar, BotaoRedondo, Cartao, IconeQuadrado, TituloDaTela } from '../src/ui/pecas'
import { cor } from '../theme'
import { verTourDeNovo } from '../src/ui/tour/Tour'

// Perfil: quem sou, quantas viagens e com quantas pessoas, e o botão de sair.
export default function Perfil() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { sessao, ehConvidado } = useSessao()
  const { viagens, meuId, atual } = useViagemAtual()
  const eu = viagens.flatMap((v) => v.membros).find((m) => m.id === meuId)
  const nome = eu?.nome ?? sessao?.user.email?.split('@')[0] ?? 'Viajante'
  const companheiros = new Set(viagens.flatMap((v) => v.membros.map((m) => m.id)).filter((id) => id !== meuId)).size

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 40, gap: 16 }}>
        {/* Spec 117: o Perfil saiu da barra de abas e abre pelo avatar do Início */}
        <View className="flex-row">
          <BotaoRedondo aoTocar={() => (router.canGoBack() ? router.back() : router.replace('/'))} rotulo="Voltar">
            <ArrowLeft size={20} color={cor.texto} />
          </BotaoRedondo>
        </View>
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
          <Numero Icone={Users} valor={companheiros} rotulo="na galera" />
        </View>

        {/* Spec 110: lembretes e outros avisos no celular */}
        {sessao ? <AvisosNoCelular meuId={meuId} /> : null}

        <View className="items-center gap-2 py-4">
          <Norti tamanho={96} />
          <Text className="text-center font-body text-[14px] text-corpo">A Norti aponta o caminho da viagem pra vocês.</Text>
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

        {/* Tour guiado (src/ui/tour/Tour.tsx): marca como não visto e abre a viagem, onde ele começa sozinho */}
        {atual ? (
          <Pressable
            onPress={async () => {
              await verTourDeNovo()
              router.push(`/viagem/${atual.id}`)
            }}
            accessibilityRole="button"
            className="active:opacity-90"
          >
            <Cartao className="flex-row items-center gap-3 p-4">
              <IconeQuadrado>
                <Compass size={20} color={cor.couro} />
              </IconeQuadrado>
              <Text className="flex-1 font-body-bold text-[15px] text-texto">Ver o tour de novo</Text>
              <ChevronRight size={20} color={cor.suave} />
            </Cartao>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sair da conta"
          onPress={() => {
            const sairDeVez = async () => {
              await esquecerEsteAparelho().catch((e) => console.error('Erro ao esquecer o aparelho:', e))
              await supabase.auth.signOut()
              router.replace('/comecar')
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

        {/* Spec 089: excluir a conta sem precisar do site (a App Store e o Google Play exigem) */}
        {sessao ? <ExcluirConta usuarioId={sessao.user.id} /> : null}
      </ScrollView>
      {/* Android (reteste r3b): ao rolar, o conteúdo passava por baixo do relógio. Faixa fixa na cor
          do fundo atrás da barra de status (igual à lista de viagens), sem receber toque. */}
      <View pointerEvents="none" className="absolute left-0 right-0 top-0 bg-fundo" style={{ height: insets.top }} />
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
