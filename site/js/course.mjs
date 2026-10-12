export const lessons = [
  {
    id: "teoria-1",
    number: 1,
    type: "teoria",
    hours: 2,
    title: "Conociendo nuestra Huella",
    short: "Nuestra huella",
    color: "lime",
    objective:
      "Comprender el ciclo de los residuos y aprender a medir nuestra generación para tomar conciencia.",
    topics: [
      "Introducción a la Gestión Integral de Residuos Sólidos (GIRS).",
      "Auditoría de basura familiar y caracterización de residuos.",
      "Cálculo de la generación per cápita estimada.",
    ],
    agenda: [
      ["30 min", "Rompehielo y El Viaje de la Basura"],
      ["45 min", "¿Qué es la caracterización de residuos?"],
      ["30 min", "Presentación de la Auditoría de Basura Familiar"],
      ["15 min", "Preguntas, dudas y cierre"],
    ],
    source:
      "ECO-VECINOS.pdf, página 1; Detallado Teorico ECOVecinos.pdf, página 1.",
  },
  {
    id: "teoria-2",
    number: 2,
    type: "teoria",
    hours: 2,
    title: "El Oro Verde de la Urbanización",
    short: "El oro verde",
    color: "green",
    objective:
      "Transformar la percepción de las hojas secas y restos de cocina: de basura a recurso fértil.",
    topics: [
      "El ciclo de la materia orgánica.",
      "Manejo de hojas secas, pasto y material de poda.",
      "Relación Carbono/Nitrógeno, compostaje doméstico y comunitario.",
      "Lombricompostaje y compostera de patio.",
    ],
    agenda: [
      ["30 min", "El problema de la materia orgánica"],
      ["45 min", "La receta del compost"],
      ["30 min", "Tecnologías de compostaje para la urbanización"],
      ["15 min", "Solución de problemas"],
    ],
    source:
      "ECO-VECINOS.pdf, página 1; Detallado Teorico ECOVecinos.pdf, páginas 1–2.",
  },
  {
    id: "teoria-3",
    number: 3,
    type: "teoria",
    hours: 2,
    title: "Plásticos, Textiles y Calzado en la Economía Circular",
    short: "Segunda vida",
    color: "orange",
    objective:
      "Identificar el valor de los reciclables secos y las rutas específicas para ropa y zapatos.",
    topics: [
      "Identificación de plásticos: códigos de resina del 1 al 7.",
      "Donación, reutilización creativa y puntos de acopio para ropa y zapatos.",
      "Mitos y realidades del reciclaje.",
    ],
    agenda: [
      ["40 min", "El universo de los plásticos"],
      ["40 min", "La ruta de la moda circular"],
      ["25 min", "Mapeo de rutas locales"],
      ["15 min", "Quiz interactivo"],
    ],
    source:
      "ECO-VECINOS.pdf, página 1; Detallado Teorico ECOVecinos.pdf, páginas 2–3.",
  },
  {
    id: "teoria-4",
    number: 4,
    type: "teoria",
    hours: 2,
    title: "Residuos Peligrosos en el Hogar: ¡Alerta y Acción!",
    short: "Hogar seguro",
    color: "blue",
    objective:
      "Identificar y manejar de forma segura los residuos peligrosos domésticos y sus rutas de disposición.",
    topics: [
      "Limpiadores, pesticidas, pilas, bombillos, aceites y medicamentos vencidos.",
      "Lectura de los pictogramas de peligro en las etiquetas.",
      "Almacenamiento seguro temporal y disposición final especial.",
    ],
    agenda: [
      ["40 min", "Los inquilinos peligrosos de nuestra casa"],
      ["40 min", "Lectura de etiquetas y pictogramas"],
      ["25 min", "Almacenamiento y rutas de disposición"],
      ["15 min", "Cierre del componente teórico"],
    ],
    source:
      "ECO-VECINOS.pdf, página 1; Detallado Teorico ECOVecinos.pdf, página 3.",
  },
  {
    id: "taller-1",
    number: 1,
    type: "taller",
    hours: 3,
    title: "La Verdad en la Bolsa",
    short: "Caracterización comunitaria",
    color: "lime",
    objective:
      "Crear el Perfil de Residuos de la Urbanización a partir de una caracterización comunitaria.",
    topics: [
      "Caracterización de una muestra representativa con equipos de protección.",
      "Clasificación de orgánicos, reciclables secos, textiles, peligrosos y no aprovechables.",
      "Pesaje por categorías y análisis de porcentajes.",
      "Ficha de auditoría y plan de acción familiar.",
    ],
    materials:
      "Balanza, guantes, mascarilla, pinzas, bolsas o cajas, cuaderno y lona.",
    source:
      "ECO-VECINOS.pdf, página 2; Taller 1 LaVerdadEnTuBolsa.pdf; Ficha-Taller1 LaVerdadEnTuBolsa.pdf.",
  },
  {
    id: "taller-2",
    number: 2,
    type: "taller",
    hours: 3,
    title: "Manos a la Tierra",
    short: "Compostaje en acción",
    color: "green",
    objective:
      "Construir una compostera y establecer un protocolo de mantenimiento comunitario.",
    topics: [
      "Construcción colectiva de una compostera o demostración en casas piloto.",
      "Triturado de material de poda y hojas secas.",
      "Armado de la pila con materiales verdes y marrones.",
      "Volteo, humedad, temperatura y calendario de mantenimiento.",
    ],
    materials:
      "Palets o malla, estacas, herramientas, hojas secas, restos vegetales, agua y guantes.",
    source: "ECO-VECINOS.pdf, página 2; Taller 2 Manos a la Tierra.pdf.",
  },
  {
    id: "taller-3",
    number: 3,
    type: "taller",
    hours: 3,
    title: "Laboratorio de Materiales",
    short: "Plásticos, textiles y segunda vida",
    color: "orange",
    objective:
      "Preparar los plásticos para el reciclaje y establecer rutas para ropa y calzado en desuso.",
    topics: [
      "Estación de lavado y clasificación de plásticos.",
      "Feria de Segunda Vida: donación, reutilización y reciclaje industrial.",
      "Mini-taller de reutilización: bolsa de mercado a partir de una camiseta.",
      "Mapeo de rutas reales de aprovechamiento.",
    ],
    materials:
      "Envases limpios, ropa o zapatos en desuso, cajas, agua, jabón, tijeras y mapa.",
    source: "ECO-VECINOS.pdf, página 2; Taller3 Laboratorio de Materiales.pdf.",
  },
  {
    id: "taller-4",
    number: 4,
    type: "taller",
    hours: 3,
    title: "Escuadrón de Seguridad",
    short: "RESPEL y plan de acción",
    color: "blue",
    objective:
      "Identificar los residuos peligrosos y cocrear el Plan de Gestión de Residuos de la Urbanización.",
    topics: [
      "Caza de peligros con envases vacíos o imágenes.",
      "Identificación de pictogramas y almacenamiento seguro.",
      "Acuerdos para recolección, compostaje y rutas seguras.",
      "Directorio, mapa de rutas y Pacto de Hogar.",
    ],
    materials:
      "Imágenes o envases seguros, tarjetas de pictogramas, cajas, papelógrafos y marcadores.",
    source:
      "ECO-VECINOS.pdf, página 2; Taller 4 Escuadrón de Seguridad.pdf; DirectorioGestionResiduos.pdf; Mapa de rutas.pdf.",
  },
];
export const defaultSettings = {
  id: 1,
  course_dates: "",
  course_place: "",
  privacy_controller: "Jose Gonzalez",
  privacy_contact: "josegonzalezm@correo.itm.edu.co",
  privacy_address:
    "Calle 73 # 76A - 354, Bloque i, Piso 2, Departamento de Ciencias Ambientales y de la Construcción",
  privacy_phone: "6044405100 ext 5807",
  privacy_retention:
    "Cuentas no verificadas: 30 días desde la solicitud. Cuentas verificadas: durante el curso y hasta 12 meses tras la última sesión. Después, supresión de datos identificables salvo obligación legal documentada o reclamo pendiente. Revisión manual mensual; no hay borrado automático activado.",
  privacy_procedure:
    "Solicitudes a josegonzalezm@correo.itm.edu.co para consulta, corrección, revocación o supresión, verificando al titular con los datos mínimos. Consultas: 10 días hábiles, prorrogables hasta 5 más con aviso. Reclamos: 15 días hábiles desde el día siguiente a la recepción, prorrogables hasta 8 más con aviso. Registrar y resolver conforme a los artículos 14 y 15 de la Ley 1581 de 2012.",
  privacy_version: "2026-10-12",
  privacy_approved: true,
  registration_open: false,
};
export const categoryLabels = {
  general: "Curso y presentación",
  teoria: "Lecciones teóricas",
  "taller-1": "Taller 1",
  "taller-2": "Taller 2",
  "taller-3": "Taller 3",
  "taller-4": "Taller 4",
  rutas: "Directorio y rutas",
  cierre: "Evaluación y cierre",
};
