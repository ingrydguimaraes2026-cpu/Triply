import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { procurarLugar, type LugarAchado } from '@together/core'
import { MapPin, Search } from './icones'
import { Campo } from './pecas'
import { cor } from '../../theme'

// Busca de lugar com o ponto no mapa (spec 118f): cidade, praia ou país.
// Espera a pessoa parar de digitar um instante antes de buscar.
export function BuscaDeLugar({ aoEscolher, placeholder = 'Cidade, praia ou país', autoFocus }: { aoEscolher: (l: LugarAchado) => void; placeholder?: string; autoFocus?: boolean }) {
  const [texto, setTexto] = useState('')
  const [achados, setAchados] = useState<LugarAchado[]>([])
  const [buscando, setBuscando] = useState(false)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    const t = texto.trim()
    if (t.length < 2) {
      setAchados([])
      return
    }
    const controle = new AbortController()
    const espera = setTimeout(() => {
      setBuscando(true)
      setErro(false)
      procurarLugar(t, controle.signal)
        .then(setAchados)
        .catch((e) => {
          if (!controle.signal.aborted) {
            console.error('Erro ao buscar lugar:', e)
            setErro(true)
          }
        })
        .finally(() => setBuscando(false))
    }, 350)
    return () => {
      clearTimeout(espera)
      controle.abort()
    }
  }, [texto])

  return (
    <View className="gap-2">
      <Campo
        icone={<Search size={20} color={cor.suave} />}
        direita={buscando ? <ActivityIndicator color={cor.couro} /> : undefined}
        placeholder={placeholder}
        value={texto}
        onChangeText={setTexto}
        autoFocus={autoFocus}
        autoCorrect={false}
        returnKeyType="search"
      />
      {erro ? <Text className="font-body-medium text-[13px] text-vermelho">Não deu pra buscar agora. Confira a internet.</Text> : null}
      {!buscando && !erro && texto.trim().length >= 2 && !achados.length ? <Text className="font-body text-[13px] text-suave">Nada com esse nome. Tente só a cidade.</Text> : null}
      {achados.map((l) => (
        <Pressable
          key={`${l.nome}|${l.latitude}|${l.longitude}`}
          onPress={() => aoEscolher(l)}
          accessibilityRole="button"
          className="min-h-[52px] flex-row items-center gap-3 rounded-2xl bg-cartao px-4 py-2.5 active:opacity-80"
        >
          <MapPin size={20} color={cor.couro} />
          <View className="min-w-0 flex-1">
            <Text className="font-body-bold text-[15px] text-texto" numberOfLines={1}>{l.nome}</Text>
            <Text className="font-body text-[12px] text-suave" numberOfLines={1}>{[l.regiao, l.pais].filter(Boolean).join(', ')}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  )
}
