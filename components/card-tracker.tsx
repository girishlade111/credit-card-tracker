"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CardTypesTable } from "@/components/card-types-table"
import { MachinesTable } from "@/components/machines-table"
import { SalesTable } from "@/components/sales-table"
import type { CardType, Machine, Sale } from "@/lib/types"

export function CardTracker() {
  const [cardTypes, setCardTypes] = useState<CardType[]>([
    { id: "1", name: "Visa Crédito", fee: 3.5, days: 30 },
    { id: "2", name: "Visa Débito", fee: 1.5, days: 1 },
    { id: "3", name: "Master Crédito", fee: 4.0, days: 30 },
    { id: "4", name: "Master Débito", fee: 1.6, days: 1 },
  ])

  const [machines, setMachines] = useState<Machine[]>([
    { id: "1", name: "Moderninha" },
    { id: "2", name: "SumUp" },
    { id: "3", name: "Cielo" },
    { id: "4", name: "GetNet" },
  ])

  const [sales, setSales] = useState<Sale[]>([])

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedCardTypes = localStorage.getItem("cardTypes")
    const savedMachines = localStorage.getItem("machines")
    const savedSales = localStorage.getItem("sales")

    if (savedCardTypes) setCardTypes(JSON.parse(savedCardTypes))
    if (savedMachines) setMachines(JSON.parse(savedMachines))
    if (savedSales) setSales(JSON.parse(savedSales))
  }, [])

  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("cardTypes", JSON.stringify(cardTypes))
    localStorage.setItem("machines", JSON.stringify(machines))
    localStorage.setItem("sales", JSON.stringify(sales))
  }, [cardTypes, machines, sales])

  return (
    <Tabs defaultValue="sales" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-8">
        <TabsTrigger value="sales">Vendas</TabsTrigger>
        <TabsTrigger value="cardTypes">Cartões</TabsTrigger>
        <TabsTrigger value="machines">Máquinas</TabsTrigger>
      </TabsList>

      <TabsContent value="sales">
        <SalesTable sales={sales} setSales={setSales} cardTypes={cardTypes} machines={machines} />
      </TabsContent>

      <TabsContent value="cardTypes">
        <CardTypesTable cardTypes={cardTypes} setCardTypes={setCardTypes} />
      </TabsContent>

      <TabsContent value="machines">
        <MachinesTable machines={machines} setMachines={setMachines} />
      </TabsContent>
    </Tabs>
  )
}
