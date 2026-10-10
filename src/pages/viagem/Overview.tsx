import { useMemo } from 'react'
import { Link } from 'react-router'
import { Camera, MapPin, TrainFront, Users, Wallet } from 'lucide-react'
import MapaMundi from '../../features/mapa/MapaMundi'
import { useViagemAtual } from '../../features/viagens/hooks'
import { diasAte, formatarData, formatarPeriodo } from '../../lib/datas'
import Avatar from '../../components/ui/Avatar'
import Cartao from '../../components/ui/Cartao'
import EstadoVazio from '../../components/ui/EstadoVazio'
import './abas.css'

// Frase da contagem regressiva no topo do mapa
function contagem(inicio: string | null, fim: string | null) {
  if (!inicio) return null
  const faltam = diasAte(inicio)
  if (faltam > 1) return `Faltam ${faltam} dias`
  if (faltam === 1) return 'É amanhã!'
  if (faltam === 0) return 'É hoje!'
  if (fim && diasAte(fim) >= 0) return `Dia ${-faltam + 1} da viagem`
  return 'Viagem concluída'
}

// Overview: resumo de tudo. Cada cartão leva pra aba dele.
export default function Overview() {
  const { viagem, destinos, membros } = useViagemAtual()

  const pontos = useMemo(
    () =>
      destinos
        .filter((d) => d.latitude !== null && d.longitude !== null)
        .map((d) => ({ nome: d.nome, latitude: d.latitude!, longitude: d.longitude! })),
    [destinos],
  )
  const areaLivre = useMemo(() => ({ esquerda: 24, topo: 120, direita: 24, baixo: 24 }), [])
  const falta = contagem(viagem.data_inicio, viagem.data_fim)

  return (
    <div className="overview">
      {/* Mapa grande com o nome da viagem */}
      <section className="overview-mapa">
        <MapaMundi pontos={pontos} areaLivre={areaLivre} zoomMaximo={8} />
        <div className="overview-mapa-texto">
          {falta && <span className="overview-contagem">{falta}</span>}
          <h1>{viagem.nome}</h1>
          <p>{formatarPeriodo(viagem.data_inicio, viagem.data_fim)}</p>
        </div>
      </section>

      {/* Roteiro: destinos na ordem */}
      <Cartao titulo="Roteiro" icone={MapPin} className="overview-roteiro">
        <ol className="roteiro-lista">
          {destinos.map((d, i) => (
            <li key={d.id}>
              <span className="roteiro-numero">{i + 1}</span>
              <span className="roteiro-nome">
                <strong>{d.nome}</strong>
                <small>
                  {d.chegada ? `${formatarData(d.chegada)}${d.saida ? ` – ${formatarData(d.saida)}` : ''}` : d.pais}
                </small>
              </span>
            </li>
          ))}
        </ol>
      </Cartao>

      {/* TODO (Ingryd): quando o Financeiro existir, mostrar aqui o total gasto × orçamento */}
      <Cartao titulo="Orçamento" icone={Wallet} acao={<Link to="financeiro">Abrir</Link>}>
        <EstadoVazio
          compacto
          icone={Wallet}
          titulo="Sem orçamento ainda"
          texto="Defina quanto querem gastar por categoria."
        />
      </Cartao>

      {/* TODO (Ingryd): mostrar aqui o próximo trajeto (o mais perto de hoje) */}
      <Cartao titulo="Próximo trajeto" icone={TrainFront} acao={<Link to="transportes">Abrir</Link>}>
        <EstadoVazio
          compacto
          icone={TrainFront}
          titulo="Nenhum trajeto"
          texto="Adicione como vocês vão de um destino pro outro."
        />
      </Cartao>

      <Cartao titulo="Comboio" icone={Users} acao={<Link to="comboio">Abrir</Link>}>
        <ul className="overview-comboio">
          {membros.map((m) => (
            <li key={m.id}>
              <Avatar nome={m.nome} url={m.avatarUrl} tamanho={36} />
              <span>{m.nome}</span>
              {m.papel === 'adm' && <span className="selo">ADM</span>}
            </li>
          ))}
        </ul>
      </Cartao>

      {/* TODO (Ingryd): mostrar aqui as últimas fotos postadas */}
      <Cartao titulo="Fotos" icone={Camera} acao={<Link to="fotos">Abrir</Link>} className="overview-fotos">
        <EstadoVazio
          compacto
          icone={Camera}
          titulo="Nenhuma foto ainda"
          texto="As melhores fotos de cada lugar aparecem aqui."
        />
      </Cartao>
    </div>
  )
}
