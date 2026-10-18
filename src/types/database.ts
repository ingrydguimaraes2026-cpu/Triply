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
