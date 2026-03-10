"use client";

import React from "react";

import {
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  CreditCard,
  Download,
  Package,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
} from "recharts";

const revenueData = [
  { month: "Jan", revenue: 18500 },
  { month: "Feb", revenue: 22400 },
  { month: "Mar", revenue: 19800 },
  { month: "Apr", revenue: 26700 },
  { month: "May", revenue: 24300 },
  { month: "Jun", revenue: 30100 },
  { month: "Jul", revenue: 33800 },
];

const orderStatusData = [
  { name: "Pending Payment", value: 18, fill: "var(--chart-1)" },
  { name: "In Production", value: 26, fill: "var(--chart-2)" },
  { name: "Ready to Ship", value: 12, fill: "var(--chart-3)" },
  { name: "Completed", value: 44, fill: "var(--chart-4)" },
];

const salesByMaterialData = [
  { name: "Teak Wood", sales: 14 },
  { name: "Mahogany", sales: 10 },
  { name: "Plywood", sales: 8 },
  { name: "Steel Frame", sales: 6 },
  { name: "Rattan", sales: 5 },
];

const productionUpdateData = [
  { day: "Mon", completed: 3 },
  { day: "Tue", completed: 5 },
  { day: "Wed", completed: 4 },
  { day: "Thu", completed: 6 },
  { day: "Fri", completed: 4 },
  { day: "Sat", completed: 2 },
];

