// Gera modelos.html: 3 modelos mais ricos do Tripwave (o que prende + onde cobra), 6 telas cada.
import { writeFileSync } from 'node:fs'
const core = new URL('../../../packages/core/src/', import.meta.url).href
const { DESENHOS_DOS_ICONES } = await import(core + 'icones-desenhos.ts')
const { DESENHOS_DOS_SELOS } = await import(core + 'selos.ts')
const NEUTRAS = new Set(['#3b2715', '#7a5f45', '#8a7058', '#7b542f', '#b97a22', '#fff6e8', '#fff', '#ffffff'])
const ic = (n, cor = '#3B2715', t = 20, cheio = false) => {
  const f = NEUTRAS.has(cor.toLowerCase()) ? `fill="#E3A04A"` : `fill="${cor}" fill-opacity="0.25"`
  const d = DESENHOS_DOS_ICONES[n]
  const corpo = (cheio && d.c ? d.c : d.d).replace(/fill="__DUO__"/g, f).replace(/__COR__/g, cor)
  return `<span class="ic" style="width:${t}px;height:${t}px"><svg viewBox="0 0 256 256">${corpo}</svg></span>`
}
const selo = (n, t = 44, cls = '', tom = 'claro') => `<span class="selo ${cls}" style="width:${t}px;height:${t}px"><svg viewBox="0 0 48 48">${DESENHOS_DOS_SELOS[n].replace(/__TRACO__/g, tom === 'escuro' ? '#FFF6E8' : '#4A2E14')}</svg></span>`
const norti = (pose, t = 90) => `<img class="norti" src="norti/${pose}.webp" style="width:${t}px;height:${t}px" alt="">`
const W = (f) => `https://thumb.wikimedia.org/wikipedia/commons/thumb/${f}`
const F = {
  comercio: W('e/e8/Plaza_del_Comercio%2C_Lisboa%2C_Portugal%2C_2012-05-12%2C_DD_01-03_PAN.jpg/960px-Plaza_del_Comercio%2C_Lisboa%2C_Portugal%2C_2012-05-12%2C_DD_01-03_PAN.jpg'),
  se: W('5/54/West_facade_of_Lisbon_Cathedral_%28retouched%29.jpg/960px-West_facade_of_Lisbon_Cathedral_%28retouched%29.jpg'),
  castelo: 'https://upload.wikimedia.org/wikipedia/commons/3/37/Castelo_Sao_Jorge_Lisboa_1.JPG',
  rossio: W('5/5c/Lisboa_Esta%C3%A7%C3%A3o_do_Rossio_%2853820098461%29.jpg/960px-Lisboa_Esta%C3%A7%C3%A3o_do_Rossio_%2853820098461%29.jpg'),
  azulejo: W('d/d5/Convento_da_Madre_de_Deus_-_Lisboa_-_Portugal_%2846913633574%29.jpg/960px-Convento_da_Madre_de_Deus_-_Lisboa_-_Portugal_%2846913633574%29.jpg'),
  aqueduto: W('1/1d/Aqueduto_das_%C3%81guas_Livres_%281%29.jpg/960px-Aqueduto_das_%C3%81guas_Livres_%281%29.jpg'),
  carmo: W('1/14/Nave_of_Igreja_do_Convento_do_Carmo_%28Lisbon%29_81.jpg/960px-Nave_of_Igreja_do_Convento_do_Carmo_%28Lisbon%29_81.jpg'),
  estrela: W('1/1d/Main_facade_of_Bas%C3%ADlica_da_Estrela_57.jpg/960px-Main_facade_of_Bas%C3%ADlica_da_Estrela_57.jpg'),
  vicente: W('e/ef/Igreja_e_Mosteiro_de_S%C3%A3o_Vicente_de_Fora.jpg/960px-Igreja_e_Mosteiro_de_S%C3%A3o_Vicente_de_Fora.jpg'),
  figueira: W('8/8f/Lisbon_With_Langon_-_120_%283467138688%29.jpg/960px-Lisbon_With_Langon_-_120_%283467138688%29.jpg'),
}
const P = { PV: ['Paulo', '#A8703F'], AN: ['Ana', '#5E6B2E'], JU: ['Ju', '#C0573A'], BE: ['Beto', '#7B542F'], LI: ['Lia', '#B97A22'] }
const av = (k, t = 30, cls = '') => `<span class="av ${cls}" style="width:${t}px;height:${t}px;background:${P[k][1]};font-size:${Math.round(t / 2.8)}px">${k}</span>`
const rostos = (ks, t = 26, borda = '#fff') => `<span class="rostos">${ks.map((k) => av(k, t).replace('style="', `style="border-color:${borda};`)).join('')}</span>`
const foto = (f, cls = '', extra = '') => `<span class="foto ${cls}" style="background-image:url('${f}');${extra}"></span>`
const abas = (on, escuro) => `<nav class="abas ${escuro ? 'escuro' : ''}">${[['identidade', 'Viagem'], ['roteiro', 'Roteiro'], ['contas', 'Contas'], ['fotos', 'Fotos']]
  .map(([n, r]) => `<span class="${r === on ? 'on' : ''}">${ic(n, r === on ? '#B97A22' : escuro ? '#FFF6E8' : '#8A7058', 24)}<b>${r}</b></span>`).join('')}</nav>`
const tel = (titulo, nota, corpo, cls = '') => `<figure class="cel ${cls.includes('alta') ? 'alta' : ''}"><figcaption><b>${titulo}</b><small>${nota}</small></figcaption><div class="tela ${cls}"><div class="status"><b>9:41</b><i></i></div>${corpo}</div></figure>`
const secaoT = (t, link = '') => `<div class="sec"><h3>${t}</h3>${link ? `<small>${link}</small>` : ''}</div>`
const PASSOS = [['mapa', 'Roteiro', 1], ['galera', 'Galera', 1], ['calendario', 'Datas', 1], ['barraca', 'Dormir', 0], ['passagem', 'Chegar', 0], ['moedas', 'Contas', 1]]

