export type IndicadorStock = {
  unidade: string;
  quantidade: number;
};

export type IndicadorPeriodo = {
  periodo: string;
  entradas: number;
  saidas: number;
};

export type AlertaValidade = {
  lote: string;
  produto: string | null;
  estado: 'vencido' | 'critico' | 'atencao';
  dias: number | null;
};

export type IndicadoresDashboard = {
  stockDisponivel: number;
  entradasPeriodo: number;
  saidasPeriodo: number;
  descartesPeriodo: number;
  lotesVencidos: number;
  lotesCriticos: number;
  stockPorUnidade: IndicadorStock[];
  entradasVsSaidas: IndicadorPeriodo[];
  alertasValidade: AlertaValidade[];
};
