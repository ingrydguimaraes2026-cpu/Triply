// Regras da hospedagem (spec 011): moram no @together/core (o app usa também).
// Importa o arquivo direto (/hospedagem) pra os testes no Node não precisarem abrir o core inteiro.
export * from '@together/core/hospedagem'
export { linkDoMapaDaCidade as linkDoMapa } from '@together/core/hospedagem'