// ================= MODELO 1 · REVISTA DE VIAGEM =================
const M1 = [
  tel('Início', 'tudo que importa, em seções', `
    <div class="pad top">
      <div class="linha"><div><small class="cinza">Boa noite,</small><h2 class="serif">Paulo</h2></div>${ic('avisos', '#3B2715', 24)}</div>
      <div class="heroi" style="background-image:linear-gradient(#0000 35%,#2A1A0Ce6),url('${F.comercio}')">
        <span class="etq">FALTAM 34 DIAS</span>
        <div class="rodape"><small>SUA PRÓXIMA VIAGEM</small><h2 class="serif">Lisboa</h2>
          <div class="linha"><span class="claro">4 de 6 prontos</span>${rostos(['PV', 'AN', 'JU', 'BE', 'LI'], 24, '#2A1A0C')}</div>
          <div class="barra"><i style="width:66%"></i></div></div>
      </div>
      ${secaoT('No comboio agora')}
      <div class="ativ">${av('AN', 28)}<span><b>Ana</b> votou na Casa da Graça</span><small>2 min</small></div>
      <div class="ativ">${av('JU', 28)}<span><b>Ju</b> adicionou Pastéis de Belém</span><small>1 h</small></div>
      ${secaoT('Pra sua próxima', 'ver tudo')}
      <div class="carrossel">${[[F.aqueduto, 'Sintra', '3 dias'], [F.estrela, 'Porto', '4 dias'], [F.vicente, 'Évora', '2 dias']].map(([f, n, d]) => `<div class="cartinha">${foto(f)}<b>${n}</b><small>${d} · roteiro pronto</small></div>`).join('')}</div>
    </div>`),
  tel('Viagem', 'tela inteira, rolando', `
    <div class="capa" style="background-image:linear-gradient(#0000 40%,#2A1A0Cdd),url('${F.comercio}')">
      <div class="botoes">${ic('voltar', '#fff', 22)}<span>${ic('compartilhar', '#fff', 22)}</span></div>
      <div class="rodape"><small>12 – 18 DEZ · 5 PESSOAS</small><h1 class="serif">Lisboa</h1></div>
    </div>
    <div class="pad">
      <div class="proximo">${selo('barraca', 52)}<div><small class="ouro">FALTA DECIDIR</small><b>Onde vamos dormir</b><span class="cinza">2 opções · 3 de 5 votaram</span></div></div>
      <div class="votos">${[[F.figueira, 'Casa na Graça', '€ 92/noite', ['AN', 'JU', 'PV']], [F.rossio, 'Apto no Chiado', '€ 110/noite', ['BE']]].map(([f, n, p, v]) => `<div class="voto">${foto(f)}<b>${n}</b><small>${p}</small>${rostos(v, 20)}</div>`).join('')}</div>
      ${secaoT('Roteiro', '6 dias')}
      <div class="carrossel">${[[F.comercio, 'Dia 1', 'Baixa e Alfama'], [F.castelo, 'Dia 2', 'Castelo e Graça'], [F.azulejo, 'Dia 3', 'Azulejos e Belém']].map(([f, d, t]) => `<div class="cartinha larga">${foto(f)}<small class="ouro">${d.toUpperCase()}</small><b>${t}</b></div>`).join('')}</div>
      ${secaoT('Contas')}
      <div class="mini-contas"><div><small class="cinza">Gasto do grupo</small><b class="serif">€ 1.240</b></div><div class="dir"><small class="cinza">Você recebe</small><b class="serif verde">€ 48</b></div></div>
      ${secaoT('Passeios em Lisboa', 'parceiro')}
      <div class="afiliado">${foto(F.aqueduto)}<div><b>Sintra e Cascais, dia inteiro</b><small>${ic('estrela', '#B97A22', 13, true)} 4,8 · a partir de R$ 189</small></div><button class="peq">Ver</button></div>
      ${secaoT('Antes de embarcar')}
      <div class="lista-ok">${[['seguro', 'Seguro viagem (exigido)', 'cotar'], ['wifi', 'Internet no destino (eSIM)', 'ver planos'], ['documento', 'Passaportes válidos', '5 de 5']].map(([i, t, a]) => `<div>${ic(i, '#7B542F', 20)}<span>${t}</span><small>${a}</small></div>`).join('')}</div>
    </div>${abas('Viagem')}`, 'alta'),
  tel('Hoje', 'durante a viagem', `
    <div class="pad top">
      <div class="linha"><small class="cinza">TERÇA · DIA 2 DE 6</small><span class="chip">${ic('sol', '#B97A22', 16)} 21° · sol</span></div>
      <h1 class="serif">Hoje em Lisboa</h1>
      <div class="agora-foto" style="background-image:linear-gradient(#0000 45%,#2A1A0Ce6),url('${F.castelo}')"><span class="etq">AGORA · 10:00</span><div class="rodape"><h2 class="serif">Castelo de São Jorge</h2><button class="ir">${ic('navegar', '#3B2715', 16)} 12 min</button></div></div>
      <div class="lt"><small>13:00</small><b>Almoço na Alfama</b><span class="cinza">reserva às 13h</span></div>
      <div class="lt"><small>20:30</small><b>Fado no Carmo</b><span class="cinza">ingressos no cofre</span></div>
      ${secaoT('Perto de você agora')}
      <div class="carrossel">${[[F.vicente, 'São Vicente de Fora', '400 m'], [F.carmo, 'Convento do Carmo', '900 m']].map(([f, n, d]) => `<div class="cartinha">${foto(f)}<b>${n}</b><small>${d}</small></div>`).join('')}</div>
    </div>${abas('Viagem')}`),
  tel('Contas', 'um número + o que mudou', `
    <div class="pad top">
      <h1 class="serif">Contas</h1>
      <div class="saldo"><small>VOCÊ RECEBE</small><b class="serif">€ 48,20</b><button class="botao">${ic('mais', '#fff', 18)} Lançar gasto</button></div>
      <div class="cambio">${ic('descendo', '#5E6B2E', 22)}<div><b>Euro hoje: R$ 6,12</b><small>Está barato · bom pra comprar</small></div></div>
      ${secaoT('Últimos gastos', 'ver 23')}
      ${[['JU', 'Jantar na Alfama', '€ 84,00', 'Ju pagou · 5 pessoas'], ['PV', 'Uber pro castelo', '€ 12,40', 'você pagou · 3 pessoas'], ['AN', 'Ingressos do fado', '€ 125,00', 'Ana pagou · 5 pessoas']].map(([k, t, v, s]) => `<div class="gasto">${av(k, 32)}<div><b>${t}</b><small>${s}</small></div><b>${v}</b></div>`).join('')}
    </div>${abas('Contas')}`),
  tel('O que prende', 'avisos que puxam de volta', `
    <div class="bloqueio" style="background-image:linear-gradient(#0006,#0008),url('${F.comercio}')">
      <div class="hora-bloq">9:41</div><small class="data-bloq">terça-feira, 11 de novembro</small>
      ${[['Tripwave', 'Ana votou na Casa da Graça', 'Falta só você e o Beto. Vota rapidinho?'], ['Tripwave', 'Euro caiu: R$ 6,12', 'Está entre os mais baratos dos últimos 90 dias.'], ['Tripwave', 'Faltam 34 dias pra Lisboa', 'Ainda falta: onde dormir e como chegar.']].map(([a, t, c]) => `<div class="notif"><span class="app">${ic('identidade', '#fff', 16)}</span><div><small>${a.toUpperCase()} · agora</small><b>${t}</b><span>${c}</span></div></div>`).join('')}
    </div>`, 'escura'),
  tel('Onde cobra', 'Passe da viagem (assinatura opcional)', `
    <div class="pad top paywall">
      <span class="fechar">${ic('fechar', '#3B2715', 20)}</span>
      <small class="ouro">PASSE DA VIAGEM · LISBOA</small>
      <h1 class="serif">A viagem inteira na mão, até sem internet.</h1>
      <div class="previa" style="background-image:url('${F.castelo}')"><span class="etq">${ic('wifi-desligado', '#3B2715', 14)} mapa offline</span></div>
      <ul class="beneficios">${[['wifi-desligado', 'Mapa e roteiro sem internet'], ['magica', 'Roteiro montado pelos votos'], ['documento', 'Reservas lidas do e-mail'], ['baixar', 'Livro da viagem em PDF']].map(([i, t]) => `<li>${ic(i, '#7B542F', 20)}${t}</li>`).join('')}</ul>
      <div class="plano on"><b>Esta viagem</b><span>R$ 39,90 · uma vez</span><small>vale pros 5 do comboio</small></div>
      <div class="plano"><b>Tripwave+ anual</b><span>R$ 99,90/ano</span><small>todas as viagens</small></div>
      <button class="botao largo">Liberar pro comboio · R$ 39,90</button>
      <small class="miuda">Pagamento único. Sem renovação. Restaurar compra</small>
    </div>`),
]

