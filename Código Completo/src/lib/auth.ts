const KEY = "hidro-monsenhor-session";

export type Perfil = "Administrador" | "Recepção" | "Professor";

export type Sessao = {
  usuario: string;
  email: string;
  perfil: Perfil;
};

export type Permissao =
  | "painel"
  | "pre-cadastros"
  | "alunos"
  | "turmas"
  | "presenca"
  | "avisos"
  | "relatorios"
  | "seguranca"
  | "usuarios";

export const permissoesPorPerfil: Record<Perfil, Permissao[]> = {
  Administrador: [
    "painel",
    "pre-cadastros",
    "alunos",
    "turmas",
    "presenca",
    "avisos",
    "relatorios",
    "seguranca",
    "usuarios",
  ],
  Recepção: [
    "painel",
    "pre-cadastros",
    "alunos",
    "turmas",
    "presenca",
    "avisos",
    "relatorios",
  ],
  Professor: ["painel", "turmas", "presenca"],
};

export const usuariosAutorizados = [
  {
    usuario: "Administração",
    senha: "HidroMonsenhor@2026",
    email: "administracao@monsenhor.local",
    perfil: "Administrador" as Perfil,
  },
  {
    usuario: "Recepção",
    senha: "Recepcao@2026",
    email: "recepcao@monsenhor.local",
    perfil: "Recepção" as Perfil,
  },
  {
    usuario: "Professor",
    senha: "Professor@2026",
    email: "professor@monsenhor.local",
    perfil: "Professor" as Perfil,
  },
];

export function getSessao(): Sessao | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Sessao) : null;
  } catch {
    return null;
  }
}

export function entrar(usuario: string, senha: string): Sessao | null {
  const usuarioDigitado = usuario.trim();
  const senhaDigitada = senha.trim();

  const encontrado = usuariosAutorizados.find(
    (u) => u.usuario === usuarioDigitado && u.senha === senhaDigitada
  );

  if (!encontrado) return null;

  const sessao: Sessao = {
    usuario: encontrado.usuario,
    email: encontrado.email,
    perfil: encontrado.perfil,
  };

  localStorage.setItem(KEY, JSON.stringify(sessao));
  return sessao;
}

export function sair() {
  localStorage.removeItem(KEY);
}

export function podeAcessar(permissao: Permissao): boolean {
  const sessao = getSessao();

  if (!sessao) return false;

  return permissoesPorPerfil[sessao.perfil].includes(permissao);
}