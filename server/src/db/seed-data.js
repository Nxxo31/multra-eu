export const SERVICIOS_SEED = [
  { id: 'rtm_liv',  nombre: 'Revisión Técnico-Mecánica Livianos',  tipo: 'tecnomecanica', descripcion: 'Inspección completa vehículos livianos (autos, camionetas particulares). Vigencia 1 año. Tarifa regulada MinTransporte.', precio: 327700,  duracionMin: 45, aplica: 'liviano', fuente: 'MinTransporte 2026' },
  { id: 'rtm_moto', nombre: 'Revisión Técnico-Mecánica Motos',      tipo: 'tecnomecanica', descripcion: 'Inspección para motocicletas y motocarros. Vigencia 1 año.',                                                  precio: 227800,  duracionMin: 30, aplica: 'moto',    fuente: 'MinTransporte 2026' },
  { id: 'rtm_pes',  nombre: 'Revisión Técnico-Mecánica Pesados',    tipo: 'tecnomecanica', descripcion: 'Camiones, buses y vehículos de carga.',                                                                          precio: 519700,  duracionMin: 60, aplica: 'pesado',  fuente: 'MinTransporte 2026' },
  { id: 'soat_auto_lt10', nombre: 'SOAT Automóvil (<10 años, <1500cc)', tipo: 'seguro', descripcion: 'Póliza SOAT para vehículo particular menor a 10 años y 1500cc. Tarifa máxima oficial 2026.',         precio: 445000, duracionMin: 15, aplica: 'liviano',         fuente: 'SuperFinanciera 2026' },
  { id: 'soat_auto_mid',  nombre: 'SOAT Automóvil (1500-2500cc)',       tipo: 'seguro', descripcion: 'Póliza SOAT para vehículos entre 1500cc y 2500cc.',                                                             precio: 544700, duracionMin: 15, aplica: 'liviano',         fuente: 'SuperFinanciera 2026' },
  { id: 'soat_auto_gt10', nombre: 'SOAT Automóvil (>10 años)',           tipo: 'seguro', descripcion: 'SOAT para vehículos particulares con más de 10 años de antigüedad.',                                          precio: 590100, duracionMin: 15, aplica: 'liviano',         fuente: 'SuperFinanciera 2026' },
  { id: 'soat_moto_100',  nombre: 'SOAT Moto (100-200cc)',              tipo: 'seguro', descripcion: 'SOAT para motos entre 100cc y 200cc.',                                                                          precio: 326300, duracionMin: 15, aplica: 'moto',            fuente: 'SuperFinanciera 2026' },
  { id: 'soat_moto_gt200',nombre: 'SOAT Moto (>200cc)',                 tipo: 'seguro', descripcion: 'SOAT para motos de más de 200cc.',                                                                              precio: 757600, duracionMin: 15, aplica: 'moto',            fuente: 'SuperFinanciera 2026' },
  { id: 'tr_auto_basico', nombre: 'Seguro Todo Riesgo Auto (básico)',    tipo: 'seguro', descripcion: 'Cobertura amplia: daños, hurto, RC. Rango para vehículo de ~$25M COP.',                                       precio: 1500000, duracionMin: 30, aplica: 'liviano,pesado', fuente: 'Mercado 2026 (mediana)' },
  { id: 'tr_auto_full',   nombre: 'Seguro Todo Riesgo Auto (premium)',   tipo: 'seguro', descripcion: 'Cobertura amplia + deducible bajo + vehículo de reemplazo. Para sedán nuevo ~$60M.',                         precio: 2600000, duracionMin: 30, aplica: 'liviano,pesado', fuente: 'Mercado 2026 (mediana)' },
  { id: 'traspaso_auto', nombre: 'Traspaso de Vehículo (carro)',         tipo: 'tramite', descripcion: 'Cambio de propietario ante organismo de tránsito. Tarifa SDM Bogotá 2026 (no incluye retefuente ni SOAT).', precio: 260400, duracionMin: 0, aplica: 'liviano,pesado', fuente: 'SDM Bogotá 2026' },
  { id: 'traspaso_moto', nombre: 'Traspaso de Vehículo (moto)',          tipo: 'tramite', descripcion: 'Cambio de propietario de moto. Tarifa SDM Bogotá 2026.',                                                       precio: 145500, duracionMin: 0, aplica: 'moto',           fuente: 'SDM Bogotá 2026' },
  { id: 'licencia_carro_nueva',  nombre: 'Licencia de Conducción Carro (1ª vez)', tipo: 'tramite', descripcion: 'Expedición por primera vez para automóviles. Tarifa SDM Bogotá 2026.',                  precio: 329800, duracionMin: 0, aplica: '', fuente: 'SDM Bogotá 2026' },
  { id: 'licencia_moto_nueva',   nombre: 'Licencia de Conducción Moto (1ª vez)',  tipo: 'tramite', descripcion: 'Expedición por primera vez para motocicletas. Tarifa SDM Bogotá 2026.',                 precio: 272700, duracionMin: 0, aplica: '', fuente: 'SDM Bogotá 2026' },
  { id: 'licencia_carro_renov',  nombre: 'Renovación Licencia Carro',                tipo: 'tramite', descripcion: 'Renovación de licencia de conducción para automóviles.',                                  precio: 151500, duracionMin: 0, aplica: '', fuente: 'SDM Bogotá 2026' },
  { id: 'licencia_moto_renov',   nombre: 'Renovación Licencia Moto',                 tipo: 'tramite', descripcion: 'Renovación de licencia de conducción para motos.',                                       precio: 266400, duracionMin: 0, aplica: '', fuente: 'SDM Bogotá 2026' },
  { id: 'placas',   nombre: 'Duplicado de Placas',                     tipo: 'tramite', descripcion: 'Reposición por pérdida o hurto.',                                                            precio: 180000,  duracionMin: 0,  aplica: 'liviano,moto,pesado', fuente: 'referencia' },
  { id: 'motor',    nombre: 'Cambio de Motor / Carrocería',            tipo: 'tramite', descripcion: 'Registro de modificación ante RUNT.',                                                       precio: 410000,  duracionMin: 0,  aplica: 'liviano,moto,pesado', fuente: 'referencia' },
  { id: 'peritaje', nombre: 'Peritaje vehicular',                      tipo: 'peritaje', descripcion: 'Inspección para seguros o accidentes.',                                                    precio: 287500,  duracionMin: 60, aplica: 'liviano,moto,pesado', fuente: 'Mercado 2026 (rango)' },
  { id: 'gnvc',     nombre: 'Conversión a GNV',                        tipo: 'tramite', descripcion: 'Instalación y registro de gas natural vehicular.',                                          precio: 950000,  duracionMin: 0,  aplica: 'liviano',          fuente: 'referencia' }
];