// ================= MODELO 2 · COMBOIO AO VIVO (social) =================
const story = (k, nome, novo = true) => `<div class="story ${novo ? 'novo' : ''}">${av(k, 54)}<small>${nome}</small></div>`
const M2 = [
  tel('Início', 'o grupo em primeiro lugar', `
    <div class="pad top">
      <div class="linha"><h2 class="serif logo">tripwave</h2><span>${ic('avisos', '#3B2715', 24)}</span></div>
      <div class="stories">${story('PV', 'Você', false)}${story('AN', 'Ana')}${story('JU', 'Ju')}${story('BE', 'Beto')}${story('LI', 'Lia', false)}</div>
      <div class="post">
        <div class="post-topo">${av('JU', 30)}<div><b>Ju</b><small>Lisboa · sugeriu um lugar</small></div></div>
        ${foto(F.azulejo, 'post-foto')}
        <div class="post-acoes">${ic('curtir', '#C0573A', 24, true)}<b>4</b>${ic('comentario', '#3B2715', 24)}<b>2</b><span class="dir"><button class="peq">${ic('mais', '#fff', 14)} No roteiro</button></span></div>
        <b>Museu do Azulejo</b><small class="cinza">"Vi no TikTok, parece lindo"</small>
      </div>
    </div>${abas('Viagem')}`),
  tel('Viagem', 'tela inteira, rolando', `
    <div class="capa baixa" style="background-image:linear-gradient(#0000 30%,#2A1A0Cdd),url('${F.comercio}')"><div class="botoes">${ic('voltar', '#fff', 22)}<span>${ic('ajustes', '#fff', 22)}</span></div><div class="rodape"><h1 class="serif">Lisboa</h1><small>12 – 18 DEZ · faltam 34 dias</small></div></div>
    <div class="pad">
      <div class="stories">${story('AN', 'Ana')}${story('JU', 'Ju')}${story('BE', 'Beto', false)}${story('LI', 'Lia', false)}<div class="story">${'<span class="av mais-av">' + ic('mais', '#7B542F', 22) + '</span>'}<small>Convidar</small></div></div>
      ${secaoT('Decidam juntos', '2 abertas')}
      <div class="decisao">
        <small class="ouro">ONDE DORMIR · 3 DE 5 VOTARAM</small>
        <div class="duelo">${[[F.figueira, 'Casa na Graça', 3], [F.rossio, 'Apto no Chiado', 1]].map(([f, n, v]) => `<div>${foto(f)}<b>${n}</b><span class="barra"><i style="width:${v * 20}%"></i></span><small>${v} votos</small></div>`).join('')}</div>
        <div class="falta">${rostos(['BE', 'LI'], 22)}<span>faltam Beto e Lia</span><button class="peq claro">Cutucar</button></div>
      </div>
      <div class="decisao enquete"><small class="ouro">ENQUETE · JU</small><b>Jantar de chegada: fado ou rooftop?</b>
        <div class="opcao on"><span>Fado no Carmo</span><b>60%</b></div><div class="opcao"><span>Rooftop no Chiado</span><b>40%</b></div></div>
      ${secaoT('O que rolou')}
      <div class="ativ">${av('AN', 28)}<span><b>Ana</b> lançou € 125 de ingressos</span><small>1 h</small></div>
      <div class="ativ">${av('BE', 28)}<span><b>Beto</b> mandou o passaporte</span><small>ontem</small></div>
      <div class="ativ">${av('LI', 28)}<span><b>Lia</b> entrou no comboio</span><small>ontem</small></div>
    </div>${abas('Viagem')}`, 'alta'),
  tel('Hoje', 'onde está todo mundo', `
    <div class="mapinha">
      <svg viewBox="0 0 330 360"><rect width="330" height="360" fill="#EADBC0"/><path d="M0 250 C80 230 120 300 330 260 L330 360 L0 360Z" fill="#B9CFD6"/><path d="M40 0 L80 120 L60 250 M150 0 L170 140 L260 240 M0 90 L330 130 M120 200 L300 180" stroke="#F8EFDF" stroke-width="9" fill="none"/></svg>
      <span class="pino" style="left:150px;top:120px">${av('AN', 34)}</span><span class="pino" style="left:180px;top:140px">${av('JU', 34)}</span><span class="pino eu" style="left:90px;top:190px">${av('PV', 34)}</span><span class="pino" style="left:250px;top:90px">${av('BE', 34)}</span>
      <span class="chip flut">${ic('sol', '#B97A22', 16)} 21°</span>
    </div>
    <div class="folha">
      <span class="pega"></span>
      <div class="linha"><div><small class="ouro">AGORA · 10:00</small><h2 class="serif">Castelo de São Jorge</h2></div><button class="botao peq2">${ic('navegar', '#fff', 16)} Ir</button></div>
      <div class="ativ">${ic('feito', '#5E6B2E', 22)}<span><b>Lia</b> chegou bem no hotel</span><small>8 min</small></div>
      <div class="ativ">${ic('lugar', '#C0573A', 22)}<span>Encontro às 13:00 no Largo do Chafariz</span></div>
    </div>${abas('Viagem')}`),
  tel('Contas', 'como uma conversa', `
    <div class="pad top">
      <div class="linha"><h1 class="serif">Contas</h1><span class="chip verde-c">recebe € 48</span></div>
      <div class="chat">
        <div class="bolha">${av('JU', 28)}<div><b>Ju pagou € 84 · Jantar na Alfama</b><small>dividido em 5 · € 16,80 cada</small><span class="reacoes">${ic('curtir', '#C0573A', 14, true)} 3</span></div></div>
        <div class="bolha eu"><div><b>Você pagou € 12,40 · Uber</b><small>dividido em 3</small></div></div>
        <div class="bolha">${av('AN', 28)}<div><b>Ana pagou € 125 · Fado</b><small>dividido em 5</small>${foto(F.carmo, 'recibo')}</div></div>
        <div class="acerto">${ic('tudo-ok', '#5E6B2E', 18)} Beto acertou € 30 com você no Pix</div>
      </div>
      <div class="digitar"><span>${ic('nova-foto', '#7B542F', 22)}</span><span class="campo">€ 0,00 · o que foi?</span><button class="redondo">${ic('enviar', '#fff', 18)}</button></div>
    </div>${abas('Contas')}`),
  tel('O que prende', 'falta só você', `
    <div class="pad top centro">
      ${rostos(['AN', 'JU', 'PV'], 64, '#FBF3E6')}<span class="falta-voce">${av('BE', 64, 'apag')}</span>
      <h1 class="serif">Falta só o seu voto, Beto</h1>
      <p class="cinza">A Casa na Graça está ganhando. Se ninguém votar até amanhã às 20h, ela fica.</p>
      <div class="duelo grande">${[[F.figueira, 'Casa na Graça'], [F.rossio, 'Apto no Chiado']].map(([f, n]) => `<div>${foto(f)}<b>${n}</b></div>`).join('')}</div>
      <button class="botao largo">Votar agora</button>
    </div>`),
  tel('Onde cobra', 'um paga, o comboio todo ganha', `
    <div class="pad top paywall">
      <span class="fechar">${ic('fechar', '#3B2715', 20)}</span>
      <div class="coroas">${['PV', 'AN', 'JU', 'BE', 'LI'].map((k) => `<span>${ic('adm', '#B97A22', 18)}${av(k, 46)}</span>`).join('')}</div>
      <h1 class="serif">Libere a viagem pro comboio inteiro</h1>
      <p class="cinza">Uma pessoa paga, os 5 ganham. E dá pra dividir no Pix.</p>
      <ul class="beneficios">${[['wifi-desligado', 'Tudo funcionando sem internet'], ['nova-foto', 'Scan de recibo: tira foto e já divide'], ['magica', 'Roteiro do grupo montado sozinho'], ['fotos', 'Álbum sem limite de fotos']].map(([i, t]) => `<li>${ic(i, '#7B542F', 20)}${t}</li>`).join('')}</ul>
      <div class="divide"><b>R$ 39,90</b><span>= R$ 7,98 pra cada um</span></div>
      <button class="botao largo">Liberar e dividir no comboio</button>
      <small class="miuda">Uma vez, só esta viagem. Restaurar compra</small>
    </div>`),
]

