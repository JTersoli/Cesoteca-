import { POEMS_HOTSPOTS } from "../hotspots";
import PoemReader from "./PoemReader";

import Link from "next/link";

export function generateStaticParams() {
  return POEMS_HOTSPOTS.map((h) => ({ slug: h.slug }));
}

export default function PoemPage({ params }: { params: { slug: string } }) {
  const title = params.slug.replace("-", " ").toUpperCase();

  // Texto demo largo para que veas el paginado real
  const text = `
Las puertas de mi casa fueron nueve
las conté un día que mi vecina estaba a los gritos
y me quise mudar
en ese momento eran ocho, después me mudé
a otro continente
y nunca más volví a ver a mi vecina vomitando el baño
tuve siempre vecinos desgraciados
y por desgraciados digo:
sin gracia
y por sin gracia digo:
caídos en desgracia
mi vecina la de veinte hijos y treinta perros
cuya cara nunca vi
mi vecino que le decían el negro pero mi mamá
le decía marrón
y tenía un quiosco y se murió
en un accidente de moto
mis vecinas que iban a la iglesia protestante y discutíamos
entre la diferencia de la hostia y el pan
después dejamos el barrio
y hasta muchos años después
los vecinos no tendrían rostro
esa fue una buena época
teníamos una casa chica rodeada de edificios
y escuchabas voces y conocías las costumbres
pero después
cuando los veías en la calle
no había forma de saber
había uno que cantaba zamba
y yo iba al patio y lo escuchaba cantar
estoy segura que era el hijo mayor de una madre
con muchos hijos y un marido
que llegaba tarde de trabajar y les gritaba
a mí me daba miedo y me acuerdo
que mi mamá me dijo
así debo haberme escuchado yo cuando
ustedes eran chicos en Barrio Jardín
mi siguiente casa fue en otra ciudad
arriba de una librería de monjas
y después en un edificio insípido
en otro país
y después de nuevo
otra casa de vecinos sin rostro
así llegué a mi primer edificio de departamentos

un señorío digno de describir:
la señora del cuarto piso con su pelo blanco y lacio hasta los hombros
que conoció a todos los chicos que fueron a casa y que me hacía chistes hasta que
un día hizo arreglar el techo
y me avisó
pero yo me olvidé y usé el baño igual y ella vino llorando
la señora del piso dos
que no me dejaba atar las bicis en la baranda de la vereda ni en el árbol del patio de luz
ni subirlas por el ascensor
la señora del piso diez que conocía a mi papá y nos quería
hasta que le cortamos el gas
todo un club de señoras de pelo blanco
subiendo termotanques eléctricos por el ascensor
mi casa número siete es la que más amé:
en mi casa número siete
tuve doscientas setenta y tres plantas
dos patios y un balcón
una cama inmensa donde durmieron más de cien personas
y el centro de una manzana repleta de gatos
que entraban al dormitorio como si fuese su casa
y dormían la siesta conmigo y después se iban y no volvían
como si entendiesen las reglas del lugar
esa casa podría haber sido mi vida y habría sido hermosa
si no fuese porque me fui
regalé mis plantas
abracé a la Flo
y me mudé a un monoambiente a dos océanos de distancia
donde lo único que me gustaba
era el cuadro de Klimt que coronaba mi cama
igual al que hay en la casa de mis papás
y que me robé del pasillo principal cuando llegué y vi
los amantes recostados en un abrazo
que debería haber sido de pie
en ese cúmulo despojado de toda belleza vivíamos
una pareja silenciosa de japonesas con quienes nunca hablé
pero que limpiaban el baño y por eso
y porque no hablaban
me caían bien
un inglés que se afeitaba sobre la bacha y dejaba los pelos ahí
un español que me habría resultado simpático en otras circunstancias
y la señora
que empezó queriéndome y terminó gritándome
can you pleeeeaaaase stop slamping the doooooors
a esa casa le compré dos plantas y las regué
y le llené el piso de sangre y de llanto
y le puse mosquitero a las ventanas

y dormí con personas a las que eventualmente amé
y aun así
fue la casa que menos quise
ahora está la casa desde la que escribo esto
y como una rueda que hubiese dado una vuelta completa
(aunque no por eso va a dejar de girar)
me siento como en mi primera casa
en este pueblo como en mi primer barrio
la gente cuchichea chismes de los que no me entero
los chicos patean la pelota contra mi pared
y juegan a las escondidas a los gritos mientras yo quiero dormir la siesta
y me acuerdo de mi mamá que odiaba tanto
a los vecinos y las pelotas de fútbol que caían en mi patio
el verdulero pasa con su camión vociferando
que tiene pomodoro melanzane y pesca
un vecino canta a los gritos y no entiende
por qué su compañero de casa lo abandonó
y yo me levanto todas las mañanas
y mientras me preparo el mismo desayuno que hacía mi mamá
en la casa de Barrio Jardín
para nueve personas
reconozco que mi casa es cualquier lugar
donde tenga una cama y un vecino
para invitar a dormir
`.repeat(8);

  return <PoemReader title={title} text={text} />;
}

