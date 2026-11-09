import { Pressable, Text, View } from 'react-native'
import { ChevronLeft, ChevronRight } from './icones'
import { nomeDoMes } from '../lib/formato'
import { cor } from '../../theme'

// Calendário de ida e volta: toque na ida e depois na volta (Nova viagem e Configurações).
export function Calendario({
  mes,
  setMes,
  ida,
  volta,
  aoTocar,
  liberarPassado = false,
}: {
  mes: Date
  setMes: (d: Date) => void
  ida: Date | null
  volta: Date | null
  aoTocar: (d: Date) => void
  liberarPassado?: boolean // nas Configurações a viagem pode já ter começado
}) {
  const primeiroDia = mes.getDay()
  const diasNoMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()
  const celulas: (Date | null)[] = [...Array(primeiroDia).fill(null), ...Array.from({ length: diasNoMes }, (_, i) => new Date(mes.getFullYear(), mes.getMonth(), i + 1))]
  const mesmo = (a: Date | null, b: Date) => !!a && a.getTime() === b.getTime()
  const mudar = (delta: number) => setMes(new Date(mes.getFullYear(), mes.getMonth() + delta, 1))
  // Na viagem nova, dias que já passaram ficam apagados: não dá pra viajar pra trás
  const agora = new Date()
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())

  return (
    <View className="rounded-2xl bg-cartao px-4 py-5" style={{ boxShadow: '0 4px 14px rgba(74,46,20,0.06)' }}>
      <View className="flex-row items-center justify-between px-1 pb-3.5">
        <Text className="font-display text-[18px] text-texto">{nomeDoMes(mes.getMonth(), mes.getFullYear())}</Text>
        <View className="flex-row gap-4">
          <Pressable onPress={() => mudar(-1)} hitSlop={8}>
            <ChevronLeft size={20} color={cor.suave} />
          </Pressable>
          <Pressable onPress={() => mudar(1)} hitSlop={8}>
            <ChevronRight size={20} color={cor.suave} />
          </Pressable>
        </View>
      </View>
      <View className="mb-1.5 flex-row">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((l, i) => (
          <Text key={i} className="flex-1 text-center font-body-semibold text-[12px] text-suave">
            {l}
          </Text>
        ))}
      </View>
      <View className="flex-row flex-wrap">
        {celulas.map((d, i) => {
          if (!d) return <View key={i} style={{ width: `${100 / 7}%`, height: 42 }} />
          const ponta = mesmo(ida, d) || mesmo(volta, d)
          const dentro = !!(ida && volta && d > ida && d < volta)
          const faixa = !!(ida && volta && (dentro || (mesmo(ida, d) && volta.getTime() !== ida.getTime()) || mesmo(volta, d)))
          const passou = !liberarPassado && d < hoje
          return (
            <Pressable
              key={i}
              onPress={() => aoTocar(d)}
              disabled={passou}
              className="items-center justify-center"
              style={{
                width: `${100 / 7}%`,
                height: 42,
                marginVertical: 2,
                backgroundColor: faixa ? '#F1E2CB' : 'transparent',
                borderTopLeftRadius: mesmo(ida, d) ? 12 : 0,
                borderBottomLeftRadius: mesmo(ida, d) ? 12 : 0,
                borderTopRightRadius: mesmo(volta, d) ? 12 : 0,
                borderBottomRightRadius: mesmo(volta, d) ? 12 : 0,
              }}
            >
              <View className={`h-[38px] w-[38px] items-center justify-center rounded-xl ${ponta ? 'bg-couro' : ''}`}>
                <Text className={`text-[14px] ${ponta ? 'font-body-bold text-white' : passou ? 'font-body text-tracejado' : 'font-body-medium text-texto'}`}>{d.getDate()}</Text>
              </View>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
