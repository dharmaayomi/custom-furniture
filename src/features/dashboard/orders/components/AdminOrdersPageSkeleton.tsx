import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function AdminOrdersPageSkeleton() {
  return (
    <section className="space-y-6">
      <div className="bg-muted/60 rounded-lg px-4 py-6 sm:px-6 sm:py-8">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={idx} className="border-border/50 bg-card/50 py-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-10" />
              <Skeleton className="mt-2 h-3 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <div className="border-border overflow-hidden rounded-xl border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-14" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-12" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-18" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-14" />
                </TableHead>
                <TableHead className="text-right">
                  <Skeleton className="ml-auto h-4 w-14" />
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Skeleton className="h-6 w-32 rounded-md" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-30 rounded-full" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-8 w-8 rounded-md" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-7 w-7 rounded-md" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>
      </div>
    </section>
  );
}
