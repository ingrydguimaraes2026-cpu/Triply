# 110. Avisos no app do celular (push do Expo)

**Fase:** 2 (paridade do mobile) · **Tamanho:** M · **Depende de:** 032, 033 · **Status:** Pronto pra testar (código) · banco aplicado · função publicada (30/10)

## Objetivo
Quem usa o app instalado recebe os lembretes (1 h antes do trajeto e do encontro, prazo de cancelamento) no celular, igual a quem usa o site. Tocar no aviso abre a viagem certa.

## Por que
- Fila #14 (M2): os lembretes da spec 032 só chegavam pelo site (Web Push). O app nativo não tem Web Push: precisa do serviço de push do Expo.

## Inclui
- Perfil → cartão **"Avisos no celular"**: botão "Ligar avisos" (pede a permissão e salva o token do aparelho), "Abrir ajustes" se a pessoa bloqueou, e as chaves da spec 033 (lembretes, resumo da noite, fotos), que valem pro site e pro app.
- Ao abrir o app, quem já ligou tem o token salvo de novo (o token pode mudar).
- Tocar no aviso: trajeto abre Transportes; encontro e cancelamento abrem a viagem. Já troca pra viagem do aviso.
- Sair da conta faz este celular parar de receber os avisos dela.
- A função `lembretes` manda pelo site **e** pelo app. Aparelho que desinstalou o app sai da lista sozinho.

## Não inclui (fica pra depois)
- Resumo da noite, fotos, menções e "cheguei bem" pelo app (mesma ideia: copiar `mandarPeloExpo` pras outras funções).
- App no navegador (Expo web): continua sem push; o cartão explica e manda usar o site.

## Dados
- **Migration:** `supabase/migrations/20261030162108_push_do_app.sql`.
- `push_expo` (`token` único, `plataforma` ios/android): cada um vê e apaga só os seus; gravar só por `registrar_push_expo` (passa o aparelho pra conta que logou por último).
- **Função:** `supabase/functions/lembretes` (`mandarPeloExpo`, sem segredo novo).

## Pra funcionar de verdade (depende do Victor)
1. **Projeto no EAS:** rodar `eas init` em `apps/mobile` (cria `extra.eas.projectId` no `app.json`). Sem ele o cartão mostra "ainda não estão prontos nesta versão".
2. **Build de desenvolvimento** (`eas build --profile development`): o Expo Go não recebe push remoto no Android.
3. ~~Aplicar a migration e publicar a função~~ (feito em 30/10).

## Quem pode o quê
| Ação | Dono do aparelho | Outra pessoa | Sem login |
|---|---|---|---|
| Registrar o token | ✅ (pela função) | ❌ | ❌ |
| Ver / apagar o token | ✅ | ❌ | ❌ |
| Ler tokens pra mandar aviso | só o servidor | | |

## Critérios de aceite
- [x] Token só entra pela função; cada um vê e apaga só os seus (testado no banco).
- [x] Mesmo celular em outra conta passa pra ela (testado no banco).
- [x] Token torto ou plataforma estranha não entra (testado no banco).
- [x] No navegador o Perfil explica que o aviso é só no app instalado e mostra as chaves (testado em localhost:8089).
- [ ] No celular (build de desenvolvimento): ligar avisos, receber um lembrete de verdade e o toque abrir Transportes.

## Dicas pra implementar
- Mobile: `src/lib/avisos.ts` (e `avisos.web.ts`, sem expo-notifications), `src/ui/AvisosNoCelular.tsx`, `src/ui/AbrirAvisos.tsx` (na raiz, `_layout.tsx`).
- Testes: `apps/web/tests/banco-specs.test.mjs`, seção "110".
