import { Accessibility } from 'lucide-react'
import type { Preferencias } from '@together/core'
import { salvarAcessibilidade, useAcessibilidade } from '../../lib/acessibilidade'
import './acessibilidade.css'

const FONTES: { valor: Preferencias['fonte']; nome: string }[] = [
  { valor: 'normal', nome: 'Normal' },
  { valor: 'grande', nome: 'Grande' },
  { valor: 'maior', nome: 'Maior' },
]

// Acessibilidade e modo simples (spec 090). Vale só neste aparelho.
export default function FormAcessibilidade() {
  const p = useAcessibilidade()
  const mudar = (mudanca: Partial<Preferencias>) => salvarAcessibilidade({ ...p, ...mudanca })

  return (
    <section className="cartao-ui acessibilidade">
      <h2>
        <Accessibility size={18} aria-hidden="true" /> Leitura e modo simples
      </h2>
      <p className="form-dica">Vale só neste aparelho. Dá pra deixar o celular da sua mãe no modo simples, por exemplo.</p>

      <fieldset className="acessibilidade-fonte">
        <legend className="form-rotulo">Tamanho da letra</legend>
        <div className="acessibilidade-opcoes" role="radiogroup">
          {FONTES.map((f) => (
            <button key={f.valor} type="button" role="radio" aria-checked={p.fonte === f.valor} className={p.fonte === f.valor ? 'ativo' : undefined} onClick={() => mudar({ fonte: f.valor })}>
              {f.nome}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="acessibilidade-chave">
        <input type="checkbox" checked={p.contraste} onChange={(e) => mudar({ contraste: e.target.checked })} />
        <span>
          Alto contraste
          <small>Texto mais escuro e links sublinhados.</small>
        </span>
      </label>

      <label className="acessibilidade-chave">
        <input type="checkbox" checked={p.simples} onChange={(e) => mudar({ simples: e.target.checked })} />
        <span>
          Modo simples
          <small>Só Início, Hoje, Financeiro, Fotos e Comboio no menu.</small>
        </span>
      </label>
    </section>
  )
}
