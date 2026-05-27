import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { db, type Modalidade, type Turno, horarioSegQua, horarioTerQui } from "@/lib/mock-data";
import { CheckCircle2, ArrowLeft, AlertTriangle, Stethoscope } from "lucide-react";

export const Route = createFileRoute("/pre-cadastro")({
  head: () => ({
    meta: [
      { title: "Pré-cadastro — Hidro e Natação Monsenhor" },
      { name: "description", content: "Demonstre interesse nas atividades do Centro Esportivo e Cultural Profª Marta Regina de Carvalho Ferreira." },
    ],
  }),
  component: PreCadastroPage,
});

function calcIdade(nasc: string): number | null {
  if (!nasc) return null;
  const d = new Date(nasc);
  if (isNaN(d.getTime())) return null;
  if (d.getTime() > Date.now()) return null;

  const now = new Date();
  let idade = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();

  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) idade--;

  return Math.max(0, idade);
}

function turnoDeHora(hora: string): Turno {
  const h = parseInt(hora.slice(0, 2), 10);
  if (h < 12) return "Manhã";
  if (h < 18) return "Tarde";
  return "Noite";
}

type Errors = Partial<Record<
  | "nomeAluno"
  | "nascimento"
  | "idade"
  | "modalidade"
  | "horario"
  | "responsavel"
  | "telefone"
  | "whatsapp"
  | "consent"
  | "atestado",
  string
>>;

