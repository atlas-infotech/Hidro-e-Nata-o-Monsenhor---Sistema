import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal, Search, Hourglass, XCircle, MinusCircle,
  EyeIcon, RefreshCw, Trash2, UserCheck,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/pre-cadastros")({
  head: () => ({ meta: [{ title: "Pré-cadastros — Painel Monsenhor" }] }),
  component: PreCadastrosAdmin,
});

type StatusPreCadastro = "pendente" | "aprovado" | "fila de espera" | "recusado" | "inativo";

type PreCadastro = {
  id: string;
  nome_aluno: string;
  nascimento: string;
  idade: number;
  modalidade: string;
  turno: string;
  horario_interesse: string | null;
  escola_turma: string | null;
  observacoes: string | null;
  responsavel: string | null;
  telefone: string | null;
  whatsapp: string;
  email: string | null;
  status: StatusPreCadastro;
  criado_em: string;
  created_at: string;
};

const statusStyle: Record<StatusPreCadastro, string> = {
  pendente: "bg-warning/15 text-warning-foreground border border-warning/40",
  aprovado: "bg-success/15 text-success border border-success/40",
  "fila de espera": "bg-accent text-accent-foreground border border-border",
  recusado: "bg-destructive/10 text-destructive border border-destructive/30",
  inativo: "bg-muted text-muted-foreground border border-border",
};

