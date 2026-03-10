"use client";

import React from "react";

import {
  TrendingUp,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Activity,
  CreditCard,
  Download,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

const revenueData = [
  { month: "Jan", revenue: 4500, orders: 120 },
  { month: "Feb", revenue: 5200, orders: 150 },
  { month: "Mar", revenue: 4800, orders: 140 },
  { month: "Apr", revenue: 6100, orders: 180 },
  { month: "May", revenue: 5900, orders: 170 },
  { month: "Jun", revenue: 7200, orders: 210 },
  { month: "Jul", revenue: 8400, orders: 250 },
];

const categoryData = [
  { name: "Electronics", value: 400, fill: "var(--color-electronics)" },
  { name: "Fashion", value: 300, fill: "var(--color-fashion)" },
  { name: "Home", value: 200, fill: "var(--color-home)" },
  { name: "Beauty", value: 100, fill: "var(--color-beauty)" },
];

const visitData = [
  { day: "Mon", visits: 2400 },
  { day: "Tue", visits: 1398 },
  { day: "Wed", visits: 9800 },
  { day: "Thu", visits: 3908 },
  { day: "Fri", visits: 4800 },
  { day: "Sat", visits: 3800 },
  { day: "Sun", visits: 4300 },
];

const recentSales = [
  {
    name: "Olivia Martin",
    email: "olivia.martin@email.com",
    amount: "+$1,999.00",
    avatar: "https://github.com/shadcn.png",
  },
  {
    name: "Jackson Lee",
    email: "jackson.lee@email.com",
    amount: "+$39.00",
    avatar: "https://github.com/shadcn.png",
  },
  {
    name: "Isabella Nguyen",
    email: "isabella.nguyen@email.com",
    amount: "+$299.00",
    avatar: "https://github.com/shadcn.png",
  },
  {
    name: "William Kim",
    email: "will@email.com",
    amount: "+$99.00",
    avatar: "https://github.com/shadcn.png",
  },
  {
    name: "Sofia Davis",
    email: "sofia.davis@email.com",
    amount: "+$39.00",
    avatar: "https://github.com/shadcn.png",
  },
];

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
  orders: {
    label: "Orders",
    color: "var(--chart-2)",
  },
  visits: {
    label: "Visits",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const categoryChartConfig = {
  value: {
    label: "Sales",
  },
  electronics: {
    label: "Electronics",
    color: "var(--chart-1)",
  },
  fashion: {
    label: "Fashion",
    color: "var(--chart-2)",
  },
  home: {
    label: "Home",
    color: "var(--chart-3)",
  },
  beauty: {
    label: "Beauty",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

const categoryColorByName: Record<string, string> = {
  Electronics: "var(--chart-1)",
  Fashion: "var(--chart-2)",
  Home: "var(--chart-3)",
  Beauty: "var(--chart-4)",
};

const Analytics = () => {
  const totalCategorySales = categoryData.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  const topCategory = [...categoryData].sort((a, b) => b.value - a.value)[0];

  return (
    <div className="text-foreground mx-auto w-full p-4 md:p-0">
      <header className="bg-card border-accent relative mb-8 overflow-hidden rounded-2xl border px-6 py-10 shadow-lg/5 sm:px-10">
        <div className="from-primary/5 to-primary/20 pointer-events-none absolute -top-12 -right-20 h-72 w-72 rounded-full bg-linear-to-br md:-top-14 md:-right-24 lg:-top-16 lg:-right-28" />
        <div className="from-primary/10 to-primary/30 pointer-events-none absolute -top-8 -right-28 h-64 w-64 rounded-full bg-linear-to-br md:-top-10 md:-right-32 lg:-top-12 lg:-right-36" />
        <div className="from-primary/20 to-primary/80 pointer-events-none absolute -top-4 -right-36 h-56 w-56 rounded-full bg-linear-to-br md:-top-6 md:-right-40 lg:-top-8 lg:-right-44" />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2.5">
              <div className="bg-primary/10 rounded-lg p-2">
                <TrendingUp className="text-primary h-5 w-5" />
              </div>
              <h1 className="text-foreground text-2xl font-bold tracking-tight">
                Analytics Dashboard
              </h1>
            </div>
            <p className="text-muted-foreground max-w-md text-sm">
              Welcome back! Here&apos;s what&apos;s happening with your store
              today.
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-muted/60 hidden sm:flex"
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
            <Button size="sm">
              <RefreshCw className="mr-2 h-4 w-4" /> Check Updates
            </Button>
          </div>
        </div>
      </header>

      {/* Quick Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value="$45,231.89"
          change="+20.1% from last month"
          icon={<DollarSign className="text-primary h-4 w-4" />}
          trend="up"
        />
        <StatCard
          title="Active Users"
          value="+2350"
          change="+180.1% from last month"
          icon={<Users className="text-primary h-4 w-4" />}
          trend="up"
        />
        <StatCard
          title="Sales"
          value="+12,234"
          change="+19% from last month"
          icon={<CreditCard className="text-primary h-4 w-4" />}
          trend="up"
        />
        <StatCard
          title="Active Now"
          value="+573"
          change="+201 since last hour"
          icon={<Activity className="text-primary h-4 w-4" />}
          trend="up"
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Revenue Chart */}
        <Card className="border-border/50 bg-card/50 py-4 backdrop-blur-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold">
                Revenue Overview
              </CardTitle>
              <CardDescription>
                Monthly performance data for the current year
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-primary/20"
              >
                <TrendingUp className="mr-1 h-3 w-3" /> Growth: 24%
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
              Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-muted-foreground leading-none">
              Showing total revenue for the last 7 months
            </div>
          </CardFooter>
        </Card>

        {/* Sales by Category */}
        <Card className="border-border/50 bg-card/50 py-4 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>
              Distribution of sales across top departments
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ChartContainer
              config={categoryChartConfig}
              className="h-62.5 w-full"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={88}
                />
              </PieChart>
            </ChartContainer>
            <div className="mt-6 grid w-full grid-cols-2 gap-4">
              {categoryData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: categoryColorByName[item.name] }}
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
                  <p className="text-muted-foreground text-xs">Top Category</p>
                  <p className="font-semibold">{topCategory?.name ?? "-"}</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">Total Share</p>
                  <p className="font-semibold">{totalCategorySales}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Weekly Visits */}
        <Card className="border-border/50 bg-card/50 py-4 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Weekly Visits</CardTitle>
            <CardDescription>
              Daily user traffic across the past week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-75 w-full">
              <BarChart data={visitData} accessibilityLayer>
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
                  dataKey="visits"
                  fill="var(--color-visits)"
                  barSize={45}
                  maxBarSize={50}
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Recent Transactions / Activity */}
        <Card className="border-border/50 bg-card/50 py-4 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Recent Sales</CardTitle>
              <CardDescription>You made 265 sales this month.</CardDescription>
            </div>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSales.map((sale) => (
                  <TableRow key={sale.email}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="border-border/50 h-8 w-8 border">
                          <AvatarImage src={sale.avatar} alt={sale.name} />
                          <AvatarFallback>
                            {sale.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{sale.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {sale.email}
                    </TableCell>
                    <TableCell className="text-right">{sale.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
    <Card className="border-border/50 bg-card/50 hover:border-primary/20 group relative overflow-hidden py-4 backdrop-blur-sm transition-all">
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
