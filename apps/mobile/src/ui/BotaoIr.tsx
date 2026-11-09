import { useState } from 'react'
import { Linking, Modal, Platform, Pressable, Text, View } from 'react-native'
import { Bus, Car, Footprints, Map as IconeMapa, Navigation } from './icones'
import { linksComoChegar, linksDeCorrida, linksDeNavegacao, textoDoAlvo, type Alvo } from '@together/core'
import { cor } from '../../theme'

// "Como chegar" (specs 040 e 121b): uma gaveta com transporte público, a pé, de carro e Uber,
// sempre com o destino preenchido. Nada é cadastrado: só abre o app certo.
export function BotaoIr({ alvo, corrida = true, rotulo = 'Como chegar' }: { alvo: Alvo; corrida?: boolean; rotulo?: string }) {
  const [aberto, setAberto] = useState(false)
  const [publico, aPe, deCarro] = linksComoChegar(alvo)
  const uber = linksDeCorrida(alvo).find((l) => l.chave === 'uber')
  const apple = linksDeNavegacao(alvo).find((l) => l.chave === 'apple')
  const opcoes = [
    { chave: 'publico', nome: 'Transporte público', Icone: Bus, url: publico.url },
    { chave: 'a_pe', nome: 'A pé', Icone: Footprints, url: aPe.url },
    { chave: 'carro', nome: 'De carro', Icone: Navigation, url: deCarro.url },
    ...(corrida && uber ? [{ chave: 'uber', nome: 'Pedir Uber', Icone: Car, url: uber.url }] : []),
    ...(Platform.OS === 'ios' && apple ? [{ chave: 'apple', nome: 'Apple Mapas', Icone: IconeMapa, url: apple.url }] : []),
  ]

  function abrir(url: string) {
    setAberto(false)
    void Linking.openURL(url)
  }

  return (
    <>
      <Pressable
        onPress={() => setAberto(true)}
        accessibilityRole="button"
        accessibilityLabel={`${rotulo}: ${alvo.nome}`}
        className="flex-row items-center gap-1.5 self-start rounded-xl bg-chip px-3 py-2 active:opacity-80"
      >
        <Navigation size={15} color={cor.couro} />
        <Text className="font-body-bold text-[13px] text-couro">{rotulo}</Text>
      </Pressable>
      <Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
        <Pressable onPress={() => setAberto(false)} className="flex-1 justify-end bg-black/50">
          <Pressable className="gap-2 rounded-t-3xl bg-fundo px-5 pb-10 pt-5">
            <Text className="font-display text-[22px] text-texto" numberOfLines={1}>
              Ir até {alvo.nome}
            </Text>
            <Text className="mb-1 font-body text-[13px] text-suave" numberOfLines={2}>
              {textoDoAlvo(alvo)}
            </Text>
            {opcoes.map((o) => (
              <Pressable
                key={o.chave}
                onPress={() => abrir(o.url)}
                accessibilityRole="link"
                className="min-h-[52px] flex-row items-center gap-3 rounded-2xl border border-borda bg-cartao px-4 active:opacity-80"
              >
                <o.Icone size={20} color={cor.couro} />
                <Text className="font-body-bold text-[15px] text-texto">{o.nome}</Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}
