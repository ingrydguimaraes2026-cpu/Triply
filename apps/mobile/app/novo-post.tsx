import { useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { Camera, ImagePlus, X } from "../src/ui/icones";
import {
  avisarComboioDoFeed,
  buscarDestinos,
  criarPostComFotos,
  liberarPelasFotos,
  MAX_FOTOS_POR_POST,
  type FotoParaEnviar,
} from "@together/core";
import { useCarregar } from "../src/dados/useCarregar";
import { useViagemAtual } from "../src/dados/viagemAtual";
import { hojeIso, primeiroNome } from "../src/lib/formato";
import { supabase } from "../src/lib/supabase";
import { StatusBar } from "../src/ui/StatusBar";
import { Avatar, Botao, BotaoRedondo, RotuloDeSecao } from "../src/ui/pecas";
import { cor } from "../theme";

// Novo post do feed (spec 014 no mobile): até 10 fotos, lugar, quem está nas fotos (spec 100) e legenda.
// Igual ao site: a foto é comprimida antes de enviar (lado maior até 1600 px, JPEG).
const LADO_MAXIMO = 1600;

type Escolhida = {
  uri: string;
  largura: number;
  altura: number;
  ponto: { latitude: number; longitude: number } | null;
};

// GPS do EXIF (spec 108). Cada celular manda de um jeito; se não der pra ler, fica sem local.
function pontoDoExif(
  exif: Record<string, unknown> | null | undefined,
): Escolhida["ponto"] {
  if (!exif) return null;
  const gps = (exif["{GPS}"] as Record<string, unknown> | undefined) ?? exif;
  let lat = Number(gps.Latitude ?? gps.GPSLatitude);
  let lng = Number(gps.Longitude ?? gps.GPSLongitude);
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    (lat === 0 && lng === 0)
  )
    return null;
  if (String(gps.LatitudeRef ?? gps.GPSLatitudeRef).toUpperCase() === "S")
    lat = -Math.abs(lat);
  if (String(gps.LongitudeRef ?? gps.GPSLongitudeRef).toUpperCase() === "W")
    lng = -Math.abs(lng);
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180
    ? { latitude: lat, longitude: lng }
    : null;
}

async function comprimir(f: Escolhida): Promise<FotoParaEnviar> {
  const contexto = ImageManipulator.manipulate(f.uri);
  if (Math.max(f.largura, f.altura) > LADO_MAXIMO)
    contexto.resize(
      f.largura >= f.altura ? { width: LADO_MAXIMO } : { height: LADO_MAXIMO },
    );
  const imagem = await contexto.renderAsync();
  const salva = await imagem.saveAsync({
    compress: 0.75,
    format: SaveFormat.JPEG,
  });
  const corpo = await (await fetch(salva.uri)).arrayBuffer();
  return { corpo, tipo: "image/jpeg", ponto: f.ponto };
}

