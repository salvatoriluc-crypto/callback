// Datos de ejemplo para el modo demo. Las fechas son relativas a hoy,
// así la demo siempre parece "en vivo".

function at(days, time = '10:00') {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const [h, m] = time.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

const S = (title, tag, detail) => ({ title, tag, detail });
const slate = S('Presentación a cámara', '15 seg', 'Plano medio, mirando a cámara: nombre, edad, altura, ciudad y agencia.');
const perfiles = S('Perfiles y plano entero', '10 seg', 'Perfil izquierdo, derecho y plano entero. Ropa lisa, sin logos.');
const subir = S('Revisar y subir', '', 'Nombra el archivo APELLIDO_NOMBRE_ROL y súbelo al link de la convocatoria.');

export const DEMO_PROFILE = {
  name: 'Lucas Salvatori',
  agency: 'Fifth Management',
  city: 'Barcelona',
  gender: 'H',
  ageMin: 30,
  ageMax: 40,
  height: '1,80 m',
  look: 'Europeo / mediterráneo, barba corta',
  types: { OCP: true, SEC: true, FE: true, MANOS: false },
  skills: ['Español nativo', 'Catalán', 'Inglés alto', 'Skate', 'Conducir'],
  travel: true,
  eatsAll: true,
  minFee: 500
};

export function demoCastings() {
  return [
    {
      id: 'cocacola', brand: 'Coca-Cola', project: 'Spot Navidad «La mesa larga» · Blua Films', agent: 'Antígona',
      received: at(-2), status: 'casting',
      modality: { selftape: true, presencial: true },
      deadline: at(0, '23:59'),
      presencial: { at: at(2, '16:30'), place: 'Blua Casting · C/ Pujades 77, Poblenou', how: 'Metro L4 Llacuna · pregunta por Alicia' },
      shooting: '24–25 nov · Lisboa',
      fee: 2600, feeNote: 'Sesión 500 € · Derechos 2.100 €',
      conditions: { medios: 'TV + Internet + RRSS', territorio: 'España y Portugal', duracion: '1 año', exclusividad: 'Refrescos, 1 año', gastos: 'Viaje + hotel cubiertos' },
      description: 'Grupo de amigos que improvisa una cena de Navidad en un piso compartido. Tono natural, nada de sobreactuar.',
      roles: [
        { id: 'amigo', name: 'Amigo en la cena', type: 'OCP', gender: 'H', ageMin: 30, ageMax: 40, notes: 'Todas las etnias',
          steps: [slate, perfiles, S('Acting: llegas tarde', '30 seg', 'Entras con una bolsa de hielo, saludas, te quitas el abrigo y te sientas. Improvisa, sin texto.'), S('El brindis', '10 seg', 'Levantas la botella: «¡Por los que siempre llegan tarde!». Sonrisa real, sin mirar al objetivo.'), subir] },
        { id: 'repartidor', name: 'Repartidor', type: 'SEC', gender: 'H', ageMin: 25, ageMax: 35, english: true, notes: 'Frase en inglés',
          steps: [slate, perfiles, S('Acting: la entrega', '20 seg', 'Llamas a la puerta con seis pizzas y te invitan a quedarte. Dudas, miras el reloj y aceptas.'), S('Frase en inglés', '5 seg', '«Sorry, I think I’m at the wrong party… or the right one?»'), subir] },
        { id: 'invitados', name: 'Invitados de fondo', type: 'FE', gender: 'X', ageMin: 20, ageMax: 60,
          steps: [slate, S('Plano entero', '5 seg', 'De pie, plano entero, ropa de fiesta informal.'), S('Reacción al brindis', '15 seg', 'Escuchas un brindis fuera de cámara y ríes con el grupo.'), subir] },
        { id: 'anfitriona', name: 'Anfitriona', type: 'OCP', gender: 'M', ageMin: 30, ageMax: 40 },
        { id: 'abuelo', name: 'Abuelo', type: 'OCP', gender: 'H', ageMin: 65, ageMax: 80 },
        { id: 'vecino', name: 'Vecino que llega tarde', type: 'SEC', gender: 'H', ageMin: 35, ageMax: 50, localOnly: 'Lisboa' },
        { id: 'manos', name: 'Doble de manos', type: 'MANOS', gender: 'H', ageMin: 25, ageMax: 45 }
      ],
      files: ['CASTING_CALL_COCACOLA_ES.pdf', 'INSTRUCCIONES_SELFTAPE.pdf'],
      progress: { mode: 'selftape', role: 'amigo', done: { 'selftape-amigo-0': true, 'selftape-amigo-1': true, 'selftape-amigo-2': true } }
    },
    {
      id: 'kraft', brand: 'KRAFT', project: 'Campaña verano · shooting en Mallorca', agent: 'Erika',
      received: at(0, '08:30'), status: 'casting',
      modality: { selftape: true, presencial: true },
      deadline: at(4, '22:00'),
      presencial: { at: at(2, '11:00'), place: 'Estudio Fifth · C/ Llull 51, BCN', how: 'Ropa casual clara' },
      shooting: '18–19 nov · Mallorca',
      fee: 1800, feeNote: 'Derechos incluidos',
      conditions: { medios: 'Internet + PLV', territorio: 'Europa', duracion: '1 año', exclusividad: 'No', gastos: 'Vuelo + hotel cubiertos' },
      description: 'Familia preparando un picnic en la playa. Planos generales y producto en mano.',
      roles: [
        { id: 'padre', name: 'Padre en la playa', type: 'SEC', gender: 'H', ageMin: 35, ageMax: 45 },
        { id: 'madre', name: 'Madre en la playa', type: 'SEC', gender: 'M', ageMin: 35, ageMax: 45 }
      ],
      files: ['CASTING_CALL_&_BRIEF_KRAFT.pdf', 'INSTRUCCIONES_CASTING_KRAFT.pdf'],
      alert: 'Confirma a Erika si vas presencial o mandas selftape'
    },
    {
      id: 'fiveguys', brand: 'Five Guys', project: 'Campaña «Our story» · Iconoclast', agent: 'Claudia',
      received: at(-8), status: 'callback',
      modality: { selftape: false, presencial: true },
      presencial: { at: at(1, '12:30'), place: 'Iconoclast · Madrid', how: 'Lleva traje oscuro' },
      shooting: '17–20 nov · Madrid',
      fee: 2200, feeNote: 'Derechos y exclusividad en negociación',
      conditions: { medios: 'TV + Internet', territorio: 'Europa', duracion: 'Por definir', exclusividad: 'Posible (comida rápida)', gastos: 'Viaje cubierto (OCP)' },
      description: 'Tono natural con humor sutil. Imprescindible poder comer hamburguesa y cacahuetes.',
      roles: [{ id: 'business', name: 'Five Guys Business Man', type: 'OCP', gender: 'H', ageMin: 30, ageMax: 39, english: true, notes: 'Frase en inglés' }],
      files: ['CASTING_CALL_FIVE_GUYS_ES.pdf'],
      alert: 'Ojo: incompatible con la exclusividad de McDonald’s'
    },
    {
      id: 'zara', brand: 'Zara', project: 'E-commerce Hombre FW', agent: 'Carla',
      received: at(-1), status: 'callback',
      modality: { selftape: false, presencial: true },
      presencial: { at: at(4, '16:00'), place: 'Estudio Poblenou', how: 'Ropa interior neutra' },
      shooting: 'Foto · BCN', fee: 900, feeNote: '1 jornada de foto',
      conditions: { medios: 'Web + app', territorio: 'Mundial', duracion: '6 meses', exclusividad: 'No', gastos: 'Local' },
      roles: [{ id: 'modelo', name: 'Modelo e-commerce', type: 'OCP', gender: 'H', ageMin: 25, ageMax: 40 }]
    },
    {
      id: 'balun', brand: 'BALUN', project: 'Lanzamiento marca de calzado', agent: 'Antígona',
      received: at(-7), status: 'esperando',
      modality: { selftape: true, presencial: false },
      conditions: { medios: 'Por confirmar', territorio: 'España', gastos: 'Travel fee fuera de BCN' },
      roles: [{ id: 'aeropuerto', name: 'Personas en el aeropuerto', type: 'FE', gender: 'X', ageMin: 18, ageMax: 70 }],
      files: ['CASTING_CALL_BALUN_fifth.pdf']
    },
    {
      id: 'mcdonalds', brand: "McDonald's", project: 'Spot Navidad', agent: 'Carla',
      received: at(-2), status: 'opcion_firme',
      modality: { selftape: false, presencial: false },
      deadline: at(5, '12:00'), deadlineLabel: 'Responder opción',
      shooting: 'Rodaje en Madrid', shootingAt: at(15, '08:00'),
      fee: 3200, feeNote: 'Sesión 600 € · Derechos 2.600 €',
      conditions: { medios: 'TV + Internet + RRSS', territorio: 'España', duracion: '2 años', exclusividad: 'Comida rápida, 2 años', gastos: 'Viaje + dietas' },
      roles: [{ id: 'padre', name: 'Padre en la mesa', type: 'OCP', gender: 'H', ageMin: 30, ageMax: 45 }],
      alert: 'La exclusividad de comida rápida choca con Five Guys'
    },
    {
      id: 'planeta', brand: 'Planeta', project: 'Musaranya Producciones S.L.', agent: 'Laura',
      received: at(-13), status: 'opcion',
      modality: { selftape: false, presencial: false },
      shooting: 'Palau-solità i Plegamans', shootingAt: at(5, '08:00'),
      fee: 1100, feeNote: 'Derechos + sesión',
      conditions: { medios: 'Internet + TV', territorio: 'Francia', duracion: '1 año', exclusividad: 'No', gastos: 'No cubiertos' },
      roles: [{ id: 'directa', name: 'Opción directa', type: 'OCP', gender: 'H', ageMin: 30, ageMax: 45 }],
      alert: 'El cliente no cubre desplazamiento'
    },
    {
      id: 'deagostini', brand: 'Planeta DeAgostini', project: 'Foto + spot internet', agent: 'Laura',
      received: at(-17), status: 'confirmado',
      modality: { selftape: false, presencial: false },
      shooting: 'Palau de Plegamans', shootingAt: at(7, '08:00'),
      fee: 1700, feeNote: 'Derechos incluidos',
      conditions: { medios: 'Foto internet + spot', territorio: 'España', duracion: '1 año', exclusividad: 'No', gastos: 'No cubiertos' },
      roles: [{ id: 'prota', name: 'Protagonista', type: 'OCP', gender: 'H', ageMin: 30, ageMax: 40 }]
    },
    {
      id: 'estrella', brand: 'Estrella Galicia', project: 'Campaña skater', agent: 'Antígona',
      received: at(-20), status: 'por_cobrar', paymentDue: at(25),
      fee: 2000, feeNote: 'Factura enviada',
      conditions: { medios: 'TV + Internet', territorio: 'España', duracion: '1 año', exclusividad: 'Cerveza, 1 año', gastos: 'Cubiertos' },
      roles: [{ id: 'skater', name: 'Skater', type: 'OCP', gender: 'X', ageMin: 25, ageMax: 35 }]
    },
    { id: 'mango', brand: 'Mango', project: 'Lookbook otoño', agent: 'Carla', received: at(-35), status: 'cobrado', fee: 900, feeNote: 'Cobrado' },
    { id: 'iberia', brand: 'Iberia', project: 'Spot corporativo', agent: 'Antígona', received: at(-36), status: 'cobrado', fee: 1500, feeNote: 'Cobrado' },
    { id: 'pixel', brand: 'Google Pixel', project: 'Pit lane crew (featured extra)', agent: 'Carla', received: at(-36), status: 'liberada' },
    { id: 'nissan', brand: 'Nissan', project: '4xFilms · shooting Eslovenia', agent: 'Erika', received: at(-16), status: 'descartado' },
    { id: 'gelocatil', brand: 'Gelocatil', project: 'Spot farmacia', agent: 'Carla', received: at(-48), status: 'liberada' },
    { id: 'wegovy', brand: 'Wegovy', project: 'Pharma', agent: 'Antígona', received: at(-48), status: 'descartado' },
    { id: 'sprinter', brand: 'Sprinter', project: 'Campaña deporte', agent: 'Carla', received: at(-49), status: 'descartado' }
  ];
}
