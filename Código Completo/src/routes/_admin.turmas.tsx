import { createFileRoute } from "@tanstack/react-router";
import {
  useDB,
  db,
  type Modalidade,
  type StatusTurma,
  type Turma,
} from "@/lib/mock-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Users,
  Clock,
  GraduationCap,
  Pencil,
  Search,
  CalendarDays,
  Filter,
  Waves,
  Baby,
  HeartPulse,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/turmas")({
  head: () => ({ meta: [{ title: "Turmas — Painel Monsenhor" }] }),
  component: TurmasAdmin,
});

type ModalidadeFiltro = "todas" | Modalidade;
type StatusFiltro = "todos" | StatusTurma;
type DiaFiltro = "todos" | "segqua" | "terqui";

const statusColors: Record<StatusTurma, string> = {
  ativa: "bg-success/15 text-success border-success/40",
  encerrada: "bg-muted text-muted-foreground border-border",
  "em formação": "bg-warning/20 text-warning-foreground border-warning/40",
};

const modalidadeStyles: Record<
  Modalidade,
  {
    icon: typeof Waves;
    badge: string;
    border: string;
    soft: string;
  }
> = {
  "Natação Infantil": {
    icon: Baby,
    badge: "bg-sky-100 text-sky-800 border-sky-200",
    border: "border-l-sky-400",
    soft: "bg-sky-50 text-sky-700",
  },
  "Natação Adulta": {
    icon: Waves,
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    border: "border-l-blue-500",
    soft: "bg-blue-50 text-blue-700",
  },
  Hidroginástica: {
    icon: HeartPulse,
    badge: "bg-cyan-100 text-cyan-800 border-cyan-200",
    border: "border-l-cyan-500",
    soft: "bg-cyan-50 text-cyan-700",
  },
};

const modalidades: Modalidade[] = [
  "Hidroginástica",
  "Natação Infantil",
  "Natação Adulta",
];

