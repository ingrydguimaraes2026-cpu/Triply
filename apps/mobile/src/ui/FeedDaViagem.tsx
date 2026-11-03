import { useRef, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Heart, MessageCircle, Send, Trash2 } from "./icones";
import {
  alternarCurtida,
  apagarComentarioDoPost,
  apagarPostDaViagem,
  avisarComboioDoFeed,
  comentarPost,
  curtirPost,
  descurtirPost,
  podeApagarComentario,
  tempoAtras,
  textoDasCurtidas,
  textoDosMarcados,
  type Pessoa,
  type PostDaViagem,
} from "@together/core";
import { primeiroNome } from "../lib/formato";
import { supabase } from "../lib/supabase";
import { Avatar } from "./pecas";
import { cor } from "../../theme";

// Feed de fotos (spec 014 no mobile): posts com até 10 fotos, curtidas, comentários e marcações.
type Props = {
  posts: PostDaViagem[];
  membros: Pessoa[];
  meuId: string;
  destinos: { id: string; nome: string }[];
  aoMudar: () => void;
};

export function FeedDaViagem({
  posts,
  membros,
  meuId,
  destinos,
  aoMudar,
}: Props) {
  const euSouAdm = membros.some((m) => m.id === meuId && m.papel === "adm");
  return (
    <View className="gap-4">
      {posts.map((p) => (
        <PostCartao
          key={p.id}
          post={p}
          membros={membros}
          meuId={meuId}
          euSouAdm={euSouAdm}
          destino={destinos.find((d) => d.id === p.destino_id)?.nome ?? null}
          aoApagar={aoMudar}
        />
      ))}
    </View>
  );
}

