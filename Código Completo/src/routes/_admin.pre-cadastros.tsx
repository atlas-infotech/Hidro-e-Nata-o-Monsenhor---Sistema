import { createFileRoute } from "@tanstack/react-router";
import { useDB, db, type StatusPreCadastro } from "@/lib/mock-data";
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
import { useState } from "react";
import { MoreHorizontal, Search, CheckCircle2, UserCheck, Hourglass, XCircle, EyeIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/pre-cadastros")({
  head: () => ({ meta: [{ title: "Pré-cadastros — Painel Monsenhor" }] }),
  component: PreCadastrosAdmin,
});

const statusStyle: Record<StatusPreCadastro, string> = {
  pendente: "bg-warning/15 text-warning-foreground border border-warning/40",
  aprovado: "bg-success/15 text-success border border-success/40",
  "fila de espera": "bg-accent text-accent-foreground border border-border",
  recusado: "bg-destructive/10 text-destructive border border-destructive/30",
  inativo: "bg-muted text-muted-foreground border border-border",
};

function PreCadastrosAdmin() {
  const { preCadastros } = useDB();
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<"todos" | StatusPreCadastro>("todos");
  const [verId, setVerId] = useState<string | null>(null);
  const filtrados = preCadastros.filter((p) =>
    (filtro === "todos" || p.status === filtro) &&
    (p.nomeAluno.toLowerCase().includes(q.toLowerCase()) || p.responsavel.toLowerCase().includes(q.toLowerCase()))
  );
  const verItem = preCadastros.find((p) => p.id === verId);

  const setStatus = (id: string, s: StatusPreCadastro, msg: string) => {
    db.updatePreCadastroStatus(id, s);
    toast.success(msg);
  };

  const filtros: Array<{ k: "todos" | StatusPreCadastro; label: string }> = [
    { k: "todos", label: "Todos" },
    { k: "pendente", label: "Pendentes" },
    { k: "aprovado", label: "Aprovados" },
    { k: "fila de espera", label: "Fila de espera" },
    { k: "recusado", label: "Recusados" },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Pré-cadastros recebidos</CardTitle>
          <CardDescription>Aprovar, encaminhar para fila ou recusar solicitações.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por aluno ou responsável" className="pl-9" />
            </div>
            <div className="flex flex-wrap gap-2">
              {filtros.map((f) => (
                <Button key={f.k} variant={filtro === f.k ? "default" : "outline"} size="sm" onClick={() => setFiltro(f.k)}>
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
                  <TableHead>Turno</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Recebido</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <p className="font-medium">{p.nomeAluno}</p>
                      <p className="text-xs text-muted-foreground">{p.idade} anos</p>
                    </TableCell>
                    <TableCell>{p.modalidade}</TableCell>
                    <TableCell>{p.turno}</TableCell>
                    <TableCell>
                      <p className="text-sm">{p.responsavel}</p>
                      <p className="text-xs text-muted-foreground">{p.telefone}</p>
                    </TableCell>
                    <TableCell className="text-sm">{new Date(p.criadoEm).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell><span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyle[p.status]}`}>{p.status}</span></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setVerId(p.id)}><EyeIcon className="mr-2 h-4 w-4" />Visualizar</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setStatus(p.id, "aprovado", "Pré-cadastro aprovado.")}><CheckCircle2 className="mr-2 h-4 w-4" />Aprovar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatus(p.id, "fila de espera", "Encaminhado para fila de espera.")}><Hourglass className="mr-2 h-4 w-4" />Colocar em fila</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatus(p.id, "recusado", "Pré-cadastro recusado.")}><XCircle className="mr-2 h-4 w-4" />Recusar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatus(p.id, "inativo", "Pré-cadastro marcado como inativo.")}>Inativar</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => { db.converterPreCadastro(p.id); toast.success("Convertido em aluno cadastrado."); }}>
                            <UserCheck className="mr-2 h-4 w-4" />Converter em aluno
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filtrados.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">Nenhum pré-cadastro encontrado.</TableCell></TableRow>
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
                <SheetTitle>{verItem.nomeAluno}</SheetTitle>
                <SheetDescription>Detalhes do pré-cadastro</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4 px-4 text-sm">
                <Section title="Dados do aluno">
                  <Row k="Nascimento" v={new Date(verItem.nascimento).toLocaleDateString("pt-BR")} />
                  <Row k="Idade" v={`${verItem.idade} anos`} />
                  <Row k="Modalidade" v={verItem.modalidade} />
                  <Row k="Turno" v={verItem.turno} />
                  {verItem.escolaTurma && <Row k="Escola/turma" v={verItem.escolaTurma} />}
                  {verItem.observacoes && <Row k="Observações" v={verItem.observacoes} />}
                </Section>
                <Section title="Responsável">
                  <Row k="Nome" v={verItem.responsavel} />
                  <Row k="Telefone" v={verItem.telefone} />
                  <Row k="WhatsApp" v={verItem.whatsapp} />
                  {verItem.email && <Row k="E-mail" v={verItem.email} />}
                </Section>
                <Section title="Administração">
                  <Row k="Status" v={<Badge variant="outline" className="capitalize">{verItem.status}</Badge>} />
                  <Row k="Recebido em" v={new Date(verItem.criadoEm).toLocaleDateString("pt-BR")} />
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
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  );
}
