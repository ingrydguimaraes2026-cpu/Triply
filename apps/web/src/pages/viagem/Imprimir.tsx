import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, Printer } from 'lucide-react'
import { buscarFichasDoComboio, roteiroDiaADia, type FichaNoComboio } from '@together/core'
import { supabase } from '../../lib/supabase'
import { useViagemAtual } from '../../features/viagens/hooks'
import { useTrajetos } from '../../features/transportes/hooks'
import { meio } from '../../features/transportes/api'
import { diaPorExtenso, useEventosDaAgenda } from '../../features/agenda/hooks'
import { useHospedagem } from '../../features/hospedagem/hooks'
import { formatarPeriodo, formatarData } from '../../lib/datas'
import Logo from '../../components/ui/Logo'
import './imprimir.css'

// Spec 088: a viagem numa página pra imprimir ou salvar em PDF (Imprimir → "Salvar como PDF").
// Roteiro dia a dia, transportes, hospedagens escolhidas e contatos do comboio.
export default function Imprimir() {
  const { viagem, destinos, membros, meuId } = useViagemAtual()
  const { estado } = useTrajetos(viagem.id)
  const { eventos } = useEventosDaAgenda(viagem.id)
  const { itens: hospedagens } = useHospedagem(viagem.id, destinos, meuId, membros.length)
  const [fichas, setFichas] = useState<FichaNoComboio[]>([])
  // Wi-Fi e código da porta só entram se a pessoa pedir (o PDF costuma ir pra família)
  const [comSegredos, setComSegredos] = useState(false)

  useEffect(() => {
    buscarFichasDoComboio(supabase, viagem.id)
      .then(setFichas)
      .catch(() => setFichas([]))
  }, [viagem.id])

  const trajetos = useMemo(() => (estado.status === 'pronto' ? estado.trajetos : []), [estado])
  const dias = useMemo(
    () => roteiroDiaADia(viagem.data_inicio, viagem.data_fim, { destinos, trajetos, eventos: eventos ?? [] }),
    [viagem.data_inicio, viagem.data_fim, destinos, trajetos, eventos],
  )
  const escolhidas = hospedagens.filter((h) => h.escolhida)
  const nomeDe = (id: string | null) => destinos.find((d) => d.id === id)?.nome ?? '?'
  const hora = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="imprimir">
      <div className="imprimir-barra">
        <Link to={`/viagem/${viagem.id}`} className="botao-texto">
          <ArrowLeft size={16} aria-hidden="true" /> Voltar
        </Link>
        <Link to={`/viagem/${viagem.id}/livro`} className="botao-texto">
          Livro com diário e fotos →
        </Link>
        <label className="imprimir-opcao">
          <input type="checkbox" checked={comSegredos} onChange={(e) => setComSegredos(e.target.checked)} /> Incluir Wi-Fi e código da porta
        </label>
        <button type="button" className="botao" onClick={() => window.print()}>
          <Printer size={16} aria-hidden="true" /> Imprimir ou salvar PDF
        </button>
      </div>

      <header className="imprimir-topo">
        <Logo />
        <h1>{viagem.nome}</h1>
        <p>
          {formatarPeriodo(viagem.data_inicio, viagem.data_fim)} · {destinos.map((d) => d.nome).join(' → ')}
        </p>
      </header>

      <section>
        <h2>Roteiro dia a dia</h2>
        {dias.length === 0 ? (
          <p className="imprimir-vazio">Ainda sem datas ou sem nada na agenda.</p>
        ) : (
          dias.map((d) => (
            <div key={d.dia} className="imprimir-dia">
              <h3>
                {diaPorExtenso(d.dia)}
                {d.onde && <small> · {d.onde.nome}</small>}
              </h3>
              <ul>
                {d.itens.map((i) => (
                  <li key={i.chave}>
                    <span className="imprimir-hora">{i.hora || '—'}</span>
                    <span>
                      {i.titulo}
                      {i.detalhe && <small> · {i.detalhe}</small>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      {trajetos.length > 0 && (
        <section>
          <h2>Transportes</h2>
          <table>
            <thead>
              <tr>
                <th>Trecho</th>
                <th>Meio</th>
                <th>Partida</th>
                <th>Chegada</th>
                <th>Obs.</th>
              </tr>
            </thead>
            <tbody>
              {trajetos.map((t) => (
                <tr key={t.id}>
                  <td>
                    {nomeDe(t.origem_id)} → {nomeDe(t.destino_id)}
                  </td>
                  <td>{meio(t.meio).nome}</td>
                  <td>{t.partida ? hora(t.partida) : '—'}</td>
                  <td>{t.chegada ? hora(t.chegada) : '—'}</td>
                  <td>{t.observacao ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {escolhidas.length > 0 && (
        <section>
          <h2>Hospedagens</h2>
          {escolhidas.map(({ destino, escolhida }) =>
            escolhida ? (
              <div key={destino.id} className="imprimir-casa">
                <h3>
                  {destino.nome}: {escolhida.nome}
                </h3>
                <p>
                  {escolhida.checkin && `Check-in ${formatarData(escolhida.checkin)}${escolhida.horaCheckin ? ` a partir das ${escolhida.horaCheckin}` : ''}`}
                  {escolhida.checkout && ` · Check-out ${formatarData(escolhida.checkout)}${escolhida.horaCheckout ? ` até ${escolhida.horaCheckout}` : ''}`}
                </p>
                {escolhida.guia?.endereco && <p>Endereço: {escolhida.guia.endereco}</p>}
                {escolhida.guia?.comoChegar && <p>Como chegar: {escolhida.guia.comoChegar}</p>}
                {comSegredos && escolhida.guia?.wifiRede && (
                  <p>
                    Wi-Fi: {escolhida.guia.wifiRede}
                    {escolhida.guia.wifiSenha && ` · senha ${escolhida.guia.wifiSenha}`}
                  </p>
                )}
                {comSegredos && escolhida.guia?.codigoPorta && <p>Código da porta: {escolhida.guia.codigoPorta}</p>}
              </div>
            ) : null,
          )}
        </section>
      )}

      <section>
        <h2>Comboio</h2>
        <table>
          <thead>
            <tr>
              <th>Pessoa</th>
              <th>Telefone</th>
              <th>Emergência</th>
            </tr>
          </thead>
          <tbody>
            {membros.map((m) => {
              const f = fichas.find((x) => x.usuario_id === m.id)
              return (
                <tr key={m.id}>
                  <td>{m.nome}</td>
                  <td>{f?.telefone ?? '—'}</td>
                  <td>{f?.emergencia_nome ? `${f.emergencia_nome}${f.emergencia_telefone ? ` · ${f.emergencia_telefone}` : ''}` : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      <p className="imprimir-rodape">Gerado pelo Together em {new Date().toLocaleDateString('pt-BR')}.</p>
    </div>
  )
}
