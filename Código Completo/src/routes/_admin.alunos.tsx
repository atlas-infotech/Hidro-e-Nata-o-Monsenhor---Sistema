import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, Pencil, RefreshCw, MoreHorizontal, Trash2, MinusCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/alunos")({
  head: () => ({ meta: [{ title: "Alunos — Painel Monsenhor" }] }),
  component: AlunosAdmin,
});

type Modalidade = "Natação Infantil" | "Natação Adulta" | "Hidroginástica";
type StatusAluno = "ativo" | "inativo";

type Aluno = {
  id: string;
  nome_completo: string;
  nascimento: string;
  idade: number;
  modalidade: string;
  turma: string | null;
  responsavel: string | null;
  telefone: string | null;
  whatsapp: string;
  email: string | null;
  observacoes: string | null;
  ativo: boolean;
  criado_em: string;
};

type Turma = {
  id: string;
  nome: string;
  modalidade: string;
  dia_semana: string | null;
  horario_inicio: string | null;
  horario_fim: string | null;
  ativa: boolean;
};

const SEM_TURMA = "sem_turma";

const statusColors: Record<StatusAluno, string> = {
  ativo: "bg-success/15 text-success border-success/40",
  inativo: "bg-muted text-muted-foreground border-border",
};

function calcIdade(nasc: string): number {
  if (!nasc) return 0;
  const d = new Date(nasc);
  const now = new Date();
  let idade = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) idade--;
  return Math.max(0, idade);
}

function somenteNumeros(valor: string) {
  return valor.replace(/\D/g, "").slice(0, 11);
}

