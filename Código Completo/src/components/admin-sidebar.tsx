import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  CalendarDays,
  CheckSquare,
  Megaphone,
  BarChart3,
  Shield,
  UserCog,
  LogOut,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

import { sair } from "@/lib/auth";
import logo from "@/assets/Golfinho Solitário.png";

const items = [
  { to: "/painel", label: "Painel", icon: LayoutDashboard },
  { to: "/pre-cadastros", label: "Pré-cadastros", icon: ClipboardList },
  { to: "/alunos", label: "Alunos", icon: Users },
  { to: "/turmas", label: "Turmas", icon: CalendarDays },
  { to: "/presenca", label: "Presença", icon: CheckSquare },
  { to: "/avisos-admin", label: "Avisos", icon: Megaphone },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
];

const sistema = [
  { to: "/usuarios", label: "Usuários e Perfis", icon: UserCog },
  { to: "/seguranca", label: "Segurança e Backup", icon: Shield },
];

export function AdminSidebar() {
  const navigate = useNavigate();
  const current = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm">
  <img
    src={logo}
    alt="Hidro e Natação Monsenhor"
   className="h-14 w-14 scale-[1.45] object-contain -translate-x-[2px]"
  />
</span>

          <div className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-display text-sm font-semibold text-sidebar-foreground">
              Painel Monsenhor
            </span>
            <span className="truncate text-[11px] text-sidebar-foreground/70">
              Hidro e Natação Monsenhor
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => (
                <SidebarMenuItem key={it.to}>
                  <SidebarMenuButton asChild isActive={current === it.to} tooltip={it.label}>
                    <Link to={it.to}>
                      <it.icon className="h-4 w-4" />
                      <span>{it.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sistema.map((it) => (
                <SidebarMenuItem key={it.to}>
                  <SidebarMenuButton asChild isActive={current === it.to} tooltip={it.label}>
                    <Link to={it.to}>
                      <it.icon className="h-4 w-4" />
                      <span>{it.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 py-2 text-xs text-sidebar-foreground/80 group-data-[collapsible=icon]:hidden">
          <p className="font-semibold text-sidebar-foreground">Administrador</p>
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sair"
              onClick={() => {
                sair();
                navigate({ to: "/login" });
              }}
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}