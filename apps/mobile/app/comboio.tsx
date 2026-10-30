import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Crown, LogOut, Share2, X } from 'lucide-react-native'
import {
  buscarConvidados,
  buscarConvitesAtivos,
  buscarViagemComDetalhes,
  cancelarConvite,
  ConvidadoNaoViraAdm,
  mudarPapelNoComboio,
  removerDoComboio,
  UltimoAdm,
  type Pessoa,
} from '@together/core'
import { useCarregar } from '../src/dados/useCarregar'
import { useViagemAtual } from '../src/dados/viagemAtual'
import { supabase } from '../src/lib/supabase'
import { convidarProComboio, linkDoConvite } from '../src/lib/convite'
import { StatusBar } from '../src/ui/StatusBar'
import { Avatar, Botao, BotaoRedondo, Cartao, Carregando, ErroNaTela, RotuloDeSecao } from '../src/ui/pecas'
import { cor } from '../theme'

// Comboio (spec 007 no mobile): quem vai, papéis, remover, convites ativos e sair da viagem.
// O banco garante que a viagem nunca fica sem ADM; aqui a tela só explica.

// "2026-11-06T..." → "6/11"
const dataCurta = (iso: string) => {
  const d = new Date(iso)
  return `${d.getDate()}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function Comboio() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { atual, meuId, recarregar: recarregarViagens } = useViagemAtual()
  const carga = useCarregar(
    atual
      ? async () => {
          const [viagem, convidados] = await Promise.all([buscarViagemComDetalhes(supabase, atual.id), buscarConvidados(supabase, atual.id).catch((): string[] => [])])
          const euSouAdm = !!viagem?.membros.some((m) => m.id === meuId && m.papel === 'adm')
          const convites = euSouAdm ? await buscarConvitesAtivos(supabase, atual.id).catch(() => []) : []
          return { viagem, convidados, convites }
        }
      : null,
    [atual?.id, meuId],
  )
  const [menu, setMenu] = useState<string | null>(null) // pessoa com as ações abertas
  const [removendo, setRemovendo] = useState<Pessoa | null>(null)
  const [saindo, setSaindo] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [aviso, setAviso] = useState<{ texto: string; erro: boolean } | null>(null)

  if (!atual) return null
  if (carga.status === 'carregando') return <Carregando />
  if (carga.status === 'erro' || !carga.dados.viagem) return <ErroNaTela aoTentar={carga.recarregar} />
  const { viagem, convidados, convites } = carga.dados
  const membros = [...viagem.membros].sort((a, b) => Number(b.papel === 'adm') - Number(a.papel === 'adm') || a.nome.localeCompare(b.nome))
  const euSouAdm = membros.some((m) => m.id === meuId && m.papel === 'adm')
  const adms = membros.filter((m) => m.papel === 'adm')
  const souUltimoAdm = euSouAdm && adms.length === 1

  // Roda uma ação no banco e recarrega; erro vira frase simples
  async function acao(fazer: () => Promise<unknown>, falhou: string) {
    setOcupado(true)
    setAviso(null)
    try {
      await fazer()
      setMenu(null)
      setRemovendo(null)
      carga.recarregar()
    } catch (e) {
      setAviso({
        erro: true,
        texto:
          e instanceof UltimoAdm
            ? 'A viagem precisa de pelo menos um ADM. Passe o ADM pra alguém antes.'
            : e instanceof ConvidadoNaoViraAdm
              ? 'Quem entrou como convidado precisa criar conta antes de virar ADM.'
              : falhou,
      })
    }
    setOcupado(false)
  }

  async function sair() {
    setOcupado(true)
    setAviso(null)
    try {
      await removerDoComboio(supabase, viagem!.id, meuId)
      recarregarViagens()
      router.replace('/')
    } catch (e) {
      setAviso({ erro: true, texto: e instanceof UltimoAdm ? 'Passe o ADM pra alguém antes de sair.' : 'Não deu pra sair da viagem.' })
      setOcupado(false)
    }
  }

  async function convidar() {
    setAviso(await convidarProComboio(viagem!.id, viagem!.nome))
    carga.recarregar() // o convite novo entra em "Convites ativos"
  }

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: insets.bottom + 40, gap: 12 }}>
        <BotaoRedondo aoTocar={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
          <ArrowLeft size={20} color={cor.texto} />
        </BotaoRedondo>
        <View className="flex-row items-end justify-between gap-3">
          <View className="flex-1">
            <Text className="font-display text-[32px] text-texto">Comboio</Text>
            <Text className="mt-0.5 font-body text-[14px] text-suave">
              {membros.length} {membros.length === 1 ? 'pessoa' : 'pessoas'} em {viagem.nome}
            </Text>
          </View>
          {euSouAdm ? <Botao compacto titulo="Convidar" icone={<Share2 size={17} color="#fff" />} aoTocar={convidar} /> : null}
        </View>
        {aviso ? (
          <Text selectable className={`font-body-medium text-[13px] ${aviso.erro ? 'text-vermelho' : 'text-verde'}`}>
            {aviso.texto}
          </Text>
        ) : null}

        <RotuloDeSecao>Quem vai</RotuloDeSecao>
        <Cartao className="px-4">
          {membros.map((m, i) => {
            const souEu = m.id === meuId
            const convidado = convidados.includes(m.id)
            const aberto = menu === m.id
            return (
              <View key={m.id} className={i > 0 ? 'border-t border-linha' : ''}>
                <Pressable
                  onPress={euSouAdm ? () => setMenu(aberto ? null : m.id) : undefined}
                  disabled={!euSouAdm}
                  accessibilityLabel={euSouAdm ? `Ações de ${m.nome}` : undefined}
                  className="flex-row items-center gap-3 py-3 active:opacity-80"
                >
                  <Avatar nome={m.nome} indice={i} tamanho={40} />
                  <View className="min-w-0 flex-1">
                    <Text className="font-body-bold text-[15px] text-texto" numberOfLines={1}>
                      {m.nome}
                      {souEu ? ' (você)' : ''}
                    </Text>
                    <Text className="font-body text-[12.5px] text-suave">{convidado ? 'Convidado, sem conta' : m.papel === 'adm' ? 'Organiza a viagem' : 'Membro'}</Text>
                  </View>
                  {m.papel === 'adm' ? (
                    <View className="flex-row items-center gap-1 rounded-lg bg-chip px-2 py-1">
                      <Crown size={13} color={cor.caramelo} />
                      <Text className="font-body-bold text-[11px] text-caramelo">ADM</Text>
                    </View>
                  ) : null}
                  {euSouAdm ? <Text className="font-body-bold text-[18px] text-suave">⋯</Text> : null}
                </Pressable>
                {aberto ? (
                  <View className="flex-row flex-wrap gap-2 pb-3">
                    {/* O único ADM não vira membro: o banco recusaria (a viagem precisa de um ADM) */}
                    {m.papel === 'adm' ? (
                      adms.length > 1 ? (
                        <Botao
                        compacto
                        tipo="secundario"
                        titulo="Tornar membro"
                        carregando={ocupado}
                        aoTocar={() => acao(() => mudarPapelNoComboio(supabase, viagem.id, m.id, 'membro'), 'Não deu pra mudar o papel.')}
                      />
                      ) : (
                        <Text className="font-body text-[12.5px] text-suave">Único ADM: pra deixar de ser, torne outra pessoa ADM antes.</Text>
                      )
                    ) : (
                      <Botao
                        compacto
                        tipo="secundario"
                        titulo="Tornar ADM"
                        carregando={ocupado}
                        aoTocar={() => acao(() => mudarPapelNoComboio(supabase, viagem.id, m.id, 'adm'), 'Não deu pra mudar o papel.')}
                      />
                    )}
                    {!souEu ? <Botao compacto tipo="secundario" titulo="Remover" aoTocar={() => setRemovendo(m)} /> : null}
                  </View>
                ) : null}
              </View>
            )
          })}
        </Cartao>

        {removendo ? (
          <Cartao className="gap-3 bg-vermelho-fundo p-4">
            <Text className="font-body-semibold text-[14px] leading-5 text-texto">
              Remover {removendo.nome} da viagem? Os gastos dela continuam nas contas, mas ela perde o acesso.
            </Text>
            <View className="flex-row gap-2.5">
              <View className="flex-1">
                <Botao compacto tipo="secundario" titulo="Manter" aoTocar={() => setRemovendo(null)} />
              </View>
              <View className="flex-1">
                <Botao
                  compacto
                  titulo="Remover"
                  carregando={ocupado}
                  aoTocar={() => acao(() => removerDoComboio(supabase, viagem.id, removendo.id), 'Não deu pra remover essa pessoa.')}
                />
              </View>
            </View>
          </Cartao>
        ) : null}

        {euSouAdm && convites.length > 0 ? (
          <>
            <RotuloDeSecao>Convites ativos</RotuloDeSecao>
            <Cartao className="px-4">
              {convites.map((c, i) => (
                <View key={c.codigo} className={`flex-row items-center gap-3 py-3 ${i > 0 ? 'border-t border-linha' : ''}`}>
                  <View className="min-w-0 flex-1">
                    <Text className="font-body-medium text-[13px] text-texto" numberOfLines={1}>
                      {linkDoConvite(c.codigo)}
                    </Text>
                    <Text className="font-body text-[12px] text-suave">Vale até {dataCurta(c.expiraEm)}</Text>
                  </View>
                  <Pressable
                    onPress={() => acao(() => cancelarConvite(supabase, c.codigo), 'Não deu pra cancelar o convite.')}
                    accessibilityLabel="Cancelar convite"
                    className="h-9 flex-row items-center gap-1 rounded-xl bg-areia px-2.5 active:opacity-80"
                  >
                    <X size={15} color={cor.vermelho} />
                    <Text className="font-body-bold text-[12.5px] text-vermelho">Cancelar</Text>
                  </Pressable>
                </View>
              ))}
            </Cartao>
          </>
        ) : null}

        {/* Sair: o último ADM precisa passar o ADM antes (o banco também confere) */}
        <View className="mt-4">
          {saindo ? (
            <Cartao className="gap-3 bg-vermelho-fundo p-4">
              <Text className="font-body-semibold text-[14px] leading-5 text-texto">Sair de {viagem.nome}? Você perde o acesso até alguém te convidar de novo.</Text>
              <View className="flex-row gap-2.5">
                <View className="flex-1">
                  <Botao compacto tipo="secundario" titulo="Ficar" aoTocar={() => setSaindo(false)} />
                </View>
                <View className="flex-1">
                  <Botao compacto titulo="Sair" carregando={ocupado} aoTocar={sair} />
                </View>
              </View>
            </Cartao>
          ) : souUltimoAdm ? (
            <Text className="text-center font-body text-[13px] leading-5 text-suave">
              {membros.length === 1
                ? 'Você é a única pessoa da viagem. Pra apagar a viagem, use o site.'
                : 'Você é o único ADM. Pra sair, torne outra pessoa ADM antes.'}
            </Text>
          ) : (
            <Pressable onPress={() => setSaindo(true)} className="flex-row items-center justify-center gap-2 py-3 active:opacity-80">
              <LogOut size={17} color={cor.vermelho} />
              <Text className="font-body-bold text-[14px] text-vermelho">Sair da viagem</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
