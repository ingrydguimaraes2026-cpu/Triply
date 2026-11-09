// Feed de fotos (spec 014): posts com 1 a 10 fotos, curtidas e comentários.
// A lógica mora no @together/core (o app usa também); aqui só entra o cliente do site.
import { supabase } from "../../lib/supabase";
import {
  apagarComentarioDoPost,
  apagarPostDaViagem,
  avisarComboioDoFeed,
  buscarPostsDaViagem,
  comentarPost,
  criarPostComFotos,
  curtirPost,
  descurtirPost,
  desmarcarDoPost,
  type ComentarioDoPost,
  type FotoDoPost as FotoDoPostCore,
  type PostDaViagem,
} from "@together/core";

export { MAX_FOTOS_POR_POST } from "@together/core";
export type FotoDoPost = FotoDoPostCore;
export type Comentario = ComentarioDoPost;
export type Post = PostDaViagem;

// Posts da viagem (mais novos primeiro), com link temporário de 1 hora pra cada foto
export function buscarPosts(viagemId: string): Promise<Post[]> {
  return buscarPostsDaViagem(supabase, viagemId);
}

// Cria o post, envia as fotos (já comprimidas) e grava. Se algo falhar no meio, desfaz tudo.
export function criarPost(
  viagemId: string,
  destinoId: string | null,
  legenda: string,
  fotos: Blob[],
  aoEnviar?: (quantas: number) => void,
  marcados: string[] = [], // spec 100: quem está nas fotos
  pontos: ({ latitude: number; longitude: number } | null)[] = [], // spec 108: onde cada foto foi tirada
) {
  return criarPostComFotos(supabase, {
    viagemId,
    destinoId,
    legenda,
    fotos: fotos.map((corpo, i) => ({
      corpo,
      tipo: corpo.type,
      ponto: pontos[i] ?? null,
    })),
    marcados,
    aoEnviar,
  });
}

export const desmarcar = (postId: string, usuarioId: string) =>
  desmarcarDoPost(supabase, postId, usuarioId);
export const apagarPost = (post: Post) => apagarPostDaViagem(supabase, post);
export const curtir = (postId: string) => curtirPost(supabase, postId);
export const descurtir = (postId: string, meuId: string) =>
  descurtirPost(supabase, postId, meuId);
export const comentar = (postId: string, texto: string) =>
  comentarPost(supabase, postId, texto);
export const apagarComentario = (id: string) =>
  apagarComentarioDoPost(supabase, id);
export const avisarComboio = (
  corpo: { post_id: string } | { comentario_id: string },
) => avisarComboioDoFeed(supabase, corpo);
