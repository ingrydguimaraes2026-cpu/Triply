// Posts do feed de fotos (spec 014), com curtidas, comentários e quem foi marcado.
// Veio da web (features/feed/api.ts) pro core: o app usa no Livro e na Retrospectiva.
import type { ClienteTogether } from "./supabase";
import type { Tables } from "./database";

export type FotoDoPost = {
  id: string;
  caminho: string;
  url: string | null;
  latitude?: number | null;
  longitude?: number | null;
};
export type ComentarioDoPost = Tables<"comentarios">;
export type PostDaViagem = Tables<"posts"> & {
  fotos: FotoDoPost[];
  curtidas: string[];
  comentarios: ComentarioDoPost[];
  marcados: string[];
};

type PostDoBanco = Tables<"posts"> & {
  fotos: {
    id: string;
    caminho: string;
    ordem: number;
    latitude: number | null;
    longitude: number | null;
  }[];
  curtidas: { usuario_id: string }[];
  comentarios: ComentarioDoPost[];
  post_marcacoes?: { usuario_id: string }[]; // spec 100
};

// Posts da viagem (mais novos primeiro), com link temporário de 1 hora pra cada foto (o bucket é privado)
export async function buscarPostsDaViagem(
  cli: ClienteTogether,
  viagemId: string,
): Promise<PostDaViagem[]> {
  const { data, error } = await cli
    .from("posts")
    .select(
      "*, fotos(id, caminho, ordem, latitude, longitude), curtidas(usuario_id), comentarios(*), post_marcacoes(usuario_id)",
    )
    .eq("viagem_id", viagemId)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  // Post ainda sendo enviado (sem foto) não aparece
  const posts = (data as unknown as PostDoBanco[]).filter(
    (p) => p.fotos.length > 0,
  );

  const caminhos = posts.flatMap((p) => p.fotos.map((f) => f.caminho));
  const links = new Map<string, string>();
  for (let i = 0; i < caminhos.length; i += 100) {
    const { data: lote, error: erroLinks } = await cli.storage
      .from("fotos")
      .createSignedUrls(caminhos.slice(i, i + 100), 60 * 60);
    if (erroLinks) throw erroLinks;
    for (const l of lote)
      if (l.path && l.signedUrl) links.set(l.path, l.signedUrl);
  }

  return posts.map(
    ({ fotos, curtidas, comentarios, post_marcacoes, ...post }) => ({
      ...post,
      marcados: (post_marcacoes ?? []).map((m) => m.usuario_id),
      fotos: [...fotos]
        .sort((a, b) => a.ordem - b.ordem)
        .map((f) => ({
          id: f.id,
          caminho: f.caminho,
          url: links.get(f.caminho) ?? null,
          latitude: f.latitude,
          longitude: f.longitude,
        })),
      curtidas: curtidas.map((c) => c.usuario_id),
      comentarios: [...comentarios].sort((a, b) =>
        a.criado_em.localeCompare(b.criado_em),
      ),
    }),
  );
}

// ---------- Escritas do feed (web e app) ----------

export const MAX_FOTOS_POR_POST = 10;
const BUCKET = "fotos";

// O core não tem os tipos do navegador: pega o tipo do arquivo e o console do próprio ambiente
type CorpoDoArquivo = Parameters<
  ReturnType<ClienteTogether["storage"]["from"]>["upload"]
>[1];
declare const console: { error: (...dados: unknown[]) => void };

// Foto já comprimida, pronta pra enviar. Web manda Blob; o celular manda ArrayBuffer.
export type FotoParaEnviar = {
  corpo: CorpoDoArquivo;
  tipo: string;
  ponto?: { latitude: number; longitude: number } | null;
};

// Nome único do arquivo (o celular nem sempre tem crypto.randomUUID)
function idUnico(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  return (
    c?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  );
}

