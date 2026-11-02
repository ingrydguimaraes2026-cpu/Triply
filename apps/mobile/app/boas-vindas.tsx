import { Redirect } from 'expo-router'

// As boas-vindas viraram a conversa com a Agulha em /comecar (spec 116 v2).
// A rota fica pra links antigos (ex.: sair da conta no Perfil).
export default function BoasVindas() {
  return <Redirect href="/comecar" />
}
