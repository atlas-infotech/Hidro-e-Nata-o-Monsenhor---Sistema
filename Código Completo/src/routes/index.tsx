import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Waves, Baby, HeartPulse, MapPin, MessageCircle, Instagram, Facebook, Mail,
  LinkIcon, Megaphone, ArrowRight, ShieldCheck, CalendarClock, ExternalLink,
} from "lucide-react";
import { useDB, horarioSegQua, horarioTerQui } from "@/lib/mock-data";
import mapaImg from "@/assets/mapa-localizacao.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hidro e Natação Monsenhor — Centro Esportivo Profª Marta Regina" },
      { name: "description", content: "Página de apoio à organização do Centro Esportivo e Cultural Profª Marta Regina de Carvalho Ferreira, em Pedro do Rio — Petrópolis, RJ." },
      { property: "og:title", content: "Hidro e Natação Monsenhor" },
      { property: "og:description", content: "Natação infantil, natação adulta e hidroginástica em Pedro do Rio — Petrópolis, RJ." },
    ],
  }),
  component: Home,
});

const modalidades = [
  { nome: "Natação Infantil", desc: "Aulas lúdicas e seguras para crianças, com foco em adaptação ao meio líquido e iniciação aos quatro nados.", icon: Baby },
  { nome: "Natação Adulta", desc: "Aprimoramento técnico, condicionamento e bem-estar para adultos de todos os níveis.", icon: Waves },
  { nome: "Hidroginástica", desc: "Atividade de baixo impacto, ideal para adultos e idosos que buscam saúde e mobilidade.", icon: HeartPulse },
];