// ================= MODELO 3 · JOGO DO VIAJANTE (Norti) =================
const M3 = [
  tel('Início', 'nível, sequência e missões', `
    <div class="pad top">
      <div class="nivel">${norti('wave', 78)}<div><small class="ouro">VIAJANTE NÍVEL 4</small><b class="serif">Paulo</b><div class="xp"><i style="width:70%"></i></div><small class="cinza">350 / 500 até o nível 5</small></div></div>
      <div class="seq">${ic('rapido', '#B97A22', 26)}<b>6 dias seguidos</b><span class="dias7">${'SDTQQSS'.split('').map((d, i) => `<i class="${i < 6 ? 'on' : ''}">${d}</i>`).join('')}</span></div>
      ${secaoT('Missões da semana')}
      ${[['galera', 'Chame mais 1 pessoa pro comboio', '+50', 1], ['barraca', 'Vote em onde dormir', '+20', 0], ['camera', 'Poste a 1ª foto da viagem', '+30', 0]].map(([s, t, x, ok]) => `<div class="missao ${ok ? 'ok' : ''}">${selo(s, 40)}<span>${t}</span><b>${ok ? ic('ok', '#5E6B2E', 18) : x + ' XP'}</b></div>`).join('')}
      <div class="viagem-mini" style="background-image:linear-gradient(90deg,#2A1A0Ce0,#2A1A0C30),url('${F.comercio}')"><div><small>FALTAM 34 DIAS</small><b class="serif">Lisboa</b><span>4 de 6 carimbos</span></div>${ic('avancar', '#fff', 22)}</div>
    </div>${abas('Viagem')}`),
  tel('Viagem', 'tela inteira, rolando', `
    <div class="capa baixa" style="background-image:linear-gradient(#0000 30%,#2A1A0Cdd),url('${F.comercio}')"><div class="botoes">${ic('voltar', '#fff', 22)}<span>${ic('compartilhar', '#fff', 22)}</span></div><div class="rodape"><h1 class="serif">Lisboa</h1><small>12 – 18 DEZ · 5 viajantes</small></div></div>
    <div class="pad">
      <div class="livro"><small class="rot">PASSAPORTE DO COMBOIO</small>
        <div class="grade">${PASSOS.map(([s, r, ok]) => `<div class="slot ${ok ? 'ok' : ''}">${selo(s, 54, ok ? '' : 'apagado')}<small>${r}</small></div>`).join('')}</div>
        <div class="premio">${ic('ingresso', '#B97A22', 20)}<span>Complete os 6 e ganhe o <b>mapa offline grátis</b></span></div>
      </div>
      <div class="dica-norti">${norti('point', 72)}<div class="balao"><b>Bora fechar onde dormir?</b><span>A Casa na Graça tem 3 votos. +20 XP pra quem votar.</span><button class="peq">Votar</button></div></div>
      ${secaoT('Quem mais ajudou')}
      ${[['AN', 'Ana', 240, 1], ['PV', 'Você', 180, 0], ['JU', 'Ju', 150, 0]].map(([k, n, x, c], i) => `<div class="rank"><b class="pos">${i + 1}</b>${av(k, 32)}<span>${n}</span>${c ? ic('adm', '#B97A22', 18) : ''}<b>${x} XP</b></div>`).join('')}
      ${secaoT('Roteiro', '6 dias')}
      <div class="carrossel">${[[F.comercio, 'Dia 1', 'Baixa e Alfama'], [F.castelo, 'Dia 2', 'Castelo e Graça']].map(([f, d, t]) => `<div class="cartinha larga">${foto(f)}<small class="ouro">${d.toUpperCase()}</small><b>${t}</b></div>`).join('')}</div>
    </div>${abas('Viagem')}`, 'alta'),
  tel('Hoje', 'missões do dia', `
    <div class="pad top">
      <div class="linha"><small class="cinza">DIA 2 DE 6 · LISBOA</small><span class="chip">${ic('sol', '#B97A22', 16)} 21°</span></div>
      <div class="anel"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" stroke="#F1E4CF" stroke-width="12" fill="none"/><circle cx="60" cy="60" r="50" stroke="#B97A22" stroke-width="12" fill="none" stroke-dasharray="314" stroke-dashoffset="210" stroke-linecap="round" transform="rotate(-90 60 60)"/></svg><div><b class="serif">1/3</b><small>lugares de hoje</small></div></div>
      ${[[F.castelo, 'Castelo de São Jorge', '10:00', 'agora'], [F.vicente, 'São Vicente de Fora', '14:00', ''], [F.carmo, 'Fado no Carmo', '20:30', '']].map(([f, n, h, e], i) => `<div class="checkin ${i === 0 ? 'ok' : ''} ${e}">${foto(f)}<div><small>${h}</small><b>${n}</b></div>${i === 0 ? ic('feito', '#5E6B2E', 26) : e ? '<button class="peq">Cheguei</button>' : '<span class="xp-peq">+10 XP</span>'}</div>`).join('')}
    </div>${abas('Viagem')}`),
  tel('Contas', 'acertar dá carimbo', `
    <div class="pad top">
      <h1 class="serif">Contas</h1>
      <div class="saldo"><small>VOCÊ RECEBE</small><b class="serif">€ 48,20</b></div>
      ${[['AN', 'Ana te deve', '€ 30,00'], ['JU', 'Ju te deve', '€ 18,20']].map(([k, t, v]) => `<div class="gasto">${av(k, 32)}<div><b>${t}</b><small>cobrar no Pix</small></div><b class="verde">${v}</b></div>`).join('')}
      <div class="dica-norti peq-n">${norti('think', 60)}<div class="balao"><span>Acertem tudo antes de voltar e o comboio ganha o carimbo <b>Contas em dia</b>.</span></div></div>
      <button class="botao largo">${ic('mais', '#fff', 18)} Lançar gasto</button>
    </div>${abas('Contas')}`),
  tel('O que prende', 'a comemoração', `
    <div class="festa">
      <div class="confete"></div>
      ${norti('celebrate', 170)}
      <small class="ouro">CARIMBO NOVO</small>
      <h1 class="serif">Galera completa!</h1>
      ${selo('galera', 96, 'girado', 'escuro')}
      <p>Os 5 do comboio entraram. <b>+50 XP</b> pra todo mundo.</p>
      <button class="botao largo claro">${ic('compartilhar', '#3B2715', 18)} Postar no story</button>
      <button class="botao largo fantasma-c">Continuar</button>
    </div>`, 'escura'),
  tel('Onde cobra', 'a Norti oferece no marco certo', `
    <div class="pad top paywall centro">
      <span class="fechar">${ic('fechar', '#3B2715', 20)}</span>
      ${norti('love', 120)}
      <h1 class="serif">Faltam 34 dias. Bora deixar tudo pronto?</h1>
      <div class="selos-pagos">${[['wifi-desligado', 'Offline'], ['magica', 'Roteiro automático'], ['documento', 'Reservas do e-mail'], ['baixar', 'Livro da viagem']].map(([i, t]) => `<div>${ic(i, '#7B542F', 30)}<small>${t}</small></div>`).join('')}</div>
      <div class="plano on"><b>Passe da viagem</b><span>R$ 39,90</span><small>os 5 ganham · ganhe 2x XP</small></div>
      <div class="plano"><b>Livro impresso do comboio</b><span>R$ 129</span><small>depois da viagem</small></div>
      <button class="botao largo">Liberar Lisboa</button>
      <small class="miuda">Pagamento único. Restaurar compra</small>
    </div>`),
]