function TurmasAdmin() {
  const { turmas } = useDB();

  const [busca, setBusca] = useState("");
  const [modalidadeFiltro, setModalidadeFiltro] =
    useState<ModalidadeFiltro>("todas");
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>("todos");
  const [diaFiltro, setDiaFiltro] = useState<DiaFiltro>("todos");

  const resumo = useMemo(() => {
    const vagasTotais = turmas.reduce((acc, t) => acc + t.vagas, 0);
    const inscritos = turmas.reduce((acc, t) => acc + t.inscritos, 0);
    const vagasDisponiveis = Math.max(0, vagasTotais - inscritos);
    const turmasAtivas = turmas.filter((t) => t.status === "ativa").length;
    const turmasLotadas = turmas.filter((t) => t.inscritos >= t.vagas).length;

    return {
      vagasTotais,
      inscritos,
      vagasDisponiveis,
      turmasAtivas,
      turmasLotadas,
    };
  }, [turmas]);

  const turmasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return turmas
      .filter((t) => {
        const texto = [
          t.nome,
          t.modalidade,
          t.diasHorario,
          t.professor,
          t.faixaEtaria,
          t.status,
        ]
          .join(" ")
          .toLowerCase();

        const passaBusca = !termo || texto.includes(termo);
        const passaModalidade =
          modalidadeFiltro === "todas" || t.modalidade === modalidadeFiltro;
        const passaStatus = statusFiltro === "todos" || t.status === statusFiltro;
        const passaDia =
          diaFiltro === "todos" ||
          (diaFiltro === "segqua" && t.diasHorario.startsWith("Segunda")) ||
          (diaFiltro === "terqui" && t.diasHorario.startsWith("Terça"));

        return passaBusca && passaModalidade && passaStatus && passaDia;
      })
      .sort((a, b) => {
        const mod = modalidadeOrdem(a.modalidade) - modalidadeOrdem(b.modalidade);
        if (mod !== 0) return mod;

        const dia = diaOrdem(a.diasHorario) - diaOrdem(b.diasHorario);
        if (dia !== 0) return dia;

        return extrairHora(a.diasHorario).localeCompare(extrairHora(b.diasHorario));
      });
  }, [turmas, busca, modalidadeFiltro, statusFiltro, diaFiltro]);

  const agrupadas = useMemo(() => {
    return modalidades
      .map((modalidade) => ({
        modalidade,
        turmas: turmasFiltradas.filter((t) => t.modalidade === modalidade),
      }))
      .filter((grupo) => grupo.turmas.length > 0);
  }, [turmasFiltradas]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold">Turmas e horários</h2>
          <p className="text-sm text-muted-foreground">
            Organização das atividades por modalidade, dias e horários.
          </p>
        </div>

        <TurmaDialog />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ResumoCard
          titulo="Turmas ativas"
          valor={resumo.turmasAtivas}
          descricao={`${turmas.length} turmas no total`}
          icon={CalendarDays}
        />
        <ResumoCard
          titulo="Vagas disponíveis"
          valor={resumo.vagasDisponiveis}
          descricao={`${resumo.vagasTotais} vagas cadastradas`}
          icon={Users}
        />
        <ResumoCard
          titulo="Inscritos"
          valor={resumo.inscritos}
          descricao="Alunos vinculados às turmas"
          icon={GraduationCap}
        />
        <ResumoCard
          titulo="Turmas lotadas"
          valor={resumo.turmasLotadas}
          descricao="Sem vagas disponíveis"
          icon={Filter}
        />
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por modalidade, horário ou professor..."
              className="pl-9"
            />
          </div>

          <Select
            value={modalidadeFiltro}
            onValueChange={(v) => setModalidadeFiltro(v as ModalidadeFiltro)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Modalidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as modalidades</SelectItem>
              <SelectItem value="Hidroginástica">Hidroginástica</SelectItem>
              <SelectItem value="Natação Infantil">Natação Infantil</SelectItem>
              <SelectItem value="Natação Adulta">Natação Adulta</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={diaFiltro}
            onValueChange={(v) => setDiaFiltro(v as DiaFiltro)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Dias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os dias</SelectItem>
              <SelectItem value="segqua">Segunda e quarta</SelectItem>
              <SelectItem value="terqui">Terça e quinta</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusFiltro}
            onValueChange={(v) => setStatusFiltro(v as StatusFiltro)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="ativa">Ativas</SelectItem>
              <SelectItem value="em formação">Em formação</SelectItem>
              <SelectItem value="encerrada">Encerradas</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {turmasFiltradas.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Nenhuma turma encontrada com os filtros selecionados.
            </CardContent>
          </Card>
        )}

        {agrupadas.map((grupo) => {
          const Icon = modalidadeStyles[grupo.modalidade].icon;

          return (
            <section key={grupo.modalidade} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-xl ${modalidadeStyles[grupo.modalidade].soft}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>

                  <div>
                    <h3 className="font-display text-lg font-semibold">
                      {grupo.modalidade}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {grupo.turmas.length} turma
                      {grupo.turmas.length === 1 ? "" : "s"} encontrada
                      {grupo.turmas.length === 1 ? "" : "s"}.
                    </p>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={modalidadeStyles[grupo.modalidade].badge}
                >
                  {totalVagas(grupo.turmas)} vagas
                </Badge>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {grupo.turmas.map((t) => (
                  <TurmaCard key={t.id} turma={t} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function ResumoCard({
  titulo,
  valor,
  descricao,
  icon: Icon,
}: {
  titulo: string;
  valor: number;
  descricao: string;
  icon: typeof Users;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div>
          <p className="text-sm text-muted-foreground">{titulo}</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{valor}</p>
          <p className="mt-1 text-xs text-muted-foreground">{descricao}</p>
        </div>

        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
          <Icon className="h-5 w-5" />
        </span>
      </CardContent>
    </Card>
  );
}

function TurmaCard({ turma }: { turma: Turma }) {
  const ocupacao = Math.min(
    100,
    Math.round((turma.inscritos / Math.max(1, turma.vagas)) * 100)
  );

  const vagasDisponiveis = Math.max(0, turma.vagas - turma.inscritos);
  const lotada = vagasDisponiveis === 0;
  const poucasVagas = !lotada && vagasDisponiveis <= 3;
  const estilo = modalidadeStyles[turma.modalidade];

  return (
    <Card
      className={`border-l-4 ${estilo.border}`}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{turma.nome}</CardTitle>
            <CardDescription>{turma.modalidade}</CardDescription>
          </div>

          <Badge
            variant="outline"
            className={`shrink-0 capitalize ${statusColors[turma.status]}`}
          >
            {turma.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        <div className="grid gap-2">
          <InfoLinha icon={Clock}>{turma.diasHorario}</InfoLinha>
          <InfoLinha icon={GraduationCap}>{turma.professor}</InfoLinha>
          <InfoLinha icon={Users}>Faixa: {turma.faixaEtaria}</InfoLinha>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>Ocupação</span>
            <span className="font-medium text-foreground">
              {turma.inscritos} / {turma.vagas}
            </span>
          </div>

          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full ${
                lotada
                  ? "bg-destructive"
                  : poucasVagas
                  ? "bg-warning"
                  : "bg-primary"
              }`}
              style={{ width: `${ocupacao}%` }}
            />
          </div>

          <p className="mt-1.5 text-xs text-muted-foreground">
            {lotada
              ? "Turma sem vagas disponíveis."
              : `${vagasDisponiveis} vaga${vagasDisponiveis === 1 ? "" : "s"} disponível${
                  vagasDisponiveis === 1 ? "" : "is"
                }.`}
          </p>
        </div>

        <div className="flex justify-end pt-1">
          <TurmaDialog
            turma={turma}
            trigger={
              <Button size="sm" variant="outline">
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

function InfoLinha({
  icon: Icon,
  children,
}: {
  icon: typeof Clock;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-foreground/80">
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <span className="truncate">{children}</span>
    </div>
  );
}

function TurmaDialog({
  turma,
  trigger,
}: {
  turma?: Turma;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const empty: Omit<Turma, "id"> = {
    nome: "",
    modalidade: "Natação Infantil",
    diasHorario: "",
    professor: "Equipe de Educação Física",
    faixaEtaria: "8 a 17 anos",
    vagas: 12,
    inscritos: 0,
    status: "em formação",
  };

  const [f, setF] = useState<Omit<Turma, "id">>(turma ?? empty);

  const save = () => {
    if (!f.nome || !f.diasHorario || !f.professor) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }

    if (f.inscritos > f.vagas) {
      toast.error("O número de inscritos não pode ser maior que o número de vagas.");
      return;
    }

    if (turma) {
      db.updateTurma(turma.id, f);
      toast.success("Turma atualizada.");
    } else {
      db.addTurma(f);
      toast.success("Turma cadastrada.");
    }

    setOpen(false);
  };

  const mudarModalidade = (modalidade: Modalidade) => {
    setF({
      ...f,
      modalidade,
      faixaEtaria:
        modalidade === "Natação Infantil" ? "8 a 17 anos" : "18 anos ou mais",
      vagas: modalidade === "Natação Infantil" ? 12 : 16,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setF(turma ?? empty);
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova turma
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{turma ? "Editar turma" : "Nova turma"}</DialogTitle>
          <DialogDescription>
            Defina modalidade, horário, capacidade e status da turma.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 md:grid-cols-2">
          <Fld label="Nome">
            <Input
              value={f.nome}
              onChange={(e) => setF({ ...f, nome: e.target.value })}
              placeholder="Natação Infantil — Seg/Qua 08:00"
            />
          </Fld>

          <Fld label="Modalidade">
            <Select
              value={f.modalidade}
              onValueChange={(v) => mudarModalidade(v as Modalidade)}
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

          <Fld label="Dias e horário">
            <Input
              value={f.diasHorario}
              onChange={(e) => setF({ ...f, diasHorario: e.target.value })}
              placeholder="Segunda e quarta, 08:00"
            />
          </Fld>

          <Fld label="Professor responsável">
            <Input
              value={f.professor}
              onChange={(e) => setF({ ...f, professor: e.target.value })}
            />
          </Fld>

          <Fld label="Faixa etária">
            <Input
              value={f.faixaEtaria}
              onChange={(e) => setF({ ...f, faixaEtaria: e.target.value })}
              placeholder="8 a 17 anos"
            />
          </Fld>

          <Fld label="Vagas">
            <Input
              type="number"
              min={1}
              value={f.vagas}
              onChange={(e) => setF({ ...f, vagas: Number(e.target.value) })}
            />
          </Fld>

          <Fld label="Inscritos">
            <Input
              type="number"
              min={0}
              value={f.inscritos}
              onChange={(e) => setF({ ...f, inscritos: Number(e.target.value) })}
            />
          </Fld>

          <Fld label="Status">
            <Select
              value={f.status}
              onValueChange={(v) => setF({ ...f, status: v as StatusTurma })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativa">Ativa</SelectItem>
                <SelectItem value="em formação">Em formação</SelectItem>
                <SelectItem value="encerrada">Encerrada</SelectItem>
              </SelectContent>
            </Select>
          </Fld>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={save}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Fld({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}

function modalidadeOrdem(modalidade: Modalidade): number {
  if (modalidade === "Hidroginástica") return 1;
  if (modalidade === "Natação Infantil") return 2;
  return 3;
}

function diaOrdem(diasHorario: string): number {
  if (diasHorario.startsWith("Segunda")) return 1;
  if (diasHorario.startsWith("Terça")) return 2;
  return 3;
}

function extrairHora(diasHorario: string): string {
  const match = diasHorario.match(/\d{2}:\d{2}/);
  return match?.[0] ?? diasHorario;
}

function totalVagas(turmas: Turma[]): number {
  return turmas.reduce((acc, t) => acc + t.vagas, 0);
}