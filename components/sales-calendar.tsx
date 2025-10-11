"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check, CreditCard, DollarSign, ChevronLeft, ChevronRight } from "lucide-react"
import type { Sale, CardType, PaymentStatus } from "@/lib/types"
import {
  format,
  isSameDay,
  parseISO,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from "date-fns"
import { ptBR } from "date-fns/locale"

interface SalesCalendarProps {
  sales: Sale[]
  cardTypes: CardType[]
  paymentStatus: PaymentStatus
  markPaymentReceived: (saleId: string, received: boolean) => void
  compact: boolean
}

export function SalesCalendar({ sales, cardTypes, paymentStatus, markPaymentReceived, compact }: SalesCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [openDialog, setOpenDialog] = useState(false)

  const getCardTypeName = (id: string): string => {
    const cardType = cardTypes.find((c) => c.id === id)
    return cardType ? cardType.name : ""
  }

  const getSalesByDate = (date: Date) => {
    return sales.filter((sale) => {
      const expectedDate = parseISO(sale.expectedDate)
      return isSameDay(expectedDate, date)
    })
  }

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1))
  }

  const handleDayClick = (day: Date) => {
    setSelectedDay(day)
    setOpenDialog(true)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  }

  // Generate days for the current month view
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Create calendar grid with proper day of week alignment
  const startDay = monthStart.getDay() // 0 = Sunday, 1 = Monday, etc.
  const calendarDays = []

  // Add empty cells for days before the start of the month
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null)
  }

  // Add the actual days of the month
  calendarDays.push(...daysInMonth)

  return (
    <Card className={compact ? "h-full" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center">
          <CreditCard className="mr-2 h-5 w-5" />
          Calendário de Recebimentos
        </CardTitle>
        <div className="flex items-center space-x-1">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="w-32 text-center font-medium">{format(currentMonth, "MMMM yyyy", { locale: ptBR })}</div>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day, i) => (
            <div key={i} className="text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            if (!day) {
              return <div key={`empty-${i}`} className="h-20 p-1 border rounded-md bg-gray-50 opacity-50"></div>
            }

            const salesOnDay = getSalesByDate(day)
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isCurrentDay = isToday(day)

            const totalAmount = salesOnDay.reduce((sum, sale) => sum + sale.netAmount, 0)
            const receivedAmount = salesOnDay
              .filter((sale) => paymentStatus[sale.id])
              .reduce((sum, sale) => sum + sale.netAmount, 0)

            const allReceived = salesOnDay.length > 0 && salesOnDay.every((sale) => paymentStatus[sale.id])
            const someReceived = salesOnDay.some((sale) => paymentStatus[sale.id])

            return (
              <div
                key={day.toString()}
                className={`h-20 p-1 border rounded-md overflow-hidden cursor-pointer transition-colors hover:bg-gray-50 ${
                  isCurrentDay ? "border-primary border-2" : ""
                } ${!isCurrentMonth ? "opacity-50" : ""}`}
                onClick={() => handleDayClick(day)}
              >
                <div className="flex justify-between items-start">
                  <div className={`text-sm font-medium ${isCurrentDay ? "text-primary" : ""}`}>{format(day, "d")}</div>
                  {salesOnDay.length > 0 && (
                    <div
                      className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                        allReceived
                          ? "bg-green-100 text-green-800"
                          : someReceived
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {salesOnDay.length}
                    </div>
                  )}
                </div>

                {salesOnDay.length > 0 && (
                  <div className="mt-1">
                    <div
                      className={`text-xs font-bold ${
                        allReceived ? "text-green-600" : someReceived ? "text-amber-600" : "text-red-600"
                      }`}
                    >
                      {formatCurrency(totalAmount)}
                    </div>
                    {allReceived && <Check className="h-3 w-3 text-green-600" />}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                Recebimentos para {selectedDay ? format(selectedDay, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : ""}
              </DialogTitle>
            </DialogHeader>
            {selectedDay && (
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-4 p-1">
                  {getSalesByDate(selectedDay).length === 0 ? (
                    <p className="text-center text-muted-foreground">Nenhum recebimento previsto para esta data.</p>
                  ) : (
                    getSalesByDate(selectedDay).map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">{getCardTypeName(sale.cardTypeId)}</div>
                          <div className="text-sm text-muted-foreground">
                            Venda: {format(parseISO(sale.date), "dd/MM/yyyy")}
                          </div>
                          <div className="text-sm font-semibold">{formatCurrency(sale.netAmount)}</div>
                        </div>
                        <Button
                          variant={paymentStatus[sale.id] ? "default" : "outline"}
                          size="sm"
                          className={paymentStatus[sale.id] ? "bg-green-600 hover:bg-green-700" : ""}
                          onClick={() => markPaymentReceived(sale.id, !paymentStatus[sale.id])}
                        >
                          {paymentStatus[sale.id] ? (
                            <>
                              <Check className="mr-1 h-4 w-4" />
                              Recebido
                            </>
                          ) : (
                            <>
                              <DollarSign className="mr-1 h-4 w-4" />
                              Marcar Recebido
                            </>
                          )}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