export default function NovoPost() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { atual, meuId } = useViagemAtual();
  const destinos = useCarregar(
    atual ? () => buscarDestinos(supabase, atual.id) : null,
    [atual?.id],
  );
  const [fotos, setFotos] = useState<Escolhida[]>([]);
  const [destinoId, setDestinoId] = useState<string | null>(null);
  const [marcados, setMarcados] = useState<string[]>([]);
  const [legenda, setLegenda] = useState("");
  const [enviadas, setEnviadas] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  if (!atual) return null;
  const viagem = atual;
  const sobra = MAX_FOTOS_POR_POST - fotos.length;
  const fechar = () =>
    router.canGoBack() ? router.back() : router.replace("/fotos");

  async function escolher(daCamera: boolean) {
    setErro(null);
    const permissao = daCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      setErro(
        daCamera
          ? "Sem acesso à câmera. Libere nas configurações do celular."
          : "Sem acesso às fotos. Libere nas configurações do celular.",
      );
      return;
    }
    const opcoes: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      exif: true,
      quality: 1,
    };
    const res = daCamera
      ? await ImagePicker.launchCameraAsync(opcoes)
      : await ImagePicker.launchImageLibraryAsync({
          ...opcoes,
          allowsMultipleSelection: true,
          selectionLimit: sobra,
          orderedSelection: true,
        });
    if (res.canceled) return;
    const novas = res.assets.map((a) => ({
      uri: a.uri,
      largura: a.width,
      altura: a.height,
      ponto: pontoDoExif(a.exif),
    }));
    if (fotos.length + novas.length > MAX_FOTOS_POR_POST)
      setErro(
        `Cabem até ${MAX_FOTOS_POR_POST} fotos por post. Fiquei com as primeiras.`,
      );
    setFotos([...fotos, ...novas].slice(0, MAX_FOTOS_POR_POST));
  }

  async function postar() {
    if (!fotos.length || enviadas !== null) return;
    setErro(null);
    setEnviadas(0);
    try {
      const prontas = await Promise.all(fotos.map(comprimir));
      const id = await criarPostComFotos(supabase, {
        viagemId: viagem.id,
        destinoId,
        legenda,
        fotos: prontas,
        marcados,
        aoEnviar: setEnviadas,
      });
      avisarComboioDoFeed(supabase, { post_id: id });
      // Spec 118a: foto com GPS perto de um destino libera o carimbo (o GPS só é comparado aqui)
      if (destinos.status === "pronto")
        void liberarPelasFotos(
          supabase,
          viagem.id,
          destinos.dados,
          fotos.map((f) => f.ponto),
          { data_inicio: viagem.dataInicio, data_fim: viagem.dataFim },
          hojeIso(),
        ).catch((e) => console.error("Erro ao carimbar pela foto:", e));
      fechar();
    } catch (e) {
      console.error("Erro ao postar:", e);
      setErro(
        "Não deu pra postar. Confira a internet e tente de novo (nada ficou pela metade).",
      );
      setEnviadas(null);
    }
  }

  const outros = viagem.membros.filter((m) => m.id !== meuId);

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: Platform.OS === "ios" ? 16 : insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 40,
          gap: 14,
        }}
      >
        <View className="flex-row items-center justify-between">
          <Text className="font-display text-[28px] text-texto">Novo post</Text>
          <BotaoRedondo aoTocar={fechar}>
            <X size={20} color={cor.texto} />
          </BotaoRedondo>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {fotos.map((f, i) => (
            <View
              key={f.uri + i}
              className="h-28 w-28 overflow-hidden rounded-2xl bg-tracejado"
            >
              <Image
                source={{ uri: f.uri }}
                className="h-full w-full"
                resizeMode="cover"
              />
              <Pressable
                onPress={() => setFotos(fotos.filter((_x, j) => j !== i))}
                className="absolute right-1.5 top-1.5 h-7 w-7 items-center justify-center rounded-full bg-black/60"
                accessibilityLabel={`Tirar a foto ${i + 1}`}
                hitSlop={6}
              >
                <X size={14} color="#fff" />
              </Pressable>
            </View>
          ))}
          {sobra > 0 ? (
            <>
              <Pressable
                onPress={() => escolher(false)}
                className="h-28 w-28 items-center justify-center gap-1 rounded-2xl border border-dashed border-borda bg-cartao"
                accessibilityRole="button"
              >
                <ImagePlus size={24} color={cor.couro} />
                <Text className="font-body-bold text-[12px] text-couro">
                  Galeria
                </Text>
              </Pressable>
              {Platform.OS !== "web" ? (
                <Pressable
                  onPress={() => escolher(true)}
                  className="h-28 w-28 items-center justify-center gap-1 rounded-2xl border border-dashed border-borda bg-cartao"
                  accessibilityRole="button"
                >
                  <Camera size={24} color={cor.couro} />
                  <Text className="font-body-bold text-[12px] text-couro">
                    Câmera
                  </Text>
                </Pressable>
              ) : null}
            </>
          ) : null}
        </ScrollView>
        <Text className="-mt-1 font-body text-[12.5px] text-suave">
          {fotos.length} de {MAX_FOTOS_POR_POST} fotos
        </Text>

        <TextInput
          value={legenda}
          onChangeText={(t) => setLegenda(t.slice(0, 2000))}
          placeholder="Escreva uma legenda…"
          placeholderTextColor={cor.suave}
          multiline
          className="min-h-[80px] rounded-2xl border border-borda bg-cartao px-4 py-3 font-body text-[15px] text-texto"
          style={{ textAlignVertical: "top", outlineStyle: "none" } as object}
        />

        {destinos.status === "pronto" && destinos.dados.length > 0 ? (
          <View className="gap-2">
            <RotuloDeSecao>Onde</RotuloDeSecao>
            <View className="flex-row flex-wrap gap-2">
              {destinos.dados.map((d) => {
                const ativo = destinoId === d.id;
                return (
                  <Pressable
                    key={d.id}
                    onPress={() => setDestinoId(ativo ? null : d.id)}
                    className={`rounded-xl px-3 py-2 ${ativo ? "bg-couro" : "border border-borda bg-cartao"}`}
                  >
                    <Text
                      className={`font-body-semibold text-[13px] ${ativo ? "text-white" : "text-texto"}`}
                    >
                      {d.nome}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {outros.length > 0 ? (
          <View className="gap-2">
            <RotuloDeSecao>Quem está nas fotos</RotuloDeSecao>
            <View className="flex-row flex-wrap gap-2">
              {outros.map((m) => {
                const ativo = marcados.includes(m.id);
                const i = viagem.membros.findIndex((x) => x.id === m.id);
                return (
                  <Pressable
                    key={m.id}
                    onPress={() =>
                      setMarcados(
                        ativo
                          ? marcados.filter((x) => x !== m.id)
                          : [...marcados, m.id],
                      )
                    }
                    className={`h-9 flex-row items-center gap-1.5 rounded-xl pl-1 pr-3 ${ativo ? "bg-couro" : "border border-borda bg-cartao"}`}
                    accessibilityState={{ selected: ativo }}
                  >
                    <Avatar nome={m.nome} indice={i} tamanho={26} />
                    <Text
                      className={`font-body-semibold text-[13px] ${ativo ? "text-white" : "text-texto"}`}
                    >
                      {primeiroNome(m.nome)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {erro ? (
          <Text className="font-body-medium text-[13px] text-vermelho">
            {erro}
          </Text>
        ) : null}
        <Botao
          titulo={
            enviadas === null
              ? "Postar"
              : enviadas < fotos.length
                ? `Enviando ${enviadas + 1} de ${fotos.length}…`
                : "Quase lá…"
          }
          carregando={enviadas !== null}
          desabilitado={!fotos.length || enviadas !== null}
          aoTocar={postar}
        />
      </ScrollView>
    </View>
  );
}
