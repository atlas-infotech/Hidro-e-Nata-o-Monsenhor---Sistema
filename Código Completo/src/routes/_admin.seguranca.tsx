import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Lock,
  Database,
  DownloadCloud,
  EyeOff,
  KeyRound,
  ClipboardCheck,
  CheckCircle2,
  FileText,
  MonitorCheck,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/seguranca")({
  head: () => ({ meta: [{ title: "Segurança e Backup — Painel Monsenhor" }] }),
  component: Seguranca,
});

const indicadores = [
  {
    title: "Login restrito",
    desc: "O painel exige usuário e senha para acesso à área administrativa.",
    icon: KeyRound,
    status: "Ativo",
  },
  {
    title: "Perfis de acesso",
    desc: "Permissões separadas para Administração, Recepção e Professor.",
    icon: Shield,
    status: "Ativo",
  },
  {
    title: "Dados pessoais protegidos",
    desc: "Informações de alunos e responsáveis ficam restritas ao painel interno.",
    icon: EyeOff,
    status: "Conforme",
  },
  {
    title: "Sessão local",
    desc: "O acesso permanece salvo apenas no navegador utilizado.",
    icon: MonitorCheck,
    status: "Local",
  },
  {
    title: "Exportação administrativa",
    desc: "Relatórios podem ser exportados em CSV ou impressos/salvos como PDF.",
    icon: DownloadCloud,
    status: "Disponível",
  },
  {
    title: "Banco de dados",
    desc: "O sistema ainda utiliza armazenamento local. Banco online deve ser implantado em etapa futura.",
    icon: Database,
    status: "Pendente",
  },
];

function exportarDadosLocais() {
  try {
    const dados: Record<string, string | null> = {};

    for (let i = 0; i < localStorage.length; i++) {
      const chave = localStorage.key(i);

      if (chave?.startsWith("hidro-monsenhor")) {
        dados[chave] = localStorage.getItem(chave);
      }
    }

    const blob = new Blob([JSON.stringify(dados, null, 2)], {
      type: "application/json;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `backup-hidro-monsenhor-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    a.click();
    URL.revokeObjectURL(url);

    toast.success("Dados locais exportados.");
  } catch {
    toast.error("Não foi possível exportar os dados locais.");
  }
}

function imprimirPolitica() {
  toast.message("Abrindo impressão.", {
    description: "Na janela de impressão, escolha “Salvar como PDF”.",
  });

  window.print();
}

function limparSessao() {
  localStorage.removeItem("hidro-monsenhor-session");
  toast.success("Sessão administrativa encerrada neste navegador.");
}

function Seguranca() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Segurança do painel
          </CardTitle>
          <CardDescription>
            Status das práticas de controle de acesso, privacidade e exportação
            administrativa.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {indicadores.map((i) => (
            <div key={i.title} className="rounded-xl border border-border p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <i.icon className="h-5 w-5" />
                </span>

                <Badge
                  variant="outline"
                  className={
                    i.status === "Pendente"
                      ? "border-warning/40 bg-warning/10 text-warning-foreground"
                      : "border-success/40 bg-success/10 text-success"
                  }
                >
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {i.status}
                </Badge>
              </div>

              <p className="mt-3 font-semibold">{i.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {i.desc}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Ações administrativas
          </CardTitle>
          <CardDescription>
            Operações úteis para manutenção local e controle do painel.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportarDadosLocais}>
            <Database className="mr-2 h-4 w-4" />
            Exportar dados locais
          </Button>

          <Button variant="outline" onClick={imprimirPolitica}>
            <FileText className="mr-2 h-4 w-4" />
            Imprimir/PDF
          </Button>

          <Button variant="outline" onClick={limparSessao}>
            <Lock className="mr-2 h-4 w-4" />
            Encerrar sessão local
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacidade na área pública</CardTitle>
          <CardDescription>
            O site público não deve expor dados pessoais de alunos,
            responsáveis ou equipe interna.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 text-sm leading-relaxed text-foreground/80">
          <p>
            Informações pessoais devem permanecer restritas ao painel
            administrativo. Visitantes devem visualizar apenas conteúdos
            institucionais, modalidades, horários, localização, avisos públicos e
            canais oficiais.
          </p>

          <p className="text-muted-foreground">
            Para uso em produção, recomenda-se implantar banco de dados online,
            autenticação segura e regras de acesso por perfil.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}