import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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

export const Route = createFileRoute("/_admin/turmas")({
  head: () => ({ meta: [{ title: "Turmas — Painel Monsenhor" }] }),
  component: TurmasAdmin,
});

type Modalidade = "Natação Infantil" | "Natação Adulta" | "Hidroginástica";
type StatusTurma = "ativa" | "inativa";

type Turma = {
  id: string;
  nome: string;
  modalidade: string;
  dia_semana: string | null;
  horario_inicio: string | null;
  horario_fim: string | null;
  professor: string | null;
  vagas_total: number;
  ativa: boolean;
  criado_em: string;
};

const statusColors: Record<StatusTurma, string> = {
  ativa: "bg-success/15 text-success border-success/40",
  inativa: "bg-muted text-muted-foreground border-border",
};

function statusDaTurma(turma: Turma): StatusTurma {
  return turma.ativa ? "ativa" : "inativa";
}

function formatarHorario(inicio?: string | null, fim?: string | null) {
  if (!inicio && !fim) return "—";
  const i = inicio ? inicio.slice(0, 5) : "";
  const f = fim ? fim.slice(0, 5) : "";
  if (i && f) return `${i} às ${f}`;
  return i || f || "—";
}

function TurmasAdmin() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [q, setQ] = useState("");
  const [mod, setMod] = useState<"todas" | Modalidade>("todas");
  const [st, setSt] = useState<"todos" | StatusTurma>("todos");
  const [novoAberto, setNovoAberto] = useState(false);
  const [editando, setEditando] = useState<Turma | null>(null);

  const carregar = async () => {
    setCarregando(true);

    const { data, error } = await supabase
      .from("turmas")
      .select("*")
      .order("criado_em", { ascending: false });

    if (error) {
      console.error(error);
      toast.error(`Erro ao carregar turmas: ${error.message}`);
      setCarregando(false);
      return;
    }

    setTurmas((data ?? []) as Turma[]);
    setCarregando(false);
  };

  useEffect(() => {
    carregar();
  }, []);

  const alterarStatus = async (turma: Turma, ativa: boolean) => {
    const { error } = await supabase
      .from("turmas")
      .update({ ativa })
      .eq("id", turma.id);

    if (error) {
      console.error(error);
      toast.error(`Erro ao alterar status: ${error.message}`);
      return;
    }

    setTurmas((lista) =>
      lista.map((t) => (t.id === turma.id ? { ...t, ativa } : t))
    );

    toast.success(ativa ? "Turma ativada." : "Turma inativada.");
  };

  const excluirTurma = async (turma: Turma) => {
    const confirmado = window.confirm(
      `Tem certeza que deseja excluir "${turma.nome}"? Essa ação não poderá ser desfeita.`
    );

    if (!confirmado) return;

    const { error } = await supabase
      .from("turmas")
      .delete()
      .eq("id", turma.id);

    if (error) {
      console.error(error);
      toast.error(`Erro ao excluir turma: ${error.message}`);
      return;
    }

    setTurmas((lista) => lista.filter((t) => t.id !== turma.id));
    toast.success("Turma excluída.");
  };

  const list = useMemo(() => {
    const busca = q.trim().toLowerCase();

    return turmas.filter((t) => {
      const status = statusDaTurma(t);

      const passaBusca =
        !busca ||
        t.nome.toLowerCase().includes(busca) ||
        t.modalidade.toLowerCase().includes(busca) ||
        (t.dia_semana ?? "").toLowerCase().includes(busca) ||
        (t.professor ?? "").toLowerCase().includes(busca);

      const passaModalidade = mod === "todas" || t.modalidade === mod;
      const passaStatus = st === "todos" || status === st;

      return passaBusca && passaModalidade && passaStatus;
    });
  }, [turmas, q, mod, st]);

  const resumo = useMemo(() => {
    const ativas = turmas.filter((t) => t.ativa).length;
    const vagas = turmas.reduce((acc, t) => acc + (t.vagas_total || 0), 0);

    return { ativas, vagas };
  }, [turmas]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Turmas cadastradas</CardTitle>
            <CardDescription>
              {carregando
                ? "Carregando turmas..."
                : `${turmas.length} turma(s) no total. ${resumo.ativas} ativa(s). ${resumo.vagas} vaga(s) cadastrada(s).`}
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={carregar} disabled={carregando}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>

            <Button type="button" onClick={() => setNovoAberto(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova turma
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar turma"
                className="pl-9"
              />
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

            <Select value={st} onValueChange={(v) => setSt(v as "todos" | StatusTurma)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="ativa">Ativa</SelectItem>
                <SelectItem value="inativa">Inativa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Modalidade</TableHead>
                  <TableHead>Dias</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Professor</TableHead>
                  <TableHead>Vagas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {list.map((t) => {
                  const status = statusDaTurma(t);

                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.nome}</TableCell>
                      <TableCell>{t.modalidade}</TableCell>
                      <TableCell>{t.dia_semana || "—"}</TableCell>
                      <TableCell>{formatarHorario(t.horario_inicio, t.horario_fim)}</TableCell>
                      <TableCell>{t.professor || "—"}</TableCell>
                      <TableCell>{t.vagas_total}</TableCell>

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
                            <DropdownMenuItem onClick={() => setEditando(t)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {t.ativa ? (
                              <DropdownMenuItem onClick={() => alterarStatus(t, false)}>
                                <MinusCircle className="mr-2 h-4 w-4" />
                                Inativar
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="text-success focus:text-success"
                                onClick={() => alterarStatus(t, true)}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Ativar
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => excluirTurma(t)}
                            >
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
                    <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                      {carregando ? "Carregando turmas..." : "Nenhuma turma encontrada."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <NovaTurmaDialog
        open={novoAberto}
        onOpenChange={setNovoAberto}
        onSaved={carregar}
      />

      {editando && (
        <EditarTurmaDialog
          turma={editando}
          open={!!editando}
          onOpenChange={(open) => {
            if (!open) setEditando(null);
          }}
          onSaved={() => {
            setEditando(null);
            carregar();
          }}
        />
      )}
    </div>
  );
}

function NovaTurmaDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState({
    nome: "",
    modalidade: "Natação Infantil" as Modalidade,
    dia_semana: "",
    horario_inicio: "",
    horario_fim: "",
    professor: "",
    vagas_total: 12,
    ativa: true,
  });

  useEffect(() => {
    if (!open) {
      setF({
        nome: "",
        modalidade: "Natação Infantil",
        dia_semana: "",
        horario_inicio: "",
        horario_fim: "",
        professor: "",
        vagas_total: 12,
        ativa: true,
      });
    }
  }, [open]);

  const submit = async () => {
    if (!f.nome.trim()) {
      toast.error("Informe o nome da turma.");
      return;
    }

    if (!f.modalidade) {
      toast.error("Informe a modalidade.");
      return;
    }

    const { error } = await supabase.from("turmas").insert({
      nome: f.nome.trim(),
      modalidade: f.modalidade,
      dia_semana: f.dia_semana.trim() || null,
      horario_inicio: f.horario_inicio || null,
      horario_fim: f.horario_fim || null,
      professor: f.professor.trim() || null,
      vagas_total: Number(f.vagas_total) || 0,
      ativa: f.ativa,
    });

    if (error) {
      console.error(error);
      toast.error(`Erro ao cadastrar turma: ${error.message}`);
      return;
    }

    toast.success("Turma cadastrada.");
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova turma</DialogTitle>
          <DialogDescription>Cadastro de horários, vagas e professor responsável.</DialogDescription>
        </DialogHeader>

        <FormularioTurma f={f} setF={setF} />

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

function EditarTurmaDialog({
  turma,
  open,
  onOpenChange,
  onSaved,
}: {
  turma: Turma;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState({
    nome: turma.nome,
    modalidade: turma.modalidade as Modalidade,
    dia_semana: turma.dia_semana ?? "",
    horario_inicio: turma.horario_inicio?.slice(0, 5) ?? "",
    horario_fim: turma.horario_fim?.slice(0, 5) ?? "",
    professor: turma.professor ?? "",
    vagas_total: turma.vagas_total,
    ativa: turma.ativa,
  });

  useEffect(() => {
    if (open) {
      setF({
        nome: turma.nome,
        modalidade: turma.modalidade as Modalidade,
        dia_semana: turma.dia_semana ?? "",
        horario_inicio: turma.horario_inicio?.slice(0, 5) ?? "",
        horario_fim: turma.horario_fim?.slice(0, 5) ?? "",
        professor: turma.professor ?? "",
        vagas_total: turma.vagas_total,
        ativa: turma.ativa,
      });
    }
  }, [open, turma]);

  const save = async () => {
    if (!f.nome.trim()) {
      toast.error("Informe o nome da turma.");
      return;
    }

    const { error } = await supabase
      .from("turmas")
      .update({
        nome: f.nome.trim(),
        modalidade: f.modalidade,
        dia_semana: f.dia_semana.trim() || null,
        horario_inicio: f.horario_inicio || null,
        horario_fim: f.horario_fim || null,
        professor: f.professor.trim() || null,
        vagas_total: Number(f.vagas_total) || 0,
        ativa: f.ativa,
      })
      .eq("id", turma.id);

    if (error) {
      console.error(error);
      toast.error(`Erro ao atualizar turma: ${error.message}`);
      return;
    }

    toast.success("Turma atualizada.");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar turma</DialogTitle>
          <DialogDescription>Atualizar dados da turma cadastrada.</DialogDescription>
        </DialogHeader>

        <FormularioTurma f={f} setF={setF} />

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

function FormularioTurma({
  f,
  setF,
}: {
  f: {
    nome: string;
    modalidade: Modalidade;
    dia_semana: string;
    horario_inicio: string;
    horario_fim: string;
    professor: string;
    vagas_total: number;
    ativa: boolean;
  };
  setF: React.Dispatch<
    React.SetStateAction<{
      nome: string;
      modalidade: Modalidade;
      dia_semana: string;
      horario_inicio: string;
      horario_fim: string;
      professor: string;
      vagas_total: number;
      ativa: boolean;
    }>
  >;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Fld label="Nome da turma *">
        <Input
          value={f.nome}
          onChange={(e) => setF({ ...f, nome: e.target.value })}
          placeholder="Ex.: Infantil — Terça 08:00"
        />
      </Fld>

      <Fld label="Modalidade">
        <Select value={f.modalidade} onValueChange={(v) => setF({ ...f, modalidade: v as Modalidade })}>
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

      <Fld label="Dia(s) da semana">
        <Input
          value={f.dia_semana}
          onChange={(e) => setF({ ...f, dia_semana: e.target.value })}
          placeholder="Ex.: Terça e quinta"
        />
      </Fld>

      <Fld label="Professor">
        <Input
          value={f.professor}
          onChange={(e) => setF({ ...f, professor: e.target.value })}
          placeholder="Ex.: Equipe de Educação Física"
        />
      </Fld>

      <Fld label="Horário de início">
        <Input
          type="time"
          value={f.horario_inicio}
          onChange={(e) => setF({ ...f, horario_inicio: e.target.value })}
        />
      </Fld>

      <Fld label="Horário de fim">
        <Input
          type="time"
          value={f.horario_fim}
          onChange={(e) => setF({ ...f, horario_fim: e.target.value })}
        />
      </Fld>

      <Fld label="Vagas">
        <Input
          type="number"
          min={0}
          value={f.vagas_total}
          onChange={(e) => setF({ ...f, vagas_total: Number(e.target.value) })}
        />
      </Fld>

      <Fld label="Status">
        <Select value={f.ativa ? "ativa" : "inativa"} onValueChange={(v) => setF({ ...f, ativa: v === "ativa" })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ativa">Ativa</SelectItem>
            <SelectItem value="inativa">Inativa</SelectItem>
          </SelectContent>
        </Select>
      </Fld>
    </div>
  );
}

function Fld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}