function formatarTelefone(numero?: string | null) {
  if (!numero) return null;
  const n = numero.replace(/\D/g, "");
  if (n.length === 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  if (n.length === 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return numero;
}

function separarEscolaTurma(valor?: string | null) {
  if (!valor) return null;
  const partes = valor.split("—").map((p) => p.trim()).filter(Boolean);
  return {
    escola: partes[0] || null,
    anoSerie: partes[1] || null,
    turma: partes[2] || null,
  };
}

function PreCadastrosAdmin() {
  const [preCadastros, setPreCadastros] = useState<PreCadastro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<"todos" | StatusPreCadastro>("todos");
  const [verId, setVerId] = useState<string | null>(null);

  const carregar = async () => {
    setCarregando(true);

    const { data, error } = await supabase
      .from("pre_cadastros")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error(`Erro ao carregar pré-cadastros: ${error.message}`);
      setCarregando(false);
      return;
    }

    setPreCadastros((data ?? []) as PreCadastro[]);
    setCarregando(false);
  };

  useEffect(() => {
    carregar();
  }, []);

  const filtrados = useMemo(() => {
    const busca = q.trim().toLowerCase();

    return preCadastros.filter((p) => {
      const passaFiltro = filtro === "todos" || p.status === filtro;
      const passaBusca =
        !busca ||
        p.nome_aluno.toLowerCase().includes(busca) ||
        (p.responsavel ?? "").toLowerCase().includes(busca) ||
        p.whatsapp.toLowerCase().includes(busca) ||
        (p.telefone ?? "").toLowerCase().includes(busca) ||
        (p.email ?? "").toLowerCase().includes(busca);

      return passaFiltro && passaBusca;
    });
  }, [preCadastros, q, filtro]);

  const verItem = preCadastros.find((p) => p.id === verId);
  const dadosEscolares = separarEscolaTurma(verItem?.escola_turma);

  const setStatus = async (id: string, s: StatusPreCadastro, msg: string) => {
    const { error } = await supabase
      .from("pre_cadastros")
      .update({ status: s })
      .eq("id", id);

    if (error) {
      console.error(error);
      toast.error(`Não foi possível alterar o status: ${error.message}`);
      return;
    }

    setPreCadastros((lista) =>
      lista.map((p) => (p.id === id ? { ...p, status: s } : p))
    );

    toast.success(msg);
  };

  const converterEmAluno = async (p: PreCadastro) => {
    if (p.status === "aprovado") {
      toast.info("Este pré-cadastro já foi convertido ou aprovado.");
      return;
    }

    const confirmado = window.confirm(`Deseja converter "${p.nome_aluno}" em aluno cadastrado?`);
    if (!confirmado) return;

    const { data: alunoExistente, error: buscaError } = await supabase
      .from("alunos")
      .select("id")
      .eq("nome_completo", p.nome_aluno)
      .eq("nascimento", p.nascimento)
      .limit(1);

    if (buscaError) {
      console.error(buscaError);
      toast.error(`Não foi possível verificar duplicidade: ${buscaError.message}`);
      return;
    }

    if (alunoExistente && alunoExistente.length > 0) {
      await setStatus(p.id, "aprovado", "Pré-cadastro já tinha aluno cadastrado. Status atualizado.");
      return;
    }

    const { error: alunoError } = await supabase.from("alunos").insert({
      nome_completo: p.nome_aluno,
      nascimento: p.nascimento,
      idade: p.idade,
      modalidade: p.modalidade,
      turma: null,
      responsavel: p.responsavel,
      telefone: p.telefone,
      whatsapp: p.whatsapp,
      email: p.email,
      observacoes: p.observacoes,
      ativo: true,
    });

    if (alunoError) {
      console.error(alunoError);
      toast.error(`Não foi possível converter em aluno: ${alunoError.message}`);
      return;
    }

    await setStatus(p.id, "aprovado", "Aluno cadastrado com sucesso.");
  };

  const excluirPreCadastro = async (id: string) => {
    const confirmado = window.confirm(
      "Tem certeza que deseja excluir este pré-cadastro? Essa ação não poderá ser desfeita."
    );

    if (!confirmado) return;

    const { error } = await supabase.from("pre_cadastros").delete().eq("id", id);

    if (error) {
      console.error(error);
      toast.error(`Não foi possível excluir o pré-cadastro: ${error.message}`);
      return;
    }

    setPreCadastros((lista) => lista.filter((p) => p.id !== id));
    setVerId(null);
    toast.success("Pré-cadastro excluído.");
  };

  const filtros: Array<{ k: "todos" | StatusPreCadastro; label: string }> = [
    { k: "todos", label: "Todos" },
    { k: "pendente", label: "Pendentes" },
    { k: "aprovado", label: "Aprovados" },
    { k: "fila de espera", label: "Fila de espera" },
    { k: "recusado", label: "Recusados" },
    { k: "inativo", label: "Inativos" },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Pré-cadastros recebidos</CardTitle>
              <CardDescription>Aprovar, converter, encaminhar para fila ou recusar solicitações.</CardDescription>
            </div>

            <Button type="button" variant="outline" size="sm" onClick={carregar} disabled={carregando}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar pré-cadastro"
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {filtros.map((f) => (
                <Button
                  key={f.k}
                  variant={filtro === f.k ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFiltro(f.k)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Modalidade</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Recebido</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtrados.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <p className="font-medium">{p.nome_aluno}</p>
                      <p className="text-xs text-muted-foreground">{p.idade} anos</p>
                    </TableCell>

                    <TableCell>{p.modalidade}</TableCell>
                    <TableCell>{p.horario_interesse || p.turno}</TableCell>

                    <TableCell>
                      {p.responsavel ? (
                        <p className="text-sm font-medium">Responsável: {p.responsavel}</p>
                      ) : (
                        <p className="text-sm font-medium">Participante maior de idade</p>
                      )}

                      <p className="text-xs text-muted-foreground">
                        WhatsApp: {formatarTelefone(p.whatsapp)}
                      </p>

                      {p.telefone && (
                        <p className="text-xs text-muted-foreground">
                          Telefone: {formatarTelefone(p.telefone)}
                        </p>
                      )}

                      {p.email && (
                        <p className="text-xs text-muted-foreground break-all">
                          E-mail: {p.email}
                        </p>
                      )}
                    </TableCell>

                    <TableCell className="text-sm">
                      {new Date(p.criado_em).toLocaleDateString("pt-BR")}
                    </TableCell>

                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyle[p.status]}`}>
                        {p.status}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setVerId(p.id)}>
                            <EyeIcon className="mr-2 h-4 w-4" />
                            Visualizar
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem onClick={() => setStatus(p.id, "fila de espera", "Encaminhado para fila de espera.")}>
                            <Hourglass className="mr-2 h-4 w-4" />
                            Colocar em fila
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => setStatus(p.id, "recusado", "Pré-cadastro recusado.")}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Recusar
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => setStatus(p.id, "inativo", "Pré-cadastro marcado como inativo.")}>
                            <MinusCircle className="mr-2 h-4 w-4" />
                            Inativar
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            className="text-success focus:text-success"
                            disabled={p.status === "aprovado"}
                            onClick={() => converterEmAluno(p)}
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            {p.status === "aprovado" ? "Aluno já convertido" : "Converter em aluno"}
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => excluirPreCadastro(p.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}

                {filtrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      {carregando ? "Carregando pré-cadastros..." : "Nenhum pré-cadastro encontrado."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!verItem} onOpenChange={(o) => !o && setVerId(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {verItem && (
            <>
              <SheetHeader>
                <SheetTitle>{verItem.nome_aluno}</SheetTitle>
                <SheetDescription>Detalhes do pré-cadastro</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-4 px-4 text-sm">
                <Section title="Dados do aluno">
                  <Row k="Nascimento" v={new Date(verItem.nascimento).toLocaleDateString("pt-BR")} />
                  <Row k="Idade" v={`${verItem.idade} anos`} />
                  <Row k="Modalidade" v={verItem.modalidade} />
                  <Row k="Horário" v={verItem.horario_interesse || verItem.turno} />

                  {dadosEscolares?.escola && <Row k="Escola" v={dadosEscolares.escola} />}
                  {dadosEscolares?.anoSerie && <Row k="Ano/Série" v={dadosEscolares.anoSerie} />}
                  {dadosEscolares?.turma && <Row k="Turma" v={dadosEscolares.turma} />}
                  {!dadosEscolares && verItem.escola_turma && <Row k="Escola/turma" v={verItem.escola_turma} />}
                  {verItem.observacoes && <Row k="Observações" v={verItem.observacoes} />}
                </Section>

                <Section title="Contato">
                  {verItem.responsavel && <Row k="Responsável" v={verItem.responsavel} />}
                  <Row k="WhatsApp" v={formatarTelefone(verItem.whatsapp)} />
                  {verItem.telefone && <Row k="Telefone" v={formatarTelefone(verItem.telefone)} />}
                  {verItem.email && <Row k="E-mail" v={verItem.email} />}
                </Section>

                <Section title="Administração">
                  <Row
                    k="Status"
                    v={<Badge variant="outline" className="capitalize">{verItem.status}</Badge>}
                  />
                  <Row k="Recebido em" v={new Date(verItem.criado_em).toLocaleDateString("pt-BR")} />
                </Section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="space-y-1.5 rounded-md border border-border p-3">{children}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-start gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-medium break-words">{v}</span>
    </div>
  );
}