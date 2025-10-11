export interface CardType {
  id: string
  name: string
  fee: number
  days: number
}

export interface Machine {
  id: string
  name: string
}

export interface Sale {
  id: string
  date: string
  amount: number
  cardTypeId: string
  machineId: string
  fee: number
  netAmount: number
  expectedDate: string
}

export interface PaymentStatus {
  [key: string]: boolean
}

export interface MachineCardFee {
  id: string
  machineId: string
  cardTypeId: string
  fee: number
}