const liveActivityData = [
  {
    title: "New Orders Today",
    value: "12",
    note: "3 custom furniture requests added this afternoon",
    trend: "+4 vs yesterday",
  },
  {
    title: "Payments Received Today",
    value: "$4,850",
    note: "2 invoices settled and 5 deposit confirmations",
    trend: "+12.5%",
  },
  {
    title: "Production Updates Today",
    value: "7",
    note: "Units moved across cutting, assembly, and finishing",
    trend: "2 delayed items need review",
  },
];

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
  sales: {
    label: "Sales",
    color: "var(--chart-2)",
  },
  completed: {
    label: "Completed",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const orderStatusChartConfig = {
  value: {
    label: "Orders",
  },
  pendingPayment: {
    label: "Pending Payment",
    color: "var(--chart-1)",
  },
  inProduction: {
    label: "In Production",
    color: "var(--chart-2)",
  },
  readyToShip: {
    label: "Ready to Ship",
    color: "var(--chart-3)",
  },
  completed: {
    label: "Completed",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

const orderStatusColorByName: Record<string, string> = {
  "Pending Payment": "var(--chart-1)",
  "In Production": "var(--chart-2)",
  "Ready to Ship": "var(--chart-3)",
  Completed: "var(--chart-4)",
};

const Analytics = () => {
  const totalOrders = orderStatusData.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  const topOrderStatus = [...orderStatusData].sort(
    (a, b) => b.value - a.value,
  )[0];

  return (
    <div className="text-foreground mx-auto w-full p-4 md:p-0">
      <header className="bg-card border-accent relative mb-8 overflow-hidden rounded-2xl border px-6 py-10 shadow-lg/5 sm:px-10">
        <div className="from-primary/5 to-primary/20 pointer-events-none absolute -top-12 -right-20 h-72 w-72 rounded-full bg-linear-to-br md:-top-14 md:-right-24 lg:-top-16 lg:-right-28" />
        <div className="from-primary/10 to-primary/30 pointer-events-none absolute -top-8 -right-28 h-64 w-64 rounded-full bg-linear-to-br md:-top-10 md:-right-32 lg:-top-12 lg:-right-36" />
        <div className="from-primary/20 to-primary/80 pointer-events-none absolute -top-4 -right-36 h-56 w-56 rounded-full bg-linear-to-br md:-top-6 md:-right-40 lg:-top-8 lg:-right-44" />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2.5">
              <div className="bg-background/20 border-foreground/10 rounded-lg border p-2 backdrop-blur-xs">
                <TrendingUp className="text-foreground h-5 w-5" />
              </div>
              <h1 className="text-foreground text-2xl font-bold tracking-tight">
                Operations Dashboard
              </h1>
            </div>
            <p className="text-foreground/80 max-w-md text-sm">
              Revenue, order pipeline, and production progress across the custom
              furniture workflow.
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-foreground/15 bg-background/20 text-foreground hover:bg-background/30 hidden shadow-none backdrop-blur-xs sm:flex"
                >
                  <Download className="mr-2 h-4 w-4" /> Export Data
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <span>CSV Format</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>PDF Report</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Share Link</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="sm"
              className="bg-foreground text-background hover:bg-foreground/90 shadow-none"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Check Updates
            </Button>
          </div>
        </div>
      </header>

      {/* Quick Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value="$214,600"
          change="+14.8% from last month"
          icon={<DollarSign className="text-primary h-4 w-4" />}
          trend="up"
        />
        <StatCard
          title="Total Orders"
          value="100"
          change="+9 new orders this week"
          icon={<Package className="text-primary h-4 w-4" />}
          trend="up"
        />
        <StatCard
          title="Pending Payments"
          value="18"
          change="-3 awaiting confirmation"
          icon={<CreditCard className="text-primary h-4 w-4" />}
          trend="down"
        />
        <StatCard
          title="Orders In Production"
          value="26"
          change="+5 moved into workshop"
          icon={<Activity className="text-primary h-4 w-4" />}
          trend="up"
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-border/50 bg-card py-4 shadow-lg/5 backdrop-blur-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold">
                Monthly Revenue Overview
              </CardTitle>
              <CardDescription>
                Revenue trend across the latest reporting months
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-primary/20"
              >
                <TrendingUp className="mr-1 h-3 w-3" /> Growth: 14.8%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartContainer config={chartConfig} className="h-87.5 w-full">
              <BarChart data={revenueData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar
                  dataKey="revenue"
                  fill="var(--color-revenue)"
                  barSize={55}
                  maxBarSize={65}
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="border-border/20 flex-col items-start gap-2 border-t pt-4 text-sm">
            <div className="flex gap-2 leading-none font-medium">
              Trending up by 14.8% this month <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-muted-foreground leading-none">
              Showing total revenue for the last 7 months
            </div>
          </CardFooter>
        </Card>

        <Card className="border-border/50 bg-card py-4 shadow-lg/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
            <CardDescription>
              Current order mix across payment and production stages
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ChartContainer
              config={orderStatusChartConfig}
              className="h-62.5 w-full"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={orderStatusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={88}
                >
                  {orderStatusData.map((item) => (
                    <Cell key={item.name} fill={item.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="mt-6 grid w-full grid-cols-2 gap-4">
              {orderStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: orderStatusColorByName[item.name],
                    }}
                  />
                  <span className="text-xs font-medium">{item.name}</span>
                  <span className="text-muted-foreground ml-auto text-xs">
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-5 w-full border-t pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">
                    Largest Status
                  </p>
                  <p className="font-semibold">{topOrderStatus?.name ?? "-"}</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">
                    Tracked Orders
                  </p>
                  <p className="font-semibold">{totalOrders}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border/50 bg-card py-4 shadow-lg/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Sales by Product / Material</CardTitle>
            <CardDescription>
              Top-selling furniture materials in the current period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-75 w-full">
              <BarChart data={salesByMaterialData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="sales"
                  fill="var(--color-sales)"
                  barSize={45}
                  maxBarSize={50}
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card py-4 shadow-lg/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Production Updates This Week</CardTitle>
            <CardDescription>
              Items completed or advanced by the workshop team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-75 w-full">
              <BarChart data={productionUpdateData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="completed"
                  fill="var(--color-completed)"
                  barSize={45}
                  maxBarSize={50}
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {liveActivityData.map((item) => (
          <Card
            key={item.title}
            className="border-border/50 bg-card py-4 shadow-lg/5 backdrop-blur-sm"
          >
            <CardHeader className="pb-3">
              <CardDescription>{item.title}</CardDescription>
              <CardTitle className="text-2xl">{item.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">{item.note}</p>
            </CardContent>
            <CardFooter className="text-primary text-xs font-medium">
              {item.trend}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

const StatCard = ({
  title,
  value,
  change,
  icon,
  trend,
}: {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  trend: "up" | "down";
}) => {
  return (
    <Card className="border-border/50 hover:border-primary/20 group bg-card relative overflow-hidden py-4 shadow-lg/5 backdrop-blur-sm transition-all">
      <div className="from-primary/5 absolute inset-0 bg-linear-to-br to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
          {trend === "up" ? (
            <ArrowUpRight className="text-primary h-3 w-3" />
          ) : (
            <ArrowDownRight className="text-destructive h-3 w-3" />
          )}
          <span
            className={
              trend === "up"
                ? "text-primary font-medium"
                : "text-destructive font-medium"
            }
          >
            {change.split(" ")[0]}
          </span>
          {change.split(" ").slice(1).join(" ")}
        </p>
      </CardContent>
    </Card>
  );
};

export default Analytics;
