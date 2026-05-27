import { createFileRoute } from "@tanstack/react-router";
import { useDB, db, type StatusPresenca } from "@/lib/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useMemo, useState, useEffect } from "react";
import { CheckSquare, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/presenca")({
  head: () => ({ meta: [{ title: "Presença — Painel Monsenhor" }] }),
  component: PresencaAdmin,
});

const opcoes: { v: StatusPresenca; label: string; color: string }[] = [
  { v: "presente", label: "Presente", color: "text-success" },
  { v: "falta", label: "Falta", color: "text-destructive" },
  { v: "falta justificada", label: "Falta justificada", color: "text-warning-foreground" },
];

function PresencaAdmin() {
  const data = useDB();
  const today = new Date().toISOString().slice(0, 10);
  const [turmaId, setTurmaId] = useState<string>(data.turmas.find((t) => t.status === "ativa")?.id ?? data.turmas[0]?.id ?? "");
  const [dataSel, setDataSel] = useState(today);
  const alunosTurma = useMemo(() => data.alunos.filter((a) => a.turmaId === turmaId), [data.alunos, turmaId]);
  const existente = data.presencas.find((p) => p.turmaId === turmaId && p.data === dataSel);
  const [reg, setReg] = useState<Record<string, StatusPresenca>>({});

  useEffect(() => {
    const inicial: Record<string, StatusPresenca> = {};
    alunosTurma.forEach((a) => {
      const found = existente?.registros.find((r) => r.alunoId === a.id);
      inicial[a.id] = found?.status ?? "presente";
    });
    setReg(inicial);
  }, [turmaId, dataSel, alunosTurma.length, existente]);

  const salvar = () => {
    const lista = alunosTurma.map((a) => ({ alunoId: a.id, status: reg[a.id] ?? "presente" }));
    db.salvarPresenca(turmaId, dataSel, lista);
    toast.success("Presença salva com sucesso.");
  };

  const totais = Object.values(reg).reduce(
    (acc, s) => ({ ...acc, [s]: (acc[s] ?? 0) + 1 }),
    {} as Record<string, number>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CheckSquare className="h-5 w-5 text-primary" />Chamada digital</CardTitle>
          <CardDescription>Selecione a turma e a data para registrar a presença.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Turma</Label>
            <Select value={turmaId} onValueChange={setTurmaId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {data.turmas.map((t) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Data</Label>
            <Input type="date" value={dataSel} onChange={(e) => setDataSel(e.target.value)} />
          </div>
          <div className="flex items-end justify-end">
            <Button onClick={salvar} disabled={alunosTurma.length === 0} size="lg"><Save className="mr-2 h-4 w-4" />Salvar presença</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alunos da turma</CardTitle>
          <CardDescription>
            {alunosTurma.length} aluno(s) · Presentes: {totais["presente"] ?? 0} · Faltas: {totais["falta"] ?? 0} · Justificadas: {totais["falta justificada"] ?? 0}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alunosTurma.length === 0 ? (
            <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Esta turma ainda não possui alunos vinculados. Vá até a tela de Alunos para fazer a vinculação.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {alunosTurma.map((a) => (
                <li key={a.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{a.nome}</p>
                    <p className="text-xs text-muted-foreground">{a.idade} anos · {a.responsavel}</p>
                  </div>
                  <RadioGroup
                    value={reg[a.id]}
                    onValueChange={(v) => setReg((r) => ({ ...r, [a.id]: v as StatusPresenca }))}
                    className="flex flex-wrap gap-3"
                  >
                    {opcoes.map((o) => (
                      <label key={o.v} className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent">
                        <RadioGroupItem value={o.v} id={`${a.id}-${o.v}`} />
                        <span className={o.color}>{o.label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
