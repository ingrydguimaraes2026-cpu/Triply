import { useEffect, useRef } from 'react'
import { useRouter, type Href } from 'expo-router'
import * as Notifications from 'expo-notifications'
import { useViagemAtual } from '../dados/viagemAtual'
import { estadoDosAvisos, ligarAvisos, telaDoAviso, type DadosDoAviso } from '../lib/avisos'

// Fica na raiz do app (só no celular, não no navegador). Faz duas coisas:
// 1. Quem já ligou os avisos tem o token salvo de novo ao abrir (o token pode mudar).
// 2. Tocar num aviso abre a tela certa, já na viagem do aviso (spec 110).
export function AbrirAvisos() {
  const router = useRouter()
  const { escolher, meuId } = useViagemAtual()
  const resposta = Notifications.useLastNotificationResponse()
  const tratada = useRef<string | null>(null)

  useEffect(() => {
    if (!meuId) return
    estadoDosAvisos()
      .then((estado) => (estado === 'ligado' ? ligarAvisos() : null))
      .catch((e) => console.error('Erro ao renovar o token de aviso:', e))
  }, [meuId])

  useEffect(() => {
    if (!resposta) return
    const id = resposta.notification.request.identifier
    if (tratada.current === id) return
    tratada.current = id
    const dados = resposta.notification.request.content.data as DadosDoAviso
    const tela = telaDoAviso(dados)
    if (!tela || !dados.viagemId) return
    escolher(dados.viagemId)
    router.push(tela as Href)
  }, [resposta, escolher, router])

  return null
}
