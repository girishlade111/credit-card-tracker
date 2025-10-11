"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pencil, Trash2, Plus, Save, X, CreditCard } from "lucide-react"
import type { CardType } from "@/lib/types"

interface CardTypesTableProps {
  cardTypes: CardType[]
  setCardTypes: React.Dispatch<React.SetStateAction<CardType[]>>
}

export function CardTypesTable({ cardTypes, setCardTypes }: CardTypesTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newCardType, setNewCardType] = useState<Partial<CardType>>({})
  const [isAdding, setIsAdding] = useState(false)

  const handleEdit = (id: string) => {
    setEditingId(id)
  }

  const handleSave = (id: string) => {
    setCardTypes(cardTypes.map((card) => (card.id === id ? { ...card, ...newCardType } : card)))
    setEditingId(null)
    setNewCardType({})
  }

  const handleDelete = (id: string) => {
    setCardTypes(cardTypes.filter((card) => card.id !== id))
  }

  const handleAdd = () => {
    if (newCardType.name && newCardType.fee !== undefined && newCardType.days !== undefined) {
      const newCard: CardType = {
        id: Date.now().toString(),
        name: newCardType.name,
        fee: newCardType.fee,
        days: newCardType.days,
      }

      setCardTypes([...cardTypes, newCard])
      setIsAdding(false)
      setNewCardType({})
    }
  }

  const handleChange = (id: string, field: keyof CardType, value: string | number) => {
    if (id === "new") {
      setNewCardType({
        ...newCardType,
        [field]: field === "name" ? value : Number(value),
      })
    } else {
      setNewCardType({
        ...newCardType,
        [field]: field === "name" ? value : Number(value),
      })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <CreditCard className="mr-2 h-5 w-5" />
          Tipos de Cartão
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
              <TableHead>Cartão</TableHead>
              <TableHead>Taxa (%)</TableHead>
              <TableHead>Prazo Recebimento (dias)</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isAdding && (
              <TableRow>
                <TableCell>
                  <Input
                    value={newCardType.name || ""}
                    onChange={(e) => handleChange("new", "name", e.target.value)}
                    placeholder="Nome do cartão"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    value={newCardType.fee || ""}
                    onChange={(e) => handleChange("new", "fee", e.target.value)}
                    placeholder="Taxa"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={newCardType.days || ""}
                    onChange={(e) => handleChange("new", "days", e.target.value)}
                    placeholder="Dias"
                  />
                </TableCell>
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

            {cardTypes.map((card) => (
              <TableRow key={card.id}>
                <TableCell>
                  {editingId === card.id ? (
                    <Input
                      value={newCardType.name !== undefined ? newCardType.name : card.name}
                      onChange={(e) => handleChange(card.id, "name", e.target.value)}
                    />
                  ) : (
                    card.name
                  )}
                </TableCell>
                <TableCell>
                  {editingId === card.id ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={newCardType.fee !== undefined ? newCardType.fee : card.fee}
                      onChange={(e) => handleChange(card.id, "fee", e.target.value)}
                    />
                  ) : (
                    card.fee.toFixed(2)
                  )}
                </TableCell>
                <TableCell>
                  {editingId === card.id ? (
                    <Input
                      type="number"
                      value={newCardType.days !== undefined ? newCardType.days : card.days}
                      onChange={(e) => handleChange(card.id, "days", e.target.value)}
                    />
                  ) : (
                    card.days
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {editingId === card.id ? (
                      <Button size="icon" variant="ghost" onClick={() => handleSave(card.id)}>
                        <Save className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(card.id)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(card.id)}>
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
  )
}