function PostCartao({
  post,
  membros,
  meuId,
  euSouAdm,
  destino,
  aoApagar,
}: {
  post: PostDaViagem;
  membros: Pessoa[];
  meuId: string;
  euSouAdm: boolean;
  destino: string | null;
  aoApagar: () => void;
}) {
  const [curtidas, setCurtidas] = useState(post.curtidas);
  const [comentarios, setComentarios] = useState(post.comentarios);
  const [abertos, setAbertos] = useState(false);
  const [texto, setTexto] = useState("");
  const [largura, setLargura] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [confirmar, setConfirmar] = useState(false);
  const [apagando, setApagando] = useState(false);
  const ultimoToque = useRef(0);

  const indice = (id: string) =>
    Math.max(
      0,
      membros.findIndex((m) => m.id === id),
    );
  const nomeDe = (id: string) =>
    primeiroNome(membros.find((m) => m.id === id)?.nome ?? "Alguém");
  const curti = curtidas.includes(meuId);
  const podeApagarPost = post.autor === meuId || euSouAdm;

  async function alternar() {
    const antes = curtidas;
    setCurtidas(alternarCurtida(curtidas, meuId)); // muda na hora; volta se o servidor recusar
    try {
      if (curti) await descurtirPost(supabase, post.id, meuId);
      else await curtirPost(supabase, post.id);
    } catch (e) {
      console.error("Erro ao curtir:", e);
      setCurtidas(antes);
    }
  }

  // Toque duplo na foto curte (não descurte, igual ao Instagram)
  function toqueNaFoto() {
    const agora = Date.now();
    if (agora - ultimoToque.current < 300 && !curti) alternar();
    ultimoToque.current = agora;
  }

  async function enviar() {
    const limpo = texto.trim();
    if (!limpo) return;
    setTexto("");
    try {
      const novo = await comentarPost(supabase, post.id, limpo);
      setComentarios((c) => [...c, novo]);
      setAbertos(true);
      avisarComboioDoFeed(supabase, { comentario_id: novo.id });
    } catch (e) {
      console.error("Erro ao comentar:", e);
      setTexto(limpo);
    }
  }

  async function apagarComentario(id: string) {
    try {
      await apagarComentarioDoPost(supabase, id);
      setComentarios((c) => c.filter((x) => x.id !== id));
    } catch (e) {
      console.error("Erro ao apagar comentário:", e);
    }
  }

  async function apagar() {
    setApagando(true);
    try {
      await apagarPostDaViagem(supabase, post);
      aoApagar();
    } catch (e) {
      console.error("Erro ao apagar post:", e);
      setApagando(false);
      setConfirmar(false);
    }
  }

  const textoCurtidas = textoDasCurtidas(curtidas, meuId, nomeDe);
  const marcados = textoDosMarcados(
    post.marcados,
    (id) => membros.find((m) => m.id === id)?.nome ?? "Alguém",
  );

  return (
    <View className="overflow-hidden rounded-3xl border border-borda bg-cartao">
      <View className="flex-row items-center gap-2.5 px-3.5 py-3">
        <Avatar
          nome={membros.find((m) => m.id === post.autor)?.nome ?? "?"}
          indice={indice(post.autor)}
          tamanho={34}
        />
        <View className="min-w-0 flex-1">
          <Text
            className="font-body-bold text-[14px] text-texto"
            numberOfLines={1}
          >
            {post.autor === meuId ? "Você" : nomeDe(post.autor)}
            {marcados ? (
              <Text className="font-body text-corpo"> {marcados}</Text>
            ) : null}
          </Text>
          <Text className="font-body text-[12px] text-suave">
            {[destino, tempoAtras(post.criado_em)].filter(Boolean).join(" · ")}
          </Text>
        </View>
        {podeApagarPost ? (
          confirmar ? (
            <View className="flex-row items-center gap-3">
              <Pressable onPress={() => setConfirmar(false)} hitSlop={6}>
                <Text className="font-body-semibold text-[13px] text-suave">
                  Cancelar
                </Text>
              </Pressable>
              <Pressable onPress={apagar} disabled={apagando} hitSlop={6}>
                <Text className="font-body-bold text-[13px] text-vermelho">
                  {apagando ? "Apagando…" : "Apagar"}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setConfirmar(true)}
              hitSlop={8}
              accessibilityLabel="Apagar post"
            >
              <Trash2 size={17} color={cor.suave} />
            </Pressable>
          )
        ) : null}
      </View>

      <View onLayout={(e) => setLargura(e.nativeEvent.layout.width)}>
        {largura > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) =>
              setPagina(Math.round(e.nativeEvent.contentOffset.x / largura))
            }
            onScroll={(e) =>
              setPagina(Math.round(e.nativeEvent.contentOffset.x / largura))
            }
            scrollEventThrottle={64}
          >
            {post.fotos.map((f) => (
              <Pressable
                key={f.id}
                onPress={toqueNaFoto}
                style={{ width: largura, height: largura }}
                className="bg-tracejado"
                accessibilityLabel="Foto do post. Toque duas vezes pra curtir"
              >
                {f.url ? (
                  <Image
                    source={{ uri: f.url }}
                    style={{ width: largura, height: largura }}
                    resizeMode="cover"
                  />
                ) : null}
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View className="aspect-square bg-tracejado" />
        )}
        {post.fotos.length > 1 ? (
          <View className="absolute right-3 top-3 rounded-full bg-black/55 px-2 py-0.5">
            <Text className="font-body-bold text-[11px] text-white">
              {pagina + 1}/{post.fotos.length}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="gap-1.5 px-3.5 pb-3.5 pt-2.5">
        <View className="flex-row items-center gap-4">
          <Pressable
            onPress={alternar}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={curti ? "Descurtir" : "Curtir"}
            accessibilityState={{ selected: curti }}
          >
            <Heart
              size={24}
              color={curti ? cor.vermelho : cor.texto}
              fill={curti ? cor.vermelho : "transparent"}
            />
          </Pressable>
          <Pressable
            onPress={() => setAbertos(!abertos)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Comentários"
          >
            <MessageCircle size={23} color={cor.texto} />
          </Pressable>
        </View>
        {textoCurtidas ? (
          <Text className="font-body-bold text-[13px] text-texto">
            {textoCurtidas}
          </Text>
        ) : null}
        {post.legenda ? (
          <Text className="font-body text-[14px] leading-5 text-texto">
            <Text className="font-body-bold">
              {post.autor === meuId ? "Você" : nomeDe(post.autor)}
            </Text>{" "}
            {post.legenda}
          </Text>
        ) : null}
        {comentarios.length > 0 && !abertos ? (
          <Pressable onPress={() => setAbertos(true)} hitSlop={4}>
            <Text className="font-body text-[13px] text-suave">
              Ver{" "}
              {comentarios.length === 1
                ? "1 comentário"
                : `os ${comentarios.length} comentários`}
            </Text>
          </Pressable>
        ) : null}
        {abertos
          ? comentarios.map((c) => (
              <View key={c.id} className="flex-row items-start gap-2">
                <Text className="min-w-0 flex-1 font-body text-[13.5px] leading-5 text-texto">
                  <Text className="font-body-bold">
                    {c.autor === meuId ? "Você" : nomeDe(c.autor)}
                  </Text>{" "}
                  {c.texto}
                  <Text className="text-suave">
                    {" "}
                    · {tempoAtras(c.criado_em)}
                  </Text>
                </Text>
                {podeApagarComentario(c.autor, post.autor, meuId, euSouAdm) ? (
                  <Pressable
                    onPress={() => apagarComentario(c.id)}
                    hitSlop={8}
                    accessibilityLabel="Apagar comentário"
                  >
                    <Trash2 size={13} color={cor.suave} />
                  </Pressable>
                ) : null}
              </View>
            ))
          : null}
        <View className="mt-1 flex-row items-center gap-2 rounded-xl border border-borda px-3 py-1.5">
          <TextInput
            value={texto}
            onChangeText={(t) => setTexto(t.slice(0, 500))}
            placeholder="Comentar…"
            placeholderTextColor={cor.suave}
            className="min-w-0 flex-1 font-body text-[13px] text-texto"
            style={{ outlineStyle: "none" } as object}
            onSubmitEditing={enviar}
            returnKeyType="send"
          />
          <Pressable
            onPress={enviar}
            hitSlop={8}
            disabled={!texto.trim()}
            accessibilityLabel="Enviar comentário"
          >
            <Send size={16} color={texto.trim() ? cor.couro : cor.tracejado} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
