import { createFileRoute } from "@tanstack/react-router";
import { useDB, type Modalidade } from "@/lib/mock-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileText,
  BarChart3,
  Users,
  ClipboardList,
  Hourglass,
  DoorOpen,
  Waves,
  Baby,
  HeartPulse,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — Painel Monsenhor" }] }),
  component: Relatorios,
});

function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(";")
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
  toast.success(`Arquivo ${filename} exportado.`);
}

function exportarPDF() {
  toast.message("Abrindo impressão do relatório.", {
    description: "Na janela de impressão, escolha “Salvar como PDF”.",
  });

  window.print();
}

function Relatorios() {
  const data = useDB();

  const totalAlunos = data.alunos.length;

  const pendentes = data.preCadastros.filter(
    (p) => p.status === "pendente"
  ).length;

  const fila =
    data.preCadastros.filter((p) => p.status === "fila de espera").length +
    data.alunos.filter((a) => a.status === "fila de espera").length;

  const vagasTotais = data.turmas.reduce((acc, t) => acc + t.vagas, 0);

  const vagasOcupadas = data.turmas.reduce((acc, t) => acc + t.inscritos, 0);

  const vagasDisp = data.turmas.reduce(
    (acc, t) => acc + Math.max(0, t.vagas - t.inscritos),
    0
  );

  const porMod = ([
    "Natação Infantil",
    "Natação Adulta",
    "Hidroginástica",
  ] as Modalidade[]).map((modalidade) => ({
    modalidade,
    total: data.alunos.filter((a) => a.modalidade === modalidade).length,
  }));

  const porTurma = data.turmas.map((t) => ({
    turma: t.nome,
    modalidade: t.modalidade,
    horario: t.diasHorario,
    inscritos: t.inscritos,
    vagas: t.vagas,
    disponiveis: Math.max(0, t.vagas - t.inscritos),
  }));

  const presPorPeriodo = data.presencas.map((p) => {
    const turma = data.turmas.find((t) => t.id === p.turmaId);

    const counts = p.registros.reduce(
      (acc, r) => ({
        ...acc,
        [r.status]: (acc[r.status as string] ?? 0) + 1,
      }),
      {} as Record<string, number>
    );

    return {
      turma: turma?.nome ?? "—",
      data: p.data,
      presentes: counts["presente"] ?? 0,
      faltas: counts["falta"] ?? 0,
      justificadas: counts["falta justificada"] ?? 0,
    };
  });

  const faltasPorAluno = data.alunos
    .map((a) => {
      const faltas = data.presencas.reduce(
        (acc, p) =>
          acc +
          p.registros.filter(
            (r) => r.alunoId === a.id && r.status === "falta"
          ).length,
        0
      );

      return {
        aluno: a.nome,
        faltas,
      };
    })
    .filter((x) => x.faltas > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold">Relatórios</h2>
        <p className="text-sm text-muted-foreground">
          Indicadores e exportações do centro.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ResumoCard
          title="Alunos cadastrados"
          value={totalAlunos}
          description="Participantes registrados"
          icon={Users}
        />

        <ResumoCard
          title="Pré-cadastros pendentes"
          value={pendentes}
          description="Solicitações aguardando análise"
          icon={ClipboardList}
        />

        <ResumoCard
          title="Fila de espera"
          value={fila}
          description="Interessados aguardando vaga"
          icon={Hourglass}
        />

        <ResumoCard
          title="Vagas disponíveis"
          value={vagasDisp}
          description={`${vagasOcupadas} ocupadas de ${vagasTotais}`}
          icon={DoorOpen}
        />
      </div>

      <ReportCard
        title="Distribuição por modalidade"
        description="Resumo de alunos cadastrados em cada atividade."
        onCSV={() =>
          downloadCSV("alunos-por-modalidade.csv", [
            ["Modalidade", "Total"],
            ...porMod.map((x) => [x.modalidade, x.total]),
          ])
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          {porMod.map((x) => (
            <ModalidadeResumo
              key={x.modalidade}
              modalidade={x.modalidade}
              total={x.total}
            />
          ))}
        </div>
      </ReportCard>

      <ReportCard
        title="Alunos e vagas por turma"
        description="Relação das turmas cadastradas, capacidade e vagas disponíveis."
        onCSV={() =>
          downloadCSV("alunos-por-turma.csv", [
            [
              "Turma",
              "Modalidade",
              "Horário",
              "Inscritos",
              "Vagas",
              "Disponíveis",
            ],
            ...porTurma.map((x) => [
              x.turma,
              x.modalidade,
              x.horario,
              x.inscritos,
              x.vagas,
              x.disponiveis,
            ]),
          ])
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Turma</TableHead>
              <TableHead>Modalidade</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead className="text-right">Inscritos</TableHead>
              <TableHead className="text-right">Vagas</TableHead>
              <TableHead className="text-right">Disponíveis</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {porTurma.map((x) => (
              <TableRow key={`${x.turma}-${x.horario}`}>
                <TableCell className="font-medium">{x.turma}</TableCell>
                <TableCell>{x.modalidade}</TableCell>
                <TableCell className="text-muted-foreground">
                  {x.horario}
                </TableCell>
                <TableCell className="text-right">{x.inscritos}</TableCell>
                <TableCell className="text-right">{x.vagas}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline">{x.disponiveis}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ReportCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <ReportCard
          title="Presença por período"
          description="Registros de presença lançados por turma e data."
          onCSV={() =>
            downloadCSV("presencas.csv", [
              ["Turma", "Data", "Presentes", "Faltas", "Justificadas"],
              ...presPorPeriodo.map((x) => [
                x.turma,
                formatarData(x.data),
                x.presentes,
                x.faltas,
                x.justificadas,
              ]),
            ])
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Turma</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Presentes</TableHead>
                <TableHead className="text-right">Faltas</TableHead>
                <TableHead className="text-right">Justif.</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {presPorPeriodo.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    Nenhuma presença registrada ainda.
                  </TableCell>
                </TableRow>
              )}

              {presPorPeriodo.map((x, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm">{x.turma}</TableCell>
                  <TableCell>{formatarData(x.data)}</TableCell>
                  <TableCell className="text-right">{x.presentes}</TableCell>
                  <TableCell className="text-right">{x.faltas}</TableCell>
                  <TableCell className="text-right">{x.justificadas}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ReportCard>

        <ReportCard
          title="Faltas por aluno"
          description="Alunos com faltas não justificadas registradas."
          onCSV={() =>
            downloadCSV("faltas-por-aluno.csv", [
              ["Aluno", "Faltas"],
              ...faltasPorAluno.map((x) => [x.aluno, x.faltas]),
            ])
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead className="text-right">Faltas</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {faltasPorAluno.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    Nenhuma falta registrada ainda.
                  </TableCell>
                </TableRow>
              )}

              {faltasPorAluno.map((x) => (
                <TableRow key={x.aluno}>
                  <TableCell>{x.aluno}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="destructive">{x.faltas}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ReportCard>
      </div>
    </div>
  );
}

function ResumoCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>

        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
          <Icon className="h-5 w-5" />
        </span>
      </CardContent>
    </Card>
  );
}

function ModalidadeResumo({
  modalidade,
  total,
}: {
  modalidade: Modalidade;
  total: number;
}) {
  const config: Record<
    Modalidade,
    {
      icon: LucideIcon;
      descricao: string;
      className: string;
    }
  > = {
    "Natação Infantil": {
      icon: Baby,
      descricao: "8 a 17 anos",
      className: "bg-sky-50 text-sky-700",
    },
    "Natação Adulta": {
      icon: Waves,
      descricao: "18 anos ou mais",
      className: "bg-blue-50 text-blue-700",
    },
    Hidroginástica: {
      icon: HeartPulse,
      descricao: "18 anos ou mais",
      className: "bg-cyan-50 text-cyan-700",
    },
  };

  const Icon = config[modalidade].icon;

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-background p-4">
      <div className="flex items-center gap-3">
        <span
          className={`grid h-10 w-10 place-items-center rounded-xl ${config[modalidade].className}`}
        >
          <Icon className="h-5 w-5" />
        </span>

        <div>
          <p className="font-medium text-foreground">{modalidade}</p>
          <p className="text-xs text-muted-foreground">
            {config[modalidade].descricao}
          </p>
        </div>
      </div>

      <p className="text-2xl font-semibold text-foreground">{total}</p>
    </div>
  );
}

function ReportCard({
  title,
  description,
  children,
  onCSV,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  onCSV: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {description && (
            <CardDescription className="mt-1">{description}</CardDescription>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="outline" onClick={onCSV}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>

          <Button size="sm" variant="outline" onClick={exportarPDF}>
            <FileText className="mr-2 h-4 w-4" />
            Imprimir/PDF
          </Button>
        </div>
      </CardHeader>

      <CardContent className="overflow-x-auto">{children}</CardContent>
    </Card>
  );
}

function formatarData(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);

  if (m) return `${m[3]}/${m[2]}/${m[1]}`;

  return new Date(iso).toLocaleDateString("pt-BR");
}