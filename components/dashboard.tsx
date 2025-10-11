"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SalesCalendar } from "@/components/sales-calendar"
import { SalesCharts } from "@/components/sales-charts"
import { SalesTable } from "@/components/sales-table"
import { CardTypesTable } from "@/components/card-types-table"
import { MachinesTable } from "@/components/machines-table"
import type { CardType, Machine, Sale, PaymentStatus, MachineCardFee } from "@/lib/types"
import { generateMockData } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Download, Upload, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { format } from "date-fns"

export function Dashboard() {
  const [cardTypes, setCardTypes] = useState<CardType[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({})
  const [machineCardFees, setMachineCardFees] = useState<MachineCardFee[]>([])
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedCardTypes = localStorage.getItem("cardTypes")
    const savedMachines = localStorage.getItem("machines")
    const savedSales = localStorage.getItem("sales")
    const savedPaymentStatus = localStorage.getItem("paymentStatus")
    const savedMachineCardFees = localStorage.getItem("machineCardFees")

    if (savedCardTypes) {
      setCardTypes(JSON.parse(savedCardTypes))
    } else {
      const { cardTypes: mockCardTypes } = generateMockData()
      setCardTypes(mockCardTypes)
    }

    if (savedMachines) {
      setMachines(JSON.parse(savedMachines))
    } else {
      const { machines: mockMachines } = generateMockData()
      setMachines(mockMachines)
    }

    if (savedSales) {
      setSales(JSON.parse(savedSales))
    } else {
      const { sales: mockSales } = generateMockData()
      setSales(mockSales)
    }

    if (savedPaymentStatus) {
      setPaymentStatus(JSON.parse(savedPaymentStatus))
    }

    if (savedMachineCardFees) {
      setMachineCardFees(JSON.parse(savedMachineCardFees))
    } else {
      const { machineCardFees: mockMachineFees } = generateMockData()
      setMachineCardFees(mockMachineFees)
    }
  }, [])

  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("cardTypes", JSON.stringify(cardTypes))
    localStorage.setItem("machines", JSON.stringify(machines))
    localStorage.setItem("sales", JSON.stringify(sales))
    localStorage.setItem("paymentStatus", JSON.stringify(paymentStatus))
    localStorage.setItem("machineCardFees", JSON.stringify(machineCardFees))
  }, [cardTypes, machines, sales, paymentStatus, machineCardFees])

  const markPaymentReceived = (saleId: string, received: boolean) => {
    setPaymentStatus((prev) => ({
      ...prev,
      [saleId]: received,
    }))
  }

  const handleBackup = () => {
    const backupData = {
      cardTypes,
      machines,
      sales,
      paymentStatus,
      machineCardFees,
      exportDate: new Date().toISOString(),
    }

    const dataStr = JSON.stringify(backupData, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

    const exportFileDefaultName = `sistema-recebimentos-backup-${format(new Date(), "yyyy-MM-dd")}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const handleImport = () => {
    if (!importFile) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string
        const parsedData = JSON.parse(result)

        // Validate the imported data
        if (!parsedData.cardTypes || !parsedData.machines || !parsedData.sales) {
          setImportError("Arquivo de backup inválido. Formato incorreto.")
          return
        }

        setCardTypes(parsedData.cardTypes)
        setMachines(parsedData.machines)
        setSales(parsedData.sales)

        if (parsedData.paymentStatus) {
          setPaymentStatus(parsedData.paymentStatus)
        }

        if (parsedData.machineCardFees) {
          setMachineCardFees(parsedData.machineCardFees)
        }

        setImportFile(null)
        setImportError(null)
      } catch (error) {
        setImportError("Erro ao importar o arquivo. Verifique se é um JSON válido.")
      }
    }
    reader.readAsText(importFile)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0])
      setImportError(null)
    }
  }

  // Calculate total fees paid to operators monthly
  const calculateMonthlyFees = () => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const monthlyFees = sales
      .filter((sale) => {
        const saleDate = new Date(sale.date)
        return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear
      })
      .reduce((total, sale) => {
        return total + (sale.amount - sale.netAmount)
      }, 0)

    return monthlyFees
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Sistema de Conferência de Recebimentos</h1>

      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleBackup}>
            <Download className="mr-2 h-4 w-4" />
            Backup
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Importar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importar Backup</DialogTitle>
                <DialogDescription>Selecione um arquivo de backup para restaurar seus dados.</DialogDescription>
              </DialogHeader>

              {importError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{importError}</AlertDescription>
                </Alert>
              )}

              <Input type="file" accept=".json" onChange={handleFileChange} />

              <DialogFooter>
                <Button onClick={handleImport} disabled={!importFile}>
                  Importar Dados
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-800">
          <p className="font-semibold">Total em taxas este mês:</p>
          <p className="text-xl">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(calculateMonthlyFees())}
          </p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="cardTypes">Cartões</TabsTrigger>
          <TabsTrigger value="machines">Máquinas</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SalesCharts
              sales={sales}
              cardTypes={cardTypes}
              paymentStatus={paymentStatus}
              machineCardFees={machineCardFees}
            />
            <SalesCalendar
              sales={sales}
              cardTypes={cardTypes}
              paymentStatus={paymentStatus}
              markPaymentReceived={markPaymentReceived}
              compact={true}
            />
          </div>
        </TabsContent>

        <TabsContent value="sales">
          <SalesTable
            sales={sales}
            setSales={setSales}
            cardTypes={cardTypes}
            machines={machines}
            paymentStatus={paymentStatus}
            markPaymentReceived={markPaymentReceived}
            machineCardFees={machineCardFees}
          />
        </TabsContent>

        <TabsContent value="cardTypes">
          <CardTypesTable cardTypes={cardTypes} setCardTypes={setCardTypes} />
        </TabsContent>

        <TabsContent value="machines">
          <MachinesTable
            machines={machines}
            setMachines={setMachines}
            cardTypes={cardTypes}
            machineCardFees={machineCardFees}
            setMachineCardFees={setMachineCardFees}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
