"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  //   Tooltip,
  Legend,
  Cell
} from "recharts";

// Generate random data for the charts
const generateRandomData = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    name: `Day ${i + 1}`,
    visits: Math.floor(Math.random() * 1000),
    sales: Math.floor(Math.random() * 500),
    newUsers: Math.floor(Math.random() * 100),
    revenue: Math.floor(Math.random() * 10000)
  }));
};

const data = generateRandomData(7);

const pieData = [
  { name: "Mobile", value: 400 },
  { name: "Desktop", value: 300 },
  { name: "Tablet", value: 200 },
  { name: "Other", value: 100 }
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export function Dashboard() {
  const totalVisits = data.reduce((sum, day) => sum + day.visits, 0);
  const totalSales = data.reduce((sum, day) => sum + day.sales, 0);
  const totalNewUsers = data.reduce((sum, day) => sum + day.newUsers, 0);
  const totalRevenue = data.reduce((sum, day) => sum + day.revenue, 0);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-800">Weekly Summary</CardTitle>
          <CardDescription className="text-gray-600">
            Overview of key metrics for the past week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">
                Total Visits
              </h3>
              <p className="text-2xl font-bold text-gray-900">{totalVisits}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700">
                Total Sales
              </h3>
              <p className="text-2xl font-bold text-gray-900">{totalSales}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700">New Users</h3>
              <p className="text-2xl font-bold text-gray-900">
                {totalNewUsers}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700">
                Total Revenue
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                ${totalRevenue}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-800">Weekly Visits</CardTitle>
            <CardDescription className="text-gray-600">
              Number of visits in the past week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                visits: {
                  label: "Visits",
                  color: "hsl(var(--chart-1))"
                }
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#888888" />
                  <YAxis stroke="#888888" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="visits" fill="var(--color-visits)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-800">Weekly Sales</CardTitle>
            <CardDescription className="text-gray-600">
              Sales trend over the past week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                sales: {
                  label: "Sales",
                  color: "hsl(var(--chart-2))"
                }
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#888888" />
                  <YAxis stroke="#888888" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="var(--color-sales)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-800">New Users</CardTitle>
            <CardDescription className="text-gray-600">
              New user registrations over the past week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                newUsers: {
                  label: "New Users",
                  color: "hsl(var(--chart-3))"
                }
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#888888" />
                  <YAxis stroke="#888888" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="newUsers"
                    stroke="var(--color-newUsers)"
                    fill="var(--color-newUsers)"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-800">Device Usage</CardTitle>
            <CardDescription className="text-gray-600">
              Distribution of visits by device type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                mobile: { label: "Mobile", color: COLORS[0] },
                desktop: { label: "Desktop", color: COLORS[1] },
                tablet: { label: "Tablet", color: COLORS[2] },
                other: { label: "Other", color: COLORS[3] }
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
