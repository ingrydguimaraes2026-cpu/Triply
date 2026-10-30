// Gerado a partir do banco do Supabase. Não edite à mão: gere de novo quando o banco mudar.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      comentarios: {
        Row: { autor: string; criado_em: string; id: string; post_id: string; texto: string }
        Insert: { autor?: string; criado_em?: string; id?: string; post_id: string; texto: string }
        Update: { autor?: string; criado_em?: string; id?: string; post_id?: string; texto?: string }
        Relationships: [
          {
            foreignKeyName: "comentarios_autor_fkey"
            columns: ["autor"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      curtidas: {
        Row: { criado_em: string; post_id: string; usuario_id: string }
        Insert: { criado_em?: string; post_id: string; usuario_id?: string }
        Update: { criado_em?: string; post_id?: string; usuario_id?: string }
        Relationships: [
          {
            foreignKeyName: "curtidas_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curtidas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      comboio_membros: {
        Row: {
          entrou_em: string
          papel: string
          usuario_id: string
          viagem_id: string
        }
        Insert: {
          entrou_em?: string
          papel?: string
          usuario_id: string
          viagem_id: string
        }
        Update: {
          entrou_em?: string
          papel?: string
          usuario_id?: string
          viagem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comboio_membros_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comboio_membros_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      comentarios_item: {
        Row: {
          autor: string
          criado_em: string
          gasto_id: string | null
          hospedagem_id: string | null
          id: string
          lugar_id: string | null
          texto: string
          viagem_id: string
        }
        Insert: {
          autor?: string
          criado_em?: string
          gasto_id?: string | null
          hospedagem_id?: string | null
          id?: string
          lugar_id?: string | null
          texto: string
          viagem_id: string
        }
        Update: {
          autor?: string
          criado_em?: string
          gasto_id?: string | null
          hospedagem_id?: string | null
          id?: string
          lugar_id?: string | null
          texto?: string
          viagem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comentarios_item_autor_fkey"
            columns: ["autor"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_item_gasto_id_fkey"
            columns: ["gasto_id"]
            isOneToOne: false
            referencedRelation: "gastos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_item_hospedagem_id_fkey"
            columns: ["hospedagem_id"]
            isOneToOne: false
            referencedRelation: "hospedagens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_item_lugar_id_fkey"
            columns: ["lugar_id"]
            isOneToOne: false
            referencedRelation: "lugares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_item_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      compras_cambio: {
        Row: {
          cotacao: number | null
          criado_em: string
          data: string
          id: string
          moeda_destino: string
          moeda_origem: string
          usuario_id: string
          valor_destino: number
          valor_origem: number
          viagem_id: string
        }
        Insert: {
          cotacao?: number | null
          criado_em?: string
          data?: string
          id?: string
          moeda_destino?: string
          moeda_origem?: string
          usuario_id?: string
          valor_destino: number
          valor_origem: number
          viagem_id: string
        }
        Update: {
          cotacao?: number | null
          criado_em?: string
          data?: string
          id?: string
          moeda_destino?: string
          moeda_origem?: string
          usuario_id?: string
          valor_destino?: number
          valor_origem?: number
          viagem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compras_cambio_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_cambio_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      convites: {
        Row: {
          codigo: string
          criado_em: string
          criado_por: string
          expira_em: string
          viagem_id: string
        }
        Insert: {
          codigo?: string
          criado_em?: string
          criado_por?: string
          expira_em?: string
          viagem_id: string
        }
        Update: {
          codigo?: string
          criado_em?: string
          criado_por?: string
          expira_em?: string
          viagem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "convites_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "convites_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      destinos: {
        Row: {
          chegada: string | null
          id: string
          latitude: number | null
          longitude: number | null
          nome: string
          ordem: number
          pais: string | null
          saida: string | null
          viagem_id: string
        }
        Insert: {
          chegada?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome: string
          ordem?: number
          pais?: string | null
          saida?: string | null
          viagem_id: string
        }
        Update: {
          chegada?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome?: string
          ordem?: number
          pais?: string | null
          saida?: string | null
          viagem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "destinos_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_pessoais: {
        Row: {
          atualizado_em: string
          nacionalidades: string[]
          passaporte_validade: string | null
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string
          nacionalidades?: string[]
          passaporte_validade?: string | null
          usuario_id?: string
        }
        Update: {
          atualizado_em?: string
          nacionalidades?: string[]
          passaporte_validade?: string | null
          usuario_id?: string
        }
        Relationships: []
      }
      documentos_status: {
        Row: {
          atualizado_em: string
          item: string
          status: string
          usuario_id: string
          viagem_id: string
        }
        Insert: {
          atualizado_em?: string
          item: string
          status?: string
          usuario_id: string
          viagem_id: string
        }
        Update: {
          atualizado_em?: string
          item?: string
          status?: string
          usuario_id?: string
          viagem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_status_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_status_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      hospedagem_votos: {
        Row: {
          criado_em: string
          hospedagem_id: string
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          hospedagem_id: string
          usuario_id: string
        }
        Update: {
          criado_em?: string
          hospedagem_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hospedagem_votos_hospedagem_id_fkey"
            columns: ["hospedagem_id"]
            isOneToOne: false
            referencedRelation: "hospedagens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospedagem_votos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      hospedagens: {
        Row: {
          cancelamento_gratis_ate: string | null
          checkin: string | null
          checkout: string | null
          codigo_porta: string | null
          criado_em: string
          criado_por: string
          destino_id: string | null
          endereco: string | null
          escolhida: boolean
          hora_checkin: string | null
          hora_checkin_limite: string | null
          hora_checkout: string | null
          id: string
          link: string | null
          moeda: string
          nome: string
          observacao: string | null
          preco_total: number | null
          regras_casa: string | null
          self_checkin: boolean
          viagem_id: string
          wifi_rede: string | null
          wifi_senha: string | null
        }
        Insert: {
          cancelamento_gratis_ate?: string | null
          checkin?: string | null
          checkout?: string | null
          codigo_porta?: string | null
          criado_em?: string
          criado_por?: string
          destino_id?: string | null
          endereco?: string | null
          escolhida?: boolean
          hora_checkin?: string | null
          hora_checkin_limite?: string | null
          hora_checkout?: string | null
          id?: string
          link?: string | null
          moeda?: string
          nome: string
          observacao?: string | null
          preco_total?: number | null
          regras_casa?: string | null
          self_checkin?: boolean
          viagem_id: string
          wifi_rede?: string | null
          wifi_senha?: string | null
        }
        Update: {
          cancelamento_gratis_ate?: string | null
          checkin?: string | null
          checkout?: string | null
          codigo_porta?: string | null
          criado_em?: string
          criado_por?: string
          destino_id?: string | null
          endereco?: string | null
          escolhida?: boolean
          hora_checkin?: string | null
          hora_checkin_limite?: string | null
          hora_checkout?: string | null
          id?: string
          link?: string | null
          moeda?: string
          nome?: string
          observacao?: string | null
          preco_total?: number | null
          regras_casa?: string | null
          self_checkin?: boolean
          viagem_id?: string
          wifi_rede?: string | null
          wifi_senha?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hospedagens_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospedagens_destino_id_fkey"
            columns: ["destino_id"]
            isOneToOne: false
            referencedRelation: "destinos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospedagens_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      fotos: {
        Row: {
          caminho: string
          criado_em: string
          destino_id: string | null
          enviada_por: string
          id: string
          legenda: string | null
          ordem: number
          post_id: string
          viagem_id: string
        }
        Insert: {
          caminho: string
          criado_em?: string
          destino_id?: string | null
          enviada_por?: string
          id?: string
          legenda?: string | null
          ordem?: number
          post_id: string
          viagem_id: string
        }
        Update: {
          caminho?: string
          criado_em?: string
          destino_id?: string | null
          enviada_por?: string
          id?: string
          legenda?: string | null
          ordem?: number
          post_id?: string
          viagem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fotos_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fotos_destino_id_fkey"
            columns: ["destino_id"]
            isOneToOne: false
            referencedRelation: "destinos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fotos_enviada_por_fkey"
            columns: ["enviada_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fotos_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      gasto_divisoes: {
        Row: {
          gasto_id: string
          usuario_id: string
          valor: number
        }
        Insert: {
          gasto_id: string
          usuario_id: string
          valor: number
        }
        Update: {
          gasto_id?: string
          usuario_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "gasto_divisoes_gasto_id_fkey"
            columns: ["gasto_id"]
            isOneToOne: false
            referencedRelation: "gastos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gasto_divisoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      gastos: {
        Row: {
          categoria: string
          criado_em: string
          criado_por: string
          data: string
          descricao: string
          id: string
          moeda: string
          pago_por: string
          pessoal: boolean
          rascunho: boolean
          valor: number
          viagem_id: string
        }
        Insert: {
          categoria?: string
          criado_em?: string
          criado_por?: string
          data?: string
          descricao: string
          id?: string
          moeda?: string
          pago_por: string
          pessoal?: boolean
          rascunho?: boolean
          valor: number
          viagem_id: string
        }
        Update: {
          categoria?: string
          criado_em?: string
          criado_por?: string
          data?: string
          descricao?: string
          id?: string
          moeda?: string
          pago_por?: string
          pessoal?: boolean
          rascunho?: boolean
          valor?: number
          viagem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gastos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_pago_por_fkey"
            columns: ["pago_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          categoria: string
          id: string
          moeda: string
          valor_meta: number
          viagem_id: string
        }
        Insert: {
          categoria: string
          id?: string
          moeda?: string
          valor_meta: number
          viagem_id: string
        }
        Update: {
          categoria?: string
          id?: string
          moeda?: string
          valor_meta?: number
          viagem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      lugares: {
        Row: {
          criado_em: string
          criado_por: string
          destino_id: string | null
          horario: string | null
          id: string
          link: string | null
          moeda: string
          nome: string
          observacao: string | null
          preco: number | null
          tipo: string
          viagem_id: string
        }
        Insert: {
          criado_em?: string
          criado_por?: string
          destino_id?: string | null
          horario?: string | null
          id?: string
          link?: string | null
          moeda?: string
          nome: string
          observacao?: string | null
          preco?: number | null
          tipo?: string
          viagem_id: string
        }
        Update: {
          criado_em?: string
          criado_por?: string
          destino_id?: string | null
          horario?: string | null
          id?: string
          link?: string | null
          moeda?: string
          nome?: string
          observacao?: string | null
          preco?: number | null
          tipo?: string
          viagem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lugares_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lugares_destino_id_fkey"
            columns: ["destino_id"]
            isOneToOne: false
            referencedRelation: "destinos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lugares_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      metas_cambio: {
        Row: { atualizado_em: string; avisado_em: string | null; avisar: boolean; abaixo: boolean; boletim_em: string | null; meta: number | null; moeda: string; ultimo_valor: number | null; usuario_id: string; viagem_id: string }
        Insert: { atualizado_em?: string; avisado_em?: string | null; avisar?: boolean; abaixo?: boolean; boletim_em?: string | null; meta?: number | null; moeda: string; ultimo_valor?: number | null; usuario_id?: string; viagem_id: string }
        Update: { atualizado_em?: string; avisado_em?: string | null; avisar?: boolean; abaixo?: boolean; boletim_em?: string | null; meta?: number | null; moeda?: string; ultimo_valor?: number | null; usuario_id?: string; viagem_id?: string }
        Relationships: [
          {
            foreignKeyName: "metas_cambio_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metas_cambio_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          avatar_url: string | null
          criado_em: string
          id: string
          nome: string | null
        }
        Insert: {
          avatar_url?: string | null
          criado_em?: string
          id: string
          nome?: string | null
        }
        Update: {
          avatar_url?: string | null
          criado_em?: string
          id?: string
          nome?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: { autor: string; criado_em: string; destino_id: string | null; id: string; legenda: string | null; viagem_id: string }
        Insert: { autor?: string; criado_em?: string; destino_id?: string | null; id?: string; legenda?: string | null; viagem_id: string }
        Update: { autor?: string; criado_em?: string; destino_id?: string | null; id?: string; legenda?: string | null; viagem_id?: string }
        Relationships: [
          {
            foreignKeyName: "posts_autor_fkey"
            columns: ["autor"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_destino_id_fkey"
            columns: ["destino_id"]
            isOneToOne: false
            referencedRelation: "destinos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      preferencias_aviso: {
        Row: {
          atualizado_em: string
          ligado: boolean
          tipo: string
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string
          ligado?: boolean
          tipo: string
          usuario_id?: string
        }
        Update: {
          atualizado_em?: string
          ligado?: boolean
          tipo?: string
          usuario_id?: string
        }
        Relationships: []
      }
      push_inscricoes: {
        Row: { auth: string; criado_em: string; endpoint: string; id: string; p256dh: string; usuario_id: string }
        Insert: { auth: string; criado_em?: string; endpoint: string; id?: string; p256dh: string; usuario_id?: string }
        Update: { auth?: string; criado_em?: string; endpoint?: string; id?: string; p256dh?: string; usuario_id?: string }
        Relationships: [
          {
            foreignKeyName: "push_inscricoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      seguros_viagem: {
        Row: {
          apolice: string | null
          atualizado_em: string
          cobertos: string[]
          cobertura: string | null
          criado_em: string
          criado_por: string
          id: string
          seguradora: string
          telefone: string | null
          valido_ate: string | null
          valido_de: string | null
          viagem_id: string
        }
        Insert: {
          apolice?: string | null
          atualizado_em?: string
          cobertos?: string[]
          cobertura?: string | null
          criado_em?: string
          criado_por?: string
          id?: string
          seguradora: string
          telefone?: string | null
          valido_ate?: string | null
          valido_de?: string | null
          viagem_id: string
        }
        Update: {
          apolice?: string | null
          atualizado_em?: string
          cobertos?: string[]
          cobertura?: string | null
          criado_em?: string
          criado_por?: string
          id?: string
          seguradora?: string
          telefone?: string | null
          valido_ate?: string | null
          valido_de?: string | null
          viagem_id?: string
        }
        Relationships: []
      }
      trajetos: {
        Row: {
          bate_e_volta: boolean
          chegada: string | null
          destino_id: string | null
          id: string
          link_reserva: string | null
          meio: string
          moeda: string | null
          observacao: string | null
          origem_id: string | null
          partida: string | null
          preco: number | null
          situacao: string
          viagem_id: string
        }
        Insert: {
          bate_e_volta?: boolean
          chegada?: string | null
          destino_id?: string | null
          id?: string
          link_reserva?: string | null
          meio?: string
          moeda?: string | null
          observacao?: string | null
          origem_id?: string | null
          partida?: string | null
          preco?: number | null
          situacao?: string
          viagem_id: string
        }
        Update: {
          bate_e_volta?: boolean
          chegada?: string | null
          destino_id?: string | null
          id?: string
          link_reserva?: string | null
          meio?: string
          moeda?: string | null
          observacao?: string | null
          origem_id?: string | null
          partida?: string | null
          preco?: number | null
          situacao?: string
          viagem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trajetos_destino_id_fkey"
            columns: ["destino_id"]
            isOneToOne: false
            referencedRelation: "destinos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trajetos_origem_id_fkey"
            columns: ["origem_id"]
            isOneToOne: false
            referencedRelation: "destinos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trajetos_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      viagens: {
        Row: {
          criado_em: string
          criado_por: string
          data_fim: string | null
          data_inicio: string | null
          id: string
          moeda_principal: string
          nome: string
        }
        Insert: {
          criado_em?: string
          criado_por?: string
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          moeda_principal?: string
          nome: string
        }
        Update: {
          criado_em?: string
          criado_por?: string
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          moeda_principal?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "viagens_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      carteiras: {
        Row: {
          ajuste: number
          criado_em: string
          id: string
          moeda: string
          saldo_inicial: number
          usuario_id: string
          viagem_id: string
        }
        Insert: {
          ajuste?: number
          criado_em?: string
          id?: string
          moeda?: string
          saldo_inicial?: number
          usuario_id?: string
          viagem_id: string
        }
        Update: {
          ajuste?: number
          criado_em?: string
          id?: string
          moeda?: string
          saldo_inicial?: number
          usuario_id?: string
          viagem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "carteiras_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carteiras_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentos_carteira: {
        Row: {
          carteira_id: string
          criado_em: string
          data: string
          descricao: string | null
          gmail_message_id: string
          id: string
          moeda: string
          provedor: string
          tipo: string
          valor: number
        }
        Insert: {
          carteira_id: string
          criado_em?: string
          data?: string
          descricao?: string | null
          gmail_message_id: string
          id?: string
          moeda: string
          provedor: string
          tipo: string
          valor: number
        }
        Update: {
          carteira_id?: string
          criado_em?: string
          data?: string
          descricao?: string | null
          gmail_message_id?: string
          id?: string
          moeda?: string
          provedor?: string
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimentos_carteira_carteira_id_fkey"
            columns: ["carteira_id"]
            isOneToOne: false
            referencedRelation: "carteiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentos_carteira_carteira_id_fkey"
            columns: ["carteira_id"]
            isOneToOne: false
            referencedRelation: "carteiras_com_saldo"
            referencedColumns: ["id"]
          },
        ]
      }
      arquivos_viagem: {
        Row: {
          caminho: string
          criado_em: string
          enviado_por: string
          id: string
          nome: string
          tamanho: number
          tipo: string
          trajeto_id: string | null
          viagem_id: string
        }
        Insert: {
          caminho: string
          criado_em?: string
          enviado_por?: string
          id?: string
          nome: string
          tamanho: number
          tipo: string
          trajeto_id?: string | null
          viagem_id: string
        }
        Update: {
          caminho?: string
          criado_em?: string
          enviado_por?: string
          id?: string
          nome?: string
          tamanho?: number
          tipo?: string
          trajeto_id?: string | null
          viagem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "arquivos_viagem_enviado_por_fkey"
            columns: ["enviado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arquivos_viagem_trajeto_id_fkey"
            columns: ["trajeto_id"]
            isOneToOne: false
            referencedRelation: "trajetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arquivos_viagem_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      avisos: {
        Row: {
          atualizado_em: string
          criado_em: string
          criado_por: string
          id: string
          texto: string
          viagem_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          criado_por?: string
          id?: string
          texto: string
          viagem_id: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          criado_por?: string
          id?: string
          texto?: string
          viagem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avisos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avisos_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      pontos_de_encontro: {
        Row: {
          atualizado_em: string
          criado_em: string
          criado_por: string
          id: string
          latitude: number | null
          local: string
          longitude: number | null
          observacao: string | null
          quando: string | null
          viagem_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          criado_por?: string
          id?: string
          latitude?: number | null
          local: string
          longitude?: number | null
          observacao?: string | null
          quando?: string | null
          viagem_id: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          criado_por?: string
          id?: string
          latitude?: number | null
          local?: string
          longitude?: number | null
          observacao?: string | null
          quando?: string | null
          viagem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pontos_de_encontro_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pontos_de_encontro_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefas: {
        Row: {
          criado_em: string
          criado_por: string
          feita: boolean
          id: string
          prazo: string | null
          responsavel_id: string | null
          titulo: string
          viagem_id: string
        }
        Insert: {
          criado_em?: string
          criado_por?: string
          feita?: boolean
          id?: string
          prazo?: string | null
          responsavel_id?: string | null
          titulo: string
          viagem_id: string
        }
        Update: {
          criado_em?: string
          criado_por?: string
          feita?: boolean
          id?: string
          prazo?: string | null
          responsavel_id?: string | null
          titulo?: string
          viagem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      atividades_viagem: {
        Row: {
          alvo_id: string | null
          autor: string | null
          criado_em: string
          id: string
          tipo: string
          titulo: string | null
          viagem_id: string
        }
        Insert: {
          alvo_id?: string | null
          autor?: string | null
          criado_em?: string
          id?: string
          tipo: string
          titulo?: string | null
          viagem_id: string
        }
        Update: {
          alvo_id?: string | null
          autor?: string | null
          criado_em?: string
          id?: string
          tipo?: string
          titulo?: string | null
          viagem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividades_viagem_autor_fkey"
            columns: ["autor"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_viagem_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      atividades_vistas: {
        Row: {
          usuario_id: string
          viagem_id: string
          visto_em: string
        }
        Insert: {
          usuario_id?: string
          viagem_id: string
          visto_em?: string
        }
        Update: {
          usuario_id?: string
          viagem_id?: string
          visto_em?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividades_vistas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_vistas_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_agenda: {
        Row: {
          criado_em: string
          criado_por: string
          dia: string
          hora: string | null
          id: string
          local: string | null
          observacao: string | null
          titulo: string
          viagem_id: string
        }
        Insert: {
          criado_em?: string
          criado_por?: string
          dia: string
          hora?: string | null
          id?: string
          local?: string | null
          observacao?: string | null
          titulo: string
          viagem_id: string
        }
        Update: {
          criado_em?: string
          criado_por?: string
          dia?: string
          hora?: string | null
          id?: string
          local?: string | null
          observacao?: string | null
          titulo?: string
          viagem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_agenda_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_agenda_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      enquetes: {
        Row: {
          criado_em: string
          criado_por: string
          fechada: boolean
          fechada_em: string | null
          id: string
          multipla: boolean
          pergunta: string
          viagem_id: string
        }
        Insert: {
          criado_em?: string
          criado_por?: string
          fechada?: boolean
          fechada_em?: string | null
          id?: string
          multipla?: boolean
          pergunta: string
          viagem_id: string
        }
        Update: {
          criado_em?: string
          criado_por?: string
          fechada?: boolean
          fechada_em?: string | null
          id?: string
          multipla?: boolean
          pergunta?: string
          viagem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enquetes_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquetes_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
      enquete_opcoes: {
        Row: {
          enquete_id: string
          id: string
          ordem: number
          texto: string
        }
        Insert: {
          enquete_id: string
          id?: string
          ordem?: number
          texto: string
        }
        Update: {
          enquete_id?: string
          id?: string
          ordem?: number
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "enquete_opcoes_enquete_id_fkey"
            columns: ["enquete_id"]
            isOneToOne: false
            referencedRelation: "enquetes"
            referencedColumns: ["id"]
          },
        ]
      }
      enquete_votos: {
        Row: {
          criado_em: string
          enquete_id: string
          opcao_id: string
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          enquete_id: string
          opcao_id: string
          usuario_id?: string
        }
        Update: {
          criado_em?: string
          enquete_id?: string
          opcao_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enquete_votos_enquete_id_fkey"
            columns: ["enquete_id"]
            isOneToOne: false
            referencedRelation: "enquetes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquete_votos_opcao_id_fkey"
            columns: ["opcao_id"]
            isOneToOne: false
            referencedRelation: "enquete_opcoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquete_votos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      lugar_votos: {
        Row: {
          criado_em: string
          lugar_id: string
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          lugar_id: string
          usuario_id?: string
        }
        Update: {
          criado_em?: string
          lugar_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lugar_votos_lugar_id_fkey"
            columns: ["lugar_id"]
            isOneToOne: false
            referencedRelation: "lugares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lugar_votos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      carteiras_com_saldo: {
        Row: {
          ajuste: number | null
          criado_em: string | null
          id: string | null
          moeda: string | null
          saldo_atual: number | null
          saldo_inicial: number | null
          usuario_id: string | null
          viagem_id: string | null
        }
        Insert: {
          ajuste?: number | null
          criado_em?: string | null
          id?: string | null
          moeda?: string | null
          saldo_atual?: never
          saldo_inicial?: number | null
          usuario_id?: string | null
          viagem_id?: string | null
        }
        Update: {
          ajuste?: number | null
          criado_em?: string | null
          id?: string | null
          moeda?: string | null
          saldo_atual?: never
          saldo_inicial?: number | null
          usuario_id?: string | null
          viagem_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carteiras_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carteiras_viagem_id_fkey"
            columns: ["viagem_id"]
            isOneToOne: false
            referencedRelation: "viagens"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      aceitar_convite: { Args: { p_codigo: string; p_nome?: string }; Returns: string }
      alertas_de_passaporte: {
        Args: {
          p_viagem: string
        }
        Returns: { usuario_id: string; situacao: string }[]
      }
      ver_convite: { Args: { p_codigo: string }; Returns: Json }
      convidados_da_viagem: { Args: { p_viagem: string }; Returns: string[] }
      registrar_push: {
        Args: { p_auth: string; p_endpoint: string; p_p256dh: string }
        Returns: undefined
      }
      escolher_hospedagem: {
        Args: { p_escolher?: boolean; p_hospedagem: string }
        Returns: undefined
      }
      salvar_gasto: {
        Args: { p_divisoes?: Json; p_gasto: Json; p_viagem: string }
        Returns: string
      }
      salvar_roteiro: {
        Args: { p_destinos: Json; p_removidos?: string[]; p_viagem: string }
        Returns: {
          chegada: string | null
          id: string
          latitude: number | null
          longitude: number | null
          nome: string
          ordem: number
          pais: string | null
          saida: string | null
          viagem_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "destinos"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      minha_conexao_gmail: {
        Args: never
        Returns: {
          email: string
          expira_em: string
          status: string
          ultimo_sync: string
        }[]
      }
      saldo_euro_do_comboio: { Args: { p_viagem_id: string }; Returns: number }
      criar_enquete: {
        Args: { p_viagem: string; p_pergunta: string; p_multipla: boolean; p_opcoes: Json }
        Returns: string
      }
      votar_enquete: { Args: { p_opcao: string; p_marcar?: boolean }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never
