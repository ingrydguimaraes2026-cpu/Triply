// Gera direcoes.html: 3 direções do conceito "passaporte do comboio", 5 telas cada.
import { writeFileSync } from 'node:fs'
const core = 'file:///C:/Users/victurib/projects/Triply/packages/core/src/'
const { DESENHOS_DOS_ICONES } = await import(core + 'icones-desenhos.ts')
const { DESENHOS_DOS_SELOS } = await import(core + 'selos.ts')
// mesma regra do packages/core/src/icones.ts
const NEUTRAS = new Set(['#3b2715', '#7a5f45', '#8a7058', '#7b542f', '#b97a22', '#fff6e8', '#fff'])
const svgDoIcone = (n, { cor }) => {
  const f = NEUTRAS.has(cor.toLowerCase()) ? `fill="#E3A04A" fill-opacity="1"` : `fill="${cor}" fill-opacity="0.25"`
  return `<svg viewBox="0 0 256 256">${DESENHOS_DOS_ICONES[n].d.replace(/fill="__DUO__"/g, f).replace(/__COR__/g, cor)}</svg>`
}
const svgDoSelo = (n, tom) => `<svg viewBox="0 0 48 48">${DESENHOS_DOS_SELOS[n].replace(/__TRACO__/g, tom === 'escuro' ? '#FFF6E8' : '#4A2E14')}</svg>`

const ic = (n, cor = '#3B2715', t = 22, extra = {}) => `<span class="ic" style="width:${t}px;height:${t}px">${svgDoIcone(n, { cor, ...extra })}</span>`
const selo = (n, t = 44, tom = 'claro', cls = '') => `<span class="selo ${cls}" style="width:${t}px;height:${t}px">${svgDoSelo(n, tom)}</span>`
const W = (f) => `https://thumb.wikimedia.org/wikipedia/commons/thumb/${f}`
const F = {
  comercio: W('e/e8/Plaza_del_Comercio%2C_Lisboa%2C_Portugal%2C_2012-05-12%2C_DD_01-03_PAN.jpg/960px-Plaza_del_Comercio%2C_Lisboa%2C_Portugal%2C_2012-05-12%2C_DD_01-03_PAN.jpg'),
  se: W('5/54/West_facade_of_Lisbon_Cathedral_%28retouched%29.jpg/960px-West_facade_of_Lisbon_Cathedral_%28retouched%29.jpg'),
  castelo: 'https://upload.wikimedia.org/wikipedia/commons/3/37/Castelo_Sao_Jorge_Lisboa_1.JPG',
  rossio: W('5/5c/Lisboa_Esta%C3%A7%C3%A3o_do_Rossio_%2853820098461%29.jpg/960px-Lisboa_Esta%C3%A7%C3%A3o_do_Rossio_%2853820098461%29.jpg'),
  azulejo: W('d/d5/Convento_da_Madre_de_Deus_-_Lisboa_-_Portugal_%2846913633574%29.jpg/960px-Convento_da_Madre_de_Deus_-_Lisboa_-_Portugal_%2846913633574%29.jpg'),
  aqueduto: W('1/1d/Aqueduto_das_%C3%81guas_Livres_%281%29.jpg/960px-Aqueduto_das_%C3%81guas_Livres_%281%29.jpg'),
  carmo: W('1/14/Nave_of_Igreja_do_Convento_do_Carmo_%28Lisbon%29_81.jpg/960px-Nave_of_Igreja_do_Convento_do_Carmo_%28Lisbon%29_81.jpg'),
  paris: W('8/85/Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg/640px-Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg'),
}
const PESSOAS = [['PV', '#A8703F'], ['AN', '#5E6B2E'], ['JU', '#C0573A'], ['+2', '#B97A22']]
const rostos = (t = 30, borda = '#FBF3E6') => `<span class="rostos">${PESSOAS.map(([i, c]) => `<span style="width:${t}px;height:${t}px;background:${c};border-color:${borda}">${i}</span>`).join('')}</span>`
const PASSOS = [['mapa', 'Roteiro', 'feito'], ['galera', 'Galera', 'agora'], ['calendario', 'Datas', ''], ['barraca', 'Onde dormir', ''], ['passagem', 'Como chegar', ''], ['moedas', 'Contas', '']]
const abas = (on, tema) => {
  const cor = tema === 'b' ? ['#FFF6E8', '#E3A04A'] : ['#8A7058', '#B97A22']
  return `<nav class="abas">${[['identidade', 'Passaporte'], ['roteiro', 'Roteiro'], ['contas', 'Contas'], ['fotos', 'Fotos']]
    .map(([n, r]) => `<span class="${r === on ? 'on' : ''}">${ic(n, r === on ? cor[1] : cor[0], 24)}<b>${r}</b></span>`).join('')}</nav>`
}
const tel = (titulo, corpo, cls = '') => `<figure class="cel"><figcaption>${titulo}</figcaption><div class="tela ${cls}"><div class="status"><b>9:41</b><i></i></div>${corpo}</div></figure>`

