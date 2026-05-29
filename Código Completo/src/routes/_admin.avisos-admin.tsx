import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { Plus, Pencil, Trash2, Megaphone, RefreshCw } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/avisos-admin")({
  head: () => ({ meta: [{ title: "Avisos — Painel Monsenhor" }] }),
  component: AvisosAdmin,
});

type Aviso = {
  id: string;
  titulo: string;
  mensagem: string;
  data: string;
  importante: boolean;
  publico: boolean;
  created_at?: string;
};

type AvisoForm = Omit<Aviso, "id" | "created_at">;

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatarData(data: string) {
  if (!data) return "";
  return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
}

function AvisosAdmin() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregarAvisos() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("avisos")
      .select("*")
      .order("data", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar avisos:", error);
      toast.error("Não foi possível carregar os avisos.");
      setCarregando(false);
      return;
    }

    setAvisos(data || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregarAvisos();
  }, []);

  async function removerAviso(id: string) {
    const confirmar = window.confirm("Tem certeza que deseja remover este aviso?");

    if (!confirmar) return;

    const { error } = await supabase.from("avisos").delete().eq("id", id);

    if (error) {
      console.error("Erro ao remover aviso:", error);
      toast.error("Não foi possível remover o aviso.");
      return;
    }

    toast.success("Aviso removido.");
    carregarAvisos();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold">Gestão de avisos</h2>
          <p className="text-sm text-muted-foreground">
            Comunique horários, manutenções e eventos.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={carregarAvisos}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>

          <AvisoDialog onSaved={carregarAvisos} />
        </div>
      </div>

      {carregando && (
        <p className="text-sm text-muted-foreground">Carregando avisos...</p>
      )}

      {!carregando && avisos.length === 0 && (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            Nenhum aviso cadastrado no momento.
          </CardContent>
        </Card>
      )}

      {!carregando && avisos.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {avisos.map((a) => (
            <Card key={a.id} style={{ boxShadow: "var(--shadow-card)" }}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <Megaphone className="h-4 w-4 text-primary" />

                  <div className="flex gap-1">
                    {a.importante && <Badge variant="destructive">Importante</Badge>}

                    <Badge variant={a.publico ? "default" : "outline"}>
                      {a.publico ? "Público" : "Interno"}
                    </Badge>
                  </div>
                </div>

                <CardTitle className="mt-2 text-base">{a.titulo}</CardTitle>
                <CardDescription>{formatarData(a.data)}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 text-sm text-foreground/80">
                <p>{a.mensagem}</p>

                <div className="flex justify-end gap-2">
                  <AvisoDialog
                    aviso={a}
                    onSaved={carregarAvisos}
                    trigger={
                      <Button size="sm" variant="outline">
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                    }
                  />

                  <Button size="sm" variant="ghost" onClick={() => removerAviso(a.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AvisoDialog({
  aviso,
  trigger,
  onSaved,
}: {
  aviso?: Aviso;
  trigger?: ReactNode;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const empty: AvisoForm = {
    titulo: "",
    mensagem: "",
    data: hojeISO(),
    importante: false,
    publico: true,
  };

  const [f, setF] = useState<AvisoForm>({
    titulo: aviso?.titulo ?? "",
    mensagem: aviso?.mensagem ?? "",
    data: aviso?.data ?? hojeISO(),
    importante: aviso?.importante ?? false,
    publico: aviso?.publico ?? true,
  });

  function abrirDialog(o: boolean) {
    setOpen(o);

    if (o) {
      setF({
        titulo: aviso?.titulo ?? "",
        mensagem: aviso?.mensagem ?? "",
        data: aviso?.data ?? hojeISO(),
        importante: aviso?.importante ?? false,
        publico: aviso?.publico ?? true,
      });
    }
  }

  async function save() {
    if (!f.titulo.trim() || !f.mensagem.trim()) {
      toast.error("Informe título e mensagem.");
      return;
    }

    setSalvando(true);

    if (aviso) {
      const { error } = await supabase
        .from("avisos")
        .update({
          titulo: f.titulo.trim(),
          mensagem: f.mensagem.trim(),
          data: f.data,
          importante: f.importante,
          publico: f.publico,
        })
        .eq("id", aviso.id);

      setSalvando(false);

      if (error) {
        console.error("Erro ao atualizar aviso:", error);
        toast.error("Não foi possível atualizar o aviso.");
        return;
      }

      toast.success("Aviso atualizado.");
      setOpen(false);
      onSaved();
      return;
    }

    const { error } = await supabase.from("avisos").insert({
      titulo: f.titulo.trim(),
      mensagem: f.mensagem.trim(),
      data: f.data,
      importante: f.importante,
      publico: f.publico,
    });

    setSalvando(false);

    if (error) {
      console.error("Erro ao publicar aviso:", error);
      toast.error("Não foi possível publicar o aviso.");
      return;
    }

    toast.success("Aviso publicado.");
    setOpen(false);
    setF(empty);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={abrirDialog}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo aviso
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{aviso ? "Editar aviso" : "Novo aviso"}</DialogTitle>
          <DialogDescription>Defina a mensagem e onde ela será exibida.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Fld label="Título">
            <Input
              value={f.titulo}
              onChange={(e) => setF({ ...f, titulo: e.target.value })}
              placeholder="Manutenção da piscina"
            />
          </Fld>

          <Fld label="Mensagem">
            <Textarea
              value={f.mensagem}
              onChange={(e) => setF({ ...f, mensagem: e.target.value })}
              rows={4}
              placeholder="Digite o comunicado..."
            />
          </Fld>

          <div className="grid gap-3 md:grid-cols-3">
            <Fld label="Data">
              <Input
                type="date"
                value={f.data}
                onChange={(e) => setF({ ...f, data: e.target.value })}
              />
            </Fld>

            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <Label className="text-sm">Marcar como importante</Label>
              <Switch
                checked={f.importante}
                onCheckedChange={(v) => setF({ ...f, importante: v })}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <Label className="text-sm">Exibir na página pública</Label>
              <Switch
                checked={f.publico}
                onCheckedChange={(v) => setF({ ...f, publico: v })}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={salvando}>
            Cancelar
          </Button>

          <Button onClick={save} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Fld({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}