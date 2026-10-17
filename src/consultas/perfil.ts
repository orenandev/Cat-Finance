import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUsuario } from '@/contextos/SessaoContexto'
import { garantir } from '@/lib/erros'
import { supabase } from '@/lib/supabase'
import type { Perfil } from '@/tipos/dominio'
import { chaves } from './chaves'

type AtualizacaoPerfil = Partial<Pick<Perfil, 'nome' | 'usuario' | 'avatar_url' | 'moeda' | 'termos_aceitos_em'>>

export function usePerfil() {
  const usuario = useUsuario()
  return useQuery({
    queryKey: chaves.perfil(usuario.id),
    queryFn: async () =>
      garantir(
        await supabase
          .from('perfis')
          .select('id, nome, usuario, avatar_url, moeda, termos_aceitos_em, criado_em')
          .eq('id', usuario.id)
          .single<Perfil>(),
      ),
    staleTime: 5 * 60_000,
  })
}

export function useAtualizarPerfil() {
  const usuario = useUsuario()
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: async (dados: AtualizacaoPerfil) =>
      garantir(
        await supabase
          .from('perfis')
          .update(dados)
          .eq('id', usuario.id)
          .select('id, nome, usuario, avatar_url, moeda, termos_aceitos_em, criado_em')
          .single<Perfil>(),
      ),
    onSuccess: (perfil) => cliente.setQueryData(chaves.perfil(usuario.id), perfil),
    meta: { sucesso: 'Perfil atualizado.' },
  })
}
