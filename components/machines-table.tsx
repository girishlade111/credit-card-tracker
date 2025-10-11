"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pencil, Trash2, Plus, Save, X, Cpu, Settings } from "lucide-react"
import type { Machine, CardType, MachineCardFee } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface MachinesTableProps {
  machines: Machine[]
  setMachines: React.Dispatch<React.SetStateAction<Machine[]>>
  cardTypes: CardType[]
  machineCardFees: MachineCardFee[]
  setMachineCardFees: React.Dispatch<React.SetStateAction<MachineCardFee[]>>
}

export function MachinesTable({
  machines,
  setMachines,
  cardTypes,
  machineCardFees,
  setMachineCardFees,
}: MachinesTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newMachineName, setNewMachineName] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null)
  const [editingFees, setEditingFees] = useState<Record<string, number>>({})

  const handleEdit = (id: string) => {
    setEditingId(id)
    const machine = machines.find((m) => m.id === id)
    if (machine) {
      setNewMachineName(machine.name)
    }
  }

  const handleSave = (id: string) => {
    setMachines(machines.map((machine) => (machine.id === id ? { ...machine, name: newMachineName } : machine)))
    setEditingId(null)
    setNewMachineName("")
  }

  const handleDelete = (id: string) => {
    setMachines(machines.filter((machine) => machine.id !== id))
    // Also delete any associated machine card fees
    setMachineCardFees(machineCardFees.filter((fee) => fee.machineId !== id))
  }

  const handleAdd = () => {
    if (newMachineName.trim()) {
      const newMachine: Machine = {
        id: Date.now().toString(),
        name: newMachineName,
      }

      setMachines([...machines, newMachine])
      setIsAdding(false)
      setNewMachineName("")
    }
  }

  const openMachineFees = (machine: Machine) => {
    setSelectedMachine(machine)

    // Initialize editing fees with current values
    const currentFees: Record<string, number> = {}
    cardTypes.forEach((cardType) => {
      const existingFee = machineCardFees.find((fee) => fee.machineId === machine.id && fee.cardTypeId === cardType.id)
      currentFees[cardType.id] = existingFee ? existingFee.fee : cardType.fee
    })

    setEditingFees(currentFees)
  }

  const handleFeeChange = (cardTypeId: string, value: string) => {
    setEditingFees((prev) => ({
      ...prev,
      [cardTypeId]: Number.parseFloat(value) || 0,
    }))
  }

  const saveMachineFees = () => {
    if (!selectedMachine) return

    // Remove existing fees for this machine
    const filteredFees = machineCardFees.filter((fee) => fee.machineId !== selectedMachine.id)

    // Add updated fees
    const newFees = Object.entries(editingFees).map(([cardTypeId, fee]) => ({
      id: `${selectedMachine.id}-${cardTypeId}`,
      machineId: selectedMachine.id,
      cardTypeId,
      fee,
    }))

    setMachineCardFees([...filteredFees, ...newFees])
    setSelectedMachine(null)
  }

  const getMachineFee = (machineId: string, cardTypeId: string): number => {
    const machineFee = machineCardFees.find((fee) => fee.machineId === machineId && fee.cardTypeId === cardTypeId)

    if (machineFee) {
      return machineFee.fee
    }

    // Return default card type fee if no machine-specific fee is set
    const cardType = cardTypes.find((card) => card.id === cardTypeId)
    return cardType ? cardType.fee : 0
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <Cpu className="mr-2 h-5 w-5" />
            Máquinas
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setIsAdding(true)} disabled={isAdding}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome da Máquina</TableHead>
                <TableHead className="text-right">Taxas</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isAdding && (
                <TableRow>
                  <TableCell>
                    <Input
                      value={newMachineName}
                      onChange={(e) => setNewMachineName(e.target.value)}
                      placeholder="Nome da máquina"
                    />
                  </TableCell>
                  <TableCell></TableCell>
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

              {machines.map((machine) => (
                <TableRow key={machine.id}>
                  <TableCell>
                    {editingId === machine.id ? (
                      <Input value={newMachineName} onChange={(e) => setNewMachineName(e.target.value)} />
                    ) : (
                      machine.name
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openMachineFees(machine)}>
                      <Settings className="h-4 w-4 mr-1" />
                      Configurar Taxas
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {editingId === machine.id ? (
                        <Button size="icon" variant="ghost" onClick={() => handleSave(machine.id)}>
                          <Save className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(machine.id)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(machine.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Machine Fees Dialog */}
      <Dialog open={!!selectedMachine} onOpenChange={(open) => !open && setSelectedMachine(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Configurar Taxas para {selectedMachine?.name}</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo de Cartão</TableHead>
                  <TableHead>Taxa Padrão (%)</TableHead>
                  <TableHead>Taxa Específica (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cardTypes.map((cardType) => (
                  <TableRow key={cardType.id}>
                    <TableCell>{cardType.name}</TableCell>
                    <TableCell>{cardType.fee.toFixed(2)}%</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={editingFees[cardType.id] || ""}
                        onChange={(e) => handleFeeChange(cardType.id, e.target.value)}
                        placeholder={`Taxa para ${cardType.name}`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button onClick={saveMachineFees}>Salvar Taxas</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Machine Fees Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Visão Geral das Taxas por Máquina</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={machines[0]?.id || ""}>
            <TabsList className="mb-4">
              {machines.map((machine) => (
                <TabsTrigger key={machine.id} value={machine.id}>
                  {machine.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {machines.map((machine) => (
              <TabsContent key={machine.id} value={machine.id}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo de Cartão</TableHead>
                      <TableHead>Taxa (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cardTypes.map((cardType) => (
                      <TableRow key={cardType.id}>
                        <TableCell>{cardType.name}</TableCell>
                        <TableCell>{getMachineFee(machine.id, cardType.id).toFixed(2)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