function formatarTelefone(numero?: string | null) {
  if (!numero) return "—";
  const n = numero.replace(/\D/g, "");
  if (n.length === 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  if (n.length === 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return numero;
}

function statusDoAluno(aluno: Aluno): StatusAluno {
  return aluno.ativo ? "ativo" : "inativo";
}

function descricaoTurma(t: Turma) {
  return `${t.nome} — ${t.dia_semana ?? "dias não definidos"} — ${t.horario_inicio?.slice(0, 5) ?? "--:--"}`;
}

function turmaInicialPorNome(turmas: Turma[], nome?: string | null) {
  if (!nome) return SEM_TURMA;
  return turmas.find((t) => t.nome === nome)?.id ?? SEM_TURMA;
}

function AlunosAdmin() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [q, setQ] = useState("");
  const [mod, setMod] = useState<"todas" | Modalidade>("todas");
  const [st, setSt] = useState<"todos" | StatusAluno>("todos");
  const [novoAberto, setNovoAberto] = useState(false);
  const [editando, setEditando] = useState<Aluno | null>(null);

  const carregar = async () => {
    setCarregando(true);

    const { data, error } = await supabase
      .from("alunos")
      .select("*")
      .order("criado_em", { ascending: false });

    if (error) {
      console.error(error);
      toast.error(`Erro ao carregar alunos: ${error.message}`);
      setCarregando(false);
      return;
    }

    setAlunos((data ?? []) as Aluno[]);
    setCarregando(false);
  };

  const carregarTurmas = async () => {
    const { data, error } = await supabase
      .from("turmas")
      .select("id, nome, modalidade, dia_semana, horario_inicio, horario_fim, ativa")
      .eq("ativa", true)
      .order("horario_inicio", { ascending: true });

    if (error) {
      console.error(error);
      toast.error(`Erro ao carregar turmas: ${error.message}`);
      return;
    }

    setTurmas((data ?? []) as Turma[]);
  };

  useEffect(() => {
    carregar();
    carregarTurmas();
  }, []);

  const alterarStatus = async (aluno: Aluno, ativo: boolean) => {
    const { error } = await supabase.from("alunos").update({ ativo }).eq("id", aluno.id);

    if (error) {
      console.error(error);
      toast.error(`Erro ao alterar status: ${error.message}`);
      return;
    }

    setAlunos((lista) => lista.map((a) => (a.id === aluno.id ? { ...a, ativo } : a)));
    toast.success(ativo ? "Aluno ativado." : "Aluno inativado.");
  };

  const excluirAluno = async (aluno: Aluno) => {
    const confirmado = window.confirm(
      `Tem certeza que deseja excluir "${aluno.nome_completo}"? Essa ação não poderá ser desfeita.`
    );

    if (!confirmado) return;

    const { error } = await supabase.from("alunos").delete().eq("id", aluno.id);

    if (error) {
      console.error(error);
      toast.error(`Erro ao excluir aluno: ${error.message}`);
      return;
    }

    setAlunos((lista) => lista.filter((a) => a.id !== aluno.id));
    toast.success("Aluno excluído.");
  };

  const list = useMemo(() => {
    const busca = q.trim().toLowerCase();

    return alunos.filter((a) => {
      const status = statusDoAluno(a);

      const passaBusca =
        !busca ||
        a.nome_completo.toLowerCase().includes(busca) ||
        (a.turma ?? "").toLowerCase().includes(busca) ||
        (a.responsavel ?? "").toLowerCase().includes(busca) ||
        (a.telefone ?? "").toLowerCase().includes(busca) ||
        a.whatsapp.toLowerCase().includes(busca) ||
        (a.email ?? "").toLowerCase().includes(busca);

      const passaModalidade = mod === "todas" || a.modalidade === mod;
      const passaStatus = st === "todos" || status === st;

      return passaBusca && passaModalidade && passaStatus;
    });
  }, [alunos, q, mod, st]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Alunos cadastrados</CardTitle>
            <CardDescription>
              {carregando ? "Carregando alunos..." : `${alunos.length} aluno(s) no total.`}
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                carregar();
                carregarTurmas();
              }}
              disabled={carregando}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>

            <Button type="button" onClick={() => setNovoAberto(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar aluno
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar aluno" className="pl-9" />
            </div>

            <Select value={mod} onValueChange={(v) => setMod(v as "todas" | Modalidade)}>
              <SelectTrigger>
                <SelectValue placeholder="Modalidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as modalidades</SelectItem>
                <SelectItem value="Natação Infantil">Natação Infantil</SelectItem>
                <SelectItem value="Natação Adulta">Natação Adulta</SelectItem>
                <SelectItem value="Hidroginástica">Hidroginástica</SelectItem>
              </SelectContent>
            </Select>

            <Select value={st} onValueChange={(v) => setSt(v as "todos" | StatusAluno)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Idade</TableHead>
                  <TableHead>Modalidade</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {list.map((a) => {
                  const status = statusDoAluno(a);

                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.nome_completo}</TableCell>
                      <TableCell>{a.idade}</TableCell>
                      <TableCell>{a.modalidade}</TableCell>
                      <TableCell className="text-sm">{a.turma || "—"}</TableCell>

                      <TableCell>
                        <p className="text-sm">{a.responsavel || "Participante maior de idade"}</p>
                        <p className="text-xs text-muted-foreground">WhatsApp: {formatarTelefone(a.whatsapp)}</p>
                        {a.telefone && <p className="text-xs text-muted-foreground">Telefone: {formatarTelefone(a.telefone)}</p>}
                        {a.email && <p className="break-all text-xs text-muted-foreground">E-mail: {a.email}</p>}
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className={`capitalize ${statusColors[status]}`}>
                          {status}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditando(a)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {a.ativo ? (
                              <DropdownMenuItem onClick={() => alterarStatus(a, false)}>
                                <MinusCircle className="mr-2 h-4 w-4" />
                                Inativar
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem className="text-success focus:text-success" onClick={() => alterarStatus(a, true)}>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Ativar
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => excluirAluno(a)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {list.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      {carregando ? "Carregando alunos..." : "Nenhum aluno encontrado."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <NovoAlunoDialog open={novoAberto} onOpenChange={setNovoAberto} onSaved={carregar} turmas={turmas} />

      {editando && (
        <EditarAlunoDialog
          aluno={editando}
          open={!!editando}
          onOpenChange={(open) => {
            if (!open) setEditando(null);
          }}
          onSaved={() => {
            setEditando(null);
            carregar();
          }}
          turmas={turmas}
        />
      )}
    </div>
  );
}

function NovoAlunoDialog({
  open,
  onOpenChange,
  onSaved,
  turmas,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  turmas: Turma[];
}) {
  const [f, setF] = useState({
    nome_completo: "",
    nascimento: "",
    modalidade: "Natação Infantil" as Modalidade,
    turma_id: SEM_TURMA,
    responsavel: "",
    telefone: "",
    whatsapp: "",
    email: "",
    observacoes: "",
    ativo: true,
  });

  useEffect(() => {
    if (!open) {
      setF({
        nome_completo: "",
        nascimento: "",
        modalidade: "Natação Infantil",
        turma_id: SEM_TURMA,
        responsavel: "",
        telefone: "",
        whatsapp: "",
        email: "",
        observacoes: "",
        ativo: true,
      });
    }
  }, [open]);

  const turmasFiltradas = turmas.filter((t) => t.modalidade === f.modalidade);

  const submit = async () => {
    if (!f.nome_completo.trim()) {
      toast.error("Informe o nome completo.");
      return;
    }

    if (!f.nascimento) {
      toast.error("Informe a data de nascimento.");
      return;
    }

    if (!f.whatsapp.trim() || f.whatsapp.trim().length < 10) {
      toast.error("Informe um WhatsApp válido com DDD.");
      return;
    }

    const turmaSelecionada = turmas.find((t) => t.id === f.turma_id);

    const { data: alunoCriado, error } = await supabase
      .from("alunos")
      .insert({
        nome_completo: f.nome_completo.trim(),
        nascimento: f.nascimento,
        idade: calcIdade(f.nascimento),
        modalidade: f.modalidade,
        turma: turmaSelecionada?.nome ?? null,
        responsavel: f.responsavel.trim() || null,
        telefone: f.telefone.trim() || null,
        whatsapp: f.whatsapp.trim(),
        email: f.email.trim() || null,
        observacoes: f.observacoes.trim() || null,
        ativo: f.ativo,
      })
      .select("id")
      .single();

    if (error) {
      console.error(error);
      toast.error(`Erro ao cadastrar aluno: ${error.message}`);
      return;
    }

    if (f.turma_id !== SEM_TURMA && alunoCriado?.id) {
      const { error: vinculoError } = await supabase.from("alunos_turmas").insert({
        aluno_id: alunoCriado.id,
        turma_id: f.turma_id,
        ativo: true,
      });

      if (vinculoError) {
        console.error(vinculoError);
        toast.error(`Aluno cadastrado, mas houve erro ao vincular turma: ${vinculoError.message}`);
        onOpenChange(false);
        onSaved();
        return;
      }
    }

    toast.success("Aluno cadastrado.");
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo aluno</DialogTitle>
          <DialogDescription>Cadastro manual realizado pela recepção.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 md:grid-cols-2">
          <Fld label="Nome completo *">
            <Input value={f.nome_completo} onChange={(e) => setF({ ...f, nome_completo: e.target.value })} />
          </Fld>

          <Fld label="Nascimento *">
            <Input type="date" value={f.nascimento} onChange={(e) => setF({ ...f, nascimento: e.target.value })} />
          </Fld>

          <Fld label="Modalidade">
            <Select
              value={f.modalidade}
              onValueChange={(v) => setF({ ...f, modalidade: v as Modalidade, turma_id: SEM_TURMA })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Natação Infantil">Natação Infantil</SelectItem>
                <SelectItem value="Natação Adulta">Natação Adulta</SelectItem>
                <SelectItem value="Hidroginástica">Hidroginástica</SelectItem>
              </SelectContent>
            </Select>
          </Fld>

          <Fld label="Turma">
            <Select value={f.turma_id} onValueChange={(v) => setF({ ...f, turma_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma turma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_TURMA}>Sem turma definida</SelectItem>
                {turmasFiltradas.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {descricaoTurma(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Fld>

          <Fld label="Responsável">
            <Input value={f.responsavel} onChange={(e) => setF({ ...f, responsavel: e.target.value })} />
          </Fld>

          <Fld label="Telefone">
            <Input value={f.telefone} onChange={(e) => setF({ ...f, telefone: somenteNumeros(e.target.value) })} inputMode="numeric" maxLength={11} />
          </Fld>

          <Fld label="WhatsApp *">
            <Input value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: somenteNumeros(e.target.value) })} inputMode="numeric" maxLength={11} />
          </Fld>

          <Fld label="E-mail">
            <Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          </Fld>

          <Fld label="Status">
            <Select value={f.ativo ? "ativo" : "inativo"} onValueChange={(v) => setF({ ...f, ativo: v === "ativo" })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </Fld>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditarAlunoDialog({
  aluno,
  open,
  onOpenChange,
  onSaved,
  turmas,
}: {
  aluno: Aluno;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  turmas: Turma[];
}) {
  const [f, setF] = useState({
    ...aluno,
    turma_id: turmaInicialPorNome(turmas, aluno.turma),
  });

  useEffect(() => {
    if (open) {
      setF({
        ...aluno,
        turma_id: turmaInicialPorNome(turmas, aluno.turma),
      });
    }
  }, [open, aluno, turmas]);

  const turmasFiltradas = turmas.filter((t) => t.modalidade === f.modalidade);

  const save = async () => {
    if (!f.nome_completo.trim()) {
      toast.error("Informe o nome completo.");
      return;
    }

    if (!f.whatsapp.trim() || f.whatsapp.trim().length < 10) {
      toast.error("Informe um WhatsApp válido com DDD.");
      return;
    }

    const turmaSelecionada = turmas.find((t) => t.id === f.turma_id);

    const { error } = await supabase
      .from("alunos")
      .update({
        nome_completo: f.nome_completo.trim(),
        nascimento: f.nascimento,
        idade: calcIdade(f.nascimento),
        modalidade: f.modalidade,
        turma: turmaSelecionada?.nome ?? null,
        responsavel: f.responsavel?.trim() || null,
        telefone: f.telefone?.trim() || null,
        whatsapp: f.whatsapp.trim(),
        email: f.email?.trim() || null,
        observacoes: f.observacoes?.trim() || null,
        ativo: f.ativo,
      })
      .eq("id", aluno.id);

    if (error) {
      console.error(error);
      toast.error(`Erro ao atualizar aluno: ${error.message}`);
      return;
    }

    await supabase.from("alunos_turmas").delete().eq("aluno_id", aluno.id);

    if (f.turma_id !== SEM_TURMA) {
      const { error: vinculoError } = await supabase.from("alunos_turmas").insert({
        aluno_id: aluno.id,
        turma_id: f.turma_id,
        ativo: true,
      });

      if (vinculoError) {
        console.error(vinculoError);
        toast.error(`Aluno atualizado, mas houve erro ao vincular turma: ${vinculoError.message}`);
        onSaved();
        return;
      }
    }

    toast.success("Aluno atualizado.");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar aluno</DialogTitle>
          <DialogDescription>Atualizar status, turma ou contato.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 md:grid-cols-2">
          <Fld label="Nome">
            <Input value={f.nome_completo} onChange={(e) => setF({ ...f, nome_completo: e.target.value })} />
          </Fld>

          <Fld label="Nascimento">
            <Input type="date" value={f.nascimento} onChange={(e) => setF({ ...f, nascimento: e.target.value })} />
          </Fld>

          <Fld label="Responsável">
            <Input value={f.responsavel ?? ""} onChange={(e) => setF({ ...f, responsavel: e.target.value })} />
          </Fld>

          <Fld label="Telefone">
            <Input value={f.telefone ?? ""} onChange={(e) => setF({ ...f, telefone: somenteNumeros(e.target.value) })} inputMode="numeric" maxLength={11} />
          </Fld>

          <Fld label="WhatsApp">
            <Input value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: somenteNumeros(e.target.value) })} inputMode="numeric" maxLength={11} />
          </Fld>

          <Fld label="E-mail">
            <Input type="email" value={f.email ?? ""} onChange={(e) => setF({ ...f, email: e.target.value })} />
          </Fld>

          <Fld label="Modalidade">
            <Select
              value={f.modalidade as Modalidade}
              onValueChange={(v) => setF({ ...f, modalidade: v as Modalidade, turma_id: SEM_TURMA })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Natação Infantil">Natação Infantil</SelectItem>
                <SelectItem value="Natação Adulta">Natação Adulta</SelectItem>
                <SelectItem value="Hidroginástica">Hidroginástica</SelectItem>
              </SelectContent>
            </Select>
          </Fld>

          <Fld label="Turma">
            <Select value={f.turma_id} onValueChange={(v) => setF({ ...f, turma_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma turma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_TURMA}>Sem turma definida</SelectItem>
                {turmasFiltradas.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {descricaoTurma(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Fld>

          <Fld label="Status">
            <Select value={f.ativo ? "ativo" : "inativo"} onValueChange={(v) => setF({ ...f, ativo: v === "ativo" })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </Fld>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={save}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Fld({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}