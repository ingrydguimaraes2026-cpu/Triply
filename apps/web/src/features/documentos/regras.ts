// As regras moram no @together/core (web e app usam a mesma tabela). Importa o arquivo direto
// (/documentos-regras) pra os testes no Node não precisarem abrir o core inteiro.
export * from '@together/core/documentos-regras'
