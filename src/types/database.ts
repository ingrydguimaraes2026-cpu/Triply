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
          checkin: string | null
          checkout: string | null
          criado_em: string
          criado_por: string
          destino_id: string | null
          escolhida: boolean
          id: string
          link: string | null
          moeda: string
          nome: string
          observacao: string | null
          preco_total: number | null
          viagem_id: string
        }
        Insert: {
          checkin?: string | null
          checkout?: string | null
          criado_em?: string
          criado_por?: string
          destino_id?: string | null
          escolhida?: boolean
          id?: string
          link?: string | null
          moeda?: string
          nome: string
          observacao?: string | null
          preco_total?: number | null
          viagem_id: string
        }
        Update: {
          checkin?: string | null
          checkout?: string | null
          criado_em?: string
          criado_por?: string
          destino_id?: string | null
          escolhida?: boolean
          id?: string
          link?: string | null
          moeda?: string
          nome?: string
          observacao?: string | null
          preco_total?: number | null
          viagem_id?: string
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
          viagem_id: string
        }
        Insert: {
          caminho: string
          criado_em?: string
          destino_id?: string | null
          enviada_por?: string
          id?: string
          legenda?: string | null
          viagem_id: string
        }
        Update: {
          caminho?: string
          criado_em?: string
          destino_id?: string | null
          enviada_por?: string
          id?: string
          legenda?: string | null
          viagem_id?: string
        }
        Relationships: [
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
      metas_cambio: {
        Row: { atualizado_em: string; avisado_em: string | null; avisar: boolean; abaixo: boolean; meta: number; moeda: string; usuario_id: string; viagem_id: string }
        Insert: { atualizado_em?: string; avisado_em?: string | null; avisar?: boolean; abaixo?: boolean; meta: number; moeda: string; usuario_id?: string; viagem_id: string }
        Update: { atualizado_em?: string; avisado_em?: string | null; avisar?: boolean; abaixo?: boolean; meta?: number; moeda?: string; usuario_id?: string; viagem_id?: string }
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
      trajetos: {
        Row: {
          bate_e_volta: boolean
          chegada: string | null
          destino_id: string | null
          id: string
          link_reserva: string | null
          meio: string
          observacao: string | null
          origem_id: string | null
          partida: string | null
          viagem_id: string
        }
        Insert: {
          bate_e_volta?: boolean
          chegada?: string | null
          destino_id?: string | null
          id?: string
          link_reserva?: string | null
          meio?: string
          observacao?: string | null
          origem_id?: string | null
          partida?: string | null
          viagem_id: string
        }
        Update: {
          bate_e_volta?: boolean
          chegada?: string | null
          destino_id?: string | null
          id?: string
          link_reserva?: string | null
          meio?: string
          observacao?: string | null
          origem_id?: string | null
          partida?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aceitar_convite: { Args: { p_codigo: string }; Returns: string }
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
