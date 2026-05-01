"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface VarejoTopBottomProps {
  data: any[];
}

function parseBRNumber(value: string): number {
  if (!value) return 0;
  const str = String(value).trim().replace("R$", "").trim();
  const normalized = str.replace(/\./g, "").replace(",", ".");
  return parseFloat(normalized) || 0;
}

export function VarejoTopBottom({ data }: VarejoTopBottomProps) {
  const rankings = useMemo(() => {
    if (!data || data.length === 0) {
      return { top5: [], bottom5: [], spread: 0 };
    }

    // Sort by "Transações Recorrentes por mês"
    const sorted = [...data]
      .map((v) => ({
        name: v.Varejo || "N/A",
        transacoes: Number(v["Transações Recorrentes por mês"]) || 0,
      }))
      .sort((a, b) => b.transacoes - a.transacoes);

    const top5 = sorted.slice(0, 5);
    const bottom5 = sorted.slice(-5).reverse();
    
    const spread = top5.length > 0 && bottom5.length >= 5
      ? top5[0].transacoes / Math.max(bottom5[4]?.transacoes ?? 1, 1)
      : 0;

    return { top5, bottom5, spread };
  }, [data]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Top 5 */}
      <Card className="border-l-4 border-[#00C853] bg-[#E8F5E9]">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#1a1a1a] flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#00C853]" />
            Top 5 Varejos
          </CardTitle>
          <p className="text-xs text-[#64748b] font-normal mt-1">
            Por transações recorrentes/mês
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {rankings.top5.map((varejo, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-[#00C853]/20 last:border-0">
                <span className="text-sm font-medium text-[#1a1a1a]">
                  {idx + 1}. {varejo.name}
                </span>
                <span className="text-sm font-bold text-[#00C853]">
                  {varejo.transacoes.toLocaleString("pt-BR")}/mês
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bottom 5 */}
      <Card className="border-l-4 border-[#EF4444] bg-[#FEF2F2]">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-[#1a1a1a] flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-[#EF4444]" />
            Bottom 5 Varejos
          </CardTitle>
          <p className="text-xs text-[#64748b] font-normal mt-1">
            Por transações recorrentes/mês
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {rankings.bottom5.map((varejo, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-[#EF4444]/20 last:border-0">
                <span className="text-sm font-medium text-[#1a1a1a]">
                  {idx + 1}. {varejo.name}
                </span>
                <span className="text-sm font-bold text-[#EF4444]">
                  {varejo.transacoes.toLocaleString("pt-BR")}/mês
                </span>
              </div>
            ))}
          </div>
          {rankings.spread > 0 && (
            <div className="mt-4 pt-4 border-t border-[#EF4444]/20">
              <p className="text-xs text-[#64748b] text-center">
                Spread de <span className="font-bold text-[#EF4444]">{rankings.spread.toFixed(2)}x</span> entre o melhor e o pior varejo da rede.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
