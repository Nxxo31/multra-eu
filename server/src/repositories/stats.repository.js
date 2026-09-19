import { BaseRepository } from './base.repository.js';

export class StatsRepository extends BaseRepository {
  async countClientes() {
    return (await this.getOne('SELECT COUNT(*) AS c FROM clientes')).c;
  }

  async countVehiculos() {
    return (await this.getOne('SELECT COUNT(*) AS c FROM vehiculos')).c;
  }

  async countPolizasVigentes(today) {
    return (await this.getOne('SELECT COUNT(*) AS c FROM polizas WHERE fin >= ?', [today])).c;
  }

  async countCitasHoy(today) {
    return (await this.getOne('SELECT COUNT(*) AS c FROM citas WHERE fecha = ?', [today])).c;
  }

  async countTramitesActivos() {
    return (
      await this.getOne(
        "SELECT COUNT(*) AS c FROM tramites WHERE estado NOT IN ('finalizado','rechazado')"
      )
    ).c;
  }

  async ingresosMes(yearMonth) {
    const rows = await this.query(
      "SELECT monto FROM pagos WHERE strftime('%Y-%m', fecha) = ?",
      [yearMonth]
    );
    return rows.reduce((a, p) => a + Number(p.monto || 0), 0);
  }

  async findVehiculosFechas() {
    return this.query('SELECT soatVence, tecnomecanicaVence FROM vehiculos');
  }
}
