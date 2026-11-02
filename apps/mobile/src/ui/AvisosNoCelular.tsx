import { useEffect, useState } from 'react'
import { Linking, Switch, Text, View } from 'react-native'
import { Bell } from 'lucide-react-native'
import { buscarPreferenciasDeAviso, marcarPreferenciaDeAviso, TIPOS_DE_AVISO, type TipoAviso } from '@together/core'
import { estadoDosAvisos, ligarAvisos, type EstadoDosAvisos } from '../lib/avisos'
import { supabase } from '../lib/supabase'
import { Botao, Cartao, IconeQuadrado } from './pecas'
import { cor } from '../../theme'

const EXPLICA: Record<EstadoDosAvisos, string> = {
  ligado: 'Este celular recebe os avisos do comboio.',
  pedir: 'Ligue pra receber lembretes 1 hora antes de cada trajeto e encontro.',
  bloqueado: 'As notificações do Tripwave estão bloqueadas nos ajustes do celular.',
  'sem-suporte': 'Os avisos chegam só no app instalado no celular. No navegador, use o site.',
  'sem-projeto': 'Os avisos ainda não estão prontos nesta versão do app.',
}

// Spec 110 (+ 033): ligar os avisos neste celular e escolher quais receber.
export function AvisosNoCelular({ meuId }: { meuId: string }) {
  const [estado, setEstado] = useState<EstadoDosAvisos | null>(null)
  const [prefs, setPrefs] = useState<Record<TipoAviso, boolean> | null>(null)
  const [ligando, setLigando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    estadoDosAvisos()
      .then(setEstado)
      .catch(() => setEstado('sem-suporte'))
    buscarPreferenciasDeAviso(supabase)
      .then(setPrefs)
      .catch(() => setPrefs(null))
  }, [])

  async function ligar() {
    setLigando(true)
    setErro(null)
    try {
      setEstado(await ligarAvisos())
    } catch (e) {
      console.error('Erro ao ligar os avisos:', e)
      setErro('Não deu pra ligar agora. Tente de novo.')
    }
    setLigando(false)
  }

  async function trocar(tipo: TipoAviso, ligado: boolean) {
    if (!prefs) return
    setPrefs({ ...prefs, [tipo]: ligado })
    try {
      await marcarPreferenciaDeAviso(supabase, meuId, tipo, ligado)
    } catch {
      setPrefs({ ...prefs, [tipo]: !ligado }) // desfaz
      setErro('Não deu pra salvar a escolha.')
    }
  }

  if (!estado) return null

  return (
    <Cartao className="gap-3 p-4">
      <View className="flex-row items-center gap-3">
        <IconeQuadrado>
          <Bell size={20} color={cor.couro} />
        </IconeQuadrado>
        <View className="flex-1">
          <Text className="font-body-bold text-[15px] text-texto">Avisos no celular</Text>
          <Text className="font-body text-[12.5px] leading-5 text-suave">{EXPLICA[estado]}</Text>
        </View>
      </View>
      {estado === 'pedir' ? <Botao compacto titulo="Ligar avisos" carregando={ligando} aoTocar={ligar} /> : null}
      {estado === 'bloqueado' ? <Botao compacto tipo="secundario" titulo="Abrir ajustes" aoTocar={() => Linking.openSettings()} /> : null}
      {/* As escolhas valem pro site e pro app (ficam na conta) */}
      {prefs && (estado === 'ligado' || estado === 'sem-suporte')
        ? TIPOS_DE_AVISO.map((t) => (
            <View key={t.tipo} className="flex-row items-center gap-3 border-t border-linha pt-3">
              <View className="flex-1">
                <Text className="font-body-semibold text-[14px] text-texto">{t.nome}</Text>
                <Text className="font-body text-[12px] text-suave">{t.explica}</Text>
              </View>
              <Switch
                value={prefs[t.tipo]}
                onValueChange={(v) => trocar(t.tipo, v)}
                trackColor={{ true: cor.caramelo, false: cor.borda }}
                thumbColor="#fff"
                {...({ activeThumbColor: '#fff' } as object)} // no navegador o thumbColor não vale pro ligado
                accessibilityLabel={t.nome}
              />
            </View>
          ))
        : null}
      {erro ? <Text className="font-body-medium text-[13px] text-vermelho">{erro}</Text> : null}
    </Cartao>
  )
}
