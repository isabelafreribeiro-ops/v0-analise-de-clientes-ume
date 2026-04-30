import type { AggregationResult } from "./aggregation-worker";

export interface ClienteRow {
  Nome: string;
  Idade: number;
  Sexo: string;
  "Data de Entrada na Ume": string;
  "Qtd de Compras": number;
  "Limite Disponível": number;
  "Limite Total": number;
  "Já teve Aumento de limite?": string;
  "Data da Última Compra": string;
  "Qtd de Varejos que já comprou": number;
  Situação: string;
  "Tem App?": string;
  "N. Médio de Parcelas": number;
  "Taxa de Juros Média (ao mês)": number;
  "Score de Crédito": number;
}

export interface VarejoRow {
  Varejo: string;
  Segmento: string;
  Lojas: number;
  "Mês de Entrada": string;
  "Transações Recorrentes por mês": number;
  "Vendas Recorrentes por mês": number;
  "Transações de Conversões por mês": number;
  "Vendas de Conversões por mês": number;
  "Originação Total": number;
}

export interface FunnelStep {
  name: string;
  value: number;
  percentage: number;
  dropoffRate: number;
}

export interface DataContextType {
  clientesData: ClienteRow[];
  varejoData: VarejoRow[];
  aggregationResult: AggregationResult | null;
  setClientesData: (data: ClienteRow[]) => void;
  setVarejoData: (data: VarejoRow[]) => void;
  setAggregationResult: (result: AggregationResult) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}
