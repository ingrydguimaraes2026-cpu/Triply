# 059. Ferramentas do dia (na tela Hoje)

**Fase:** 2 · **Tamanho:** P · **Depende de:** 012, 058 · **Status:** Pronto pra testar (web)

## Objetivo
Na tela Hoje, as ferramentas de rua: quanto dá em reais, gorjeta dividida, endereço pro motorista, banheiro grátis perto, onde comer e onde guardar a mala.

## Por que
- Catálogo J2 (conversor), J4 (mostrar pro motorista), J6 (gorjeta), C11 (banheiro grátis, ideia do Flush), C12 (restaurante, ideia do TheFork), E12 (guarda-volumes, ideia do Nannybag). Ver `docs/ideias-de-outros-apps.md`.

## Inclui
- **Quanto dá em reais?** Valor na moeda do país de hoje → reais pela cotação de hoje (Frankfurter), com e sem IOF de 3,5%.
- **Gorjeta e divisão:** conta, % (vem com o costume do país: EUA 18%, Japão 0%, Europa 5–10%), pessoas → "por pessoa", gorjeta, total e a sobra dos centavos.
- **Mostrar endereço pro motorista:** endereço da hospedagem de hoje em tela cheia, letra enorme (toque fecha).
- **Banheiro grátis perto:** pede a localização (ou usa o centro da cidade), busca no OpenStreetMap num raio de 800 m e lista grátis primeiro, com distância, "acessível" e link pra ir a pé.
- **Comer por perto:** Google Maps de restaurantes perto e busca do TheFork na cidade.
- **Guardar as malas:** busca de Nannybag, Bounce e Radical Storage na cidade.

## Não inclui (fica pra depois)
- Endereço traduzido pro idioma local (J4 completo): mostra o endereço como foi digitado.
- Lançar a conta da gorjeta direto como gasto.
- Parcerias/afiliados (só links de busca).

## Dados
- Nenhuma mudança no banco. APIs abertas: Frankfurter (câmbio) e Overpass/OpenStreetMap (banheiros), sem chave.

## Critérios de aceite
- [x] Conversor com/sem IOF; gorjeta por país e divisão; banheiros grátis primeiro por distância; links (testado: `ferramentas.test.mjs`).
- [ ] No celular, em Nice: "Procurar perto de mim" lista banheiros e abre o Maps a pé.
