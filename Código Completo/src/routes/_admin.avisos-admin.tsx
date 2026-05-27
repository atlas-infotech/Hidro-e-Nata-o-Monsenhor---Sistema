import { createFileRoute } from "@tanstack/react-router";
import { useDB, db, type Aviso } from "@/lib/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Megaphone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/avisos-admin")({
  head: () => ({ meta: [{ title: "Avisos — Painel Monsenhor" }] }),
  component: AvisosAdmin,
});

function AvisosAdmin() {
  const { avisos } = useDB();
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold">Gestão de avisos</h2>
          <p className="text-sm text-muted-foreground">Comunique horários, manutenções e eventos.</p>
        </div>
        <AvisoDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {avisos.map((a) => (
          <Card key={a.id} style={{ boxShadow: "var(--shadow-card)" }}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <Megaphone className="h-4 w-4 text-primary" />
                <div className="flex gap-1">
                  {a.importante && <Badge variant="destructive">Importante</Badge>}
                  <Badge variant={a.publico ? "default" : "outline"}>{a.publico ? "Público" : "Interno"}</Badge>
                </div>
              </div>
              <CardTitle className="mt-2 text-base">{a.titulo}</CardTitle>
              <CardDescription>{new Date(a.data).toLocaleDateString("pt-BR")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-foreground/80">
              <p>{a.mensagem}</p>
              <div className="flex justify-end gap-2">
                <AvisoDialog aviso={a} trigger={<Button size="sm" variant="outline"><Pencil className="mr-2 h-4 w-4" />Editar</Button>} />
                <Button size="sm" variant="ghost" onClick={() => { db.removeAviso(a.id); toast.success("Aviso removido."); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AvisoDialog({ aviso, trigger }: { aviso?: Aviso; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const empty: Omit<Aviso, "id"> = {
    titulo: "", mensagem: "", data: new Date().toISOString().slice(0, 10),
    importante: false, publico: true,
  };
  const [f, setF] = useState<Omit<Aviso, "id">>(aviso ?? empty);

  const save = () => {
    if (!f.titulo || !f.mensagem) { toast.error("Informe título e mensagem."); return; }
    if (aviso) { db.updateAviso(aviso.id, f); toast.success("Aviso atualizado."); }
    else { db.addAviso(f); toast.success("Aviso publicado."); }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setF(aviso ?? empty); }}>
      <DialogTrigger asChild>{trigger ?? <Button><Plus className="mr-2 h-4 w-4" />Novo aviso</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{aviso ? "Editar aviso" : "Novo aviso"}</DialogTitle>
          <DialogDescription>Defina a mensagem e onde ela será exibida.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Fld label="Título"><Input value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} placeholder="Manutenção da piscina" /></Fld>
          <Fld label="Mensagem"><Textarea value={f.mensagem} onChange={(e) => setF({ ...f, mensagem: e.target.value })} rows={4} /></Fld>
          <div className="grid gap-3 md:grid-cols-3">
            <Fld label="Data"><Input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} /></Fld>
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <Label className="text-sm">Marcar como importante</Label>
              <Switch checked={f.importante} onCheckedChange={(v) => setF({ ...f, importante: v })} />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <Label className="text-sm">Exibir na página pública</Label>
              <Switch checked={f.publico} onCheckedChange={(v) => setF({ ...f, publico: v })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={save}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Fld({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-sm">{label}</Label>{children}</div>;
}
