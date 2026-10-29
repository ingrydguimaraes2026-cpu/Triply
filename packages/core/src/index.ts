// Fonte única da lógica compartilhada. Web e mobile importam de '@together/core'.
export * from './dinheiro'
export * from './termometro'
export * from './clima'
export * from './compartilhar'
export * from './agenda'
export * from './notificacoes'
export * from './supabase'
export * from './acertos'
export * from './dados'
export type * from './database'
// Tipos de auth reexportados pra quem usa o core não precisar depender direto do supabase-js
export type { Session, User } from '@supabase/supabase-js'
