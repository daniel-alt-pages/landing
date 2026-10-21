import type { RecomendacionDetallada } from './types';

/** Recomendaciones específicas para el modal de sesión del plan de estudio. */
export function generarRecomendacionDetallada(
    materia: string,
    tema: string,
    prioridad: string,
    repaso: number,
    minutos: number,
): RecomendacionDetallada {
    const esPrimeraVez = repaso === 1;
    const esRepaso = repaso > 1;

    const contextoRepaso = esPrimeraVez
        ? '🎯 Primera exposición: Enfócate en comprender los conceptos fundamentales.'
        : repaso === 2
            ? '🔄 Segundo repaso: Refuerza lo aprendido y practica aplicación.'
            : repaso === 3
                ? '💪 Tercer repaso: Aumenta velocidad y precisión en ejercicios.'
                : repaso === 4
                    ? '⚡ Cuarto repaso: Domina casos complejos y trampas comunes.'
                    : '🏆 Repaso final: Consolida dominio total y automatiza respuestas.';

    if (materia === 'lectura crítica') {
        return {
            objetivo: esPrimeraVez
                ? `Comprender las estrategias de lectura crítica aplicadas a ${tema}`
                : `Perfeccionar tu análisis de ${tema} y aumentar velocidad de comprensión`,
            queEstudiar: [
                `Estructura y características de ${tema}`,
                'Tipos de preguntas ICFES sobre este tema',
                'Distractores comunes y cómo identificarlos',
                esPrimeraVez ? 'Vocabulario clave del tema' : 'Patrones de respuesta en preguntas difíciles',
            ],
            comoEstudiar: [
                `Lee 2-3 textos de ${tema} subrayando ideas principales`,
                'Identifica la tesis, argumentos y conclusión en cada texto',
                'Practica justificar por qué cada distractor es incorrecto',
                esRepaso ? 'Cronometra tu lectura: máximo 3 min por texto' : 'Lee sin prisa, enfócate en comprender',
                'Escribe un resumen de 2 líneas de cada texto leído',
            ],
            recursos: [
                '📚 Banco de textos ICFES sobre el tema',
                '📝 Guía de estrategias de lectura crítica',
                '🎯 Simulador de preguntas tipo ICFES',
                '📖 Glosario de términos literarios/argumentativos',
            ],
            evaluacion: esPrimeraVez
                ? 'Resuelve 5 preguntas de práctica sin límite de tiempo'
                : `Resuelve 8 preguntas en ${Math.round(minutos * 0.7)} minutos`,
            contextoRepaso,
        };
    }

    if (materia === 'matemáticas') {
        return {
            objetivo: esPrimeraVez
                ? `Dominar los conceptos y fórmulas fundamentales de ${tema}`
                : `Automatizar la resolución de problemas de ${tema} con precisión`,
            queEstudiar: [
                `Fórmulas y propiedades clave de ${tema}`,
                'Tipos de problemas ICFES sobre este tema',
                'Errores comunes y cómo evitarlos',
                esPrimeraVez ? 'Definiciones y teoremas básicos' : 'Casos especiales y excepciones',
            ],
            comoEstudiar: [
                `Crea una hoja de fórmulas de ${tema} (máximo 1 página)`,
                'Resuelve 8-10 ejercicios de dificultad progresiva',
                'Explica en voz alta cada paso de la solución',
                esRepaso ? 'Identifica atajos y métodos rápidos' : 'Enfócate en entender el proceso completo',
                'Revisa tus errores y anota por qué fallaste',
            ],
            recursos: [
                '📐 Formulario de matemáticas ICFES',
                '🎓 Videos explicativos del tema (Khan Academy)',
                '📊 Banco de ejercicios resueltos paso a paso',
                '🧮 Calculadora permitida en ICFES (familiarízate)',
            ],
            evaluacion: esPrimeraVez
                ? 'Resuelve 6 problemas básicos verificando cada paso'
                : `Resuelve 10 problemas en ${Math.round(minutos * 0.6)} minutos`,
            contextoRepaso,
        };
    }

    if (materia === 'sociales y ciudadanas') {
        return {
            objetivo: esPrimeraVez
                ? `Comprender los conceptos y contextos de ${tema}`
                : `Analizar críticamente situaciones de ${tema} y argumentar posiciones`,
            queEstudiar: [
                `Conceptos clave y definiciones de ${tema}`,
                'Contexto histórico/social del tema',
                'Diferentes perspectivas y posturas sobre el tema',
                esPrimeraVez ? 'Actores y eventos principales' : 'Debates contemporáneos y casos actuales',
            ],
            comoEstudiar: [
                `Crea un mapa conceptual de ${tema} con actores, causas y consecuencias`,
                'Identifica 3 posturas diferentes sobre el tema',
                'Practica argumentar a favor y en contra de cada postura',
                esRepaso ? 'Conecta el tema con noticias actuales' : 'Enfócate en comprender el contexto histórico',
                'Resume en 5 líneas: qué, quién, cuándo, dónde, por qué',
            ],
            recursos: [
                '🌍 Atlas histórico y mapas temáticos',
                '📰 Artículos de análisis sobre el tema',
                '🎯 Preguntas ICFES con análisis de respuestas',
                '📚 Línea de tiempo de eventos clave',
            ],
            evaluacion: esPrimeraVez
                ? 'Responde 5 preguntas explicando tu razonamiento'
                : `Resuelve 8 preguntas en ${Math.round(minutos * 0.65)} minutos`,
            contextoRepaso,
        };
    }

    if (materia === 'ciencias naturales') {
        return {
            objetivo: esPrimeraVez
                ? `Entender los principios científicos de ${tema}`
                : `Aplicar conceptos de ${tema} en análisis de situaciones y experimentos`,
            queEstudiar: [
                `Leyes, principios y conceptos de ${tema}`,
                'Variables y unidades de medida relevantes',
                'Relaciones causa-efecto en el tema',
                esPrimeraVez ? 'Vocabulario científico básico' : 'Aplicaciones y casos complejos',
            ],
            comoEstudiar: [
                `Resume los conceptos clave de ${tema} en un esquema visual`,
                'Identifica variables independientes y dependientes',
                'Practica interpretar gráficas y tablas del tema',
                esRepaso ? 'Resuelve problemas de análisis experimental' : 'Enfócate en comprender los conceptos',
                'Explica el tema como si enseñaras a alguien más',
            ],
            recursos: [
                '🔬 Simuladores virtuales de experimentos',
                '📊 Gráficas y datos para interpretar',
                '🎓 Videos de experimentos y demostraciones',
                '📖 Glosario científico ilustrado',
            ],
            evaluacion: esPrimeraVez
                ? 'Resuelve 6 preguntas de comprensión conceptual'
                : `Resuelve 8 preguntas de análisis en ${Math.round(minutos * 0.65)} minutos`,
            contextoRepaso,
        };
    }

    if (materia === 'inglés') {
        return {
            objetivo: esPrimeraVez
                ? `Dominar las estructuras y vocabulario de ${tema}`
                : `Automatizar el reconocimiento y uso correcto de ${tema}`,
            queEstudiar: [
                `Reglas gramaticales de ${tema}`,
                'Vocabulario y expresiones comunes',
                'Errores típicos y cómo evitarlos',
                esPrimeraVez ? 'Ejemplos básicos y contextos de uso' : 'Casos especiales y excepciones',
            ],
            comoEstudiar: [
                `Crea 10 ejemplos propios usando ${tema}`,
                'Identifica el tema en textos auténticos (artículos, canciones)',
                'Practica ejercicios de completar y corregir errores',
                esRepaso ? 'Enfócate en velocidad de reconocimiento' : 'Comprende las reglas antes de practicar',
                'Lee en voz alta para internalizar las estructuras',
            ],
            recursos: [
                '📚 Guía gramatical con ejemplos',
                '🎧 Audio de pronunciación y uso en contexto',
                '📝 Ejercicios interactivos de práctica',
                '🎯 Banco de preguntas ICFES del tema',
            ],
            evaluacion: esPrimeraVez
                ? 'Completa 10 ejercicios de práctica guiada'
                : `Resuelve 15 preguntas en ${Math.round(minutos * 0.7)} minutos`,
            contextoRepaso,
        };
    }

    return {
        objetivo: `Dominar ${tema} en ${materia}`,
        queEstudiar: [
            `Conceptos fundamentales de ${tema}`,
            'Tipos de preguntas ICFES sobre este tema',
            'Estrategias de resolución',
            'Errores comunes',
        ],
        comoEstudiar: [
            'Lee y resume los conceptos clave',
            'Practica ejercicios de dificultad progresiva',
            'Revisa tus errores y aprende de ellos',
            'Explica el tema en tus propias palabras',
        ],
        recursos: [
            '📚 Material de estudio del tema',
            '🎯 Banco de preguntas ICFES',
            '📝 Guías y resúmenes',
            '🎓 Videos explicativos',
        ],
        evaluacion: `Resuelve ejercicios de práctica en ${minutos} minutos`,
        contextoRepaso,
    };
}
