import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ArrowLeftRight, Trash2 } from "../src/ui/icones";
import {
  buscarDestinos,
  buscarLugares,
  diaNoFuso,
  horaNoFuso,
  MEIOS_DE_TRANSPORTE,
  type Destino,
  type Lugar,
  type Tables,
} from "@together/core";
import { useCarregar } from "../src/dados/useCarregar";
import { useViagemAtual } from "../src/dados/viagemAtual";
import { diaLongo, lerData } from "../src/lib/formato";
import { supabase } from "../src/lib/supabase";
import { StatusBar } from "../src/ui/StatusBar";
import { normalizarHora } from "../src/ui/FormEvento";
import {
  Botao,
  BotaoRedondo,
  Campo,
  Carregando,
  ErroNaTela,
} from "../src/ui/pecas";
import { cor } from "../theme";

// Spec 122a: novo deslocamento (ou editar um). De e para em texto livre: qualquer lugar pra qualquer
// lugar ("Varenna → Bellagio"), com sugestões dos destinos e lugares da viagem.
// Rota: /novo-deslocamento?dia=AAAA-MM-DD[&trajeto=<id>]
// Horários reais e comparar opções vêm na 122c.

type Trajeto = Tables<"trajetos">;
type Ponto = {
  nome: string;
  latitude: number | null;
  longitude: number | null;
};

const MEIOS = MEIOS_DE_TRANSPORTE.filter((m) => m.chave !== "carona").flatMap(
  (m) => (m.chave === "onibus" ? [m, { chave: "metro", nome: "Metrô" }] : [m]),
);
const SITUACOES = [
  { chave: "sugestao", nome: "Pra decidir" },
  { chave: "decidido", nome: "Decidido" },
  { chave: "reservado", nome: "Reservado" },
  { chave: "comprado", nome: "Comprado" },
];
const TROCAS = [
  { valor: null, nome: "Não sei" },
  { valor: 0, nome: "Direto" },
  { valor: 1, nome: "1 troca" },
  { valor: 2, nome: "2 trocas" },
  { valor: 3, nome: "3 ou mais" },
];

async function carregar(viagemId: string, trajetoId: string | undefined) {
  const [destinos, lugares, trajeto] = await Promise.all([
    buscarDestinos(supabase, viagemId),
    buscarLugares(supabase, viagemId),
    trajetoId
      ? supabase
          .from("trajetos")
          .select("*")
          .eq("id", trajetoId)
          .single()
          .then((r) => (r.error ? Promise.reject(r.error) : r.data))
      : Promise.resolve(null),
  ]);
  return { destinos, lugares, trajeto };
}

export default function NovoDeslocamento() {
  const { atual: viagem } = useViagemAtual();
  const params = useLocalSearchParams<{ dia?: string; trajeto?: string }>();
  const carga = useCarregar(
    viagem ? () => carregar(viagem.id, params.trajeto) : null,
    [viagem?.id, params.trajeto],
  );
  if (!viagem) return <ErroNaTela aoTentar={() => {}} />;
  if (carga.status === "carregando") return <Carregando />;
  if (carga.status === "erro")
    return <ErroNaTela aoTentar={carga.recarregar} />;
  return (
    <Formulario
      {...carga.dados}
      viagemId={viagem.id}
      moeda={viagem.moeda}
      diaInicial={params.dia}
    />
  );
}