// ---------- Direção A: Passaporte de papel ----------
const A = [
  tel('Viagens', `
    <div class="pad top">
      <div class="linha"><small>Olá, Paulo</small><span class="av">PV</span></div>
      <h1 class="serif g">Pra onde<br>vamos?</h1>
      <div class="capaA" style="background-image:url('${F.comercio}')">
        <div class="carimbo-data">FALTAM<br><b>211</b><br>DIAS</div>
        <div class="rodape"><h2 class="serif">Lisboa</h2><span>${rostos(26, '#fff')}</span></div>
      </div>
      <div class="mini"><span style="background-image:url('${F.aqueduto}')"></span><b>Sintra</b><small>sem data</small>${ic('avancar', '#8A7058', 18)}</div>
      <button class="botao">${ic('mais', '#fff', 18)} Nova viagem</button>
    </div>`),
  tel('Passaporte · antes', `
    <div class="faixa" style="background-image:linear-gradient(#0000,#4A2E14cc),url('${F.comercio}')"><h2 class="serif">Lisboa</h2>${rostos(28, '#fff')}</div>
    <div class="pad">
      <div class="pagina">
        <small class="rot">PASSAPORTE DO COMBOIO · 1 DE 6</small>
        <div class="grade">${PASSOS.map(([s, r, e]) => `<div class="slot ${e}">${selo(e === 'feito' ? s : s, 50, 'claro')}<small>${r}</small></div>`).join('')}</div>
      </div>
      <div class="proximo">
        ${selo('galera', 56)}
        <div><small>PRÓXIMO CARIMBO</small><h3 class="serif">Chamar a galera</h3></div>
      </div>
      <button class="botao largo">Mandar o convite</button>
    </div>${abas('Passaporte', 'a')}`),
  tel('Passaporte · durante (Hoje)', `
    <div class="pad top">
      <div class="linha"><small>DIA 2 DE 6 · LISBOA</small><span class="chip">${ic('sol', '#B97A22', 16)} 21°</span></div>
      <h1 class="serif">Agora</h1>
      <div class="foto-agora" style="background-image:linear-gradient(#0000 40%,#2A1A0Cdd),url('${F.castelo}')">
        <span class="hora">10:00</span>
        <div class="rodape"><h2 class="serif">Castelo de São Jorge</h2><button class="ir">${ic('navegar', '#3B2715', 18)} Ir</button></div>
      </div>
      <div class="depois"><small>DEPOIS</small><b>13:00 · Almoço na Alfama</b></div>
      <div class="depois"><small>À NOITE</small><b>20:30 · Fado no Carmo</b></div>
    </div>${abas('Passaporte', 'a')}`),
  tel('Roteiro', `
    <div class="pad top">
      <h1 class="serif">Roteiro</h1>
      <div class="dias"><b class="on">Dia 1</b><b>Dia 2</b><b>Dia 3</b><b>Dia 4</b></div>
      ${[[F.comercio, 'Praça do Comércio', '09:30'], [F.se, 'Sé de Lisboa', '11:00'], [F.azulejo, 'Museu do Azulejo', '15:00']].map(([f, n, h]) => `<div class="parada"><span style="background-image:url('${f}')"></span><div><small>${h}</small><b>${n}</b></div></div>`).join('')}
      <div class="parada dormir">${selo('barraca', 40)}<div><small>DORMIR</small><b>Casa na Graça</b></div></div>
      <button class="botao fantasma">${ic('explorar', '#7B542F', 18)} Achar mais lugares</button>
    </div>${abas('Roteiro', 'a')}`),
  tel('Contas', `
    <div class="pad top centro">
      <h1 class="serif">Contas</h1>
      <small class="rot">VOCÊ RECEBE</small>
      <div class="numero serif verde">€ 48<small>,20</small></div>
      <div class="pessoas">${[['AN', '#5E6B2E', 'te deve € 30'], ['JU', '#C0573A', 'te deve € 18,20']].map(([i, c, t]) => `<div><span class="av" style="background:${c}">${i}</span><small>${t}</small></div>`).join('')}</div>
      <button class="botao largo grande">${ic('mais', '#fff', 22)} Lançar gasto</button>
      <small class="link">Ver os 12 gastos</small>
    </div>${abas('Contas', 'a')}`),
]

