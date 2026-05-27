import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDB } from "@/lib/mock-data";
import { Megaphone } from "lucide-react";

export const Route = createFileRoute("/avisos")({
  head: () => ({
    meta: [
      { title: "Avisos — Hidro e Natação Monsenhor" },
      { name: "description", content: "Comunicados oficiais do Centro Esportivo Profª Marta Regina." },
    ],
  }),
  component: AvisosPublicos,
});

function AvisosPublicos() {
  const { avisos } = useDB();
  const publicos = avisos.filter((a) => a.publico).sort((a, b) => b.data.localeCompare(a.data));
  return (
    <PublicLayout>
      <section className="mx-auto w-full max-w-4xl px-4 py-10">
        <h1 className="font-display text-3xl font-semibold">Avisos</h1>
        <p className="text-sm text-muted-foreground">Comunicados oficiais da administração do centro.</p>
        <div className="mt-6 space-y-4">
          {publicos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum aviso publicado no momento.</p>}
          {publicos.map((a) => (
            <Card key={a.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-primary" />
                  {a.importante && <Badge variant="destructive">Importante</Badge>}
                </div>
                <CardTitle className="text-lg">{a.titulo}</CardTitle>
                <CardDescription>{new Date(a.data).toLocaleDateString("pt-BR")}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-foreground/80">{a.mensagem}</CardContent>
            </Card>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
