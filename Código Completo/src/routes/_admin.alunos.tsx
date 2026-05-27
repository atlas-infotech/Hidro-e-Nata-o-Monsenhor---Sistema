import { createFileRoute } from "@tanstack/react-router";
import { useDB, db, type Aluno, type Modalidade, type StatusAluno } from "@/lib/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useMemo, useState } from "react";
import { Plus, Search, Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/alunos")({
  head: () => ({ meta: [{ title: "Alunos — Painel Monsenhor" }] }),
  component: AlunosAdmin,
});

const statusColors: Record<StatusAluno, string> = {
  ativo: "bg-success/15 text-success border-success/40",
  inativo: "bg-muted text-muted-foreground border-border",
  "fila de espera": "bg-accent text-accent-foreground border-border",
};

function AlunosAdmin() {
  const data = useDB();
  const [q, setQ] = useState("");
  const [mod, setMod] = useState<"todas" | Modalidade>("todas");
  const [st, setSt] = useState<"todos" | StatusAluno>("todos");
  const [turmaF, setTurmaF] = useState<string>("todas");

  const list = useMemo(() => data.alunos.filter((a) =>
    a.nome.toLowerCase().includes(q.toLowerCase()) &&
    (mod === "todas" || a.modalidade === mod) &&
    (st === "todos" || a.status === st) &&
    (turmaF === "todas" || a.turmaId === turmaF)
  ), [data.alunos, q, mod, st, turmaF]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>Alunos cadastrados</CardTitle>
            <CardDescription>{data.alunos.length} alunos no total.</CardDescription>
          </div>
          <NovoAlunoDialog />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome" className="pl-9" />
            </div>
            <Select value={mod} onValueChange={(v) => setMod(v as never)}>
              <SelectTrigger><SelectValue placeholder="Modalidade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as modalidades</SelectItem>
                <SelectItem value="Natação Infantil">Natação Infantil</SelectItem>
                <SelectItem value="Natação Adulta">Natação Adulta</SelectItem>
                <SelectItem value="Hidroginástica">Hidroginástica</SelectItem>
              </SelectContent>
            </Select>
            <Select value={turmaF} onValueChange={setTurmaF}>
              <SelectTrigger><SelectValue placeholder="Turma" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as turmas</SelectItem>
                {data.turmas.map((t) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={st} onValueChange={(v) => setSt(v as never)}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="fila de espera">Fila de espera</SelectItem>
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
                  <TableHead>Responsável</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.nome}</TableCell>
                    <TableCell>{a.idade}</TableCell>
                    <TableCell>{a.modalidade}</TableCell>
                    <TableCell className="text-sm">{data.turmas.find((t) => t.id === a.turmaId)?.nome ?? "—"}</TableCell>
                    <TableCell>
                      <p className="text-sm">{a.responsavel}</p>
                      <p className="text-xs text-muted-foreground">{a.telefone}</p>
                    </TableCell>
                    <TableCell><Badge variant="outline" className={`capitalize ${statusColors[a.status]}`}>{a.status}</Badge></TableCell>
                    <TableCell className="text-right"><EditarAlunoDialog aluno={a} /></TableCell>
                  </TableRow>
                ))}
                {list.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">Nenhum aluno encontrado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NovoAlunoDialog() {
  const data = useDB();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    nome: "", nascimento: "", modalidade: "Natação Infantil" as Modalidade,
    turmaId: "", responsavel: "", telefone: "", status: "ativo" as StatusAluno,
  });
  const submit = () => {
    if (!f.nome || !f.nascimento) { toast.error("Informe nome e nascimento."); return; }
    const idade = Math.floor((Date.now() - new Date(f.nascimento).getTime()) / (365.25 * 24 * 3600 * 1000));
    db.addAluno({ ...f, idade, turmaId: f.turmaId || undefined });
    toast.success("Aluno cadastrado.");
    setOpen(false);
    setF({ nome: "", nascimento: "", modalidade: "Natação Infantil", turmaId: "", responsavel: "", telefone: "", status: "ativo" });
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Adicionar aluno</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo aluno</DialogTitle>
          <DialogDescription>Cadastro manual realizado pela recepção.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 md:grid-cols-2">
          <Fld label="Nome completo"><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></Fld>
          <Fld label="Nascimento"><Input type="date" value={f.nascimento} onChange={(e) => setF({ ...f, nascimento: e.target.value })} /></Fld>
          <Fld label="Modalidade">
            <Select value={f.modalidade} onValueChange={(v) => setF({ ...f, modalidade: v as Modalidade })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Natação Infantil">Natação Infantil</SelectItem>
                <SelectItem value="Natação Adulta">Natação Adulta</SelectItem>
                <SelectItem value="Hidroginástica">Hidroginástica</SelectItem>
              </SelectContent>
            </Select>
          </Fld>
          <Fld label="Vincular à turma">
            <Select value={f.turmaId || "_none"} onValueChange={(v) => setF({ ...f, turmaId: v === "_none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Sem turma" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Sem turma</SelectItem>
                {data.turmas.map((t) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </Fld>
          <Fld label="Responsável"><Input value={f.responsavel} onChange={(e) => setF({ ...f, responsavel: e.target.value })} /></Fld>
          <Fld label="Telefone"><Input value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} /></Fld>
          <Fld label="Status">
            <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v as StatusAluno })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="fila de espera">Fila de espera</SelectItem>
              </SelectContent>
            </Select>
          </Fld>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditarAlunoDialog({ aluno }: { aluno: Aluno }) {
  const data = useDB();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ ...aluno });
  const save = () => {
    db.updateAluno(aluno.id, { ...f, turmaId: f.turmaId || undefined });
    toast.success("Aluno atualizado.");
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setF({ ...aluno }); }}>
      <DialogTrigger asChild><Button size="sm" variant="ghost"><Pencil className="mr-2 h-4 w-4" />Editar</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar aluno</DialogTitle>
          <DialogDescription>Atualizar status, turma ou contato.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 md:grid-cols-2">
          <Fld label="Nome"><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></Fld>
          <Fld label="Responsável"><Input value={f.responsavel} onChange={(e) => setF({ ...f, responsavel: e.target.value })} /></Fld>
          <Fld label="Telefone"><Input value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} /></Fld>
          <Fld label="Modalidade">
            <Select value={f.modalidade} onValueChange={(v) => setF({ ...f, modalidade: v as Modalidade })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Natação Infantil">Natação Infantil</SelectItem>
                <SelectItem value="Natação Adulta">Natação Adulta</SelectItem>
                <SelectItem value="Hidroginástica">Hidroginástica</SelectItem>
              </SelectContent>
            </Select>
          </Fld>
          <Fld label="Turma">
            <Select value={f.turmaId || "_none"} onValueChange={(v) => setF({ ...f, turmaId: v === "_none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Sem turma" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Sem turma</SelectItem>
                {data.turmas.map((t) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </Fld>
          <Fld label="Status">
            <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v as StatusAluno })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="fila de espera">Fila de espera</SelectItem>
              </SelectContent>
            </Select>
          </Fld>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={save}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Fld({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-sm">{label}</Label>{children}</div>;
}