// ---------- Direção B: Foto manda (escuro, imersivo) ----------
const B = [
  tel('Viagens', `
    <div class="cheia" style="background-image:linear-gradient(#0008,#0000 30%,#1d120acc 70%,#1d120a),url('${F.comercio}')">
      <div class="pad top"><div class="linha claro"><small>Olá, Paulo</small><span class="av">PV</span></div></div>
      <div class="baixo">
        <small class="rot claro">PRÓXIMA VIAGEM · FALTAM 211 DIAS</small>
        <h1 class="serif enorme">Lisboa</h1>
        <div class="selos-linha">${PASSOS.map(([s, , e]) => selo(s, 30, 'escuro', e === 'feito' ? '' : 'apagado')).join('')}</div>
        <button class="botao claro largo">Abrir a viagem</button>
        <div class="outras"><span style="background-image:url('${F.aqueduto}')"></span><span class="nova">${ic('mais', '#FFF6E8', 20)}</span></div>
      </div>
    </div>`, 'escura'),
  tel('Passaporte · antes', `
    <div class="cheia" style="background-image:linear-gradient(#0006,#0000 25%,#1d120a 62%),url('${F.comercio}')">
      <div class="pad top"><div class="linha claro">${ic('voltar', '#FFF6E8', 22)}${rostos(30, '#1d120a')}</div></div>
      <div class="baixo">
        <h1 class="serif enorme">Lisboa</h1>
        <div class="contador"><b class="serif">1</b><span>de 6<br>carimbos</span></div>
        <div class="selos-linha grande">${PASSOS.map(([s, , e]) => selo(s, 40, 'escuro', e === 'feito' ? '' : e === 'agora' ? 'pulsa' : 'apagado')).join('')}</div>
        <div class="vidro">${selo('galera', 48, 'escuro')}<div><small>AGORA</small><b>Chamar a galera</b></div><button class="redondo">${ic('seta-direita', '#3B2715', 20)}</button></div>
      </div>
    </div>${abas('Passaporte', 'b')}`, 'escura'),
  tel('Passaporte · durante (Hoje)', `
    <div class="cheia" style="background-image:linear-gradient(#0006,#0000 25%,#1d120a 66%),url('${F.castelo}')">
      <div class="pad top"><div class="linha claro"><small>DIA 2 DE 6</small><span class="chip escuro">${ic('sol', '#E3A04A', 16)} 21°</span></div></div>
      <div class="baixo">
        <small class="rot claro">AGORA · 10:00</small>
        <h1 class="serif enorme menor">Castelo de São Jorge</h1>
        <button class="botao claro largo">${ic('navegar', '#3B2715', 18)} Ir agora · 12 min</button>
        <div class="vidro fino"><small>DEPOIS</small><b>13:00 Almoço na Alfama</b></div>
      </div>
    </div>${abas('Passaporte', 'b')}`, 'escura'),
  tel('Roteiro', `
    <div class="pad top escuro-fundo">
      <h1 class="serif claro-t">Dia 1</h1>
      <div class="dias escuro"><b class="on">1</b><b>2</b><b>3</b><b>4</b></div>
      <div class="pilha">
        ${[[F.comercio, 'Praça do Comércio', '09:30'], [F.se, 'Sé de Lisboa', '11:00'], [F.azulejo, 'Museu do Azulejo', '15:00']].map(([f, n, h]) => `<div class="foto-parada" style="background-image:linear-gradient(#0000 40%,#000a),url('${f}')"><small>${h}</small><b>${n}</b></div>`).join('')}
      </div>
    </div>${abas('Roteiro', 'b')}`, 'escura'),
  tel('Contas', `
    <div class="pad top escuro-fundo centro">
      <small class="rot claro">VOCÊ RECEBE</small>
      <div class="numero serif claro-t">€ 48<small>,20</small></div>
      <div class="barra-grupo"><i style="flex:5;background:#E3A04A"></i><i style="flex:3;background:#C0573A"></i><i style="flex:2;background:#6E7D36"></i></div>
      <div class="pessoas claro-t">${[['AN', '#5E6B2E', '€ 30'], ['JU', '#C0573A', '€ 18,20']].map(([i, c, t]) => `<div><span class="av" style="background:${c}">${i}</span><small>${t}</small></div>`).join('')}</div>
      <button class="mais-gigante">${ic('mais', '#3B2715', 34)}</button>
    </div>${abas('Contas', 'b')}`, 'escura'),
]

