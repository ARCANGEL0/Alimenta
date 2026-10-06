export type IndicadoresDashboard = {
  stockDisponivel: number;
  entradasPeriodo: number;
  saidasPeriodo: number;
  descartesPeriodo: number;
  lotesVencidos: number;
  lotesCriticos: number;
  stockPorUnidade: Array<{ unidade: string; quantidade: number }>;
  entradasVsSaidas: Array<{
    periodo: string;
    entradas: number;
    saidas: number;
  }>;
  alertasValidade: Array<{
    lote: string;
    produto: string | null;
    estado: 'vencido' | 'critico' | 'atencao';
    dias: number | null;
  }>;
};
