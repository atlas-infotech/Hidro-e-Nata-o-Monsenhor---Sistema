import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDB } from "@/lib/mock-data";
import {
  Users, ClipboardList, CalendarDays, CheckSquare, Megaphone, Hourglass,
  ArrowRight,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_admin/painel")({
  head: () => ({ meta: [{ title: "Painel — Hidro e Natação Monsenhor" }] }),
  component: Painel,
});

function Painel() {
  const data = useDB();
  const totalAlunos = data.alunos.length;
  const pendentes = data.preCadastros.filter((p) => p.status === "pendente").length;
  const turmasAtivas = data.turmas.filter((t) => t.status === "ativa").length;
  const today = new Date().toISOString().slice(0, 10);
  const presencasHoje = data.presencas
    .filter((p) => p.data === today)
    .reduce((acc, p) => acc + p.registros.filter((r) => r.status === "presente").length, 0);
  const fila = data.alunos.filter((a) => a.status === "fila de espera").length
    + data.preCadastros.filter((p) => p.status === "fila de espera").length;
  const avisosRecentes = data.avisos.slice(0, 3);
  const ultimosPre = data.preCadastros.slice(0, 4);
  const turmasComVagas = data.turmas
    .filter((t) => t.status === "ativa" && t.inscritos < t.vagas)
    .slice(0, 5);
  const avisosPublicados = data.avisos.filter((a) => a.publico).length;

  const chartData = ["Natação Infantil", "Natação Adulta", "Hidroginástica"].map((m) => ({
    modalidade: m.replace("Natação ", "Nat. "),
    alunos: data.alunos.filter((a) => a.modalidade === m).length,
  }));

  const cards = [
    { title: "Alunos cadastrados", value: totalAlunos, icon: Users, to: "/alunos" },
    { title: "Pré-cadastros pendentes", value: pendentes, icon: ClipboardList, to: "/pre-cadastros" },
    { title: "Turmas ativas", value: turmasAtivas, icon: CalendarDays, to: "/turmas" },
    { title: "Presença do dia", value: presencasHoje, icon: CheckSquare, to: "/presenca" },
    { title: "Fila de espera", value: fila, icon: Hourglass, to: "/alunos" },
    { title: "Avisos publicados", value: avisosPublicados, icon: Megaphone, to: "/avisos-admin" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-dashed border-border bg-accent/30 px-3 py-2 text-xs text-muted-foreground">
        Painel administrativo — ambiente interno de organização do centro.
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link to={c.to} key={c.title}>
            <Card className="transition-shadow hover:shadow-md" style={{ boxShadow: "var(--shadow-card)" }}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardDescription>{c.title}</CardDescription>
                  <CardTitle className="text-3xl">{c.value}</CardTitle>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <c.icon className="h-5 w-5" />
                </span>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">Ver detalhes →</CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Alunos por modalidade</CardTitle>
            <CardDescription>Distribuição atual entre as atividades aquáticas.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="modalidade" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)" }} />
                <Bar dataKey="alunos" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Avisos recentes</CardTitle>
              <CardDescription>Últimos comunicados publicados.</CardDescription>
            </div>
            <Link to="/avisos-admin"><Button size="sm" variant="ghost">Ver todos <ArrowRight className="ml-1 h-3 w-3" /></Button></Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {avisosRecentes.map((a) => (
              <div key={a.id} className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm">{a.titulo}</p>
                  {a.importante && <Badge variant="destructive">Importante</Badge>}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(a.data).toLocaleDateString("pt-BR")}</p>
                <p className="mt-1 line-clamp-2 text-sm text-foreground/80">{a.mensagem}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Últimos pré-cadastros</CardTitle>
              <CardDescription>Solicitações recentes recebidas pelo sistema.</CardDescription>
            </div>
            <Link to="/pre-cadastros"><Button size="sm" variant="ghost">Ver todos <ArrowRight className="ml-1 h-3 w-3" /></Button></Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {ultimosPre.length === 0 && <p className="text-sm text-muted-foreground">Nenhum pré-cadastro registrado.</p>}
            {ultimosPre.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-3 text-sm">
                <div>
                  <p className="font-medium">{p.nomeAluno}</p>
                  <p className="text-xs text-muted-foreground">{p.modalidade} · {p.turno} · {new Date(p.criadoEm).toLocaleDateString("pt-BR")}</p>
                </div>
                <Badge variant="outline" className="capitalize">{p.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Turmas com vagas disponíveis</CardTitle>
              <CardDescription>Turmas ativas que ainda comportam novos alunos.</CardDescription>
            </div>
            <Link to="/turmas"><Button size="sm" variant="ghost">Ver todas <ArrowRight className="ml-1 h-3 w-3" /></Button></Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {turmasComVagas.length === 0 && <p className="text-sm text-muted-foreground">Todas as turmas estão lotadas.</p>}
            {turmasComVagas.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-3 text-sm">
                <div>
                  <p className="font-medium">{t.nome}</p>
                  <p className="text-xs text-muted-foreground">{t.diasHorario}</p>
                </div>
                <Badge variant="outline">{t.vagas - t.inscritos} vaga(s)</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
