import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { getSessao } from "@/lib/auth";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/_admin")({
  beforeLoad: () => {
    // Client-only auth check (prototype). On SSR pass-through and re-check on client.
    if (typeof window !== "undefined" && !getSessao()) {
      throw redirect({ to: "/login" });
    }
  },
  component: AdminLayout,
});

const titles: Record<string, { title: string; sub?: string }> = {
  "/painel": { title: "Painel", sub: "Visão geral do centro" },
  "/pre-cadastros": { title: "Pré-cadastros", sub: "Solicitações recebidas pela equipe" },
  "/alunos": { title: "Alunos", sub: "Cadastro e gestão dos estudantes" },
  "/turmas": { title: "Turmas", sub: "Organização das atividades" },
  "/presenca": { title: "Presença", sub: "Controle digital de frequência" },
  "/avisos-admin": { title: "Avisos", sub: "Comunicação com a comunidade" },
  "/relatorios": { title: "Relatórios", sub: "Indicadores e exportações" },
  "/seguranca": { title: "Segurança e Backup", sub: "Boas práticas e indicadores" },
  "/usuarios": { title: "Usuários e Perfis", sub: "Permissões da equipe" },
};

function AdminLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const meta = titles[path] ?? { title: "Painel administrativo" };
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6" />
            <div className="leading-tight">
              <p className="font-display text-sm font-semibold">{meta.title}</p>
              {meta.sub && <p className="text-xs text-muted-foreground">{meta.sub}</p>}
            </div>
          </header>
          <main className="flex-1 px-4 py-6 md:px-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