function Formulario({
  destinos,
  lugares,
  trajeto,
  viagemId,
  moeda,
  diaInicial,
}: {
  destinos: Destino[];
  lugares: Lugar[];
  trajeto: Trajeto | null;
  viagemId: string;
  moeda: string;
  diaInicial?: string;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { meuId, atual } = useViagemAtual();
  const euSouAdm = !!atual?.membros.some(
    (m) => m.id === meuId && m.papel === "adm",
  );
  const nomeDoDestino = (id: string | null) =>
    destinos.find((d) => d.id === id)?.nome ?? "";

  const dia = trajeto?.partida
    ? diaNoFuso(trajeto.partida)
    : (diaInicial ?? diaNoFuso(new Date().toISOString()));
  const [de, setDe] = useState<Ponto>({
    nome: trajeto?.de_texto ?? nomeDoDestino(trajeto?.origem_id ?? null),
    latitude: trajeto?.de_lat ?? null,
    longitude: trajeto?.de_lon ?? null,
  });
  const [para, setPara] = useState<Ponto>({
    nome: trajeto?.para_texto ?? nomeDoDestino(trajeto?.destino_id ?? null),
    latitude: trajeto?.para_lat ?? null,
    longitude: trajeto?.para_lon ?? null,
  });
  const [focado, setFocado] = useState<"de" | "para" | null>(null);
  const [meio, setMeio] = useState(trajeto?.meio ?? "trem");
  const [saida, setSaida] = useState(
    trajeto?.partida ? horaNoFuso(trajeto.partida) : "",
  );
  const [chegada, setChegada] = useState(
    trajeto?.chegada ? horaNoFuso(trajeto.chegada) : "",
  );
  const [situacao, setSituacao] = useState(trajeto?.situacao ?? "sugestao");
  const [trocas, setTrocas] = useState<number | null>(trajeto?.trocas ?? null);
  const [preco, setPreco] = useState(
    trajeto?.preco != null ? String(trajeto.preco).replace(".", ",") : "",
  );
  const [ultimo, setUltimo] = useState(trajeto?.ultimo_do_dia ?? false);
  const [observacao, setObservacao] = useState(trajeto?.observacao ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const podeApagar = !!trajeto && (euSouAdm || trajeto.criado_por === meuId);

  // Sugestões: destinos e lugares da viagem (com coordenadas quando tiver)
  const pontos = useMemo<Ponto[]>(() => {
    const todos = [
      ...destinos.map((d) => ({
        nome: d.nome,
        latitude: d.latitude,
        longitude: d.longitude,
      })),
      ...lugares.map((l) => ({
        nome: l.nome,
        latitude: l.latitude ?? null,
        longitude: l.longitude ?? null,
      })),
    ];
    const vistos = new Set<string>();
    return todos.filter(
      (p) =>
        !vistos.has(p.nome.toLowerCase()) && vistos.add(p.nome.toLowerCase()),
    );
  }, [destinos, lugares]);
  const texto = focado === "de" ? de.nome : focado === "para" ? para.nome : "";
  const sugestoes = focado
    ? pontos
        .filter(
          (p) =>
            p.nome.toLowerCase() !== texto.trim().toLowerCase() &&
            p.nome.toLowerCase().includes(texto.trim().toLowerCase()),
        )
        .slice(0, 6)
    : [];

  // Chegada antes da saída = chega no dia seguinte (ônibus noturno)
  const hSaida = normalizarHora(saida);
  const hChegada = normalizarHora(chegada);
  const diaSeguinte = !!hSaida && !!hChegada && hChegada < hSaida;

  function horario(hora: string, maisUmDia = false) {
    const d = new Date(`${dia}T${hora}:00`);
    if (maisUmDia) d.setDate(d.getDate() + 1);
    return d.toISOString();
  }

  async function salvar() {
    if (!de.nome.trim() || !para.nome.trim())
      return setErro("Diga de onde e pra onde.");
    if (!hSaida)
      return setErro(
        hSaida === undefined
          ? "Hora de saída inválida. Ex.: 17:55"
          : "Diga a hora de saída.",
      );
    if (hChegada === undefined)
      return setErro("Hora de chegada inválida. Ex.: 18:10");
    const valor = preco.trim()
      ? Number(preco.replace(/\./g, "").replace(",", "."))
      : null;
    if (valor != null && (Number.isNaN(valor) || valor < 0))
      return setErro("Preço inválido. Ex.: 29,90");
    setErro(null);
    setSalvando(true);
    const dados = {
      de_texto: de.nome.trim(),
      para_texto: para.nome.trim(),
      de_lat: de.latitude,
      de_lon: de.longitude,
      para_lat: para.latitude,
      para_lon: para.longitude,
      meio,
      partida: horario(hSaida),
      chegada: hChegada ? horario(hChegada, diaSeguinte) : null,
      situacao,
      trocas,
      preco: valor,
      moeda: valor != null ? (trajeto?.moeda ?? moeda) : null,
      ultimo_do_dia: ultimo,
      observacao: observacao.trim() || null,
    };
    const { error } = trajeto
      ? await supabase.from("trajetos").update(dados).eq("id", trajeto.id)
      : await supabase
          .from("trajetos")
          .insert({ ...dados, viagem_id: viagemId, tipo: "trecho" });
    setSalvando(false);
    if (error) {
      console.error("Erro ao salvar o deslocamento:", error);
      return setErro(
        error.code === "42501"
          ? "Deslocamento do grupo só o ADM (ou quem ele liberou) põe. Peça pra ele."
          : "Não deu pra salvar. Confira a internet e tente de novo.",
      );
    }
    voltar();
  }

  async function apagar() {
    if (!trajeto) return;
    setSalvando(true);
    const { error } = await supabase
      .from("trajetos")
      .delete()
      .eq("id", trajeto.id);
    setSalvando(false);
    if (error) return setErro("Não deu pra apagar. Tente de novo.");
    voltar();
  }

  const voltar = () =>
    router.canGoBack() ? router.back() : router.replace("/");
  const trocar = () => {
    setDe(para);
    setPara(de);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-fundo"
    >
      <StatusBar style="dark" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 40,
          gap: 12,
        }}
      >
        <View className="flex-row items-center justify-between">
          <BotaoRedondo aoTocar={voltar}>
            <ArrowLeft size={20} color={cor.texto} />
          </BotaoRedondo>
          <Text className="font-body-medium text-[13px] text-suave">
            {diaLongo(lerData(dia))}
          </Text>
        </View>
        <Text className="font-display text-[28px] leading-[32px] text-texto">
          {trajeto ? "Deslocamento" : "Novo deslocamento"}
        </Text>

        <View className="gap-2">
          <Rotulo texto="De" />
          <Campo
            value={de.nome}
            onChangeText={(v) =>
              setDe({ nome: v, latitude: null, longitude: null })
            }
            onFocus={() => setFocado("de")}
            onBlur={() => setTimeout(() => setFocado(null), 200)}
            placeholder="Cidade, estação, lugar…"
            direita={
              <Pressable
                onPress={trocar}
                accessibilityLabel="Trocar de e para"
                hitSlop={8}
              >
                <ArrowLeftRight size={18} color={cor.couro} />
              </Pressable>
            }
          />
          {focado === "de" ? (
            <Sugestoes lista={sugestoes} aoEscolher={(p) => setDe(p)} />
          ) : null}
          <Rotulo texto="Para" />
          <Campo
            value={para.nome}
            onChangeText={(v) =>
              setPara({ nome: v, latitude: null, longitude: null })
            }
            onFocus={() => setFocado("para")}
            onBlur={() => setTimeout(() => setFocado(null), 200)}
            placeholder="Cidade, estação, lugar…"
          />
          {focado === "para" ? (
            <Sugestoes lista={sugestoes} aoEscolher={(p) => setPara(p)} />
          ) : null}
        </View>

        <Rotulo texto="Como" />
        <Chips
          opcoes={MEIOS.map((m) => ({ chave: m.chave, nome: m.nome }))}
          valor={meio}
          aoMudar={setMeio}
        />

        <View className="flex-row gap-3">
          <View className="flex-1 gap-2">
            <Rotulo texto="Sai" />
            <Campo
              value={saida}
              onChangeText={setSaida}
              placeholder="17:55"
              keyboardType="numbers-and-punctuation"
            />
          </View>
          <View className="flex-1 gap-2">
            <Rotulo texto="Chega" />
            <Campo
              value={chegada}
              onChangeText={setChegada}
              placeholder="Opcional"
              keyboardType="numbers-and-punctuation"
            />
          </View>
        </View>
        {diaSeguinte ? (
          <Text className="font-body text-[13px] text-caramelo">
            Chega no dia seguinte.
          </Text>
        ) : null}

        <Rotulo texto="Trocas" />
        <Chips
          opcoes={TROCAS.map((t) => ({ chave: String(t.valor), nome: t.nome }))}
          valor={String(trocas)}
          aoMudar={(v) => setTrocas(v === "null" ? null : Number(v))}
        />

        <Rotulo texto="Situação" />
        <Chips opcoes={SITUACOES} valor={situacao} aoMudar={setSituacao} />

        <View className="gap-2">
          <Rotulo texto={`Preço do grupo todo (${trajeto?.moeda ?? moeda})`} />
          <Campo
            value={preco}
            onChangeText={setPreco}
            placeholder="Opcional"
            keyboardType="decimal-pad"
          />
        </View>

        <View className="flex-row items-center justify-between rounded-2xl border border-borda bg-cartao px-4 py-3">
          <View className="min-w-0 flex-1 pr-3">
            <Text className="font-body-bold text-[14px] text-texto">
              É o último do dia
            </Text>
            <Text className="font-body text-[12.5px] text-suave">
              Perdeu, não tem outro.
            </Text>
          </View>
          <Switch
            value={ultimo}
            onValueChange={setUltimo}
            trackColor={{ true: cor.couro, false: cor.borda }}
          />
        </View>

        <View className="gap-2">
          <Rotulo texto="Observação" />
          <Campo
            value={observacao}
            onChangeText={setObservacao}
            placeholder="Ex.: compra no cais, troca em Milão"
          />
        </View>

        {erro ? (
          <Text className="font-body text-[13px] text-vermelho">{erro}</Text>
        ) : null}
        <Botao
          titulo={trajeto ? "Salvar" : "Pôr no dia"}
          aoTocar={() => void salvar()}
          carregando={salvando}
        />
        {podeApagar ? (
          <Pressable
            onPress={() => void apagar()}
            disabled={salvando}
            accessibilityRole="button"
            className="flex-row items-center justify-center gap-1.5 py-2 active:opacity-70"
          >
            <Trash2 size={15} color={cor.vermelho} />
            <Text className="font-body-bold text-[14px] text-vermelho">
              Apagar deslocamento
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Rotulo({ texto }: { texto: string }) {
  return (
    <Text className="font-body-bold text-[12px] uppercase tracking-widest text-caramelo">
      {texto}
    </Text>
  );
}

function Chips({
  opcoes,
  valor,
  aoMudar,
}: {
  opcoes: { chave: string; nome: string }[];
  valor: string;
  aoMudar: (v: string) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {opcoes.map((o) => (
        <Pressable
          key={o.chave}
          onPress={() => aoMudar(o.chave)}
          accessibilityRole="button"
          accessibilityState={{ selected: valor === o.chave }}
          className={`min-h-[38px] justify-center rounded-full border-[1.5px] px-3.5 ${valor === o.chave ? "border-couro bg-couro" : "border-borda bg-cartao"}`}
        >
          <Text
            className={`font-body-semibold text-[13px] ${valor === o.chave ? "text-white" : "text-texto"}`}
          >
            {o.nome}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function Sugestoes({
  lista,
  aoEscolher,
}: {
  lista: Ponto[];
  aoEscolher: (p: Ponto) => void;
}) {
  if (!lista.length) return null;
  return (
    <View className="flex-row flex-wrap gap-2">
      {lista.map((p) => (
        <Pressable
          key={p.nome}
          onPress={() => aoEscolher(p)}
          className="rounded-full bg-chip px-3 py-1.5 active:opacity-80"
        >
          <Text className="font-body-semibold text-[13px] text-couro">
            {p.nome}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
