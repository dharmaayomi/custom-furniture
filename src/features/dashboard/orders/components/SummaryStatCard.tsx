import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";
import { ReactNode } from "react";

export function SummaryStatCard({
  title,
  value,
  helperText,
  icon,
}: {
  title: string;
  value: number;
  helperText: string;
  icon: ReactNode;
}) {
  return (
    <Card className="border-border/50 bg-card/50 hover:border-primary/20 group relative h-full overflow-hidden py-3 backdrop-blur-sm transition-all">
      <div className="from-primary/5 absolute inset-0 bg-linear-to-br to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm leading-snug font-medium">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-muted-foreground mt-1 flex items-start gap-1 text-xs leading-snug">
          <ArrowUpRight className="text-primary h-3 w-3" />
          <span className="text-primary font-medium">{helperText}</span>
        </p>
      </CardContent>
    </Card>
  );
}
