import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import {
  ClipboardList,
  MessageCircle,
  Instagram,
  Facebook,
  MapPin,
  Clock,
  Megaphone,
  Waves,
  Stethoscope,
  CalendarCheck,
  Info,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/acesso-rapido")({
  head: () => ({
    meta: [
      { title: "Acesso Rápido — Hidro e Natação Monsenhor" },
      {
        name: "description",
        content:
          "Atalhos e informações importantes sobre pré-cadastro, avisos, horários, modalidades e localização.",
      },
    ],
  }),
  component: AcessoRapido,
});

type LinkItem = {
  label: string;
  icon: typeof ClipboardList;
  href?: string;
  disabled?: boolean;
  hint?: string;
};

const links: LinkItem[] = [
  { label: "Pré-cadastro", icon: ClipboardList, href: "/pre-cadastro" },
  { label: "Avisos", icon: Megaphone, href: "/avisos" },
  { label: "Horários", icon: Clock, href: "/#horarios" },
  { label: "Modalidades", icon: Waves, href: "/#modalidades" },
  { label: "Localização", icon: MapPin, href: "/#localizacao" },
  { label: "WhatsApp", icon: MessageCircle, disabled: true, hint: "Em implantação" },
  { label: "Instagram", icon: Instagram, disabled: true, hint: "Em implantação" },
  { label: "Facebook", icon: Facebook, disabled: true, hint: "Em implantação" },
];

const infos = [
  {
    title: "Atestado médico obrigatório",
    text: "A matrícula só poderá ser confirmada mediante apresentação de atestado médico na secretaria.",
    icon: Stethoscope,
  },
  {
    title: "Pré-cadastro não garante vaga",
    text: "A equipe entrará em contato para orientar os próximos passos e confirmar disponibilidade de turma.",
    icon: Info,
  },
  {
    title: "Organização por horário",
    text: "As turmas são organizadas por modalidade, dias da semana e horários definidos.",
    icon: CalendarCheck,
  },
  {
    title: "Dados usados para atendimento",
    text: "As informações enviadas são utilizadas para organização do pré-cadastro e contato da equipe responsável.",
    icon: ShieldCheck,
  },
];

function AcessoRapido() {
  return (
    <PublicLayout>
      <section className="mx-auto w-full max-w-5xl px-4 py-10">
        <h1 className="font-display text-3xl font-semibold">Central de acesso</h1>
        <p className="text-sm text-muted-foreground">
          Atalhos para os principais recursos e informações do centro.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {links.map((l) => {
            const Icon = l.icon;

            const content = (
              <Button
                variant="outline"
                disabled={l.disabled}
                className="h-auto w-full justify-start gap-3 py-4 text-left"
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="h-4 w-4" />
                </span>

                <span className="flex flex-col">
                  <span className="text-sm font-medium">{l.label}</span>
                  {l.hint && (
                    <span className="text-[11px] text-muted-foreground">{l.hint}</span>
                  )}
                </span>
              </Button>
            );

            return l.href && !l.disabled ? (
              <a key={l.label} href={l.href}>
                {content}
              </a>
            ) : (
              <div key={l.label}>{content}</div>
            );
          })}
        </div>

        <div className="mt-12">
          <h2 className="font-display text-2xl font-semibold">Informações importantes</h2>
          <p className="text-sm text-muted-foreground">
            Orientações rápidas para quem deseja participar das atividades.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {infos.map((info) => {
              const Icon = info.icon;

              return (
                <Card key={info.title}>
                  <CardContent className="space-y-3 p-5">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                      <Icon className="h-5 w-5" />
                    </span>

                    <div>
                      <h3 className="font-semibold text-foreground">{info.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {info.text}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}