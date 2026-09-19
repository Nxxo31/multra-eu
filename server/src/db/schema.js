export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT UNIQUE NOT NULL,
  passwordHash  TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin',
  name          TEXT,
  email         TEXT,
  createdAt     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS servicios (
  id            TEXT PRIMARY KEY,
  nombre        TEXT NOT NULL,
  tipo          TEXT NOT NULL CHECK (tipo IN ('tecnomecanica','seguro','tramite','peritaje')),
  descripcion   TEXT,
  precio        REAL NOT NULL,
  duracionMin   INTEGER DEFAULT 0,
  aplica        TEXT,
  fuente        TEXT
);

CREATE TABLE IF NOT EXISTS clientes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre        TEXT NOT NULL,
  cedula        TEXT UNIQUE NOT NULL,
  telefono      TEXT,
  email         TEXT,
  direccion     TEXT,
  createdAt     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vehiculos (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  clienteId          INTEGER NOT NULL,
  placa              TEXT UNIQUE NOT NULL,
  marca              TEXT NOT NULL,
  linea              TEXT,
  modelo             INTEGER,
  color              TEXT,
  clase              TEXT,
  tipoVehiculo       TEXT DEFAULT 'liviano' CHECK (tipoVehiculo IN ('liviano','moto','pesado')),
  cilindraje         INTEGER DEFAULT 0,
  combustible        TEXT,
  kilometraje        INTEGER DEFAULT 0,
  soatVence          TEXT,
  tecnomecanicaVence TEXT,
  createdAt          TEXT NOT NULL,
  FOREIGN KEY (clienteId) REFERENCES clientes(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_veh_cliente ON vehiculos(clienteId);
CREATE INDEX IF NOT EXISTS idx_veh_placa   ON vehiculos(placa);

CREATE TABLE IF NOT EXISTS polizas (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  vehiculoId    INTEGER NOT NULL,
  clienteId     INTEGER NOT NULL,
  tipo          TEXT NOT NULL CHECK (tipo IN ('soat','todo_riesgo')),
  aseguradora   TEXT NOT NULL,
  numero        TEXT,
  inicio        TEXT NOT NULL,
  fin           TEXT NOT NULL,
  prima         REAL NOT NULL,
  estado        TEXT DEFAULT 'vigente',
  createdAt     TEXT NOT NULL,
  FOREIGN KEY (vehiculoId) REFERENCES vehiculos(id) ON DELETE CASCADE,
  FOREIGN KEY (clienteId)  REFERENCES clientes(id)  ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_pol_veh ON polizas(vehiculoId);
CREATE INDEX IF NOT EXISTS idx_pol_fin ON polizas(fin);

CREATE TABLE IF NOT EXISTS citas (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  vehiculoId    INTEGER NOT NULL,
  clienteId     INTEGER NOT NULL,
  servicioId    TEXT NOT NULL,
  fecha         TEXT NOT NULL,
  hora          TEXT NOT NULL,
  estado        TEXT DEFAULT 'agendada',
  tecnico       TEXT,
  obs           TEXT,
  createdAt     TEXT NOT NULL,
  FOREIGN KEY (vehiculoId) REFERENCES vehiculos(id) ON DELETE CASCADE,
  FOREIGN KEY (clienteId)  REFERENCES clientes(id)  ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_cita_fecha ON citas(fecha);

CREATE TABLE IF NOT EXISTS tramites (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  clienteId     INTEGER NOT NULL,
  vehiculoId    INTEGER,
  tipo          TEXT NOT NULL,
  descripcion   TEXT,
  documentos    TEXT,
  gestor        TEXT,
  estado        TEXT DEFAULT 'recibido',
  createdAt     TEXT NOT NULL,
  FOREIGN KEY (clienteId)  REFERENCES clientes(id)  ON DELETE CASCADE,
  FOREIGN KEY (vehiculoId) REFERENCES vehiculos(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS pagos (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  polizaId      INTEGER,
  clienteId     INTEGER NOT NULL,
  monto         REAL NOT NULL,
  metodo        TEXT NOT NULL,
  ref           TEXT,
  fecha         TEXT NOT NULL,
  estado        TEXT DEFAULT 'pagado',
  FOREIGN KEY (polizaId)  REFERENCES polizas(id)  ON DELETE SET NULL,
  FOREIGN KEY (clienteId) REFERENCES clientes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inspections (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  vehiculoId    INTEGER NOT NULL,
  tecnico       TEXT,
  resultado     TEXT,
  okCount       INTEGER DEFAULT 0,
  failCount     INTEGER DEFAULT 0,
  naCount       INTEGER DEFAULT 0,
  items         TEXT,
  obs           TEXT,
  createdAt     TEXT NOT NULL,
  FOREIGN KEY (vehiculoId) REFERENCES vehiculos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recordatorios (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  placa         TEXT NOT NULL,
  nombre        TEXT NOT NULL,
  cedula        TEXT NOT NULL,
  celular       TEXT NOT NULL,
  estado        TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','enviado','cancelado')),
  ip            TEXT,
  userAgent     TEXT,
  createdAt     TEXT NOT NULL,
  sentAt        TEXT
);
CREATE INDEX IF NOT EXISTS idx_rec_placa ON recordatorios(placa);
CREATE INDEX IF NOT EXISTS idx_rec_estado ON recordatorios(estado);
`;
