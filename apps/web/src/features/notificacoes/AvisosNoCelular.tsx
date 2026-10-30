import { useEffect, useState } from 'react'
import { BellRing } from 'lucide-react'
import { buscarPreferenciasDeAviso, marcarPreferenciaDeAviso, TIPOS_DE_AVISO, type TipoAviso } from '@together/core'
import { supabase } from '../../lib/supabase'
import { ehIphone, ligarAvisos, situacaoDoAviso, type SituacaoAviso } from '../cambio/avisos'

// Avisos no celular (specs 032 e 033): liga a notificação neste aparelho e escolhe o que receber.
// Fica no topo da gaveta "Novidades".
export default function AvisosNoCelular({ meuId }: { meuId: string }) {
  const [situacao, setSituacao] = useState<SituacaoAviso | null>(null)
  const [prefs, setPrefs] = useState<Record<TipoAviso, boolean> | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    let ativo = true
    situacaoDoAviso().then((s) => ativo && setSituacao(s))
    buscarPreferenciasDeAviso(supabase)
      .then((p) => ativo && setPrefs(p))
      .catch((e) => console.error('Erro ao buscar as preferências de aviso:', e))
    return () => {
      ativo = false
    }
  }, [])

  async function ligar() {
    setErro(null)
    try {
      await ligarAvisos()
      setSituacao('ligado')
    } catch (e) {
      const motivo = (e as Error).message
      if (motivo === 'negado' || motivo === 'sem-app') setSituacao(motivo)
      else setErro('Não deu pra ligar os avisos neste aparelho.')
    }
  }

  async function trocar(tipo: TipoAviso, ligado: boolean) {
    if (!prefs) return
    setErro(null)
    setPrefs({ ...prefs, [tipo]: ligado })
    try {
      await marcarPreferenciaDeAviso(supabase, meuId, tipo, ligado)
    } catch {
      setPrefs({ ...prefs, [tipo]: !ligado })
      setErro('Não deu pra salvar. Tente de novo.')
    }
  }

  return (
    <section className="avisos-celular" aria-label="Avisos no celular">
      <button type="button" className="avisos-celular-topo" onClick={() => setAberto(!aberto)} aria-expanded={aberto}>
        <BellRing size={18} aria-hidden="true" />
        <span>
          <strong>Avisos no celular</strong>
          <small>{situacao === 'ligado' ? 'Ligados neste aparelho' : 'Lembretes 1 h antes de trajetos e encontros'}</small>
        </span>
        <span className="avisos-celular-seta">{aberto ? 'Fechar' : 'Ajustar'}</span>
      </button>

      {aberto && (
        <div className="avisos-celular-corpo">
          {situacao === 'desligado' && (
            <button type="button" className="botao" onClick={ligar}>
              Ligar avisos neste aparelho
            </button>
          )}
          {situacao === 'negado' && <p className="dica">As notificações estão bloqueadas. Libere nas configurações do navegador.</p>}
          {situacao === 'iphone-instalar' && <p className="dica">No iPhone, instale o app na tela de início (Compartilhar → Adicionar à Tela de Início) pra receber avisos.</p>}
          {situacao === 'sem-suporte' && <p className="dica">{ehIphone() ? 'Atualize o iOS pra receber avisos.' : 'Este navegador não recebe avisos.'}</p>}
          {situacao === 'sem-app' && <p className="dica">Os avisos funcionam no site publicado (não no modo de desenvolvimento).</p>}

          {prefs && (
            <ul className="avisos-celular-lista">
              {TIPOS_DE_AVISO.map((t) => (
                <li key={t.tipo}>
                  <label>
                    <input type="checkbox" checked={prefs[t.tipo]} onChange={(e) => trocar(t.tipo, e.target.checked)} />
                    <span>
                      <strong>{t.nome}</strong>
                      <small>{t.explica}</small>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          {erro && <p className="form-erro">{erro}</p>}
        </div>
      )}
    </section>
  )
}
