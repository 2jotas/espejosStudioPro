export interface Apunte {
  archivo: string;
  titulo: string;
  tags: string[];
  dificultad: 'Básica' | 'Media' | 'Media-Alta' | 'Avanzada' | 'Experta';
  contenido: string;
}

export interface Modulo {
  id: string;
  nombre: string;
  semestre: number;
  creditos: number;
  temas: string[];
  apuntes: Apunte[];
}

export interface AnoCurricular {
  ano: number;
  nombre: string;
  descripcion: string;
  modulos: Modulo[];
}

export const CURRICULUM_DATA: AnoCurricular[] = [
  {
    "ano": 1,
    "nombre": "Año 1: Fundamentos y Ramos Cursados (Marzo 2026 a la fecha)",
    "descripcion": "4 Ramos completados con sus 7 semanas estructuradas, guías oficiales, notas y ejercicios.",
    "modulos": [
      {
        "id": "01_introduccion_al_analisis_de_datos",
        "nombre": "Introducción al Análisis de Datos",
        "semestre": 1,
        "creditos": 6,
        "temas": [
          "Semana 1",
          "Semana 2",
          "Semana 3",
          "Semana 4",
          "Semana 5",
          "Semana 6",
          "Semana 7"
        ],
        "apuntes": [
          {
            "archivo": "semana_1.md",
            "titulo": "Semana 1: Introducción al Análisis de Datos",
            "tags": [
              "datos",
              "semana_1",
              "universidad"
            ],
            "dificultad": "Media",
            "contenido": "# 📚 Introducción al Análisis de Datos · Semana 1\n\nBienvenido a los apuntes y material de estudio correspondiente a la **Semana 1**.\n\n---\n\n### 📂 Archivos y Guías de esta Semana:\n- 📄 `adaptacion-cambios-del-mercado1.png`\n- 📄 `adaptacion-cambios-del-mercado2.png`\n- 📄 `adaptacion-cambios-del-mercado3.png`\n- 📄 `adaptacion-cambios-del-mercado4.png`\n- 📄 `adaptacion-cambios-del-mercado5.png`\n- 📄 `adaptacion-cambios-del-mercado6.png`\n- 📄 `adaptacion-cambios-del-mercado7.png`\n- 📄 `adaptacion-cambios-del-mercado8.png`\n- 📄 `conclusion1.png`\n- 📄 `conclusion2.png`\n- 📄 `cumplimiento-normativo1.png`\n- 📄 `cumplimiento-normativo2.png`\n- 📄 `cumplimiento-normativo3.png`\n- 📄 `cumplimiento-normativo4.png`\n- 📄 `definicion-y-beneficios1.png`\n- 📄 `definicion-y-beneficios2.png`\n- 📄 `deteccion-oportunidades-negocio1.png`\n- 📄 `deteccion-oportunidades-negocio2.png`\n- 📄 `deteccion-oportunidades-negocio3.png`\n- 📄 `deteccion-oportunidades-negocios3.png`\n- 📄 `ESP-Clasificacion-de-Datos.pdf`\n- 📄 `ESP148.1.711.pdf`\n- 📄 `gestion-de-riesgos1.png`\n- 📄 `gestion-de-riesgos2.png`\n- 📄 `gestion-de-riesgos3.png`\n- 📄 `gestion-de-riesgos4.png`\n- 📄 `Identificacion-patrones-tendencias-.png`\n- 📄 `Identificacion-patrones-tendencias.aplicacion-area-ciencia.png`\n- 📄 `Identificacion-patrones-tendencias.aplicacion-area-marketing.png`\n- 📄 `Identificacion-patrones-tendencias.png`\n- 📄 `Identificacion-patrones.aplicacion-area-medica.png`\n- 📄 `innovacion1.png`\n- 📄 `innovacion2.png`\n- 📄 `innovacion3.png`\n- 📄 `introduccion.png`\n- 📄 `mejora-experiencia-cliente1.png`\n- 📄 `mejora-experiencia-cliente2.png`\n- 📄 `mejora-experiencia-cliente3.png`\n- 📄 `optimizacion-procesos1.png`\n- 📄 `optimizacion-procesos2.png`\n- 📄 `optimizacion-procesos3.png`\n- 📄 `optimizacion-procesos4.png`\n- 📄 `personalizacion-experiencias1.png`\n- 📄 `personalizacion-experiencias2.png`\n- 📄 `personalizacion-experiencias3.png`\n- 📄 `personalizacion-experiencias4.png`\n- 📄 `personalizacion-experiencias5.png`\n- 📄 `personalizacion-experiencias6.png`\n- 📄 `prediccion-y-pronosticos1.png`\n- 📄 `prediccion-y-pronosticos2.png`\n- 📄 `prediccion-y-pronosticos3.png`\n- 📄 `prediccion-y-pronosticos4.png`\n- 📄 `README.md`\n- 📄 `resumen-identificacion-patrones.png`\n- 📄 `seguimiento-del-rendimiento1.png`\n- 📄 `seguimiento-del-rendimiento2.png`\n- 📄 `seguimiento-del-rendimiento3.png`\n- 📄 `toma-decisiones-basada-en-ciencia1.png`\n- 📄 `toma-decisiones-basada-en-ciencia2.png`\n- 📄 `toma-decisiones-basada-en-ciencia3.png`\n\n---\n\n### 💡 Resumen y Objetivos:\n- Conceptos clave y material de lectura oficial de la universidad.\n- Ejercicios prácticos, scripts en Python y recursos de apoyo.\n\n*Puedes interactuar con este módulo, ejecutar código en el Playground o subir nuevos apuntes.*\n"
          },
          {
            "archivo": "semana_2.md",
            "titulo": "Semana 2: Introducción al Análisis de Datos",
            "tags": [
              "datos",
              "semana_2",
              "universidad"
            ],
            "dificultad": "Media",
            "contenido": "# 📚 Introducción al Análisis de Datos · Semana 2\n\nBienvenido a los apuntes y material de estudio correspondiente a la **Semana 2**.\n\n---\n\n### 📂 Archivos y Guías de esta Semana:\n- 📄 `editor,+Revista+34-6.pdf`\n- 📄 `ESP148.1.712.pdf`\n- 📄 `README.md`\n\n---\n\n### 💡 Resumen y Objetivos:\n- Conceptos clave y material de lectura oficial de la universidad.\n- Ejercicios prácticos, scripts en Python y recursos de apoyo.\n\n*Puedes interactuar con este módulo, ejecutar código en el Playground o subir nuevos apuntes.*\n"
          },
          {
            "archivo": "semana_3.md",
            "titulo": "Semana 3: Introducción al Análisis de Datos",
            "tags": [
              "datos",
              "semana_3",
              "universidad"
            ],
            "dificultad": "Media",
            "contenido": "# 📚 Introducción al Análisis de Datos · Semana 3\n\nBienvenido a los apuntes y material de estudio correspondiente a la **Semana 3**.\n\n---\n\n### 📂 Archivos y Guías de esta Semana:\n- 📄 `ESP148.2.713.pdf`\n- 📄 `README.md`\n\n---\n\n### 💡 Resumen y Objetivos:\n- Conceptos clave y material de lectura oficial de la universidad.\n- Ejercicios prácticos, scripts en Python y recursos de apoyo.\n\n*Puedes interactuar con este módulo, ejecutar código en el Playground o subir nuevos apuntes.*\n"
          },
          {
            "archivo": "semana_4.md",
            "titulo": "Semana 4: Introducción al Análisis de Datos",
            "tags": [
              "datos",
              "semana_4",
              "universidad"
            ],
            "dificultad": "Media",
            "contenido": "# 📚 Introducción al Análisis de Datos · Semana 4\n\nBienvenido a los apuntes y material de estudio correspondiente a la **Semana 4**.\n\n---\n\n### 📂 Archivos y Guías de esta Semana:\n- 📄 `README.md`\n\n---\n\n### 💡 Resumen y Objetivos:\n- Conceptos clave y material de lectura oficial de la universidad.\n- Ejercicios prácticos, scripts en Python y recursos de apoyo.\n\n*Puedes interactuar con este módulo, ejecutar código en el Playground o subir nuevos apuntes.*\n"
          },
          {
            "archivo": "semana_5.md",
            "titulo": "Semana 5: Introducción al Análisis de Datos",
            "tags": [
              "datos",
              "semana_5",
              "universidad"
            ],
            "dificultad": "Media",
            "contenido": "# 📚 Introducción al Análisis de Datos · Semana 5\n\nBienvenido a los apuntes y material de estudio correspondiente a la **Semana 5**.\n\n---\n\n### 📂 Archivos y Guías de esta Semana:\n- 📄 `README.md`\n\n---\n\n### 💡 Resumen y Objetivos:\n- Conceptos clave y material de lectura oficial de la universidad.\n- Ejercicios prácticos, scripts en Python y recursos de apoyo.\n\n*Puedes interactuar con este módulo, ejecutar código en el Playground o subir nuevos apuntes.*\n"
          },
          {
            "archivo": "semana_6.md",
            "titulo": "Semana 6: Introducción al Análisis de Datos",
            "tags": [
              "datos",
              "semana_6",
              "universidad"
            ],
            "dificultad": "Media",
            "contenido": "# 📚 Introducción al Análisis de Datos · Semana 6\n\nBienvenido a los apuntes y material de estudio correspondiente a la **Semana 6**.\n\n---\n\n### 📂 Archivos y Guías de esta Semana:\n- 📄 `README.md`\n\n---\n\n### 💡 Resumen y Objetivos:\n- Conceptos clave y material de lectura oficial de la universidad.\n- Ejercicios prácticos, scripts en Python y recursos de apoyo.\n\n*Puedes interactuar con este módulo, ejecutar código en el Playground o subir nuevos apuntes.*\n"
          },
          {
            "archivo": "semana_7.md",
            "titulo": "Semana 7: Introducción al Análisis de Datos",
            "tags": [
              "datos",
              "semana_7",
              "universidad"
            ],
            "dificultad": "Media",
            "contenido": "# 📚 Introducción al Análisis de Datos · Semana 7\n\nBienvenido a los apuntes y material de estudio correspondiente a la **Semana 7**.\n\n---\n\n### 📂 Archivos y Guías de esta Semana:\n- 📄 `README.md`\n\n---\n\n### 💡 Resumen y Objetivos:\n- Conceptos clave y material de lectura oficial de la universidad.\n- Ejercicios prácticos, scripts en Python y recursos de apoyo.\n\n*Puedes interactuar con este módulo, ejecutar código en el Playground o subir nuevos apuntes.*\n"
          }
        ]
      },
      {
        "id": "01_introduccion_python_datos",
        "nombre": "01 Introduccion Python Datos",
        "semestre": 1,
        "creditos": 6,
        "temas": [
          "Semana 1",
          "Semana 2",
          "Semana 3",
          "Semana 4",
          "Semana 5",
          "Semana 6",
          "Semana 7"
        ],
        "apuntes": []
      },
      {
        "id": "02_algebra_lineal_calculo",
        "nombre": "02 Algebra Lineal Calculo",
        "semestre": 2,
        "creditos": 6,
        "temas": [
          "Semana 1",
          "Semana 2",
          "Semana 3",
          "Semana 4",
          "Semana 5",
          "Semana 6",
          "Semana 7"
        ],
        "apuntes": []
      },
      {
        "id": "02_analisis_de_datos",
        "nombre": "Análisis de Datos",
        "semestre": 1,
        "creditos": 6,
        "temas": [
          "Semana 1",
          "Semana 2",
          "Semana 3",
          "Semana 4",
          "Semana 5",
          "Semana 6",
          "Semana 7"
        ],
        "apuntes": [
          {
            "archivo": "semana_1.md",
            "titulo": "Semana 1: Análisis de Datos",
            "tags": [
              "datos",
              "semana_1",
              "universidad"
            ],
            "dificultad": "Media",
            "contenido": "# 📚 Análisis de Datos · Semana 1\n\nBienvenido a los apuntes y material de estudio correspondiente a la **Semana 1**.\n\n---\n\n### 📂 Archivos y Guías de esta Semana:\n- 📄 `ESP10.1.711.pdf`\n- 📄 `README.md`\n- 📄 `uno.txt`\n\n---\n\n### 💡 Resumen y Objetivos:\n- Conceptos clave y material de lectura oficial de la universidad.\n- Ejercicios prácticos, scripts en Python y recursos de apoyo.\n\n*Puedes interactuar con este módulo, ejecutar código en el Playground o subir nuevos apuntes.*\n"
          },
          {
            "archivo": "semana_2.md",
            "titulo": "Semana 2: Análisis de Datos",
            "tags": [
              "datos",
              "semana_2",
              "universidad"
            ],
            "dificultad": "Media",
            "contenido": "# 📚 Análisis de Datos · Semana 2\n\nBienvenido a los apuntes y material de estudio correspondiente a la **Semana 2**.\n\n---\n\n### 📂 Archivos y Guías de esta Semana:\n- 📄 `ESP10.1.712.pdf`\n- 📄 `README.md`\n- 📄 `Semana 1 - Reunión Sincronica.mkv`\n\n---\n\n### 💡 Resumen y Objetivos:\n- Conceptos clave y material de lectura oficial de la universidad.\n- Ejercicios prácticos, scripts en Python y recursos de apoyo.\n\n*Puedes interactuar con este módulo, ejecutar código en el Playground o subir nuevos apuntes.*\n"
          },
          {
            "archivo": "semana_3.md",
            "titulo": "Semana 3: Análisis de Datos",
            "tags": [
              "datos",
              "semana_3",
              "universidad"
            ],
            "dificultad": "Media",
            "contenido": "# 📚 Análisis de Datos · Semana 3\n\nBienvenido a los apuntes y material de estudio correspondiente a la **Semana 3**.\n\n---\n\n### 📂 Archivos y Guías de esta Semana:\n- 📄 `enlaces.txt`\n- 📄 `ESP10.2.713.pdf`\n- 📄 `README.md`\n\n---\n\n### 💡 Resumen y Objetivos:\n- Conceptos clave y material de lectura oficial de la universidad.\n- Ejercicios prácticos, scripts en Python y recursos de apoyo.\n\n*Puedes interactuar con este módulo, ejecutar código en el Playground o subir nuevos apuntes.*\n"
          },
          {
            "archivo": "semana_4.md",
            "titulo": "Semana 4: Análisis de Datos",
            "tags": [
              "datos",
              "semana_4",
              "universidad"
            ],
            "dificultad": "Media",
            "contenido": "# 📚 Análisis de Datos · Semana 4\n\nBienvenido a los apuntes y material de estudio correspondiente a la **Semana 4**.\n\n---\n\n### 📂 Archivos y Guías de esta Semana:\n- 📄 `README.md`\n\n---\n\n### 💡 Resumen y Objetivos:\n- Conceptos clave y material de lectura oficial de la universidad.\n- Ejercicios prácticos, scripts en Python y recursos de apoyo.\n\n*Puedes interactuar con este módulo, ejecutar código en el Playground o subir nuevos apuntes.*\n"
          },
          {
            "archivo": "semana_5.md",
            "titulo": "Semana 5: Análisis de Datos",
            "tags": [
              "datos",
              "semana_5",
              "universidad"
            ],
            "dificultad": "Media",
            "contenido": "# 📚 Análisis de Datos · Semana 5\n\nBienvenido a los apuntes y material de estudio correspondiente a la **Semana 5**.\n\n---\n\n### 📂 Archivos y Guías de esta Semana:\n- 📄 `ESP10.3.715.pdf`\n- 📄 `ESP10.5.721.png`\n- 📄 `README.md`\n\n---\n\n### 💡 Resumen y Objetivos:\n- Conceptos clave y material de lectura oficial de la universidad.\n- Ejercicios prácticos, scripts en Python y recursos de apoyo.\n\n*Puedes interactuar con este módulo, ejecutar código en el Playground o subir nuevos apuntes.*\n"
          },
          {
            "archivo": "semana_6.md",
            "titulo": "Semana 6: Análisis de Datos",
            "tags": [
              "datos",
              "semana_6",
              "universidad"
            ],
            "dificultad": "Media",
            "contenido": "# 📚 Análisis de Datos · Semana 6\n\nBienvenido a los apuntes y material de estudio correspondiente a la **Semana 6**.\n\n---\n\n### 📂 Archivos y Guías de esta Semana:\n- 📄 `README.md`\n\n---\n\n### 💡 Resumen y Objetivos:\n- Conceptos clave y material de lectura oficial de la universidad.\n- Ejercicios prácticos, scripts en Python y recursos de apoyo.\n\n*Puedes interactuar con este módulo, ejecutar código en el Playground o subir nuevos apuntes.*\n"
          },
          {
            "archivo": "semana_7.md",
            "titulo": "Semana 7: Análisis de Datos",
            "tags": [
              "datos",
              "semana_7",
              "universidad"
            ],
            "dificultad": "Media",
            "contenido": "# 📚 Análisis de Datos · Semana 7\n\nBienvenido a los apuntes y material de estudio correspondiente a la **Semana 7**.\n\n---\n\n### 📂 Archivos y Guías de esta Semana:\n- 📄 `README.md`\n\n---\n\n### 💡 Resumen y Objetivos:\n- Conceptos clave y material de lectura oficial de la universidad.\n- Ejercicios prácticos, scripts en Python y recursos de apoyo.\n\n*Puedes interactuar con este módulo, ejecutar código en el Playground o subir nuevos apuntes.*\n"
          }
        ]
      },
      {
        "id": "03_estadistica",
        "nombre": "Estadística y Probabilidad",
        "semestre": 2,
        "creditos": 6,
        "temas": [
          "Semana 1",
          "Semana 2",
          "Semana 3",
          "Semana 4",
          "Semana 5",
          "Semana 6",
          "Semana 7"
        ],
        "apuntes": [
          {
            "archivo": "semana_1.md",
            "titulo": "Semana 1: Estadística y Probabilidad",
            "tags": [
              "estadistica",
              "semana_1",
              "universidad"
            ],
            "dificultad": "Media",
            "contenido": "# 📚 Estadística y Probabilidad · Semana 1\n\nBienvenido a los apuntes y material de estudio correspondiente a la **Semana 1**.\n\n---\n\n### 📂 Archivos y Guías de esta Semana:\n- 📄 `17.jpg`\n- 📄 `19.jpg`\n- 📄 `Ejercicio-material-apoyo.xlsx`\n- 📄 `formulas-excel.txt`\n- 📄 `README.md`\n- 📄 `tabla-frecuencias.png`\n- 📄 `TEC13.1.711.pdf`\n\n---\n\n### 💡 Resumen y Objetivos:\n- Conceptos clave y material de lectura oficial de la universidad.\n- Ejercicios prácticos, scripts en Python y recursos de apoyo.\n\n*Puedes interactuar con este módulo, ejecutar código en el Playground o subir nuevos apuntes.*\n"
          },
          {
            "archivo": "semana_2.md",
            "titulo": "Semana 2: Estadística y Probabilidad",
            "tags": [
              "estadistica",
              "semana_2",
              "universidad"
            ],
            "dificultad": "Media",
            "contenido": "# 📚 Estadística y Probabilidad · Semana 2\n\nBienvenido a los apuntes y material de estudio correspondiente a la **Semana 2**.\n\n---\n\n### 📂 Archivos y Guías de esta Semana:\n- 📄 `medwave.2011.03.4934.pdf`\n- 📄 `README.md`\n- 📄 `Screenshot 2026-08-11 123449.png`\n- 📄 `Screenshot 2026-08-11 124306.png`\n- 📄 `Screenshot 2026-08-11 124316.png`\n- 📄 `TEC13.1.712.pdf`\n- 📄 `TEC13.1.722 (1).png`\n- 📄 `uno.txt`\n\n---\n\n### 💡 Resumen y Objetivos:\n- Conceptos clave y material de lectura oficial de la universidad.\n- Ejercicios prácticos, scripts en Python y recursos de apoyo.\n\n*Puedes interactuar con este módulo, ejecutar código en el Playground o subir nuevos apuntes.*\n"
          },
          {
            "archivo": "semana_3.md",
            "titulo": "Semana 3: Estadística y Probabilidad",
            "tags": [
              "estadistica",
              "semana_3",
              "universidad"
            ],
            "dificultad": "Media",
            "contenido": "# 📚 Estadística y Probabilidad · Semana 3\n\nBienvenido a los apuntes y material de estudio correspondiente a la **Semana 3**.\n\n---\n\n### 📂 Archivos y Guías de esta Semana:\n- 📄 `README.md`\n\n---\n\n### 💡 Resumen y Objetivos:\n- Conceptos clave y material de lectura oficial de la universidad.\n- Ejercicios prácticos, scripts en Python y recursos de apoyo.\n\n*Puedes interactuar con este módulo, ejecutar código en el Playground o subir nuevos apuntes.*\n"
          },
          {
            "archivo": "semana_4.md",
            "titulo": "Semana 4: Estadística y Probabilidad",
            "tags": [
              "estadistica",
              "semana_4",
              "universidad"
            ],
            "dificultad": "Media",
            "contenido": "# 📚 Estadística y Probabilidad · Semana 4\n\nBienvenido a los apuntes y material de estudio correspondiente a la **Semana 4**.\n\n---\n\n### 📂 Archivos y Guías de esta Semana:\n- 📄 `README.md`\n- 📄 `TEC13.2.714.pdf`\n\n---\n\n### 💡 Resumen y Objetivos:\n- Conceptos clave y material de lectura oficial de la universidad.\n- Ejercicios prácticos, scripts en Python y recursos de apoyo.\n\n*Puedes interactuar con este módulo, ejecutar código en el Playground o subir nuevos apuntes.*\n"
          },
          {
            "archivo": "semana_5.md",
            "titulo": "Semana 5: Estadística y Probabilidad",
            "tags": [
              "estadistica",
              "semana_5",
              "universidad"
            ],
            "dificultad": "Media",
            "contenido": "# 📚 Estadística y Probabilidad · Semana 5\n\nBienvenido a los apuntes y material de estudio correspondiente a la **Semana 5**.\n\n---\n\n### 📂 Archivos y Guías de esta Semana:\n- 📄 `index.html`\n- 📄 `README.md`\n- 📄 `TEC13.3.715.pdf`\n\n---\n\n### 💡 Resumen y Objetivos:\n- Conceptos clave y material de lectura oficial de la universidad.\n- Ejercicios prácticos, scripts en Python y recursos de apoyo.\n\n*Puedes interactuar con este módulo, ejecutar código en el Playground o subir nuevos apuntes.*\n"
          },
          {
            "archivo": "semana_6.md",
            "titulo": "Semana 6: Estadística y Probabilidad",
            "tags": [
              "estadistica",
              "semana_6",
              "universidad"
            ],
            "dificultad": "Media",
            "contenido": "# 📚 Estadística y Probabilidad · Semana 6\n\nBienvenido a los apuntes y material de estudio correspondiente a la **Semana 6**.\n\n---\n\n### 📂 Archivos y Guías de esta Semana:\n- 📄 `README.md`\n\n---\n\n### 💡 Resumen y Objetivos:\n- Conceptos clave y material de lectura oficial de la universidad.\n- Ejercicios prácticos, scripts en Python y recursos de apoyo.\n\n*Puedes interactuar con este módulo, ejecutar código en el Playground o subir nuevos apuntes.*\n"
          },
          {
            "archivo": "semana_7.md",
            "titulo": "Semana 7: Estadística y Probabilidad",
            "tags": [
              "estadistica",
              "semana_7",
              "universidad"
            ],
            "dificultad": "Media",
            "contenido": "# 📚 Estadística y Probabilidad · Semana 7\n\nBienvenido a los apuntes y material de estudio correspondiente a la **Semana 7**.\n\n---\n\n### 📂 Archivos y Guías de esta Semana:\n- 📄 `README.md`\n\n---\n\n### 💡 Resumen y Objetivos:\n- Conceptos clave y material de lectura oficial de la universidad.\n- Ejercicios prácticos, scripts en Python y recursos de apoyo.\n\n*Puedes interactuar con este módulo, ejecutar código en el Playground o subir nuevos apuntes.*\n"
          }
        ]
      },
      {
        "id": "03_estadistica_descriptiva_probabilidad",
        "nombre": "03 Estadistica Descriptiva Probabilidad",
        "semestre": 2,
        "creditos": 6,
        "temas": [
          "Semana 1",
          "Semana 2",
          "Semana 3",
          "Semana 4",
          "Semana 5",
          "Semana 6",
          "Semana 7"
        ],
        "apuntes": []
      },
      {
        "id": "04_bases_datos_sql_relacional",
        "nombre": "04 Bases Datos Sql Relacional",
        "semestre": 2,
        "creditos": 6,
        "temas": [
          "Semana 1",
          "Semana 2",
          "Semana 3",
          "Semana 4",
          "Semana 5",
          "Semana 6",
          "Semana 7"
        ],
        "apuntes": []
      },
      {
        "id": "04_etica_y_proteccion_de_datos",
        "nombre": "Ética y Protección de Datos",
        "semestre": 2,
        "creditos": 6,
        "temas": [
          "Semana 1",
          "Semana 2",
          "Semana 3",
          "Semana 4",
          "Semana 5",
          "Semana 6",
          "Semana 7"
        ],
        "apuntes": [
          {
            "archivo": "semana_1.md",
            "titulo": "Semana 1: Ética y Protección de Datos",
            "tags": [
              "datos",
              "semana_1",
              "universidad"
            ],
            "dificultad": "Media",
            "contenido": "# 📚 Ética y Protección de Datos · Semana 1\n\nBienvenido a los apuntes y material de estudio correspondiente a la **Semana 1**.\n\n---\n\n### 📂 Archivos y Guías de esta Semana:\n- 📄 `Formas-de-privacidad.png`\n- 📄 `Formas-privacidad.Modelo-Alan_Westin.png`\n- 📄 `Formas-privacidad.Modelo-Darhl_Pedersen.png`\n- 📄 `Privacidad-datos.Unidad1.pdf`\n- 📄 `README.md`\n\n---\n\n### 💡 Resumen y Objetivos:\n- Conceptos clave y material de lectura oficial de la universidad.\n- Ejercicios prácticos, scripts en Python y recursos de apoyo.\n\n*Puedes interactuar con este módulo, ejecutar código en el Playground o subir nuevos apuntes.*\n"
          },
          {
            "archivo": "semana_2.md",
            "titulo": "Semana 2: Ética y Protección de Datos",
            "tags": [
              "datos",
              "semana_2",
              "universidad"
            ],
            "dificultad": "Media",
            "contenido": "# 📚 Ética y Protección de Datos · Semana 2\n\nBienvenido a los apuntes y material de estudio correspondiente a la **Semana 2**.\n\n---\n\n### 📂 Archivos y Guías de esta Semana:\n- 📄 `ESP92.1.712.pdf`\n- 📄 `README.md`\n\n---\n\n### 💡 Resumen y Objetivos:\n- Conceptos clave y material de lectura oficial de la universidad.\n- Ejercicios prácticos, scripts en Python y recursos de apoyo.\n\n*Puedes interactuar con este módulo, ejecutar código en el Playground o subir nuevos apuntes.*\n"
          },
          {
            "archivo": "semana_3.md",
            "titulo": "Semana 3: Ética y Protección de Datos",
            "tags": [
              "datos",
              "semana_3",
              "universidad"
            ],
            "dificultad": "Media",
            "contenido": "# 📚 Ética y Protección de Datos · Semana 3\n\nBienvenido a los apuntes y material de estudio correspondiente a la **Semana 3**.\n\n---\n\n### 📂 Archivos y Guías de esta Semana:\n- 📄 `art04.pdf`\n- 📄 `ESP92.1.713.pdf`\n- 📄 `LEY-19628_28-AGO-1999.pdf`\n- 📄 `README.md`\n\n---\n\n### 💡 Resumen y Objetivos:\n- Conceptos clave y material de lectura oficial de la universidad.\n- Ejercicios prácticos, scripts en Python y recursos de apoyo.\n\n*Puedes interactuar con este módulo, ejecutar código en el Playground o subir nuevos apuntes.*\n"
          },
          {
            "archivo": "semana_4.md",
            "titulo": "Semana 4: Ética y Protección de Datos",
            "tags": [
              "datos",
              "semana_4",
              "universidad"
            ],
            "dificultad": "Media",
            "contenido": "# 📚 Ética y Protección de Datos · Semana 4\n\nBienvenido a los apuntes y material de estudio correspondiente a la **Semana 4**.\n\n---\n\n### 📂 Archivos y Guías de esta Semana:\n- 📄 `README.md`\n\n---\n\n### 💡 Resumen y Objetivos:\n- Conceptos clave y material de lectura oficial de la universidad.\n- Ejercicios prácticos, scripts en Python y recursos de apoyo.\n\n*Puedes interactuar con este módulo, ejecutar código en el Playground o subir nuevos apuntes.*\n"
          },
          {
            "archivo": "semana_5.md",
            "titulo": "Semana 5: Ética y Protección de Datos",
            "tags": [
              "datos",
              "semana_5",
              "universidad"
            ],
            "dificultad": "Media",
            "contenido": "# 📚 Ética y Protección de Datos · Semana 5\n\nBienvenido a los apuntes y material de estudio correspondiente a la **Semana 5**.\n\n---\n\n### 📂 Archivos y Guías de esta Semana:\n- 📄 `README.md`\n\n---\n\n### 💡 Resumen y Objetivos:\n- Conceptos clave y material de lectura oficial de la universidad.\n- Ejercicios prácticos, scripts en Python y recursos de apoyo.\n\n*Puedes interactuar con este módulo, ejecutar código en el Playground o subir nuevos apuntes.*\n"
          },
          {
            "archivo": "semana_6.md",
            "titulo": "Semana 6: Ética y Protección de Datos",
            "tags": [
              "datos",
              "semana_6",
              "universidad"
            ],
            "dificultad": "Media",
            "contenido": "# 📚 Ética y Protección de Datos · Semana 6\n\nBienvenido a los apuntes y material de estudio correspondiente a la **Semana 6**.\n\n---\n\n### 📂 Archivos y Guías de esta Semana:\n- 📄 `README.md`\n\n---\n\n### 💡 Resumen y Objetivos:\n- Conceptos clave y material de lectura oficial de la universidad.\n- Ejercicios prácticos, scripts en Python y recursos de apoyo.\n\n*Puedes interactuar con este módulo, ejecutar código en el Playground o subir nuevos apuntes.*\n"
          },
          {
            "archivo": "semana_7.md",
            "titulo": "Semana 7: Ética y Protección de Datos",
            "tags": [
              "datos",
              "semana_7",
              "universidad"
            ],
            "dificultad": "Media",
            "contenido": "# 📚 Ética y Protección de Datos · Semana 7\n\nBienvenido a los apuntes y material de estudio correspondiente a la **Semana 7**.\n\n---\n\n### 📂 Archivos y Guías de esta Semana:\n- 📄 `README.md`\n\n---\n\n### 💡 Resumen y Objetivos:\n- Conceptos clave y material de lectura oficial de la universidad.\n- Ejercicios prácticos, scripts en Python y recursos de apoyo.\n\n*Puedes interactuar con este módulo, ejecutar código en el Playground o subir nuevos apuntes.*\n"
          }
        ]
      },
      {
        "id": "09_p1",
        "nombre": "Fundamentos y Conceptos Básicos",
        "semestre": 2,
        "creditos": 6,
        "temas": [
          "Semana 1",
          "Semana 2",
          "Semana 3",
          "Semana 4",
          "Semana 5",
          "Semana 6",
          "Semana 7"
        ],
        "apuntes": [
          {
            "archivo": "semana_1.md",
            "titulo": "Semana 1: Fundamentos y Conceptos Básicos",
            "tags": [
              "p1",
              "semana_1",
              "universidad"
            ],
            "dificultad": "Media",
            "contenido": "# 📚 Fundamentos y Conceptos Básicos · Semana 1\n\nBienvenido a los apuntes y material de estudio correspondiente a la **Semana 1**.\n\n---\n\n### 📂 Archivos y Guías de esta Semana:\n- 📄 `conceptos.basicos.txt`\n\n---\n\n### 💡 Resumen y Objetivos:\n- Conceptos clave y material de lectura oficial de la universidad.\n- Ejercicios prácticos, scripts en Python y recursos de apoyo.\n\n*Puedes interactuar con este módulo, ejecutar código en el Playground o subir nuevos apuntes.*\n"
          }
        ]
      }
    ]
  },
  {
    "ano": 2,
    "nombre": "Año 2: Análisis Exploratorio, Inferencia y Machine Learning Clásico",
    "descripcion": "Módulos correspondientes al Año 2.",
    "modulos": [
      {
        "id": "05_eda_pandas",
        "nombre": "Análisis Exploratorio con Pandas y Seaborn",
        "semestre": 3,
        "creditos": 8,
        "temas": [
          "Semana 1",
          "Semana 2",
          "Semana 3",
          "Semana 4",
          "Semana 5",
          "Semana 6",
          "Semana 7"
        ],
        "apuntes": [
          {
            "archivo": "semana_1.md",
            "titulo": "Semana 1: Análisis Exploratorio con Pandas y Seaborn",
            "tags": [
              "05_eda_pandas",
              "proyeccion",
              "carrera"
            ],
            "dificultad": "Media-Alta",
            "contenido": "# Análisis Exploratorio con Pandas y Seaborn\n\nContenido proyectado para el Año 2 de la carrera."
          }
        ]
      },
      {
        "id": "06_inferencia_regresion",
        "nombre": "Inferencia Estadística y Modelos de Regresión",
        "semestre": 3,
        "creditos": 8,
        "temas": [
          "Semana 1",
          "Semana 2",
          "Semana 3",
          "Semana 4",
          "Semana 5",
          "Semana 6",
          "Semana 7"
        ],
        "apuntes": [
          {
            "archivo": "semana_1.md",
            "titulo": "Semana 1: Inferencia Estadística y Modelos de Regresión",
            "tags": [
              "06_inferencia_regresion",
              "proyeccion",
              "carrera"
            ],
            "dificultad": "Media-Alta",
            "contenido": "# Inferencia Estadística y Modelos de Regresión\n\nContenido proyectado para el Año 2 de la carrera."
          }
        ]
      },
      {
        "id": "07_nosql_warehouses",
        "nombre": "Bases NoSQL y Data Warehouses",
        "semestre": 3,
        "creditos": 8,
        "temas": [
          "Semana 1",
          "Semana 2",
          "Semana 3",
          "Semana 4",
          "Semana 5",
          "Semana 6",
          "Semana 7"
        ],
        "apuntes": [
          {
            "archivo": "semana_1.md",
            "titulo": "Semana 1: Bases NoSQL y Data Warehouses",
            "tags": [
              "07_nosql_warehouses",
              "proyeccion",
              "carrera"
            ],
            "dificultad": "Media-Alta",
            "contenido": "# Bases NoSQL y Data Warehouses\n\nContenido proyectado para el Año 2 de la carrera."
          }
        ]
      },
      {
        "id": "08_machine_learning_scikit",
        "nombre": "Machine Learning Supervisado",
        "semestre": 3,
        "creditos": 8,
        "temas": [
          "Semana 1",
          "Semana 2",
          "Semana 3",
          "Semana 4",
          "Semana 5",
          "Semana 6",
          "Semana 7"
        ],
        "apuntes": [
          {
            "archivo": "semana_1.md",
            "titulo": "Semana 1: Machine Learning Supervisado",
            "tags": [
              "08_machine_learning_scikit",
              "proyeccion",
              "carrera"
            ],
            "dificultad": "Media-Alta",
            "contenido": "# Machine Learning Supervisado\n\nContenido proyectado para el Año 2 de la carrera."
          }
        ]
      }
    ]
  },
  {
    "ano": 3,
    "nombre": "Año 3: Inteligencia Artificial, Deep Learning y Big Data",
    "descripcion": "Módulos correspondientes al Año 3.",
    "modulos": [
      {
        "id": "09_xgboost_clustering",
        "nombre": "Métodos de Ensamble y Clustering",
        "semestre": 5,
        "creditos": 8,
        "temas": [
          "Semana 1",
          "Semana 2",
          "Semana 3",
          "Semana 4",
          "Semana 5",
          "Semana 6",
          "Semana 7"
        ],
        "apuntes": [
          {
            "archivo": "semana_1.md",
            "titulo": "Semana 1: Métodos de Ensamble y Clustering",
            "tags": [
              "09_xgboost_clustering",
              "proyeccion",
              "carrera"
            ],
            "dificultad": "Avanzada",
            "contenido": "# Métodos de Ensamble y Clustering\n\nContenido proyectado para el Año 3 de la carrera."
          }
        ]
      },
      {
        "id": "10_pytorch_deep_learning",
        "nombre": "Deep Learning con PyTorch",
        "semestre": 5,
        "creditos": 8,
        "temas": [
          "Semana 1",
          "Semana 2",
          "Semana 3",
          "Semana 4",
          "Semana 5",
          "Semana 6",
          "Semana 7"
        ],
        "apuntes": [
          {
            "archivo": "semana_1.md",
            "titulo": "Semana 1: Deep Learning con PyTorch",
            "tags": [
              "10_pytorch_deep_learning",
              "proyeccion",
              "carrera"
            ],
            "dificultad": "Avanzada",
            "contenido": "# Deep Learning con PyTorch\n\nContenido proyectado para el Año 3 de la carrera."
          }
        ]
      },
      {
        "id": "11_nlp_transformers",
        "nombre": "NLP y Transformers",
        "semestre": 5,
        "creditos": 8,
        "temas": [
          "Semana 1",
          "Semana 2",
          "Semana 3",
          "Semana 4",
          "Semana 5",
          "Semana 6",
          "Semana 7"
        ],
        "apuntes": [
          {
            "archivo": "semana_1.md",
            "titulo": "Semana 1: NLP y Transformers",
            "tags": [
              "11_nlp_transformers",
              "proyeccion",
              "carrera"
            ],
            "dificultad": "Avanzada",
            "contenido": "# NLP y Transformers\n\nContenido proyectado para el Año 3 de la carrera."
          }
        ]
      },
      {
        "id": "12_data_engineering",
        "nombre": "Pipelines de Datos con Airflow",
        "semestre": 5,
        "creditos": 8,
        "temas": [
          "Semana 1",
          "Semana 2",
          "Semana 3",
          "Semana 4",
          "Semana 5",
          "Semana 6",
          "Semana 7"
        ],
        "apuntes": [
          {
            "archivo": "semana_1.md",
            "titulo": "Semana 1: Pipelines de Datos con Airflow",
            "tags": [
              "12_data_engineering",
              "proyeccion",
              "carrera"
            ],
            "dificultad": "Avanzada",
            "contenido": "# Pipelines de Datos con Airflow\n\nContenido proyectado para el Año 3 de la carrera."
          }
        ]
      }
    ]
  },
  {
    "ano": 4,
    "nombre": "Año 4: Sistemas RAG, MLOps, Analítica Cuantitativa y Tesis",
    "descripcion": "Módulos correspondientes al Año 4.",
    "modulos": [
      {
        "id": "13_rag_vector_dbs",
        "nombre": "Sistemas RAG y Bases Vectoriales",
        "semestre": 7,
        "creditos": 8,
        "temas": [
          "Semana 1",
          "Semana 2",
          "Semana 3",
          "Semana 4",
          "Semana 5",
          "Semana 6",
          "Semana 7"
        ],
        "apuntes": [
          {
            "archivo": "semana_1.md",
            "titulo": "Semana 1: Sistemas RAG y Bases Vectoriales",
            "tags": [
              "13_rag_vector_dbs",
              "proyeccion",
              "carrera"
            ],
            "dificultad": "Avanzada",
            "contenido": "# Sistemas RAG y Bases Vectoriales\n\nContenido proyectado para el Año 4 de la carrera."
          }
        ]
      },
      {
        "id": "14_mlops_production",
        "nombre": "MLOps y Despliegue en Producción",
        "semestre": 7,
        "creditos": 8,
        "temas": [
          "Semana 1",
          "Semana 2",
          "Semana 3",
          "Semana 4",
          "Semana 5",
          "Semana 6",
          "Semana 7"
        ],
        "apuntes": [
          {
            "archivo": "semana_1.md",
            "titulo": "Semana 1: MLOps y Despliegue en Producción",
            "tags": [
              "14_mlops_production",
              "proyeccion",
              "carrera"
            ],
            "dificultad": "Avanzada",
            "contenido": "# MLOps y Despliegue en Producción\n\nContenido proyectado para el Año 4 de la carrera."
          }
        ]
      },
      {
        "id": "15_time_series_finance",
        "nombre": "Series Temporales y Modelos Cuantitativos",
        "semestre": 7,
        "creditos": 8,
        "temas": [
          "Semana 1",
          "Semana 2",
          "Semana 3",
          "Semana 4",
          "Semana 5",
          "Semana 6",
          "Semana 7"
        ],
        "apuntes": [
          {
            "archivo": "semana_1.md",
            "titulo": "Semana 1: Series Temporales y Modelos Cuantitativos",
            "tags": [
              "15_time_series_finance",
              "proyeccion",
              "carrera"
            ],
            "dificultad": "Avanzada",
            "contenido": "# Series Temporales y Modelos Cuantitativos\n\nContenido proyectado para el Año 4 de la carrera."
          }
        ]
      },
      {
        "id": "16_tesis_grado",
        "nombre": "Proyecto Final de Grado",
        "semestre": 7,
        "creditos": 8,
        "temas": [
          "Semana 1",
          "Semana 2",
          "Semana 3",
          "Semana 4",
          "Semana 5",
          "Semana 6",
          "Semana 7"
        ],
        "apuntes": [
          {
            "archivo": "semana_1.md",
            "titulo": "Semana 1: Proyecto Final de Grado",
            "tags": [
              "16_tesis_grado",
              "proyeccion",
              "carrera"
            ],
            "dificultad": "Avanzada",
            "contenido": "# Proyecto Final de Grado\n\nContenido proyectado para el Año 4 de la carrera."
          }
        ]
      }
    ]
  }
];
