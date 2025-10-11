import type { CardType, Machine, Sale } from "@/lib/types"
import { format, addDays, subDays } from "date-fns"
import { adjustToBusinessDay } from "@/lib/utils"

interface MachineCardFee {
  id: string
  machineId: string
  cardTypeId: string
  fee: number
}

export function generateMockData() {
  // Card types
  const cardTypes: CardType[] = [
    { id: "1", name: "Visa Crédito", fee: 3.5, days: 30 },
    { id: "2", name: "Visa Débito", fee: 1.5, days: 1 },
    { id: "3", name: "Master Crédito", fee: 4.0, days: 30 },
    { id: "4", name: "Master Débito", fee: 1.6, days: 1 },
  ]

  // Machines
  const machines: Machine[] = [
    { id: "1", name: "Moderninha" },
    { id: "2", name: "SumUp" },
    { id: "3", name: "Cielo" },
    { id: "4", name: "GetNet" },
  ]

  // Machine-specific card fees
  const machineCardFees: MachineCardFee[] = [
    { id: "1-1", machineId: "1", cardTypeId: "1", fee: 3.2 },
    { id: "1-2", machineId: "1", cardTypeId: "2", fee: 1.3 },
    { id: "2-1", machineId: "2", cardTypeId: "1", fee: 3.7 },
    { id: "2-3", machineId: "2", cardTypeId: "3", fee: 4.2 },
  ]

  // Generate sales for the last 90 days
  const sales: Sale[] = []
  const today = new Date()

  for (let i = 0; i < 30; i++) {
    const saleDate = format(subDays(today, Math.floor(Math.random() * 90)), "yyyy-MM-dd")
    const cardType = cardTypes[Math.floor(Math.random() * cardTypes.length)]
    const machine = machines[Math.floor(Math.random() * machines.length)]
    const amount = Math.floor(Math.random() * 1000) + 50

    // Check if there's a machine-specific fee
    const machineFee = machineCardFees.find((fee) => fee.machineId === machine.id && fee.cardTypeId === cardType.id)

    const fee = machineFee ? machineFee.fee : cardType.fee
    const netAmount = amount - (amount * fee) / 100

    // Calcular a data esperada e ajustar para dia útil
    const rawExpectedDate = addDays(new Date(saleDate), cardType.days)
    const adjustedExpectedDate = adjustToBusinessDay(rawExpectedDate)
    const expectedDate = format(adjustedExpectedDate, "yyyy-MM-dd")

    sales.push({
      id: `sale-${i + 1}`,
      date: saleDate,
      amount,
      cardTypeId: cardType.id,
      machineId: machine.id,
      fee,
      netAmount,
      expectedDate,
    })
  }

  return { cardTypes, machines, sales, machineCardFees }
}
