-- ============================================================
-- Multra E.U. — Esquema MySQL 8.0+ (producción)
-- Para usar en lugar de SQLite cuando se requiera servidor MySQL.
-- Aplicar con:  mysql -u root -p < schema-mysql.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS multra
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE multra;

DROP TABLE IF EXISTS inspections;
DROP TABLE IF EXISTS pagos;
DROP TABLE IF EXISTS tramites;
DROP TABLE IF EXISTS citas;
DROP TABLE IF EXISTS polizas;
DROP TABLE IF EXISTS vehiculos;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS servicios;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(80) UNIQUE NOT NULL,
  passwordHash  VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'admin',
  name          VARCHAR(120),
  email         VARCHAR(160)
) ENGINE=InnoDB;

CREATE TABLE servicios (
  id            VARCHAR(40) PRIMARY KEY,
  nombre        VARCHAR(160) NOT NULL,
  tipo          ENUM('tecnomecanica','seguro','tramite','peritaje') NOT NULL,
  descripcion   TEXT,
  precio        DECIMAL(12,2) NOT NULL,
  duracionMin   INT DEFAULT 0,
  aplica        VARCHAR(80),
  fuente        VARCHAR(160)
) ENGINE=InnoDB;

CREATE TABLE clientes (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(160) NOT NULL,
  cedula        VARCHAR(20) UNIQUE NOT NULL,
  telefono      VARCHAR(40),
  email         VARCHAR(160),
  direccion     VARCHAR(255),
  createdAt     DATETIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE vehiculos (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  clienteId          INT NOT NULL,
  placa              VARCHAR(10) UNIQUE NOT NULL,
  marca              VARCHAR(80) NOT NULL,
  linea              VARCHAR(80),
  modelo             INT,
  color              VARCHAR(40),
  clase              VARCHAR(40),
  tipoVehiculo       ENUM('liviano','moto','pesado') DEFAULT 'liviano',
  cilindraje          INT,
  combustible        VARCHAR(40),
  kilometraje        INT DEFAULT 0,
  soatVence          DATE,
  tecnomecanicaVence DATE,
  createdAt          DATETIME NOT NULL,
  FOREIGN KEY (clienteId) REFERENCES clientes(id) ON DELETE CASCADE,
  INDEX idx_veh_cliente (clienteId)
) ENGINE=InnoDB;

CREATE TABLE polizas (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  vehiculoId    INT NOT NULL,
  clienteId     INT NOT NULL,
  tipo          ENUM('soat','todo_riesgo') NOT NULL,
  aseguradora   VARCHAR(80) NOT NULL,
  numero        VARCHAR(80),
  inicio        DATE NOT NULL,
  fin           DATE NOT NULL,
  prima         DECIMAL(12,2) NOT NULL,
  estado        VARCHAR(20) DEFAULT 'vigente',
  createdAt     DATETIME NOT NULL,
  FOREIGN KEY (vehiculoId) REFERENCES vehiculos(id) ON DELETE CASCADE,
  FOREIGN KEY (clienteId)  REFERENCES clientes(id)  ON DELETE CASCADE,
  INDEX idx_pol_veh (vehiculoId),
  INDEX idx_pol_fin (fin)
) ENGINE=InnoDB;

CREATE TABLE citas (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  vehiculoId    INT NOT NULL,
  clienteId     INT NOT NULL,
  servicioId    VARCHAR(40) NOT NULL,
  fecha         DATE NOT NULL,
  hora          TIME NOT NULL,
  estado        VARCHAR(20) DEFAULT 'agendada',
  tecnico       VARCHAR(120),
  obs           TEXT,
  createdAt     DATETIME NOT NULL,
  FOREIGN KEY (vehiculoId) REFERENCES vehiculos(id) ON DELETE CASCADE,
  FOREIGN KEY (clienteId)  REFERENCES clientes(id)  ON DELETE CASCADE,
  INDEX idx_cita_fecha (fecha)
) ENGINE=InnoDB;

CREATE TABLE tramites (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  clienteId     INT NOT NULL,
  vehiculoId    INT,
  tipo          VARCHAR(160) NOT NULL,
  descripcion   TEXT,
  documentos    JSON,
  gestor        VARCHAR(120),
  estado        VARCHAR(20) DEFAULT 'recibido',
  createdAt     DATETIME NOT NULL,
  FOREIGN KEY (clienteId)  REFERENCES clientes(id)  ON DELETE CASCADE,
  FOREIGN KEY (vehiculoId) REFERENCES vehiculos(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE pagos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  polizaId      INT,
  clienteId     INT NOT NULL,
  monto         DECIMAL(12,2) NOT NULL,
  metodo        VARCHAR(40) NOT NULL,
  ref           VARCHAR(120),
  fecha         DATE NOT NULL,
  estado        VARCHAR(20) DEFAULT 'pagado',
  FOREIGN KEY (polizaId)  REFERENCES polizas(id)  ON DELETE SET NULL,
  FOREIGN KEY (clienteId) REFERENCES clientes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE inspections (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  vehiculoId    INT NOT NULL,
  tecnico       VARCHAR(120),
  resultado     VARCHAR(20),
  okCount       INT DEFAULT 0,
  failCount     INT DEFAULT 0,
  naCount       INT DEFAULT 0,
  items         JSON,
  obs           TEXT,
  createdAt     DATETIME NOT NULL,
  FOREIGN KEY (vehiculoId) REFERENCES vehiculos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- Seed con precios reales Colombia 2026
-- (password del admin: 'Multra2026' — hash bcrypt)
-- ============================================================

INSERT INTO users (username, passwordHash, role, name, email) VALUES
  ('admin', '$2a$10$REEMPLAZAR_CON_HASH_BCRYPT', 'admin', 'Administrador', 'admin@multra.com.co');

INSERT INTO servicios (id,nombre,tipo,descripcion,precio,duracionMin,aplica,fuente) VALUES
  ('rtm_liv',         'Revisión Técnico-Mecánica Livianos',  'tecnomecanica', 'Inspección completa vehículos livianos particulares. Vigencia 1 año. Tarifa regulada MinTransporte.', 327700,  45, 'liviano',          'MinTransporte 2026'),
  ('rtm_moto',        'Revisión Técnico-Mecánica Motos',      'tecnomecanica', 'Inspección para motocicletas y motocarros. Vigencia 1 año. Tarifa regulada MinTransporte.',          227800,  30, 'moto',             'MinTransporte 2026'),
  ('rtm_pes',         'Revisión Técnico-Mecánica Pesados',    'tecnomecanica', 'Camiones, buses y vehículos de carga. Tarifa regulada MinTransporte.',                                519700,  60, 'pesado',           'MinTransporte 2026'),
  ('soat_auto_lt10',  'SOAT Automóvil (<10 años, <1500cc)',   'seguro',        'Tarifa máxima oficial Superfinanciera 2026.',                                                          445000,  15, 'liviano',          'SuperFinanciera 2026'),
  ('soat_auto_mid',   'SOAT Automóvil (1500-2500cc)',         'seguro',        'Vehículos entre 1500cc y 2500cc.',                                                                      544700,  15, 'liviano',          'SuperFinanciera 2026'),
  ('soat_auto_gt10',  'SOAT Automóvil (>10 años)',             'seguro',        'Vehículos con más de 10 años.',                                                                         590100,  15, 'liviano',          'SuperFinanciera 2026'),
  ('soat_moto_100',   'SOAT Moto (100-200cc)',                'seguro',        'Motos entre 100cc y 200cc.',                                                                             326300,  15, 'moto',             'SuperFinanciera 2026'),
  ('soat_moto_gt200', 'SOAT Moto (>200cc)',                   'seguro',        'Motos de más de 200cc.',                                                                                 757600,  15, 'moto',             'SuperFinanciera 2026'),
  ('tr_auto_basico',  'Seguro Todo Riesgo Auto (básico)',     'seguro',        'Cobertura amplia para vehículo ~$25M COP.',                                                             1500000, 30, 'liviano,pesado',  'Mercado 2026 (mediana)'),
  ('tr_auto_full',    'Seguro Todo Riesgo Auto (premium)',    'seguro',        'Cobertura amplia + deducible bajo. Sedán nuevo ~$60M.',                                                 2600000, 30, 'liviano,pesado',  'Mercado 2026 (mediana)'),
  ('traspaso_auto',   'Traspaso de Vehículo (carro)',         'tramite',       'Cambio de propietario. SDM Bogotá 2026.',                                                               260400,  0, 'liviano,pesado',  'SDM Bogotá 2026'),
  ('traspaso_moto',   'Traspaso de Vehículo (moto)',          'tramite',       'Cambio de propietario moto. SDM Bogotá 2026.',                                                          145500,  0, 'moto',             'SDM Bogotá 2026'),
  ('licencia_carro_nueva',  'Licencia de Conducción Carro (1ª vez)', 'tramite', 'Expedición por primera vez para automóviles. SDM Bogotá 2026.',                                     329800,  0, '',                 'SDM Bogotá 2026'),
  ('licencia_moto_nueva',   'Licencia de Conducción Moto (1ª vez)',  'tramite', 'Expedición por primera vez para motos. SDM Bogotá 2026.',                                            272700,  0, '',                 'SDM Bogotá 2026'),
  ('licencia_carro_renov',  'Renovación Licencia Carro',            'tramite', 'Renovación licencia automóviles. SDM Bogotá 2026.',                                                   151500,  0, '',                 'SDM Bogotá 2026'),
  ('licencia_moto_renov',   'Renovación Licencia Moto',             'tramite', 'Renovación licencia motos. SDM Bogotá 2026.',                                                         266400,  0, '',                 'SDM Bogotá 2026'),
  ('placas',          'Duplicado de Placas',                  'tramite',       'Reposición por pérdida o hurto.',                                                                       180000,  0, 'liviano,moto,pesado', 'referencia'),
  ('motor',           'Cambio de Motor / Carrocería',         'tramite',       'Registro ante RUNT.',                                                                                   410000,  0, 'liviano,moto,pesado', 'referencia'),
  ('peritaje',        'Peritaje vehicular',                   'peritaje',      'Inspección para seguros o accidentes.',                                                                 287500, 60, 'liviano,moto,pesado', 'Mercado 2026 (rango)'),
  ('gnvc',            'Conversión a GNV',                     'tramite',       'Instalación y registro de GNV.',                                                                        950000,  0, 'liviano',          'referencia');

-- ============================================================
-- Notas de migración SQLite → MySQL:
-- 1. Exportar SQLite:  sqlite3 data/multra.db .dump > dump.sql
-- 2. Reemplazar 'AUTOINCREMENT' → 'AUTO_INCREMENT'
-- 3. Reemplazar 'datetime' por columnas con DATETIME
-- 4. Cargar:  mysql -u root -p multra < dump.sql
-- 5. Generar hash bcrypt de la contraseña admin con Node:
--      node -e "console.log(require('bcryptjs').hashSync('Multra2026', 10))"
--    y reemplazar el placeholder arriba.
-- ============================================================
