import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ExampleCardProps = {
  title?: string;
  description?: string;
  status?: string;
};

function ExampleCard({
  title = "Ready to publish",
  description = "Use this component as a small, installable starter item.",
  status = "Template",
}: ExampleCardProps) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{title}</CardTitle>
          <Badge variant="secondary">{status}</Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Replace this example with a component from your own registry.
        </p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Open docs</Button>
      </CardFooter>
    </Card>
  );
}

export { ExampleCard, type ExampleCardProps };
