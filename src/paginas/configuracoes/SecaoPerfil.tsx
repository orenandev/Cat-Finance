import { AtSign, ImageOff } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Botao } from '@/componentes/ui/Botao'
import { Campo, Selecao } from '@/componentes/ui/Campo'
import { Cartao } from '@/componentes/ui/Cartao'
import { Avatar } from '@/componentes/ui/Diversos'
import { useAtualizarPerfil } from '@/consultas/perfil'
import { useUsuario } from '@/contextos/SessaoContexto'
import { provedores } from '@/lib/autenticacao'
import type { Moeda, Perfil } from '@/tipos/dominio'
import { type ErrosFormulario, esquemaPerfil, validarFormulario } from '@/validacao/esquemas'

function fotosDisponiveis(identidades: { provider: string; identity_data?: Record<string, unknown> }[] | undefined) {
  return (identidades ?? []).flatMap((identidade) => {
    const url = identidade.identity_data?.avatar_url ?? identidade.identity_data?.picture
    return typeof url === 'string' && url.startsWith('https://') ? [{ provedor: identidade.provider, url }] : []
  })
}

export function SecaoPerfil({ perfil }: { perfil: Perfil }) {
  const usuario = useUsuario()
  const atualizar = useAtualizarPerfil()
  const [erros, setErros] = useState<ErrosFormulario>({})
  const [formulario, setFormulario] = useState({
    nome: perfil.nome ?? '',
    usuario: perfil.usuario,
    moeda: perfil.moeda,
  })

  const fotos = fotosDisponiveis(usuario.identities)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const validacao = validarFormulario(esquemaPerfil, formulario)
    if (!validacao.sucesso) {
      setErros(validacao.erros)
      return
    }
    setErros({})
    atualizar.mutate(validacao.dados)
  }

  return (
    <Cartao titulo="Perfil" descricao="Como você aparece no Catfinance.">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar nome={perfil.nome || usuario.email || ''} url={perfil.avatar_url} tamanho={64} />
        <div className="flex flex-wrap gap-2">
          {fotos.map((foto) => {
            const provedor = provedores.find((item) => item.id === foto.provedor)
            if (!provedor) return null
            const emUso = foto.url === perfil.avatar_url
            return (
              <Botao
                key={foto.provedor}
                variante="secundaria"
                tamanho="sm"
                disabled={emUso || atualizar.isPending}
                onClick={() => atualizar.mutate({ avatar_url: foto.url })}
              >
                <provedor.Icone tamanho={14} />
                {emUso ? `Foto do ${provedor.nome} em uso` : `Usar foto do ${provedor.nome}`}
              </Botao>
            )
          })}
          {perfil.avatar_url && (
            <Botao variante="fantasma" tamanho="sm" icone={ImageOff} onClick={() => atualizar.mutate({ avatar_url: null })}>
              Remover foto
            </Botao>
          )}
          {fotos.length === 0 && !perfil.avatar_url && (
            <p className="text-xs text-texto-fraco">Conecte sua conta Google ou Discord para usar a foto delas.</p>
          )}
        </div>
      </div>

      <form onSubmit={enviar} noValidate className="grid gap-4 sm:grid-cols-2">
        <Campo
          rotulo="Nome"
          value={formulario.nome}
          onChange={(evento) => setFormulario((atual) => ({ ...atual, nome: evento.target.value }))}
          maxLength={120}
          erro={erros.nome}
        />
        <Campo
          rotulo="Usuário"
          value={formulario.usuario}
          onChange={(evento) => setFormulario((atual) => ({ ...atual, usuario: evento.target.value.toLowerCase() }))}
          prefixo={<AtSign size={15} />}
          maxLength={30}
          erro={erros.usuario}
        />
        <Campo rotulo="E-mail" value={usuario.email ?? ''} disabled dica="O e-mail é usado para entrar e não pode ser alterado aqui." />
        <Selecao
          rotulo="Moeda de exibição"
          value={formulario.moeda}
          onChange={(evento) => setFormulario((atual) => ({ ...atual, moeda: evento.target.value as Moeda }))}
        >
          <option value="BRL">Real (R$)</option>
          <option value="USD">Dólar (US$)</option>
          <option value="EUR">Euro (€)</option>
        </Selecao>
        <div className="sm:col-span-2 sm:flex sm:justify-end">
          <Botao type="submit" carregando={atualizar.isPending}>
            Salvar perfil
          </Botao>
        </div>
      </form>
    </Cartao>
  )
}