export const buildClientesSeed = (nowSql) => [
  { nombre: 'Carlos Rodríguez', cedula: '1075123456', telefono: '3001234567', email: 'carlos@example.com', direccion: 'Calle 15 # 8-22, Neiva' },
  { nombre: 'Laura Martínez',  cedula: '1087654321', telefono: '3119876543', email: 'laura@example.com',  direccion: 'Carrera 7 # 30-15, Neiva' },
  { nombre: 'Andrés Pérez',    cedula: '1222333444', telefono: '3201112233', email: 'andres@example.com', direccion: 'Calle 8 # 12-40, Neiva' },
].map(c => ({ ...c, createdAt: nowSql }));

export const buildVehiculosSeed = (nowSql, d) => [
  { clienteId: 1, placa: 'ABC123', marca: 'Chevrolet', linea: 'Onix 1.4',     modelo: 2020, color: 'Blanco', clase: 'Automóvil',  tipoVehiculo: 'liviano', cilindraje: 1400, combustible: 'Gasolina', kilometraje: 52000, soatVence: d(-15),  tecnomecanicaVence: d(45),  createdAt: nowSql },
  { clienteId: 2, placa: 'XYZ789', marca: 'Yamaha',    linea: 'FZ 2.0',       modelo: 2022, color: 'Negro',  clase: 'Motocicleta',tipoVehiculo: 'moto',    cilindraje: 150,  combustible: 'Gasolina', kilometraje: 12500, soatVence: d(120),  tecnomecanicaVence: d(180), createdAt: nowSql },
  { clienteId: 3, placa: 'NVA045', marca: 'Renault',   linea: 'Duster 4x4',   modelo: 2019, color: 'Gris',   clase: 'Camioneta',  tipoVehiculo: 'liviano', cilindraje: 2000, combustible: 'Gasolina', kilometraje: 87000, soatVence: d(200),  tecnomecanicaVence: d(-5),  createdAt: nowSql },
];

export const buildPolizasSeed = (nowSql, d) => [
  { vehiculoId: 1, clienteId: 1, tipo: 'soat',        aseguradora: 'Sura',   numero: 'SOAT-2025-00123', inicio: d(-180), fin: d(185),  prima: 445000,  estado: 'vigente', createdAt: nowSql },
  { vehiculoId: 2, clienteId: 2, tipo: 'soat',        aseguradora: 'Mapfre', numero: 'SOAT-2025-00789', inicio: d(-90),  fin: d(275),  prima: 326300,  estado: 'vigente', createdAt: nowSql },
  { vehiculoId: 1, clienteId: 1, tipo: 'todo_riesgo', aseguradora: 'Sura',   numero: 'TR-2025-00456',   inicio: d(-60),  fin: d(305),  prima: 2600000, estado: 'vigente', createdAt: nowSql },
];

export const buildCitasSeed = (nowSql, d) => [
  { vehiculoId: 1, clienteId: 1, servicioId: 'rtm_liv', fecha: d(2),  hora: '09:00', estado: 'agendada',   tecnico: 'Por asignar', obs: 'Cliente solicita turno temprano.', createdAt: nowSql },
  { vehiculoId: 3, clienteId: 3, servicioId: 'rtm_liv', fecha: d(0),  hora: '14:30', estado: 'en proceso', tecnico: 'J. Vargas',   obs: '',                                  createdAt: nowSql },
];

export const buildTramitesSeed = (nowSql, d) => [
  { clienteId: 1, vehiculoId: 1, tipo: 'Traspaso de vehículo', descripcion: 'Traspaso a nombre de Carlos Rodríguez', documentos: JSON.stringify(['Cédula','SOAT vigente','T. propiedad anterior']), gestor: 'admin', estado: 'en proceso', createdAt: nowSql },
];

export const buildPagosSeed = (nowSql, d) => [
  { polizaId: 1, clienteId: 1, monto: 445000,  metodo: 'pse',    ref: 'PSE-998877', fecha: d(-180), estado: 'pagado' },
  { polizaId: 3, clienteId: 1, monto: 2600000, metodo: 'tarjeta',ref: 'TX-445566',  fecha: d(-60),  estado: 'pagado' },
];