function PreCadastroPage() {
  const [enviado, setEnviado] = useState(false);
  const [consent, setConsent] = useState(false);
  const [cienteAtestado, setCienteAtestado] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const [form, setForm] = useState({
    nomeAluno: "",
    nascimento: "",
    modalidade: "" as Modalidade | "",
    horario: "",
    escola: "",
    anoSerie: "",
    turma: "",
    observacoes: "",
    responsavel: "",
    telefone: "",
    whatsapp: "",
    email: "",
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const idade = useMemo(() => calcIdade(form.nascimento), [form.nascimento]);
  const nascInvalida = form.nascimento !== "" && idade === null;
  const isMenor = idade !== null && idade < 18;
  const idadeMinimaOk = idade !== null && idade >= 8;

  const modalidadesDisponiveis: Modalidade[] = useMemo(() => {
    if (idade === null) return [];
    if (idade < 18) return ["Natação Infantil"];
    return ["Natação Adulta", "Hidroginástica"];
  }, [idade]);

  if (form.modalidade && !modalidadesDisponiveis.includes(form.modalidade as Modalidade)) {
    setTimeout(() => setForm((f) => ({ ...f, modalidade: "", horario: "" })), 0);
  }

  const horariosDisponiveis = useMemo(() => {
    if (!form.modalidade) return [] as { label: string; value: string; hora: string }[];

    const seg = horarioSegQua
      .filter((h) => h.modalidade === form.modalidade)
      .map((h) => ({
        label: `Segunda e quarta — ${h.hora}`,
        value: `Seg/Qua ${h.hora}`,
        hora: h.hora,
      }));

    const ter = horarioTerQui
      .filter((h) => h.modalidade === form.modalidade)
      .map((h) => ({
        label: `Terça e quinta — ${h.hora}`,
        value: `Ter/Qui ${h.hora}`,
        hora: h.hora,
      }));

    return [...seg, ...ter];
  }, [form.modalidade]);

  const validar = (): boolean => {
    const e: Errors = {};

    if (!form.nomeAluno.trim()) e.nomeAluno = "Informe o nome completo.";
    if (!form.nascimento) e.nascimento = "Informe a data de nascimento.";
    else if (nascInvalida) e.nascimento = "Data de nascimento inválida.";
    else if (idade !== null && !idadeMinimaOk)
      e.idade = "As inscrições são permitidas apenas para participantes a partir de 8 anos.";

    if (!form.modalidade) e.modalidade = "Selecione a modalidade desejada.";
    if (!form.horario) e.horario = "Selecione um horário de interesse.";

    if (isMenor) {
      if (!form.responsavel.trim()) e.responsavel = "Informe o nome do responsável.";
      if (!form.telefone.trim()) e.telefone = "Informe o telefone do responsável.";
      if (!form.whatsapp.trim()) e.whatsapp = "Informe o WhatsApp do responsável.";
    } else if (idade !== null) {
      if (!form.telefone.trim()) e.telefone = "Informe o telefone do participante.";
      if (!form.whatsapp.trim()) e.whatsapp = "Informe o WhatsApp do participante.";
    }

    if (!cienteAtestado) e.atestado = "É necessário declarar ciência sobre o atestado médico.";
    if (!consent) e.consent = "É necessário autorizar o uso dos dados.";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();

    if (!validar()) {
      toast.error("Verifique os campos destacados.");
      return;
    }

    const hora = horariosDisponiveis.find((h) => h.value === form.horario)?.hora ?? "08:00";
    const turno = turnoDeHora(hora);

    const escolaTurma = isMenor
      ? [form.escola, form.anoSerie, form.turma].filter(Boolean).join(" — ") || undefined
      : undefined;

    db.addPreCadastro({
      nomeAluno: form.nomeAluno.trim(),
      nascimento: form.nascimento,
      idade: idade ?? 0,
      modalidade: form.modalidade as Modalidade,
      turno,
      escolaTurma,
      observacoes: form.observacoes.trim() || `Horário de interesse: ${form.horario}`,
      responsavel: isMenor ? form.responsavel.trim() : "—",
      telefone: form.telefone.trim(),
      whatsapp: (form.whatsapp || form.telefone).trim(),
      email: form.email.trim() || undefined,
    });

    setEnviado(true);
    toast.success("Pré-cadastro enviado com sucesso.");
  };

  if (enviado) {
    return (
      <PublicLayout>
        <section className="mx-auto w-full max-w-2xl px-4 py-16">
          <Card className="text-center">
            <CardHeader>
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/15 text-success">
                <CheckCircle2 className="h-7 w-7" />
              </span>
              <CardTitle className="mt-3 text-2xl">Pré-cadastro enviado com sucesso.</CardTitle>
              <CardDescription className="mx-auto max-w-xl leading-relaxed">
                A equipe responsável entrará em contato para orientar os próximos passos,
                verificar disponibilidade de turma e informar sobre a apresentação do atestado
                médico na secretaria.
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-wrap justify-center gap-3">
              <Link to="/">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao início
                </Button>
              </Link>

              <Button
                onClick={() => {
                  setEnviado(false);
                  setConsent(false);
                  setCienteAtestado(false);
                  setErrors({});
                  setForm({
                    nomeAluno: "",
                    nascimento: "",
                    modalidade: "",
                    horario: "",
                    escola: "",
                    anoSerie: "",
                    turma: "",
                    observacoes: "",
                    responsavel: "",
                    telefone: "",
                    whatsapp: "",
                    email: "",
                  });
                }}
              >
                Enviar novo pré-cadastro
              </Button>
            </CardContent>
          </Card>
        </section>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <section className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="mb-6 space-y-3">
          <h1 className="font-display text-3xl font-semibold">Pré-cadastro</h1>

          <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <p>
              Preencha o formulário abaixo para demonstrar interesse nas atividades do Centro
              Esportivo e Cultural Profª Marta Regina de Carvalho Ferreira.
            </p>

            <p>
              O envio deste formulário{" "}
              <strong className="text-foreground">não garante vaga nem confirma matrícula</strong>.
              A equipe entrará em contato para orientar os próximos passos e confirmar
              disponibilidade de turma.
            </p>
          </div>
        </div>

        <form onSubmit={submit} noValidate className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados do participante</CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field label="Nome completo *" error={errors.nomeAluno} className="md:col-span-2">
                <Input
                  value={form.nomeAluno}
                  onChange={(e) => set("nomeAluno", e.target.value)}
                  aria-invalid={!!errors.nomeAluno}
                />
              </Field>

              <Field label="Data de nascimento *" error={errors.nascimento}>
                <Input
                  type="date"
                  value={form.nascimento}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => set("nascimento", e.target.value)}
                  aria-invalid={!!errors.nascimento}
                />

                {errors.idade && (
                  <p className="mt-1 text-xs font-medium text-destructive">{errors.idade}</p>
                )}
              </Field>

              <Field label="Modalidade desejada *" error={errors.modalidade}>
                <Select
                  value={form.modalidade || undefined}
                  onValueChange={(v) => {
                    setForm((f) => ({ ...f, modalidade: v as Modalidade, horario: "" }));
                    setErrors((e) => ({ ...e, modalidade: undefined, horario: undefined }));
                  }}
                  disabled={!idadeMinimaOk}
                >
                  <SelectTrigger aria-invalid={!!errors.modalidade}>
                    <SelectValue
                      placeholder={idadeMinimaOk ? "Selecione" : "Informe o nascimento"}
                    />
                  </SelectTrigger>

                  <SelectContent>
                    {modalidadesDisponiveis.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Horário de interesse *" error={errors.horario}>
                <Select
                  value={form.horario || undefined}
                  onValueChange={(v) => set("horario", v)}
                  disabled={!form.modalidade}
                >
                  <SelectTrigger aria-invalid={!!errors.horario}>
                    <SelectValue
                      placeholder={
                        form.modalidade ? "Selecione um horário" : "Escolha a modalidade primeiro"
                      }
                    />
                  </SelectTrigger>

                  <SelectContent>
                    {horariosDisponiveis.map((h) => (
                      <SelectItem key={h.value} value={h.value}>
                        {h.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <p className="mt-1 text-xs text-muted-foreground">
                  A escolha do horário indica preferência e está sujeita à disponibilidade da turma.
                </p>
              </Field>

              <Field
                label="Condições de saúde, limitações ou cuidados importantes"
                className="md:col-span-2"
              >
                <Textarea
                  value={form.observacoes}
                  onChange={(e) => set("observacoes", e.target.value)}
                  placeholder="Informe alergias, restrições de saúde, limitações físicas, uso de medicamentos, necessidade de acompanhamento ou qualquer cuidado importante para a segurança do participante."
                  rows={4}
                />
              </Field>
            </CardContent>
          </Card>

          {isMenor && (
            <Card>
              <CardHeader>
                <CardTitle>Dados escolares</CardTitle>
                <CardDescription>
                  Informe os dados escolares do participante, quando aplicável.
                </CardDescription>
              </CardHeader>

              <CardContent className="grid gap-4 md:grid-cols-2">
                <Field label="Escola" className="md:col-span-2">
                  <Input
                    value={form.escola}
                    onChange={(e) => set("escola", e.target.value)}
                    placeholder="Digite o nome completo da escola"
                  />
                </Field>

                <Field label="Ano/Série">
                  <Input
                    value={form.anoSerie}
                    onChange={(e) => set("anoSerie", e.target.value)}
                    placeholder="Ex.: 3º ano do Ensino Fundamental"
                  />
                </Field>

                <Field label="Turma">
                  <Input
                    value={form.turma}
                    onChange={(e) => set("turma", e.target.value)}
                    placeholder="Ex.: 3º ano, turma 301"
                  />
                </Field>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>
                {isMenor ? "Dados do responsável" : "Dados de contato do participante"}
              </CardTitle>

              <CardDescription>
                Necessários para contato sobre vaga, turma e documentação.
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-4 md:grid-cols-2">
              {isMenor && (
                <Field
                  label="Nome do responsável *"
                  error={errors.responsavel}
                  className="md:col-span-2"
                >
                  <Input
                    value={form.responsavel}
                    onChange={(e) => set("responsavel", e.target.value)}
                    aria-invalid={!!errors.responsavel}
                  />
                </Field>
              )}

              <Field label="Telefone *" error={errors.telefone}>
                <Input
                  value={form.telefone}
                  onChange={(e) => set("telefone", e.target.value)}
                  placeholder="(00) 00000-0000"
                  aria-invalid={!!errors.telefone}
                />
              </Field>

              <Field label="WhatsApp *" error={errors.whatsapp}>
                <Input
                  value={form.whatsapp}
                  onChange={(e) => set("whatsapp", e.target.value)}
                  placeholder="(00) 00000-0000"
                  aria-invalid={!!errors.whatsapp}
                />
              </Field>

              <Field label="E-mail (se tiver)" className="md:col-span-2">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="contato@email.com"
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-start gap-3 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
                <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-warning-foreground" />

                <p className="text-foreground/85 leading-relaxed">
                  <strong>Atenção:</strong> para participar das atividades aquáticas, será
                  obrigatório apresentar posteriormente um atestado médico que comprove aptidão
                  física para a prática de natação ou hidroginástica.
                </p>
              </div>

              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <Checkbox
                  checked={cienteAtestado}
                  onCheckedChange={(v) => {
                    setCienteAtestado(Boolean(v));
                    setErrors((e) => ({ ...e, atestado: undefined }));
                  }}
                  className="mt-0.5"
                  aria-invalid={!!errors.atestado}
                />

                <span className="text-foreground/85 leading-relaxed">
                  Declaro estar ciente de que a matrícula só poderá ser confirmada mediante
                  apresentação do atestado médico solicitado pela secretaria.
                </span>
              </label>

              {errors.atestado && (
                <p className="text-xs font-medium text-destructive">{errors.atestado}</p>
              )}

              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <Checkbox
                  checked={consent}
                  onCheckedChange={(v) => {
                    setConsent(Boolean(v));
                    setErrors((e) => ({ ...e, consent: undefined }));
                  }}
                  className="mt-0.5"
                  aria-invalid={!!errors.consent}
                />

                <span className="text-foreground/85 leading-relaxed">
                  Autorizo o uso dos dados fornecidos exclusivamente para fins de organização
                  do pré-cadastro, contato da equipe responsável e acompanhamento do atendimento.
                </span>
              </label>

              {errors.consent && (
                <p className="text-xs font-medium text-destructive">{errors.consent}</p>
              )}

              {Object.keys(errors).some((key) => Boolean(errors[key as keyof Errors])) && (
                <div className="flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />

                  <p className="text-destructive">
                    Existem campos obrigatórios não preenchidos. Verifique as mensagens em cada campo.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-wrap justify-end gap-3">
            <Link to="/">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>

            <Button type="submit" size="lg">
              Enviar pré-cadastro
            </Button>
          </div>
        </form>
      </section>
    </PublicLayout>
  );
}

function Field({
  label,
  children,
  className = "",
  error,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  error?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-sm">{label}</Label>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}