const css = `
:root{--texto:#3B2715;--suave:#7A5F45;--couro:#7B542F;--caramelo:#B97A22;--dourado:#E3A04A;--fundo:#FBF3E6;--areia:#F1E4CF;--verde:#5E6B2E;--vermelho:#C0573A}
*{box-sizing:border-box;margin:0;padding:0}body{background:#E6D8C2;font-family:'Plus Jakarta Sans',system-ui,sans-serif;color:var(--texto);padding:28px}
.serif{font-family:'Fraunces',serif;font-weight:700;letter-spacing:-.01em}.cinza{color:var(--suave)}.ouro{color:var(--caramelo);font-weight:800;letter-spacing:.1em;font-size:10.5px}.verde{color:var(--verde)}.centro{text-align:center}
.modelo{margin-bottom:46px}.modelo>header{margin:0 0 16px 6px;max-width:1100px}.modelo>header h2{font:700 30px 'Fraunces',serif}.modelo>header p{color:var(--suave);font-size:15px;margin-top:4px}
.modelo>header .tags{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}.tags span{background:#fff;border-radius:99px;padding:5px 12px;font-size:12.5px;font-weight:600}.tags b{color:var(--caramelo)}
.telas{display:flex;gap:20px;flex-wrap:wrap;align-items:flex-start}.cel{width:330px}.cel figcaption{margin:0 0 8px 6px;display:grid}.cel figcaption b{font-size:14px}.cel figcaption small{font-size:12px;color:var(--suave)}
.tela{width:330px;height:700px;border-radius:44px;overflow:hidden;position:relative;background:var(--fundo);border:7px solid #1E140B;box-shadow:0 18px 40px #4a2e1440}.tela.alta{height:1180px}
.status{position:absolute;top:0;left:0;right:0;height:40px;z-index:9;display:flex;align-items:center;padding:0 26px;font-size:13px}.status i{width:90px;height:26px;background:#1E140B;border-radius:20px;position:absolute;left:50%;top:8px;transform:translateX(-50%)}.escura .status{color:#fff}
.ic,.selo{display:inline-flex;flex:none}.ic svg,.selo svg{width:100%;height:100%}.selo.apagado{opacity:.28;filter:grayscale(1)}.norti{object-fit:contain;flex:none}
.pad{padding:14px 18px 100px}.pad.top{padding-top:50px}.linha{display:flex;justify-content:space-between;align-items:center;gap:8px}
.av{border-radius:50%;color:#fff;font-weight:800;display:inline-grid;place-items:center;flex:none;border:2px solid transparent}.av.apag{opacity:.35}.rostos{display:inline-flex}.rostos .av{margin-left:-7px}
.foto{display:block;background-size:cover;background-position:center;border-radius:16px;background-color:#ddd}
h1{font-size:30px;line-height:1.08;margin:6px 0 14px}h2{font-size:24px}
.sec{display:flex;justify-content:space-between;align-items:baseline;margin:20px 0 10px}.sec h3{font:700 18px 'Fraunces',serif}.sec small{font-size:12px;font-weight:700;color:var(--caramelo)}
.botao{border:0;background:var(--couro);color:#fff;font:700 15px 'Plus Jakarta Sans';border-radius:16px;padding:14px 18px;display:inline-flex;gap:8px;align-items:center;justify-content:center}.botao.largo{width:100%;margin-top:10px}.botao.claro{background:#FFF6E8;color:var(--texto)}
.peq{border:0;background:var(--couro);color:#fff;font:700 12px 'Plus Jakarta Sans';border-radius:12px;padding:7px 12px;display:inline-flex;gap:4px;align-items:center}.peq.claro{background:#fff;color:var(--couro);border:1.5px solid #E5D2B0}
.chip{background:#fff;border-radius:99px;padding:5px 10px;font-size:12.5px;font-weight:700;display:inline-flex;gap:4px;align-items:center}.verde-c{background:#EEF0DF;color:var(--verde)}
.etq{position:absolute;top:14px;left:14px;background:#FFF6E8;border-radius:99px;padding:5px 11px;font-size:11px;font-weight:800;letter-spacing:.06em;display:inline-flex;gap:4px;align-items:center}
.abas{position:absolute;left:0;right:0;bottom:0;display:grid;grid-template-columns:repeat(4,1fr);padding:10px 8px 24px;background:#fffffff2;border-top:1px solid #F1E6D4;z-index:8}.abas span{display:grid;justify-items:center;gap:3px}.abas b{font-size:10.5px;color:#8A7058}.abas .on b{color:var(--caramelo)}
.carrossel{display:flex;gap:10px;overflow:hidden;margin-right:-18px}.cartinha{width:132px;flex:none}.cartinha .foto{height:150px;margin-bottom:6px}.cartinha b{display:block;font-size:14px}.cartinha small{font-size:12px;color:var(--suave)}.cartinha.larga{width:170px}.cartinha.larga .foto{height:120px}
.ativ{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #EFE2CC;font-size:13.5px}.ativ span{flex:1}.ativ .av,.ativ .ic{flex:none}.ativ small{color:var(--suave);font-size:12px}
.barra{display:block;height:6px;background:#ffffff40;border-radius:6px;overflow:hidden}.barra i{display:block;height:100%;background:var(--dourado)}
/* M1 */
.heroi{height:290px;border-radius:26px;background-size:cover;background-position:center;position:relative;margin-top:14px;box-shadow:0 12px 26px #4a2e1433}.heroi .rodape{position:absolute;left:16px;right:16px;bottom:16px;color:#fff;display:grid;gap:6px}.heroi small{font-size:10.5px;letter-spacing:.12em;font-weight:700;color:#F5E9D6}.heroi h2{font-size:38px;color:#fff;line-height:1}.claro{color:#F5E9D6;font-size:13px;font-weight:600}
.capa{height:300px;background-size:cover;background-position:center;position:relative}.capa.baixa{height:230px}.capa .botoes{position:absolute;top:50px;left:18px;right:18px;display:flex;justify-content:space-between}.capa .rodape{position:absolute;left:20px;bottom:18px;color:#fff}.capa h1{color:#fff;font-size:44px;margin:2px 0}.capa small{font-size:11px;letter-spacing:.1em;font-weight:700;color:#F5E9D6}
.proximo{display:flex;gap:12px;align-items:center;background:#fff;border-radius:20px;padding:14px;margin-top:-34px;position:relative;box-shadow:0 10px 24px #4a2e1420}.proximo div{display:grid}.proximo b{font-size:17px}.proximo span{font-size:12.5px}
.votos{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}.voto .foto{height:96px;margin-bottom:6px}.voto b{display:block;font-size:13.5px}.voto small{display:block;font-size:12px;color:var(--suave);margin-bottom:4px}
.mini-contas{display:flex;justify-content:space-between;background:#fff;border-radius:18px;padding:14px 16px}.mini-contas div{display:grid}.mini-contas .dir{text-align:right}.mini-contas b{font-size:24px}.mini-contas small{font-size:12px}
.afiliado{display:flex;gap:12px;align-items:center;background:#fff;border-radius:18px;padding:10px}.afiliado .foto{width:60px;height:60px;border-radius:14px}.afiliado div{flex:1;display:grid;gap:3px}.afiliado b{font-size:14px}.afiliado small{font-size:12px;color:var(--suave);display:flex;gap:3px;align-items:center}
.lista-ok div{display:flex;gap:10px;align-items:center;padding:11px 0;border-bottom:1px solid #EFE2CC;font-size:14px}.lista-ok span{flex:1}.lista-ok small{font-weight:700;color:var(--caramelo);font-size:12px}
.agora-foto{height:300px;border-radius:26px;background-size:cover;background-position:center;position:relative;margin-bottom:6px}.agora-foto .rodape{position:absolute;left:16px;right:16px;bottom:16px;display:flex;justify-content:space-between;align-items:end;gap:8px}.agora-foto h2{color:#fff;font-size:24px;line-height:1.05}
.ir{border:0;background:#FFF6E8;border-radius:14px;padding:9px 12px;font:700 13px 'Plus Jakarta Sans';display:inline-flex;gap:5px;align-items:center;white-space:nowrap}
.lt{display:grid;grid-template-columns:50px 1fr;padding:11px 0;border-bottom:1px solid #EFE2CC}.lt small{grid-row:span 2;font-weight:800;color:var(--suave);font-size:13px}.lt b{font-size:15px}.lt span{font-size:12.5px}
.saldo{background:var(--couro);color:#FFF6E8;border-radius:24px;padding:18px;display:grid;gap:4px}.saldo small{font-size:11px;letter-spacing:.12em;font-weight:700}.saldo b{font-size:48px;line-height:1.05}.saldo .botao{background:#FFF6E8;color:var(--texto);margin-top:8px}
.cambio{display:flex;gap:12px;align-items:center;background:#EEF0DF;border-radius:18px;padding:12px 14px;margin-top:12px}.cambio div{display:grid}.cambio b{font-size:14px}.cambio small{font-size:12px;color:var(--verde)}
.gasto{display:flex;gap:10px;align-items:center;padding:11px 0;border-bottom:1px solid #EFE2CC}.gasto div{flex:1;display:grid}.gasto b{font-size:14px}.gasto small{font-size:12px;color:var(--suave)}
.bloqueio{position:absolute;inset:0;background-size:cover;background-position:center;padding:90px 14px 0;color:#fff;text-align:center}.hora-bloq{font:300 76px 'Plus Jakarta Sans';line-height:1}.data-bloq{display:block;margin-bottom:40px;font-size:15px}
.notif{display:flex;gap:10px;text-align:left;background:#ffffffd0;backdrop-filter:blur(20px);color:#1E140B;border-radius:20px;padding:12px;margin-bottom:8px}.notif .app{width:34px;height:34px;border-radius:9px;background:var(--couro);display:grid;place-items:center;flex:none}.notif div{display:grid;gap:1px}.notif small{font-size:11px;color:#6a5a4a}.notif b{font-size:14px}.notif span{font-size:13px}
.paywall{position:relative}.fechar{position:absolute;right:18px;top:52px}.paywall h1{font-size:27px;margin-top:8px}.paywall p{font-size:14px;margin:-6px 0 12px}
.previa{height:120px;border-radius:18px;background-size:cover;background-position:center;position:relative;margin-bottom:12px}
.beneficios{list-style:none;display:grid;gap:9px;margin-bottom:14px}.beneficios li{display:flex;gap:10px;align-items:center;font-size:14px;font-weight:600}
.plano{display:grid;grid-template-columns:1fr auto;border:1.5px solid #E5D2B0;border-radius:16px;padding:10px 14px;margin-bottom:8px;background:#fff}.plano span{font-weight:800;font-size:14px}.plano small{font-size:12px;color:var(--suave)}.plano.on{border:2px solid var(--caramelo);background:#FFF8EC}
.miuda{display:block;text-align:center;font-size:11px;color:var(--suave);margin-top:8px}
/* M2 */
.logo{font-size:26px;letter-spacing:-.03em}.stories{display:flex;gap:10px;margin:12px -18px 4px 0;overflow:hidden}.story{display:grid;justify-items:center;gap:4px;flex:none}.story small{font-size:11.5px;font-weight:600}
.story.novo .av{box-shadow:0 0 0 2.5px var(--fundo),0 0 0 5px var(--caramelo)}.mais-av{width:54px;height:54px;background:#fff!important;border:1.5px dashed #CDB38E}
.post{margin-top:12px;display:grid;gap:8px}.post-topo{display:flex;gap:10px;align-items:center}.post-topo div{display:grid}.post-topo small{font-size:12px;color:var(--suave)}.post-foto{height:300px;border-radius:20px}
.post-acoes{display:flex;gap:6px;align-items:center}.post-acoes .dir{margin-left:auto}.post b{font-size:15px}
.decisao{background:#fff;border-radius:20px;padding:14px;margin-bottom:10px;display:grid;gap:10px}.duelo{display:grid;grid-template-columns:1fr 1fr;gap:10px}.duelo .foto{height:100px;margin-bottom:6px}.duelo b{display:block;font-size:13px}.duelo small{font-size:11.5px;color:var(--suave)}.duelo .barra{background:#F1E4CF;margin:5px 0 3px}.duelo .barra i{background:var(--caramelo)}
.falta{display:flex;align-items:center;gap:8px;font-size:12.5px}.falta span{flex:1;color:var(--suave)}
.enquete b{font-size:15px}.opcao{display:flex;justify-content:space-between;padding:10px 12px;border-radius:12px;background:var(--areia);font-size:13.5px}.opcao.on{background:linear-gradient(90deg,#E3A04A66 60%,var(--areia) 60%);font-weight:700}
.mapinha{position:absolute;top:0;left:0;right:0;height:380px}.mapinha svg{width:100%;height:100%}.pino{position:absolute}.pino .av{box-shadow:0 4px 10px #0003;border:3px solid #fff}.pino.eu .av{border-color:var(--caramelo)}.flut{position:absolute;top:52px;right:16px}
.folha{position:absolute;left:0;right:0;top:340px;bottom:0;background:var(--fundo);border-radius:26px 26px 0 0;padding:10px 18px;box-shadow:0 -8px 20px #0001}.pega{display:block;width:40px;height:5px;border-radius:5px;background:#DCC8A6;margin:0 auto 10px}.folha h2{font-size:22px}.peq2{padding:10px 14px}
.chat{display:grid;gap:10px;margin-top:4px}.bolha{display:flex;gap:8px;align-items:flex-end}.bolha>div{background:#fff;border-radius:18px 18px 18px 4px;padding:10px 12px;display:grid;gap:2px;max-width:240px;position:relative}.bolha b{font-size:13.5px}.bolha small{font-size:12px;color:var(--suave)}
.bolha.eu{justify-content:flex-end}.bolha.eu>div{background:var(--couro);color:#fff;border-radius:18px 18px 4px 18px}.bolha.eu small{color:#F5E9D6}.reacoes{position:absolute;right:8px;bottom:-10px;background:#fff;border-radius:99px;padding:2px 7px;font-size:11px;font-weight:700;display:flex;gap:3px;align-items:center;box-shadow:0 2px 6px #0002}
.recibo{height:70px;width:120px;margin-top:6px;border-radius:10px}.acerto{justify-self:center;background:#EEF0DF;color:var(--verde);border-radius:99px;padding:6px 12px;font-size:12px;font-weight:700;display:flex;gap:6px;align-items:center}
.digitar{position:absolute;left:14px;right:14px;bottom:88px;display:flex;gap:8px;align-items:center;background:#fff;border-radius:99px;padding:6px 6px 6px 14px;box-shadow:0 6px 16px #0001}.digitar .campo{flex:1;color:var(--suave);font-size:13.5px}.redondo{width:40px;height:40px;border-radius:50%;border:0;background:var(--caramelo);display:grid;place-items:center}
.falta-voce{display:inline-block;margin-left:-14px}.duelo.grande .foto{height:150px}.centro h1{margin-top:22px}.centro p{font-size:14px;margin-bottom:16px}
.coroas{display:flex;justify-content:center;gap:4px;margin:14px 0 4px}.coroas span{display:grid;justify-items:center}.divide{display:flex;align-items:baseline;gap:8px;justify-content:center;margin:6px 0}.divide b{font:700 30px 'Fraunces';white-space:nowrap}.divide span{color:var(--verde);font-weight:700;font-size:14px}
/* M3 */
.nivel{display:flex;gap:12px;align-items:center;background:#fff;border-radius:22px;padding:10px 14px 10px 6px}.nivel div{flex:1;display:grid;gap:3px}.nivel b{font-size:24px}.xp{height:10px;background:var(--areia);border-radius:10px;overflow:hidden}.xp i{display:block;height:100%;background:linear-gradient(90deg,var(--dourado),var(--caramelo))}.nivel small{font-size:11.5px}
.seq{display:flex;align-items:center;gap:8px;margin-top:10px;background:#FFF1DA;border-radius:18px;padding:10px 12px}.seq b{font-size:14px;flex:1}.dias7{display:flex;gap:3px}.dias7 i{width:20px;height:20px;border-radius:50%;background:#fff;font-size:10px;font-style:normal;font-weight:800;display:grid;place-items:center;color:var(--suave)}.dias7 i.on{background:var(--caramelo);color:#fff}
.missao{display:flex;gap:10px;align-items:center;background:#fff;border-radius:16px;padding:8px 12px;margin-bottom:8px;font-size:13.5px;font-weight:600}.missao span{flex:1}.missao b{color:var(--caramelo);font-size:13px}.missao.ok span{color:var(--suave);text-decoration:line-through}
.viagem-mini{margin-top:14px;height:110px;border-radius:22px;background-size:cover;background-position:center;display:flex;align-items:center;justify-content:space-between;padding:16px;color:#fff}.viagem-mini div{display:grid}.viagem-mini small{font-size:10.5px;letter-spacing:.1em;font-weight:700;color:#F5E9D6}.viagem-mini b{font-size:28px}.viagem-mini span{font-size:12.5px}
.livro{background:#F6EAD3;border:1px solid #E5D2B0;border-radius:22px;padding:14px;margin-top:-30px;position:relative;background-image:radial-gradient(#e9d8b9 1px,transparent 1px);background-size:14px 14px}.rot{font-size:10.5px;letter-spacing:.12em;font-weight:800;color:var(--suave)}
.grade{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0}.slot{display:grid;justify-items:center;gap:2px;padding:6px 0;border:1.5px dashed #D6BE99;border-radius:14px}.slot small{font-size:11px;font-weight:700;color:var(--suave)}.slot.ok{border-color:transparent}.slot.ok .selo{transform:rotate(-8deg)}
.premio{display:flex;gap:8px;align-items:center;background:#fff;border-radius:12px;padding:8px 10px;font-size:12.5px}
.dica-norti{display:flex;align-items:flex-end;gap:2px;margin-top:14px}.balao{background:#fff;border-radius:18px 18px 18px 4px;padding:12px;display:grid;gap:4px;flex:1}.balao b{font-size:14px}.balao span{font-size:12.5px;color:var(--suave)}.balao .peq{justify-self:start;margin-top:4px}.peq-n{margin:14px 0 4px}
.rank{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #EFE2CC;font-size:14px}.rank span{flex:1;font-weight:600}.pos{width:16px;color:var(--suave)}
.anel{display:flex;align-items:center;gap:14px;margin:14px 0}.anel svg{width:110px;height:110px}.anel div{display:grid}.anel b{font-size:40px}.anel small{color:var(--suave)}
.checkin{display:flex;gap:12px;align-items:center;background:#fff;border-radius:18px;padding:8px;margin-bottom:10px}.checkin .foto{width:64px;height:64px;border-radius:14px}.checkin div{flex:1;display:grid}.checkin small{font-size:12px;font-weight:800;color:var(--suave)}.checkin b{font-size:14.5px}.checkin.ok b{color:var(--suave)}.checkin.agora{border:2px solid var(--caramelo)}.xp-peq{font-size:12px;font-weight:800;color:var(--caramelo);padding-right:6px}
.festa{position:absolute;inset:0;background:radial-gradient(circle at 50% 30%,#7B542F,#2A1A0C 70%);display:grid;justify-items:center;align-content:center;gap:8px;padding:30px 24px;text-align:center;color:#FFF6E8}.festa h1{color:#FFF6E8;font-size:34px;margin:0}.festa p{font-size:14px;color:#F5E9D6;margin:4px 0 10px}.girado{transform:rotate(-10deg);filter:drop-shadow(0 6px 14px #0006)}
.confete{position:absolute;inset:0;background-image:radial-gradient(#E3A04A 2px,transparent 3px),radial-gradient(#C0573A 2px,transparent 3px),radial-gradient(#6E7D36 2px,transparent 3px);background-size:60px 70px,80px 60px,70px 90px;background-position:0 0,20px 30px,40px 10px;opacity:.55}.fantasma-c{background:transparent;color:#F5E9D6;border:1.5px solid #ffffff40}
.selos-pagos{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:4px 0 12px}.selos-pagos div{background:#fff;border-radius:16px;padding:12px 8px;display:grid;justify-items:center;gap:4px}.selos-pagos small{font-size:12px;font-weight:700}
.paywall.centro .plano{text-align:left}
`
const modelo = (id, titulo, frase, tags, telas) => `<section class="modelo ${id}"><header><h2>${titulo}</h2><p>${frase}</p><div class="tags">${tags.map(([a, b]) => `<span><b>${a}:</b> ${b}</span>`).join('')}</div></header><div class="telas">${telas.join('')}</div></section>`
const html = `<!doctype html><html lang="pt-BR" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Modelos do Tripwave</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"><style>${css}</style></head><body>
<h1 class="serif" style="font-size:36px;margin:0 0 6px 6px">Tripwave · 3 modelos (rodada 2)</h1>
<p style="margin:0 0 30px 6px;color:#7A5F45;max-width:1000px">Mais ricos que a rodada 1, mas organizados em seções. Cada modelo tem um jeito diferente de <b>prender</b> o usuário e de <b>cobrar</b>. Todos seguem a pesquisa de mercado (reports/): o essencial do grupo é grátis, o dinheiro vem do <b>Passe da viagem</b> (um paga, o comboio inteiro ganha) e de <b>parceiros</b> na hora certa. Preços são de exemplo.</p>
${modelo('m1', '1 · Revista de viagem', 'Jeito Airbnb: calmo, fotos grandes, seções que você rola (comboio agora, roteiro, onde dormir, contas, passeios). Prende pelos avisos certos na hora certa.', [['Prende', 'avisos úteis (voto, câmbio, contagem)'], ['Cobra', 'Passe da viagem + passeios, seguro e eSIM de parceiros']], M1)}
${modelo('m2', '2 · Comboio ao vivo', 'Jeito Instagram: o grupo em primeiro lugar. Stories de quem tem novidade, decisões com voto, mapa de onde está cada um, contas como conversa.', [['Prende', 'o grupo: "falta só você", cutucar, reações'], ['Cobra', 'Passe da viagem dividido no Pix entre o comboio']], M2)}
${modelo('m3', '3 · Jogo do viajante', 'Jeito Duolingo: a Norti guia, nível de viajante, sequência de dias, missões, passaporte de carimbos e ranking de quem mais ajudou.', [['Prende', 'XP, sequência, missões, comemoração'], ['Cobra', 'Passe no marco certo + livro impresso depois da viagem']], M3)}
</body></html>`
writeFileSync(new URL('./modelos.html', import.meta.url), html)
console.log('ok', html.length)