// Cria o post, envia as fotos e grava. Se algo falhar no meio, desfaz tudo (não sobra arquivo perdido).
export async function criarPostComFotos(
  cli: ClienteTogether,
  d: {
    viagemId: string;
    destinoId: string | null;
    legenda: string;
    fotos: FotoParaEnviar[];
    marcados?: string[];
    aoEnviar?: (quantas: number) => void;
  },
): Promise<string> {
  const { data: post, error } = await cli
    .from("posts")
    .insert({
      viagem_id: d.viagemId,
      destino_id: d.destinoId,
      legenda: d.legenda.trim() || null,
    })
    .select("id")
    .single();
  if (error) throw error;

  const enviados: string[] = [];
  try {
    for (const foto of d.fotos) {
      const extensao = foto.tipo === "image/webp" ? "webp" : "jpg";
      const caminho = `${d.viagemId}/${post.id}/${idUnico()}.${extensao}`;
      const { error: erroEnvio } = await cli.storage
        .from(BUCKET)
        .upload(caminho, foto.corpo, { contentType: foto.tipo });
      if (erroEnvio) throw erroEnvio;
      enviados.push(caminho);
      d.aoEnviar?.(enviados.length);
    }
    const { error: erroFotos } = await cli.from("fotos").insert(
      enviados.map((caminho, ordem) => ({
        viagem_id: d.viagemId,
        destino_id: d.destinoId,
        post_id: post.id,
        caminho,
        ordem,
        latitude: d.fotos[ordem]?.ponto?.latitude ?? null,
        longitude: d.fotos[ordem]?.ponto?.longitude ?? null,
      })),
    );
    if (erroFotos) throw erroFotos;
  } catch (erro) {
    if (enviados.length) await cli.storage.from(BUCKET).remove(enviados);
    await cli.from("posts").delete().eq("id", post.id);
    throw erro;
  }
  // Marcações (spec 100) não desfazem o post se falharem (dá pra marcar de novo depois)
  if (d.marcados?.length) {
    const { error: erroMarcas } = await cli
      .from("post_marcacoes")
      .insert(
        d.marcados.map((usuario_id) => ({ post_id: post.id, usuario_id })),
      );
    if (erroMarcas)
      console.error(
        "Post salvo, mas não deu pra marcar as pessoas:",
        erroMarcas,
      );
  }
  return post.id;
}

// Spec 100: tirar uma marcação (a própria pessoa, quem marcou ou o autor do post)
export async function desmarcarDoPost(
  cli: ClienteTogether,
  postId: string,
  usuarioId: string,
) {
  const { error } = await cli
    .from("post_marcacoes")
    .delete()
    .eq("post_id", postId)
    .eq("usuario_id", usuarioId);
  if (error) throw error;
}

// Primeiro os arquivos, depois o post (as fotos, curtidas e comentários saem junto)
export async function apagarPostDaViagem(
  cli: ClienteTogether,
  post: Pick<PostDaViagem, "id" | "fotos">,
) {
  const { error: erroArquivos } = await cli.storage
    .from(BUCKET)
    .remove(post.fotos.map((f) => f.caminho));
  if (erroArquivos) throw erroArquivos;
  const { error } = await cli.from("posts").delete().eq("id", post.id);
  if (error)
    throw new Error(
      "As fotos foram apagadas, mas o post não. Atualize e tente de novo.",
    );
}

export async function curtirPost(cli: ClienteTogether, postId: string) {
  const { error } = await cli.from("curtidas").insert({ post_id: postId });
  // Já curtido (toque duplo repetido): tudo bem
  if (error && error.code !== "23505") throw error;
}

export async function descurtirPost(
  cli: ClienteTogether,
  postId: string,
  meuId: string,
) {
  const { error } = await cli
    .from("curtidas")
    .delete()
    .eq("post_id", postId)
    .eq("usuario_id", meuId);
  if (error) throw error;
}

export async function comentarPost(
  cli: ClienteTogether,
  postId: string,
  texto: string,
): Promise<ComentarioDoPost> {
  const { data, error } = await cli
    .from("comentarios")
    .insert({ post_id: postId, texto: texto.trim() })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function apagarComentarioDoPost(cli: ClienteTogether, id: string) {
  const { error } = await cli.from("comentarios").delete().eq("id", id);
  if (error) throw error;
}

// Avisa o comboio no celular (função avisos-feed). Se falhar, o post/comentário continua: só não chega o aviso.
export function avisarComboioDoFeed(
  cli: ClienteTogether,
  corpo: { post_id: string } | { comentario_id: string },
) {
  cli.functions
    .invoke("avisos-feed", { body: corpo })
    .then(
      ({ error }) => error && console.error("Aviso do feed não foi:", error),
    )
    .catch((e) => console.error("Aviso do feed não foi:", e));
}