// ---------- Direção C: Estrada do comboio ----------
const estrada = () => {
  const pts = [[70, 520], [250, 455], [90, 380], [250, 300], [95, 222], [250, 140]]
  const d = 'M70 560 C 40 520, 280 500, 250 455 S 60 420, 90 380 S 290 340, 250 300 S 60 260, 95 222 S 280 180, 250 140 S 200 90, 170 70'
  return `<svg class="estrada" viewBox="0 0 330 600"><path d="${d}" fill="none" stroke="#E9D6B6" stroke-width="30" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="10 12"/></svg>
    ${pts.map(([x, y], i) => {
      const [s, r, e] = PASSOS[i]
      return `<div class="ponto ${e}" style="left:${x - 30}px;top:${y - 30}px">${selo(s, 60, 'claro', e ? '' : 'apagado')}<small>${r}</small></div>`
    }).join('')}
    <div class="van" style="left:${(70 + 250) / 2 - 16}px;top:${(520 + 455) / 2 - 22}px">${ic('carro', '#7B542F', 30)}</div>
    <div class="destino" style="left:140px;top:40px">${ic('bandeira', '#C0573A', 28)}</div>`
}
const C = [
  tel('Viagens', `
    <div class="topoC"><div class="linha claro"><small>Olá, Paulo</small><span class="av">PV</span></div><h1 class="serif claro-t">Suas viagens</h1></div>
    <div class="pad">
      <div class="bilhete"><span class="foto" style="background-image:url('${F.comercio}')"></span>
        <div class="dados"><small>RIO → LISBOA</small><h2 class="serif">Lisboa</h2><div class="prog"><i style="width:17%"></i></div><small>1 de 6 · faltam 211 dias</small></div></div>
      <div class="bilhete apagado"><span class="foto" style="background-image:url('${F.aqueduto}')"></span>
        <div class="dados"><small>SEM DATA</small><h2 class="serif">Sintra</h2></div></div>
      <button class="botao largo">${ic('mais', '#fff', 18)} Nova viagem</button>
    </div>`),
  tel('Passaporte · antes', `
    <div class="topoC baixo-c" style="background-image:linear-gradient(#7B542Fcc,#7B542Fee),url('${F.comercio}')"><div class="linha claro"><h2 class="serif claro-t">Lisboa</h2>${rostos(28, '#7B542F')}</div>
      <div class="pct serif">17<small>%</small></div><small class="rot claro">DA VIAGEM MONTADA</small></div>
    <div class="mapa-estrada"><div class="quadro">${estrada()}</div></div>
    <div class="flutua"><b>Chamar a galera</b><button class="botao">Convidar</button></div>
    ${abas('Passaporte', 'c')}`),
  tel('Passaporte · durante (Hoje)', `
    <div class="topoC" style="background-image:linear-gradient(#7B542Fcc,#7B542Fee),url('${F.castelo}')"><div class="linha claro"><small>DIA 2 DE 6</small><span class="chip">${ic('sol', '#B97A22', 16)} 21°</span></div><h1 class="serif claro-t">Hoje</h1></div>
    <div class="pad">
      <div class="linha-tempo">
        ${[['09:00', 'Café no Rossio', 'feito'], ['10:00', 'Castelo de São Jorge', 'agora'], ['13:00', 'Almoço na Alfama', ''], ['20:30', 'Fado no Carmo', '']].map(([h, n, e]) => `<div class="lt ${e}"><small>${h}</small><i></i><b>${n}</b>${e === 'agora' ? `<button class="ir">${ic('navegar', '#fff', 16)} Ir</button>` : ''}</div>`).join('')}
      </div>
    </div>${abas('Passaporte', 'c')}`),
  tel('Roteiro', `
    <div class="topoC curto"><h1 class="serif claro-t">Roteiro</h1><div class="dias claro"><b class="on">Dia 1</b><b>Dia 2</b><b>Dia 3</b></div></div>
    <div class="pad">
      <div class="trilha">
        ${[[F.comercio, 'Praça do Comércio', '09:30'], [F.se, 'Sé de Lisboa', '11:00'], [F.azulejo, 'Museu do Azulejo', '15:00']].map(([f, n, h]) => `<div class="tr"><span style="background-image:url('${f}')"></span><div><small>${h}</small><b>${n}</b></div></div>`).join('')}
        <div class="tr dormir">${selo('barraca', 44)}<div><small>DORMIR</small><b>Casa na Graça</b></div></div>
      </div>
      <button class="botao fantasma largo">${ic('explorar', '#7B542F', 18)} Deslizar pra achar mais</button>
    </div>${abas('Roteiro', 'c')}`),
  tel('Contas', `
    <div class="topoC centro"><small class="rot claro">VOCÊ RECEBE</small><div class="numero serif claro-t">€ 48<small>,20</small></div></div>
    <div class="pad">
      ${[['AN', '#5E6B2E', 'Ana te deve', '€ 30'], ['JU', '#C0573A', 'Ju te deve', '€ 18,20']].map(([i, c, t, v]) => `<div class="deve"><span class="av" style="background:${c}">${i}</span><b>${t}</b><span class="v">${v}</span></div>`).join('')}
      <button class="botao largo grande">${ic('mais', '#fff', 22)} Lançar gasto</button>
    </div>${abas('Contas', 'c')}`),
]

