import { useMemo, useState } from "react";
import { Users, TrendingUp, Smartphone, ArrowUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/lib/data-context";
import { segmentarClientes, calculateSegmentMetrics, generateSegmentInsights } from "@/lib/segmentation";
import type { Segment, SegmentMetrics } from "@/lib/segmentation";

const SEGMENT_COLORS: Record<string, { bg: string; accent: string; text: string }> = {
  "high-value": { bg: "#F0F4F3", accent: "#00C853", text: "#001a0f" },
  "potencial-alto": { bg: "#FFF3E0", accent: "#FF9800", text: "#3E2723" },
  "aprovados-nao-ativados": { bg: "#E3F2FD", accent: "#2196F3", text: "#0D47A1" },
  "recorrentes-leves": { bg: "#F3E5F5", accent: "#9C27B0", text: "#4A148C" },
  "baixo-valor": { bg: "#FCE4EC", accent: "#E91E63", text: "#880E4F" },
  negados: { bg: "#FFEBEE", accent: "#F44336", text: "#B71C1C" },
};

export function SegmentacaoTab() {
  const { clientesData } = useData();
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);

  const { segments, metrics, insights } = useMemo(() => {
    const segs = segmentarClientes(clientesData);
    const mets = calculateSegmentMetrics(segs);
    const insi = generateSegmentInsights(mets);
    return { segments: segs, metrics: mets, insights: insi };
  }, [clientesData]);

  const selectedSegment = segments.find((s) => s.id === selectedSegmentId);

  if (!clientesData || clientesData.length === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#F7FAF8]">
        <Users className="mb-3 h-8 w-8 text-[#cbd5e1]" />
        <p className="text-base font-medium text-[#64748b]">
          Nenhum dado de clientes disponível
        </p>
        <p className="mt-1 text-sm text-[#94a3b8]">
          Carregue a Base de Clientes para visualizar a segmentação
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#1a1a1a]">Segmentação de Clientes</h2>
        <p className="mt-1 text-sm text-[#64748b]">
          Análise comportamental da base de clientes em {clientesData.length.toLocaleString("pt-BR")} registros
        </p>
      </div>

      {/* Insights Section */}
      {insights.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Insights Principais</h3>
          <div className="space-y-2">
            {insights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-3 rounded-lg border border-[#E2E8F0] bg-[#F7FAF8] p-3">
                <TrendingUp className="h-4 w-4 flex-shrink-0 text-[#00C853] mt-0.5" />
                <p className="text-sm text-[#64748b]">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Size Comparison Chart */}
      {metrics.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#1a1a1a]">Distribuição por Segmento</h3>
          <div className="space-y-2">
            {metrics.map((metric) => (
              <div
                key={metric.segmentId}
                className="cursor-pointer rounded-lg border border-[#E2E8F0] p-3 transition-colors hover:bg-[#F7FAF8]"
                onClick={() => setSelectedSegmentId(selectedSegmentId === metric.segmentId ? null : metric.segmentId)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#1a1a1a]">{metric.segmentName}</span>
                  <span className="text-xs font-semibold text-[#64748b]">
                    {metric.totalClientes.toLocaleString("pt-BR")} clientes
                  </span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${metric.percentageOfBase}%`,
                      backgroundColor: SEGMENT_COLORS[metric.segmentId]?.accent || "#00C853",
                    }}
                  />
                </div>
                <div className="mt-1 text-xs text-[#94a3b8]">
                  {metric.percentageOfBase.toFixed(1)}% da base total
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Segment Cards Grid */}
      <div>
        <h3 className="mb-4 text-sm font-semibold text-[#1a1a1a]">Detalhes dos Segmentos</h3>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => {
            const colors = SEGMENT_COLORS[metric.segmentId];
            const isSelected = selectedSegmentId === metric.segmentId;

            return (
              <Card
                key={metric.segmentId}
                className={`cursor-pointer border-2 transition-all ${
                  isSelected
                    ? "border-[#00C853] shadow-lg"
                    : "border-[#E2E8F0] hover:border-[#cbd5e1]"
                }`}
                style={{ backgroundColor: colors.bg }}
                onClick={() =>
                  setSelectedSegmentId(isSelected ? null : metric.segmentId)
                }
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base" style={{ color: colors.text }}>
                        {metric.segmentName}
                      </CardTitle>
                      <p className="mt-1 text-xs text-[#64748b]">
                        {metric.totalClientes.toLocaleString("pt-BR")} clientes
                      </p>
                    </div>
                    <div
                      className="inline-block rounded-full px-2 py-1 text-xs font-semibold"
                      style={{ backgroundColor: colors.accent, color: "white" }}
                    >
                      {metric.percentageOfBase.toFixed(1)}%
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {/* Key Metrics */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Compras médias:</span>
                      <span className="font-semibold text-[#1a1a1a]">
                        {metric.avgCompras.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Limite médio:</span>
                      <span className="font-semibold text-[#1a1a1a]">
                        R$ {metric.avgLimite.toLocaleString("pt-BR", {
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Score médio:</span>
                      <span className="font-semibold text-[#1a1a1a]">
                        {metric.avgScore.toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {/* Secondary Metrics */}
                  <div className="border-t border-[#cbd5e1] pt-2 space-y-2 text-xs text-[#64748b]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Smartphone className="h-3 w-3" />
                        Com app
                      </div>
                      <span className="font-semibold text-[#1a1a1a]">
                        {metric.percentageComApp.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <ArrowUp className="h-3 w-3" />
                        Aumento de limite
                      </div>
                      <span className="font-semibold text-[#1a1a1a]">
                        {metric.percentageComAumento.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Selected Segment Details */}
      {selectedSegment && (
        <Card className="border-[#00C853] bg-[#F0F4F3]">
          <CardHeader>
            <CardTitle className="text-[#001a0f]">
              Detalhes: {selectedSegment.name}
            </CardTitle>
            <p className="mt-1 text-sm text-[#64748b]">
              {selectedSegment.customers.length.toLocaleString("pt-BR")} clientes neste segmento
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[#64748b] italic">{selectedSegment.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
