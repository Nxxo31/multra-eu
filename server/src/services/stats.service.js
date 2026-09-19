import { todayISO } from '../utils/dates.js';
import { fmtCOP } from '../utils/money.js';

export class StatsService {
  constructor({ statsRepository }) {
    this.statsRepository = statsRepository;
  }

  async getDashboard() {
    const today = todayISO();
    const horizon = new Date(today);
    horizon.setDate(horizon.getDate() + 30);
    const yearMonth = today.slice(0, 7);

    let soatPorVencer = 0, tecPorVencer = 0, soatVencido = 0, tecVencida = 0;
    const vehs = await this.statsRepository.findVehiculosFechas();
    for (const v of vehs) {
      if (v.soatVence) {
        const d = new Date(v.soatVence);
        if (d < new Date(today)) soatVencido++;
        else if (d <= horizon) soatPorVencer++;
      }
      if (v.tecnomecanicaVence) {
        const d = new Date(v.tecnomecanicaVence);
        if (d < new Date(today)) tecVencida++;
        else if (d <= horizon) tecPorVencer++;
      }
    }

    const [
      clientes, vehiculos, polizasVigentes, citasHoy, tramitesActivos,
    ] = await Promise.all([
      this.statsRepository.countClientes(),
      this.statsRepository.countVehiculos(),
      this.statsRepository.countPolizasVigentes(today),
      this.statsRepository.countCitasHoy(today),
      this.statsRepository.countTramitesActivos(),
    ]);

    const ingresosMes = await this.statsRepository.ingresosMes(yearMonth);

    return {
      clientes, vehiculos, polizasVigentes, citasHoy, tramitesActivos,
      alertas: { soatPorVencer, tecPorVencer, soatVencido, tecVencida },
      ingresosMes,
      ingresosMesFmt: fmtCOP(ingresosMes),
    };
  }
}