const enderecoBusca = encodeURIComponent("Escola Municipal Monsenhor João de Deus Rodrigues, R. Dr. Barros Franco, Pedro do Rio, Petrópolis - RJ");
const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${enderecoBusca}`;

function Home() {
  const data = useDB();
  const avisos = data.avisos.filter((a) => a.publico).slice(0, 3);

  return (
    <PublicLayout>
      {/* Hero */}
      <section
        className="relative overflow-hidden border-b border-border"
        style={{ background: "linear-gradient(180deg, #EFF6FF 0%, #FFFFFF 100%)" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-[-10%] h-[420px] w-[420px] rounded-full opacity-40"
          style={{ background: "radial-gradient(closest-side, #DBEAFE, transparent)" }}
        />
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col justify-center">
            <h1
              className="font-display text-4xl font-bold leading-tight sm:text-5xl md:text-6xl"
              style={{ color: "#0B1F3A" }}
            >
              Hidro e Natação <span style={{ color: "#1D4ED8" }}>Monsenhor</span>
            </h1>
            <p className="mt-4 max-w-xl text-base sm:text-lg" style={{ color: "#334155" }}>
              Página de apoio à organização do Centro Esportivo e Cultural
              Profª Marta Regina de Carvalho Ferreira, vinculado à Escola Municipal
              Monsenhor João de Deus Rodrigues, em Pedro do Rio — Petrópolis, RJ.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/pre-cadastro">
                <Button size="lg" className="bg-[#1D4ED8] text-white shadow-sm hover:bg-[#1E40AF]">
                  Fazer pré-cadastro <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/acesso-rapido">
                <Button size="lg" variant="outline" className="border-[#1D4ED8] bg-white text-[#1D4ED8] hover:bg-[#EFF6FF]">
                  Acesso rápido
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden items-center justify-center md:flex">
            <div className="grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { icon: ShieldCheck, label: "Gestão", value: "Pública e comunitária" },
                { icon: CalendarClock, label: "Organização", value: "Turmas organizadas por horário" },
              ].map((c) => (
                <div key={c.label} className="rounded-xl border border-[#DBEAFE] bg-white p-5 shadow-sm">
                  <c.icon className="h-5 w-5" style={{ color: "#1D4ED8" }} />
                  <p className="mt-3 text-xs uppercase tracking-wide" style={{ color: "#64748B" }}>{c.label}</p>
                  <p className="text-sm font-semibold" style={{ color: "#0B1F3A" }}>{c.value}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Avisos */}
      {avisos.length > 0 && (
        <section id="modalidades" className="mx-auto w-full max-w-6xl px-4 py-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold">Avisos importantes</h2>
              <p className="text-sm text-muted-foreground">Comunicados recentes da administração.</p>
            </div>
            <Link to="/avisos" className="text-sm font-medium text-primary hover:underline">Ver todos</Link>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {avisos.map((a) => (
              <Card key={a.id} style={{ boxShadow: "var(--shadow-card)" }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-primary" />
                    {a.importante && <Badge variant="destructive">Importante</Badge>}
                  </div>
                  <CardTitle className="text-base">{a.titulo}</CardTitle>
                  <CardDescription>{formatBrDate(a.data)}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-foreground/80">{a.mensagem}</CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Modalidades */}
      <section className="mx-auto w-full max-w-6xl px-4 py-10">
        <div>
          <h2 className="font-display text-2xl font-semibold">Modalidades oferecidas</h2>
          <p className="text-sm text-muted-foreground">Atividades pensadas para diferentes idades e objetivos.</p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {modalidades.map((m) => (
            <Card key={m.nome} className="border-border/70" style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-card)" }}>
              <CardHeader>
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <m.icon className="h-5 w-5" />
                </span>
                <CardTitle className="mt-3 text-lg">{m.nome}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-foreground/80">{m.desc}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Horários das atividades */}
      <section id="horarios" className="mx-auto w-full max-w-6xl px-4 py-10">
        <div>
          <h2 className="font-display text-2xl font-semibold">Horários das atividades</h2>
          <p className="text-sm text-muted-foreground">Grade semanal das aulas oferecidas pelo centro.</p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <HorariosCard titulo="Segundas e quartas" lista={horarioSegQua} />
          <HorariosCard titulo="Terças e quintas" lista={horarioTerQui} />
        </div>
      </section>

      {/* Sobre + Localização */}
      <section id="localizacao" className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="grid items-stretch gap-6 md:grid-cols-2">
          <Card className="flex h-full flex-col">
            <CardHeader>
              <CardTitle>Sobre o centro</CardTitle>
              <CardDescription>Espaço público de esporte, cultura e convivência.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4 text-sm leading-relaxed text-foreground/80">
              <p>
                O Centro Esportivo e Cultural Profª Marta Regina de Carvalho Ferreira é um espaço
                público voltado à prática de atividades aquáticas, convivência e promoção de
                saúde para a comunidade.
              </p>
              <p>
                Vinculado à Escola Municipal Monsenhor João de Deus Rodrigues, o centro atende
                moradores de Pedro do Rio e regiões próximas, oferecendo natação infantil,
                natação adulta e hidroginástica.
              </p>
              <p>
                O espaço contribui para o incentivo à prática esportiva, ao cuidado com a saúde,
                à socialização entre os participantes e ao fortalecimento do vínculo comunitário.
              </p>
              <p>
                Com turmas organizadas por faixa etária e horários definidos, o centro busca
                oferecer um ambiente acolhedor, acessível e bem estruturado para alunos,
                responsáveis e comunidade.
              </p>
              <p>
                As atividades desenvolvidas no local favorecem a disciplina, o bem-estar físico,
                a convivência social e a criação de hábitos saudáveis no cotidiano dos
                participantes.
              </p>
              <p>
                Além das atividades aquáticas, o centro representa um ponto de encontro e
                participação social, promovendo inclusão, qualidade de vida e maior aproximação
                entre escola, famílias e comunidade.
              </p>
            </CardContent>
          </Card>
          <Card className="flex h-full flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Localização</CardTitle>
              <CardDescription>Localização de referência para acesso ao centro.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3 text-sm text-foreground/80">
              <div className="overflow-hidden rounded-lg border border-border/60">
                <img src={mapaImg} alt="Mapa de localização do centro" className="h-auto w-full" />
              </div>
              <a href={mapsUrl} target="_blank" rel="noreferrer" className="mt-auto inline-block">
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-2 h-4 w-4" /> Abrir no Google Maps
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>

      </section>

      {/* Acesso rápido */}
      <section className="mx-auto w-full max-w-6xl px-4 py-10">
        <Card className="overflow-hidden border-primary/15">
          <div className="grid gap-0 md:grid-cols-[1.2fr_1fr]">
            <div className="p-6 md:p-8">
              <h2 className="font-display text-2xl font-semibold">Canais de contato</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Os canais oficiais de comunicação do centro estão em implantação.
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <Button variant="outline" disabled className="justify-start"><MessageCircle className="mr-2 h-4 w-4" />WhatsApp — em implantação</Button>
                <Button variant="outline" disabled className="justify-start"><Instagram className="mr-2 h-4 w-4" />Instagram — em implantação</Button>
                <Button variant="outline" disabled className="justify-start"><Facebook className="mr-2 h-4 w-4" />Facebook — em implantação</Button>
                <Button variant="outline" disabled className="justify-start"><Mail className="mr-2 h-4 w-4" />E-mail — em implantação</Button>
                <Link to="/acesso-rapido" className="sm:col-span-2"><Button variant="outline" className="w-full justify-start"><LinkIcon className="mr-2 h-4 w-4" />Central de acesso</Button></Link>
              </div>
            </div>
            <div className="flex flex-col justify-center gap-3 bg-accent/60 p-6 md:p-8">
              <p className="text-sm text-muted-foreground">Acesso da equipe</p>
              <p className="font-display text-lg font-semibold">Painel administrativo</p>
              <p className="text-sm text-foreground/80">Recepção, professores e gestão acessam o painel com login e senha.</p>
              <Link to="/login"><Button className="w-fit">Entrar no painel</Button></Link>
            </div>
          </div>
        </Card>
      </section>
    </PublicLayout>
  );
}

function formatBrDate(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
}

function HorariosCard({ titulo, lista }: { titulo: string; lista: { hora: string; modalidade: string }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{titulo}</CardTitle>
        <CardDescription>{lista.length} horários disponíveis</CardDescription>
      </CardHeader>
      <CardContent className="max-h-[420px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-background">
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-3">Horário</th>
              <th className="py-2">Modalidade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {lista.map((l) => (
              <tr key={l.hora}>
                <td className="py-2 pr-3 font-mono text-foreground">{l.hora}</td>
                <td className="py-2 text-foreground/80">{l.modalidade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
