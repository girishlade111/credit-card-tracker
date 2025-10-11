"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Sale, CardType } from "@/lib/types"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { BarChart3 } from "lucide-react"

interface SalesChartsProps {
  sales: Sale[]
  cardTypes: CardType[]
  paymentStatus: { [key: string]: boolean }
  machineCardFees: MachineCardFee[]
}

// Define the MachineCardFee type
interface MachineCardFee {
  id: string
  fee: number
}

export function SalesCharts({ sales, cardTypes, paymentStatus, machineCardFees }: SalesChartsProps) {
  const [monthlySalesData, setMonthlySalesData] = useState<any[]>([])
  const [cardTypeData, setCardTypeData] = useState<any[]>([])
  const [receivedVsPendingData, setReceivedVsPendingData] = useState<any[]>([])

  useEffect(() => {
    // Generate monthly sales data
    const last6Months = eachMonthOfInterval({
      start: startOfMonth(subMonths(new Date(), 5)),
      end: startOfMonth(new Date()),
    })

    const monthlyData = last6Months.map((monthDate) => {
      const monthStart = startOfMonth(monthDate)
      const monthEnd = endOfMonth(monthDate)

      const salesInMonth = sales.filter((sale) => {
        const saleDate = parseISO(sale.date)
        return saleDate >= monthStart && saleDate <= monthEnd
      })

      const totalAmount = salesInMonth.reduce((sum, sale) => sum + sale.amount, 0)
      const netAmount = salesInMonth.reduce((sum, sale) => sum + sale.netAmount, 0)

      return {
        month: format(monthDate, "MMM", { locale: ptBR }),
        totalAmount,
        netAmount,
      }
    })

    setMonthlySalesData(monthlyData)

    // Generate card type data
    const cardTypeSales: Record<string, number> = {}

    sales.forEach((sale) => {
      const cardTypeName = cardTypes.find((c) => c.id === sale.cardTypeId)?.name || "Desconhecido"
      cardTypeSales[cardTypeName] = (cardTypeSales[cardTypeName] || 0) + sale.amount
    })

    const cardTypeChartData = Object.entries(cardTypeSales).map(([name, value]) => ({
      name,
      value,
    }))

    setCardTypeData(cardTypeChartData)

    // Generate received vs pending data
    const receivedAmount = sales.filter((sale) => paymentStatus[sale.id]).reduce((sum, sale) => sum + sale.netAmount, 0)

    const pendingAmount = sales.filter((sale) => !paymentStatus[sale.id]).reduce((sum, sale) => sum + sale.netAmount, 0)

    setReceivedVsPendingData([
      { name: "Recebido", value: receivedAmount },
      { name: "Pendente", value: pendingAmount },
    ])
  }, [sales, cardTypes, paymentStatus])

  // Calculate monthly fees (amount lost to operators)
  const last6Months = eachMonthOfInterval({
    start: startOfMonth(subMonths(new Date(), 5)),
    end: startOfMonth(new Date()),
  })

  const calculateMonthlyFees = () => {
    const monthlyFeeData = last6Months.map((monthDate) => {
      const monthStart = startOfMonth(monthDate)
      const monthEnd = endOfMonth(monthDate)

      const salesInMonth = sales.filter((sale) => {
        const saleDate = parseISO(sale.date)
        return saleDate >= monthStart && saleDate <= monthEnd
      })

      const feesAmount = salesInMonth.reduce((sum, sale) => sum + (sale.amount - sale.netAmount), 0)

      return {
        month: format(monthDate, "MMM", { locale: ptBR }),
        fees: feesAmount,
      }
    })

    return monthlyFeeData
  }

  const monthlyFeeData = calculateMonthlyFees()

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="mr-2 h-5 w-5" />
          Análise de Vendas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="monthly" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="monthly">Mensal</TabsTrigger>
            <TabsTrigger value="cardTypes">Cartões</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="fees">Taxas</TabsTrigger>
          </TabsList>

          <TabsContent value="monthly">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySalesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `R$${value}`} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="totalAmount" name="Valor Bruto" fill="#8884d8" />
                  <Bar dataKey="netAmount" name="Valor Líquido" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="cardTypes">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cardTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {cardTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="status">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={receivedVsPendingData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#4ade80" />
                    <Cell fill="#f87171" />
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="fees">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyFeeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `R$${value}`} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="fees" name="Taxas Pagas" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
