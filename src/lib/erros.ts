const mensagensConhecidas: [RegExp, string][] = [
  [/invalid login credentials/i, 'E-mail ou senha incorretos.'],
  [/email not confirmed/i, 'Confirme seu e-mail antes de entrar.'],
  [/user already registered|already been registered/i, 'Este e-mail já possui uma conta. Tente entrar.'],
  [/token has expired|otp.*expired|expired/i, 'O código expirou. Solicite um novo.'],
  [/invalid.*(otp|token)|token.*invalid/i, 'Código inválido. Confira e tente novamente.'],
  [/rate limit|too many requests|security purposes/i, 'Muitas tentativas. Aguarde um pouco e tente de novo.'],
  [/password should be|weak password|password is known/i, 'Escolha uma senha mais forte.'],
  [/same password|different from the old/i, 'A nova senha precisa ser diferente da atual.'],
  [/identity.*already.*linked|already linked/i, 'Esta conta externa já está vinculada a outro usuário.'],
  [/manual linking is disabled/i, 'A vinculação de contas ainda não foi habilitada no servidor.'],
  [/duplicate key.*usuario|perfis_usuario_key/i, 'Esse nome de usuário já está em uso.'],
  [/duplicate key.*categorias/i, 'Já existe uma categoria com esse nome.'],
  [/duplicate key.*folhas/i, 'Já existe uma folha para esta competência.'],
  [/violates check constraint/i, 'Algum valor informado está fora do permitido.'],
  [/violates foreign key/i, 'Referência inválida. Atualize a página e tente novamente.'],
  [/failed to fetch|networkerror|load failed/i, 'Sem conexão com o servidor. Verifique sua internet.'],
  [/jwt expired|invalid jwt|sessão inválida/i, 'Sua sessão expirou. Entre novamente.'],
]

const codigosComMensagemPropria = new Set(['P0001', 'P0002', '22023'])

export function mensagemErro(erro: unknown, padrao = 'Algo deu errado. Tente novamente.') {
  const texto =
    erro instanceof Error
      ? erro.message
      : typeof erro === 'object' && erro && 'message' in erro
        ? String((erro as { message: unknown }).message)
        : typeof erro === 'string'
          ? erro
          : ''

  if (!texto) return padrao
  const codigo = typeof erro === 'object' && erro && 'code' in erro ? String((erro as { code: unknown }).code) : ''
  if (codigosComMensagemPropria.has(codigo)) return texto
  return mensagensConhecidas.find(([padraoErro]) => padraoErro.test(texto))?.[1] ?? padrao
}

export function garantir<T>(resultado: { data: T; error: unknown }): NonNullable<T> {
  if (resultado.error) throw resultado.error
  return resultado.data as NonNullable<T>
}
