"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil, Trash2, Plus, Save, X, Check, CreditCard, ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import type { CardType, Machine, Sale, PaymentStatus, MachineCardFee } from "@/lib/types"
import { format, parseISO, addDays, isSameDay, addMonths, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { adjustToBusinessDay } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"

interface SalesTableProps {
  sales: Sale[]
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>
  cardTypes: CardType[]
  machines: Machine[]
  paymentStatus: PaymentStatus
  markPaymentReceived: (saleId: string, received: boolean) => void
  machineCardFees: MachineCardFee[]
}

export function SalesTable({
  sales,
  setSales,
  cardTypes,
  machines,
  paymentStatus,
  markPaymentReceived,
  machineCardFees,
}: SalesTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newSale, setNewSale] = useState<Partial<Sale>>({
    date: format(new Date(), "yyyy-MM-dd"),
  })
  const [isAdding, setIsAdding] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<"day" | "month">("day")
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [calendarOpen, setCalendarOpen] = useState(false)

  const handleEdit = (id: string) => {
    setEditingId(id)
    const sale = sales.find((s) => s.id === id)
    if (sale) {
      setNewSale({
        date: sale.date,
        amount: sale.amount,
        cardTypeId: sale.cardTypeId,
        machineId: sale.machineId,
      })
    }
  }

  const handleSave = (id: string) => {
    setSales(
      sales.map((sale) => {
        if (sale.id === id && newSale.date && newSale.amount && newSale.cardTypeId && newSale.machineId) {
          const cardType = cardTypes.find((c) => c.id === newSale.cardTypeId)

          // Check for machine-specific fee
          const machineFee = machineCardFees.find(
            (fee) => fee.machineId === newSale.machineId && fee.cardTypeId === newSale.cardTypeId,
          )

          const fee = machineFee ? machineFee.fee : cardType ? cardType.fee : 0

          return {
            ...sale,
            date: newSale.date,
            amount: newSale.amount,
            cardTypeId: newSale.cardTypeId,
            machineId: newSale.machineId,
            fee: fee,
            netAmount: calculateNetAmount(newSale.amount, fee),
            expectedDate: calculateExpectedDate(newSale.date, cardType ? cardType.days : 0),
          }
        }
        return sale
      }),
    )

    setEditingId(null)
    setNewSale({ date: format(new Date(), "yyyy-MM-dd") })
  }

  const handleDelete = (id: string) => {
    setSales(sales.filter((sale) => sale.id !== id))
  }

  const handleAdd = () => {
    if (newSale.date && newSale.amount && newSale.cardTypeId && newSale.machineId) {
      const cardType = cardTypes.find((c) => c.id === newSale.cardTypeId)

      // Check for machine-specific fee
      const machineFee = machineCardFees.find(
        (fee) => fee.machineId === newSale.machineId && fee.cardTypeId === newSale.cardTypeId,
      )

      const fee = machineFee ? machineFee.fee : cardType ? cardType.fee : 0

      const sale: Sale = {
        id: Date.now().toString(),
        date: newSale.date,
        amount: newSale.amount,
        cardTypeId: newSale.cardTypeId,
        machineId: newSale.machineId,
        fee: fee,
        netAmount: calculateNetAmount(newSale.amount, fee),
        expectedDate: calculateExpectedDate(newSale.date, cardType ? cardType.days : 0),
      }

      setSales([...sales, sale])
      setIsAdding(false)
      setNewSale({ date: format(selectedDate, "yyyy-MM-dd") })
    }
  }

  const calculateNetAmount = (amount: number | undefined, fee: number): number => {
    if (!amount) return 0
    return amount - (amount * fee) / 100
  }

  const calculateExpectedDate = (date: string | undefined, days: number): string => {
    if (!date) return ""

    // Calcular a data esperada adicionando os dias
    let expectedDate = addDays(parseISO(date), days)

    // Ajustar para o próximo dia útil se cair em fim de semana ou feriado
    expectedDate = adjustToBusinessDay(expectedDate)

    return format(expectedDate, "yyyy-MM-dd")
  }

  const handleChange = (field: keyof Sale, value: string | number) => {
    if (field === "cardTypeId") {
      const cardType = cardTypes.find((c) => c.id === value)

      setNewSale({
        ...newSale,
        [field]: value,
        fee: cardType ? cardType.fee : 0,
        netAmount: calculateNetAmount(newSale.amount, cardType ? cardType.fee : 0),
        expectedDate: calculateExpectedDate(newSale.date, cardType ? cardType.days : 0),
      })
    } else if (field === "machineId" && newSale.cardTypeId) {
      // Update fee if machine changes and card type is already selected
      const cardType = cardTypes.find((c) => c.id === newSale.cardTypeId)

      // Check for machine-specific fee
      const machineFee = machineCardFees.find((fee) => fee.machineId === value && fee.cardTypeId === newSale.cardTypeId)

      const fee = machineFee ? machineFee.fee : cardType ? cardType.fee : 0

      setNewSale({
        ...newSale,
        [field]: value,
        fee: fee,
        netAmount: calculateNetAmount(newSale.amount, fee),
      })
    } else {
      setNewSale({
        ...newSale,
        [field]: field === "amount" ? Number(value) : value,
      })
    }
  }

  const formatDate = (dateString: string): string => {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy", { locale: ptBR })
    } catch (error) {
      return dateString
    }
  }

  const getCardTypeName = (id: string): string => {
    const cardType = cardTypes.find((c) => c.id === id)
    return cardType ? cardType.name : ""
  }

  const getMachineName = (id: string): string => {
    const machine = machines.find((m) => m.id === id)
    return machine ? machine.name : ""
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  }

  // Filter sales based on selected date or month
  const filteredSales = sales.filter((sale) => {
    const saleDate = parseISO(sale.date)

    if (viewMode === "day") {
      return isSameDay(saleDate, selectedDate)
    } else {
      // Month view
      return saleDate.getMonth() === currentMonth.getMonth() && saleDate.getFullYear() === currentMonth.getFullYear()
    }
  })

  // Sort sales by date (newest first)
  const sortedSales = [...filteredSales].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  // Navigate to previous/next day or month
  const navigatePrevious = () => {
    if (viewMode === "day") {
      setSelectedDate((prev) => addDays(prev, -1))
    } else {
      setCurrentMonth((prev) => subMonths(prev, 1))
    }
  }

  const navigateNext = () => {
    if (viewMode === "day") {
      setSelectedDate((prev) => addDays(prev, 1))
    } else {
      setCurrentMonth((prev) => addMonths(prev, 1))
    }
  }

  // Set new sale date to match selected date when adding
  useEffect(() => {
    if (viewMode === "day") {
      setNewSale((prev) => ({
        ...prev,
        date: format(selectedDate, "yyyy-MM-dd"),
      }))
    }
  }, [selectedDate, viewMode])

  // Calculate totals for the current view
  const totalAmount = sortedSales.reduce((sum, sale) => sum + sale.amount, 0)
  const totalNetAmount = sortedSales.reduce((sum, sale) => sum + sale.netAmount, 0)
  const totalFees = totalAmount - totalNetAmount

  // Calculate monthly receivables
  const monthlyReceivables = filteredSales.reduce((sum, sale) => sum + sale.netAmount, 0)
  const receivedAmount = filteredSales
    .filter((sale) => paymentStatus[sale.id])
    .reduce((sum, sale) => sum + sale.netAmount, 0)
  const remainingToReceive = monthlyReceivables - receivedAmount

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setCalendarOpen(false)
    }
  }

  // Handle month selection
  const handleMonthSelect = (date: Date | undefined) => {
    if (date) {
      setCurrentMonth(date)
      setCalendarOpen(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <CreditCard className="mr-2 h-5 w-5" />
          Vendas
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Select value={viewMode} onValueChange={(value: "day" | "month") => setViewMode(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Visualização" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Por Dia</SelectItem>
              <SelectItem value="month">Por Mês</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" size="icon" onClick={navigatePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {viewMode === "day" ? (
            <div className="relative z-50">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="min-w-[240px] justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          ) : (
            <div className="relative z-50">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="min-w-[240px] justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <CalendarComponent
                    mode="single"
                    selected={new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)}
                    onSelect={handleMonthSelect}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <Button variant="outline" size="icon" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {viewMode === "day" && (
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-muted-foreground">
              {sortedSales.length} {sortedSales.length === 1 ? "venda" : "vendas"} em{" "}
              {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsAdding(true)} disabled={isAdding}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Venda
            </Button>
          </div>
        )}

        {viewMode === "month" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-primary/5">
                <CardContent className="p-4">
                  <div className="text-sm font-medium">Total Bruto</div>
                  <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
                </CardContent>
              </Card>
              <Card className="bg-red-50">
                <CardContent className="p-4">
                  <div className="text-sm font-medium">Total em Taxas</div>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(totalFees)}</div>
                </CardContent>
              </Card>
              <Card className="bg-green-50">
                <CardContent className="p-4">
                  <div className="text-sm font-medium">Total Líquido</div>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(totalNetAmount)}</div>
                </CardContent>
              </Card>
              <Card className="bg-blue-50">
                <CardContent className="p-4">
                  <div className="text-sm font-medium">Falta Receber</div>
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(remainingToReceive)}</div>
                  <div className="text-xs text-blue-500 mt-1">
                    {formatCurrency(receivedAmount)} já recebido de {formatCurrency(monthlyReceivables)}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {filteredSales.length} vendas em {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-sm font-medium">
                  <span className="text-green-600">{Math.round((receivedAmount / monthlyReceivables) * 100)}%</span>{" "}
                  recebido
                </div>
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${Math.round((receivedAmount / monthlyReceivables) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="overflow-x-auto">
          <Table>
            {viewMode === "day" ? (
              <>
                <TableHeader>
                  <TableRow>
                    <TableHead>Valor Bruto</TableHead>
                    <TableHead>Cartão</TableHead>
                    <TableHead>Máquina</TableHead>
                    <TableHead>Taxa (%)</TableHead>
                    <TableHead>Valor Líquido</TableHead>
                    <TableHead>Data Prevista</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isAdding && (
                    <TableRow>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={newSale.amount || ""}
                          onChange={(e) => handleChange("amount", e.target.value)}
                          placeholder="Valor"
                        />
                      </TableCell>
                      <TableCell>
                        <Select value={newSale.cardTypeId} onValueChange={(value) => handleChange("cardTypeId", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {cardTypes.map((card) => (
                              <SelectItem key={card.id} value={card.id}>
                                {card.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={newSale.machineId} onValueChange={(value) => handleChange("machineId", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {machines.map((machine) => (
                              <SelectItem key={machine.id} value={machine.id}>
                                {machine.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {newSale.cardTypeId && newSale.machineId
                          ? (() => {
                              const machineFee = machineCardFees.find(
                                (fee) => fee.machineId === newSale.machineId && fee.cardTypeId === newSale.cardTypeId,
                              )

                              const fee = machineFee
                                ? machineFee.fee
                                : cardTypes.find((c) => c.id === newSale.cardTypeId)?.fee || 0

                              return `${fee.toFixed(2)}%`
                            })()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {newSale.amount && newSale.cardTypeId && newSale.machineId
                          ? (() => {
                              const machineFee = machineCardFees.find(
                                (fee) => fee.machineId === newSale.machineId && fee.cardTypeId === newSale.cardTypeId,
                              )

                              const fee = machineFee
                                ? machineFee.fee
                                : cardTypes.find((c) => c.id === newSale.cardTypeId)?.fee || 0

                              return formatCurrency(calculateNetAmount(newSale.amount, fee))
                            })()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {newSale.date && newSale.cardTypeId
                          ? formatDate(
                              calculateExpectedDate(
                                newSale.date,
                                cardTypes.find((c) => c.id === newSale.cardTypeId)?.days || 0,
                              ),
                            )
                          : "-"}
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="icon" variant="ghost" onClick={handleAdd}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setIsAdding(false)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {sortedSales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {`Nenhuma venda registrada para ${format(selectedDate, "dd/MM/yyyy")}`}
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          {editingId === sale.id ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={newSale.amount !== undefined ? newSale.amount : sale.amount}
                              onChange={(e) => handleChange("amount", e.target.value)}
                            />
                          ) : (
                            formatCurrency(sale.amount)
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === sale.id ? (
                            <Select
                              value={newSale.cardTypeId || sale.cardTypeId}
                              onValueChange={(value) => handleChange("cardTypeId", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                {cardTypes.map((card) => (
                                  <SelectItem key={card.id} value={card.id}>
                                    {card.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            getCardTypeName(sale.cardTypeId)
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === sale.id ? (
                            <Select
                              value={newSale.machineId || sale.machineId}
                              onValueChange={(value) => handleChange("machineId", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                {machines.map((machine) => (
                                  <SelectItem key={machine.id} value={machine.id}>
                                    {machine.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            getMachineName(sale.machineId)
                          )}
                        </TableCell>
                        <TableCell>{sale.fee.toFixed(2)}%</TableCell>
                        <TableCell>{formatCurrency(sale.netAmount)}</TableCell>
                        <TableCell>{formatDate(sale.expectedDate)}</TableCell>
                        <TableCell>
                          <Button
                            variant={paymentStatus[sale.id] ? "default" : "outline"}
                            size="sm"
                            className={paymentStatus[sale.id] ? "bg-green-600 hover:bg-green-700" : ""}
                            onClick={() => markPaymentReceived(sale.id, !paymentStatus[sale.id])}
                          >
                            {paymentStatus[sale.id] ? (
                              <>
                                <Check className="mr-1 h-3 w-3" />
                                Recebido
                              </>
                            ) : (
                              "Pendente"
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {editingId === sale.id ? (
                              <Button size="icon" variant="ghost" onClick={() => handleSave(sale.id)}>
                                <Save className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button size="icon" variant="ghost" onClick={() => handleEdit(sale.id)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(sale.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </>
            ) : (
              // Visualização mensal agrupada por dia
              <>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Vendas</TableHead>
                    <TableHead>Total Bruto</TableHead>
                    <TableHead>Total Taxas</TableHead>
                    <TableHead>Total Líquido</TableHead>
                    <TableHead>Recebido</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    // Agrupar vendas por dia
                    const salesByDay: Record<string, Sale[]> = {}

                    sortedSales.forEach((sale) => {
                      const day = sale.date.split("T")[0] // Pega apenas a parte da data
                      if (!salesByDay[day]) {
                        salesByDay[day] = []
                      }
                      salesByDay[day].push(sale)
                    })

                    // Se não houver vendas no mês
                    if (Object.keys(salesByDay).length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            {`Nenhuma venda registrada para ${format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}`}
                          </TableCell>
                        </TableRow>
                      )
                    }

                    // Ordenar dias (mais recentes primeiro)
                    return Object.entries(salesByDay)
                      .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
                      .map(([date, daySales]) => {
                        const dayTotalAmount = daySales.reduce((sum, sale) => sum + sale.amount, 0)
                        const dayTotalNetAmount = daySales.reduce((sum, sale) => sum + sale.netAmount, 0)
                        const dayTotalFees = dayTotalAmount - dayTotalNetAmount

                        const receivedSales = daySales.filter((sale) => paymentStatus[sale.id])
                        const receivedAmount = receivedSales.reduce((sum, sale) => sum + sale.netAmount, 0)
                        const receivedPercentage =
                          dayTotalNetAmount > 0 ? Math.round((receivedAmount / dayTotalNetAmount) * 100) : 0

                        const allReceived = daySales.every((sale) => paymentStatus[sale.id])
                        const someReceived = daySales.some((sale) => paymentStatus[sale.id])

                        return (
                          <TableRow key={date} className="hover:bg-gray-50 cursor-pointer">
                            <TableCell
                              className="font-medium"
                              onClick={() => {
                                setSelectedDate(parseISO(date))
                                setViewMode("day")
                              }}
                            >
                              {formatDate(date)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                {daySales.length}
                                <span
                                  className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                                    allReceived
                                      ? "bg-green-100 text-green-800"
                                      : someReceived
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {allReceived
                                    ? "Todos recebidos"
                                    : someReceived
                                      ? "Parcialmente recebido"
                                      : "Pendente"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{formatCurrency(dayTotalAmount)}</TableCell>
                            <TableCell className="text-red-600">{formatCurrency(dayTotalFees)}</TableCell>
                            <TableCell className="text-green-600 font-medium">
                              {formatCurrency(dayTotalNetAmount)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <span className="mr-2">{formatCurrency(receivedAmount)}</span>
                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-green-500 rounded-full"
                                    style={{ width: `${receivedPercentage}%` }}
                                  ></div>
                                </div>
                                <span className="ml-1 text-xs">{receivedPercentage}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedDate(parseISO(date))
                                  setViewMode("day")
                                }}
                              >
                                Ver detalhes
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })
                  })()}
                </TableBody>
              </>
            )}
          </Table>
        </div>

        {sortedSales.length > 0 && viewMode === "day" && (
          <div className="mt-6 flex justify-end">
            <div className="bg-gray-50 p-4 rounded-md flex flex-col space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Total Bruto:</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span className="font-medium">Total em Taxas:</span>
                <span>{formatCurrency(totalFees)}</span>
              </div>
              <div className="flex justify-between text-green-600 font-bold">
                <span>Total Líquido:</span>
                <span>{formatCurrency(totalNetAmount)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
