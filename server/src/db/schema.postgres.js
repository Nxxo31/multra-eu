export const SCHEMA_POSTGRES_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
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
  precio        NUMERIC(12,2) NOT NULL,
  duracionMin   INTEGER DEFAULT 0,
  aplica        TEXT,
  fuente        TEXT
);

CREATE TABLE IF NOT EXISTS clientes (
  id            SERIAL PRIMARY KEY,
  nombre        TEXT NOT NULL,
  cedula        TEXT UNIQUE NOT NULL,
  telefono      TEXT,
  email         TEXT,
  direccion     TEXT,
  createdAt     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vehiculos (
  id                 SERIAL PRIMARY KEY,
  clienteId          INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
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
  createdAt          TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_veh_cliente ON vehiculos(clienteId);
CREATE INDEX IF NOT EXISTS idx_veh_placa   ON vehiculos(placa);

CREATE TABLE IF NOT EXISTS polizas (
  id            SERIAL PRIMARY KEY,
  vehiculoId    INTEGER NOT NULL REFERENCES vehiculos(id) ON DELETE CASCADE,
  clienteId     INTEGER NOT NULL REFERENCES clientes(id)  ON DELETE CASCADE,
  tipo          TEXT NOT NULL CHECK (tipo IN ('soat','todo_riesgo')),
  aseguradora   TEXT NOT NULL,
  numero        TEXT,
  inicio        TEXT NOT NULL,
  fin           TEXT NOT NULL,
  prima         NUMERIC(12,2) NOT NULL,
  estado        TEXT DEFAULT 'vigente',
  createdAt     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pol_veh ON polizas(vehiculoId);
CREATE INDEX IF NOT EXISTS idx_pol_fin ON polizas(fin);

CREATE TABLE IF NOT EXISTS citas (
  id            SERIAL PRIMARY KEY,
  vehiculoId    INTEGER NOT NULL REFERENCES vehiculos(id) ON DELETE CASCADE,
  clienteId     INTEGER NOT NULL REFERENCES clientes(id)  ON DELETE CASCADE,
  servicioId    TEXT NOT NULL,
  fecha         TEXT NOT NULL,
  hora          TEXT NOT NULL,
  estado        TEXT DEFAULT 'agendada',
  tecnico       TEXT,
  obs           TEXT,
  createdAt     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cita_fecha ON citas(fecha);

CREATE TABLE IF NOT EXISTS tramites (
  id            SERIAL PRIMARY KEY,
  clienteId     INTEGER NOT NULL REFERENCES clientes(id)  ON DELETE CASCADE,
  vehiculoId    INTEGER REFERENCES vehiculos(id) ON DELETE SET NULL,
  tipo          TEXT NOT NULL,
  descripcion   TEXT,
  documentos    TEXT,
  gestor        TEXT,
  estado        TEXT DEFAULT 'recibido',
  createdAt     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pagos (
  id            SERIAL PRIMARY KEY,
  polizaId      INTEGER REFERENCES polizas(id)  ON DELETE SET NULL,
  clienteId     INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  monto         NUMERIC(12,2) NOT NULL,
  metodo        TEXT NOT NULL,
  ref           TEXT,
  fecha         TEXT NOT NULL,
  estado        TEXT DEFAULT 'pagado'
);

CREATE TABLE IF NOT EXISTS inspections (
  id            SERIAL PRIMARY KEY,
  vehiculoId    INTEGER NOT NULL REFERENCES vehiculos(id) ON DELETE CASCADE,
  tecnico       TEXT,
  resultado     TEXT,
  okCount       INTEGER DEFAULT 0,
  failCount     INTEGER DEFAULT 0,
  naCount       INTEGER DEFAULT 0,
  items         TEXT,
  obs           TEXT,
  createdAt     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS recordatorios (
  id            SERIAL PRIMARY KEY,
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