const secao = (id, titulo, frase, telas) => `<section class="dir ${id}"><header><h2>${titulo}</h2><p>${frase}</p></header><div class="telas">${telas.join('')}</div></section>`
const css = `
:root{--texto:#3B2715;--suave:#7A5F45;--couro:#7B542F;--caramelo:#B97A22;--dourado:#E3A04A;--fundo:#FBF3E6;--papel:#F6EAD3;--verde:#5E6B2E;--vermelho:#C0573A}
*{box-sizing:border-box;margin:0}body{background:#E6D8C2;font-family:'Plus Jakarta Sans',system-ui,sans-serif;color:var(--texto);padding:28px}
.serif{font-family:'Fraunces',serif;font-weight:700;letter-spacing:-.01em}
.dir{margin-bottom:44px}.dir header{margin:0 0 14px 6px}.dir header h2{font:700 28px 'Fraunces',serif}.dir header p{color:var(--suave);font-size:15px;margin-top:4px;max-width:900px}
.telas{display:flex;gap:22px;flex-wrap:wrap}.cel{width:330px}.cel figcaption{font-weight:700;font-size:14px;margin:0 0 8px 6px;color:var(--suave)}
.tela{width:330px;height:700px;border-radius:44px;overflow:hidden;position:relative;background:var(--fundo);border:7px solid #1E140B;box-shadow:0 18px 40px #4a2e1440}
.status{position:absolute;top:0;left:0;right:0;height:40px;z-index:5;display:flex;justify-content:space-between;align-items:center;padding:0 26px;font-size:13px}
.status i{width:90px;height:26px;background:#1E140B;border-radius:20px;position:absolute;left:50%;top:8px;transform:translateX(-50%)}
.escura .status{color:#fff}
.ic,.selo{display:inline-flex;flex:none}.ic svg,.selo svg{width:100%;height:100%}
.pad{padding:16px 20px}.pad.top{padding-top:52px}.linha{display:flex;justify-content:space-between;align-items:center}.linha small{font-size:12px;font-weight:600;color:var(--suave);letter-spacing:.06em}
.claro small,.linha.claro small{color:#F5E9D6}.av{width:34px;height:34px;border-radius:50%;background:#A8703F;color:#fff;font-size:12px;font-weight:700;display:inline-grid;place-items:center}
.rostos{display:inline-flex}.rostos span{border-radius:50%;color:#fff;font-size:10px;font-weight:700;display:grid;place-items:center;border:2px solid;margin-left:-8px}
h1{font-size:34px;line-height:1.05;margin:10px 0 16px}h1.g{font-size:42px}
.botao{border:0;background:var(--couro);color:#fff;font:700 15px 'Plus Jakarta Sans';border-radius:16px;padding:14px 18px;display:inline-flex;gap:8px;align-items:center;justify-content:center}
.botao.largo{width:100%}.botao.grande{padding:18px;font-size:17px;margin-top:22px}.botao.fantasma{background:transparent;color:var(--couro);border:1.5px dashed #CDB38E}.botao.claro{background:#FFF6E8;color:var(--texto)}
.chip{background:#fff;border-radius:99px;padding:5px 10px;font-size:13px;font-weight:700;display:inline-flex;gap:4px;align-items:center}.chip.escuro{background:#0006;color:#fff}
.rot{font-size:11px;font-weight:700;letter-spacing:.12em;color:var(--suave)}.rot.claro{color:#F5E9D6}
.numero{font-size:76px;line-height:1;margin:6px 0 18px}.numero small{font-size:36px}.verde{color:var(--verde)}.centro{text-align:center}
.pessoas{display:flex;justify-content:center;gap:28px}.pessoas div{display:grid;justify-items:center;gap:6px}.pessoas small{font-size:13px;color:var(--suave)}
.link{display:block;margin-top:14px;color:var(--couro);font-weight:700;font-size:13px}
.abas{position:absolute;left:0;right:0;bottom:0;display:grid;grid-template-columns:repeat(4,1fr);padding:10px 8px 26px;background:#fff;border-top:1px solid #F1E6D4}
.abas span{display:grid;justify-items:center;gap:3px}.abas b{font-size:10.5px;color:#8A7058}.abas .on b{color:var(--caramelo)}
/* A */
.a .capaA{height:300px;border-radius:28px;background-size:cover;background-position:center;position:relative;box-shadow:0 10px 24px #4a2e1430}
.a .capaA .rodape{position:absolute;left:0;right:0;bottom:0;padding:18px;display:flex;justify-content:space-between;align-items:end;background:linear-gradient(#0000,#2A1A0Ccc);border-radius:0 0 28px 28px}
.a .capaA h2{color:#fff;font-size:34px}
.carimbo-data{position:absolute;top:16px;right:16px;width:76px;height:76px;border-radius:50%;border:2.5px solid #FFF6E8;color:#FFF6E8;font-size:9px;font-weight:800;text-align:center;line-height:1.1;display:grid;place-content:center;transform:rotate(-12deg);background:#7B542F99}
.carimbo-data b{font:700 24px 'Fraunces'}
.mini{display:flex;align-items:center;gap:12px;margin:16px 0}.mini span{width:46px;height:46px;border-radius:14px;background-size:cover}.mini b{font-size:15px}.mini small{flex:1;color:var(--suave);font-size:13px}
.faixa{height:170px;background-size:cover;background-position:center;display:flex;justify-content:space-between;align-items:end;padding:16px 20px}.faixa h2{color:#fff;font-size:32px}
.pagina{background:var(--papel);border-radius:22px;padding:16px 14px;border:1px solid #E5D2B0;background-image:radial-gradient(#e9d8b9 1px,transparent 1px);background-size:14px 14px}
.grade{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}.slot{display:grid;justify-items:center;gap:4px;padding:8px 0;border:1.5px dashed #D6BE99;border-radius:16px}
.slot small{font-size:11px;font-weight:600;color:var(--suave)}.slot:not(.feito):not(.agora) .selo{opacity:.25;filter:grayscale(1)}
.slot.feito{border:0}.slot.feito .selo{transform:rotate(-10deg)}.slot.agora{border-color:var(--caramelo);border-style:solid;background:#fff}
.proximo{display:flex;align-items:center;gap:12px;margin:16px 0 12px}.proximo small{font-size:11px;font-weight:700;letter-spacing:.1em;color:var(--caramelo)}.proximo h3{font-size:24px}
.foto-agora{height:340px;border-radius:28px;background-size:cover;background-position:center;position:relative}.foto-agora .hora{position:absolute;top:14px;left:14px;background:#fff;border-radius:99px;padding:6px 12px;font-weight:800}
.foto-agora .rodape{position:absolute;bottom:16px;left:16px;right:16px;display:flex;justify-content:space-between;align-items:end;gap:10px}.foto-agora h2{color:#fff;font-size:26px;line-height:1.05}
.ir{border:0;background:#FFF6E8;border-radius:14px;padding:10px 14px;font:700 14px 'Plus Jakarta Sans';display:inline-flex;gap:6px;align-items:center}
.depois{display:flex;gap:10px;align-items:baseline;padding:14px 4px;border-bottom:1px solid #EADCC5}.depois small{font-size:11px;font-weight:700;letter-spacing:.1em;color:var(--suave);width:70px}.depois b{font-size:15px}
.dias{display:flex;gap:8px;margin-bottom:16px}.dias b{padding:8px 14px;border-radius:99px;background:#F1E4CF;font-size:13px}.dias b.on{background:var(--couro);color:#fff}
.parada{display:flex;gap:12px;align-items:center;margin-bottom:12px}.parada span{width:64px;height:64px;border-radius:18px;background-size:cover;background-position:center}.parada small{font-size:12px;color:var(--suave);font-weight:700}.parada b{display:block;font-size:16px}
.parada.dormir{background:#fff;border-radius:18px;padding:10px 12px}
/* B */
.escura{background:#1d120a;color:#FFF6E8}.cheia{position:absolute;inset:0;background-size:cover;background-position:center}
.baixo{position:absolute;left:0;right:0;bottom:96px;padding:0 22px}.b .tela:not(.escura) .baixo{bottom:30px}
.enorme{font-size:64px;color:#fff;margin:4px 0 12px}.enorme.menor{font-size:40px}
.selos-linha{display:flex;gap:8px;margin-bottom:18px}.selos-linha .apagado{opacity:.3}.selos-linha.grande{gap:6px}.pulsa{filter:drop-shadow(0 0 8px #E3A04A)}
.outras{display:flex;gap:10px;margin-top:14px}.outras span{width:50px;height:50px;border-radius:16px;background-size:cover}.outras .nova{border:1.5px dashed #FFF6E888;display:grid;place-items:center}
.contador{display:flex;gap:10px;align-items:center;margin-bottom:10px}.contador b{font-size:54px;color:var(--dourado)}.contador span{font-size:13px;line-height:1.2;color:#F5E9D6}
.vidro{display:flex;align-items:center;gap:12px;background:#ffffff1f;backdrop-filter:blur(14px);border:1px solid #ffffff2a;border-radius:22px;padding:12px}.vidro div{flex:1}.vidro small{font-size:11px;letter-spacing:.1em;color:#E3A04A;font-weight:700}.vidro b{display:block;font-size:17px}
.vidro.fino{margin-top:12px}.redondo{width:44px;height:44px;border-radius:50%;border:0;background:#FFF6E8;display:grid;place-items:center}
.b .abas{background:#1d120ae6;border-top:1px solid #ffffff14}.b .abas b{color:#FFF6E8aa}.b .abas .on b{color:var(--dourado)}
.escuro-fundo{background:#1d120a;height:100%}.claro-t{color:#FFF6E8}.dias.escuro b{background:#ffffff14;color:#FFF6E8}.dias.escuro b.on{background:var(--dourado);color:var(--texto)}
.pilha{display:grid;gap:12px}.foto-parada{height:150px;border-radius:24px;background-size:cover;background-position:center;padding:14px;display:flex;flex-direction:column;justify-content:end;color:#fff}.foto-parada small{font-weight:700;font-size:12px}.foto-parada b{font-size:19px}
.barra-grupo{display:flex;gap:3px;height:10px;border-radius:6px;overflow:hidden;margin:0 10px 22px}
.mais-gigante{width:92px;height:92px;border-radius:50%;border:0;background:var(--dourado);display:grid;place-items:center;margin:40px auto 0;box-shadow:0 10px 30px #E3A04A55}
/* C */
.topoC{background:var(--couro);background-size:cover;background-position:center;padding:52px 20px 22px;border-radius:0 0 30px 30px}.topoC.curto{padding-bottom:14px}.topoC.baixo-c{padding-bottom:16px}
.topoC .dias b{background:#ffffff22;color:#fff}.topoC .dias b.on{background:#FFF6E8;color:var(--texto)}
.pct{font-size:68px;color:#FFF6E8;line-height:1;margin-top:8px}.pct small{font-size:30px}
.bilhete{display:flex;background:#fff;border-radius:22px;overflow:hidden;margin-bottom:14px;box-shadow:0 6px 16px #4a2e1414;position:relative}
.bilhete .foto{width:110px;background-size:cover;background-position:center;border-right:2px dashed #E9D6B6}.bilhete .dados{padding:16px;flex:1}.bilhete small{font-size:11px;font-weight:700;color:var(--suave);letter-spacing:.08em}.bilhete h2{font-size:30px;margin:2px 0 8px}
.bilhete.apagado{opacity:.75}.prog{height:6px;background:#F1E4CF;border-radius:6px;margin-bottom:6px}.prog i{display:block;height:100%;background:var(--caramelo);border-radius:6px}
.mapa-estrada{position:relative;height:430px;overflow:hidden}.quadro{position:absolute;left:52px;top:-30px;width:330px;height:600px;transform:scale(.66);transform-origin:top left}.estrada{position:absolute;inset:0;width:330px;height:600px}
.ponto{position:absolute;display:grid;justify-items:center;width:60px}.ponto small{white-space:nowrap;font-size:14px;font-weight:700;background:#fff;border-radius:99px;padding:2px 8px;margin-top:2px}.ponto .apagado{opacity:.35;filter:grayscale(1)}
.ponto.agora .selo{filter:drop-shadow(0 0 10px #E3A04A)}.van{position:absolute;background:#fff;border-radius:50%;padding:6px;box-shadow:0 4px 10px #0002}.destino{position:absolute}
.flutua{position:absolute;left:16px;right:16px;bottom:92px;background:#fff;border-radius:20px;padding:12px 12px 12px 18px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 10px 26px #4a2e1426}.flutua b{font-size:16px}
.linha-tempo{position:relative;padding-left:8px}.lt{display:grid;grid-template-columns:48px 18px 1fr auto;align-items:center;gap:8px;padding:14px 0}.lt small{font-weight:700;color:var(--suave);font-size:13px}
.lt i{width:12px;height:12px;border-radius:50%;background:#E5D2B0}.lt.feito b{color:var(--suave);text-decoration:line-through}.lt.feito i{background:var(--verde)}
.lt.agora{background:#fff;border-radius:18px;padding:14px 10px;margin:0 -10px;box-shadow:0 6px 16px #4a2e1414}.lt.agora i{background:var(--caramelo);box-shadow:0 0 0 5px #E3A04A44}.lt.agora b{font-size:17px}.lt .ir{background:var(--couro);color:#fff;padding:8px 12px}
.trilha{border-left:3px dotted #D6BE99;margin-left:10px;padding-left:16px}.tr{display:flex;gap:12px;align-items:center;margin-bottom:14px;position:relative}.tr::before{content:'';position:absolute;left:-24px;width:13px;height:13px;border-radius:50%;background:var(--caramelo);border:3px solid var(--fundo)}
.tr span{width:70px;height:70px;border-radius:20px;background-size:cover;background-position:center}.tr small{font-size:12px;font-weight:700;color:var(--suave)}.tr b{display:block;font-size:16px}.tr.dormir{background:#fff;border-radius:18px;padding:8px 12px}
.deve{display:flex;align-items:center;gap:12px;background:#fff;border-radius:18px;padding:12px 14px;margin-top:12px}.deve b{flex:1}.deve .v{font:700 20px 'Fraunces';color:var(--verde)}
`
const html = `<!doctype html><html lang="pt-BR" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Direções do Passaporte</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"><style>${css}</style></head><body>
<h1 class="serif" style="font-size:36px;margin:0 0 6px 6px">Tripwave · conceito "passaporte do comboio"</h1>
<p style="margin:0 0 30px 6px;color:#7A5F45;max-width:900px">Mesmas 5 telas nas 3 direções. Regra das 3: uma ação por tela, texto de uma linha, 4 abas (Passaporte, Roteiro, Contas, Fotos). Ícones e selos são os nossos de verdade; fotos do nosso catálogo de Lisboa.</p>
${secao('a', 'A · Passaporte de papel', 'Claro e quente. A tela da viagem é uma página de passaporte: cada etapa vira um carimbo (selo) que o grupo vai conquistando. Embaixo, só o próximo carimbo e um botão.', A)}
${secao('b', 'B · A foto manda', 'Escuro e imersivo. A foto do destino ocupa a tela inteira; por cima, só o nome gigante, a fileira de selos e um cartão de vidro com a próxima ação.', B)}
${secao('c', 'C · Estrada do comboio', 'Mais brincalhão. O progresso é uma estrada: o carrinho do comboio anda de selo em selo até a bandeira do destino. Número grande de quanto falta.', C)}
</body></html>`
writeFileSync(new URL('./direcoes.html', import.meta.url), html) // rodar: node docs/design/direcoes/gerar.mjs
console.log('ok', html.length)
