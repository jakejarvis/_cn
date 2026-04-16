import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ExampleCard } from "../../components/example-card/example-card";
import { stats } from "./stats-data";

function StatsPanel() {
  return (
    <div className="grid w-full max-w-3xl gap-4 md:grid-cols-[1fr_1.2fr]">
      <ExampleCard
        title="Registry starter"
        description="Compose local registry items with shadcn dependencies."
        status="Block"
      />
      <Card>
        <CardHeader>
          <CardTitle>Registry health</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center justify-between gap-4 rounded-md border p-3"
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">{stat.label}</span>
                <span className="text-sm text-muted-foreground">{stat.detail}</span>
              </div>
              <Badge variant="secondary">{stat.value}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export { StatsPanel };
