/* Synthetic plant data. Not an Intertek or Intertek Alchemy product. */
window.FINDING_DATA = {
  plant: {
    name: "Cedar Valley Foods, Plant 2",
    kind: "Ready meals",
    workers: 140,
    spanishFirst: "about 60%"
  },
  people: {
    qa: "Marisol Vega",
    supervisor: "Dale Turner",
    reviewer: "Ana Ruiz",
    demoWorker: "Alex Rivera"
  },
  roster: {
    "Line 1": { "1st": 14, "2nd": 12, "3rd": 10 },
    "Line 2": { "1st": 12, "2nd": 10, "3rd": 10 },
    "Line 3": { "1st": 16, "2nd": 16, "3rd": 16 },
    "Line 4": { "1st": 8, "2nd": 8, "3rd": 8 },
    "Dock": { "1st": 6, "2nd": 4, "3rd": 4 }
  },
  roleShare: { operator: 0.7, lead: 0.2, sanitation: 0.1 },
  roles: [
    { id: "operator", label: "Operator" },
    { id: "lead", label: "Line lead" },
    { id: "sanitation", label: "Sanitation" }
  ],
  lines: ["Line 1", "Line 2", "Line 3", "Line 4", "Dock"],
  shifts: ["1st", "2nd", "3rd"],
  causes: [
    { id: "training", label: "Training gap" },
    { id: "procedure", label: "Unclear procedure" },
    { id: "equipment", label: "Equipment" }
  ],
  floorWorkers: [
    { id: "w1", name: "Luis Ortega", line: "Line 3", shift: "2nd" },
    { id: "w2", name: "Carmen Diaz", line: "Line 3", shift: "2nd" },
    { id: "w3", name: "Mateo Cruz", line: "Line 3", shift: "1st" },
    { id: "w4", name: "Sofia Ramos", line: "Line 3", shift: "1st" },
    { id: "w5", name: "Elena Vargas", line: "Line 3", shift: "3rd" },
    { id: "w6", name: "Hugo Santos", line: "Line 3", shift: "3rd" },
    { id: "w7", name: "Nina Alvarez", line: "Line 1", shift: "1st" },
    { id: "w8", name: "Jonah Blake", line: "Line 2", shift: "3rd" },
    { id: "w9", name: "Priya Shah", line: "Dock", shift: "1st" }
  ],
  findings: [
    {
      id: "F-1042",
      title: "Allergen changeover skipped the swab check before running a dairy-free batch",
      line: "Line 3",
      shift: "2nd",
      source: "Internal audit",
      severity: "High",
      ageDays: 6,
      opened: "Oct 1, 2026",
      what: "On Oct 1, Line 3 started a dairy-free batch after a cheese run. The changeover log has no swab result. An internal audit found the batch in the cooler.",
      sop: {
        code: "SOP-ALG-07",
        version: "v3",
        section: "4.2",
        title: "Allergen changeover, dairy to dairy-free",
        excerpt: [
          "4.2a Stop the line. Remove all product from the last run before you clean.",
          "4.2b Clean contact surfaces with the allergen cleaning kit. Let surfaces dry.",
          "4.2c Swab the 3 marked points. Wait for a pass result. If the swab fails, clean and swab again. Do not start.",
          "4.2d Sign the changeover log with the swab result and the time."
        ]
      },
      steps: [
        { id: "s1", en: "Stop the line and clear all product from the last run.", es: "Pare la linea y retire todo el producto de la corrida anterior.", section: "4.2a" },
        { id: "s2", en: "Clean contact surfaces with the allergen cleaning kit, then let them dry.", es: "Limpie las superficies de contacto con el kit de alergenos y dejelas secar.", section: "4.2b" },
        { id: "s3", en: "Swab the 3 marked points and wait for a pass result before you start.", es: "Tome la muestra en los 3 puntos marcados y espere un resultado aprobado antes de arrancar.", section: "4.2c" },
        { id: "s4", en: "Sign the changeover log with the swab result and the time.", es: "Firme el registro de cambio con el resultado del hisopo y la hora.", section: "4.2d" }
      ],
      questions: [
        {
          id: "q1",
          en: "What do you do if the swab fails?",
          es: "Que hace si el hisopo no pasa?",
          options: [
            { id: "a", en: "Start the line and swab later", es: "Arranque la linea y tome la muestra despues" },
            { id: "b", en: "Clean again and swab again. Do not start the line.", es: "Limpie de nuevo y tome la muestra otra vez. No arranque la linea." },
            { id: "c", en: "Skip the swab and sign the log", es: "Omita el hisopo y firme el registro" }
          ],
          correct: "b"
        },
        {
          id: "q2",
          en: "How many points do you swab?",
          es: "Cuantos puntos toma con el hisopo?",
          options: [
            { id: "a", en: "1 point", es: "1 punto" },
            { id: "b", en: "3 points", es: "3 puntos" },
            { id: "c", en: "5 points", es: "5 puntos" }
          ],
          correct: "b"
        },
        {
          id: "q3",
          en: "Where do you record the result?",
          es: "Donde registra el resultado?",
          options: [
            { id: "a", en: "A text to the supervisor", es: "Un mensaje al supervisor" },
            { id: "b", en: "The changeover log", es: "El registro de cambio" },
            { id: "c", en: "The break room board", es: "La pizarra del comedor" }
          ],
          correct: "b"
        }
      ]
    },
    {
      id: "F-1043",
      title: "Hairnet and beard net not worn at Line 1 entry",
      line: "Line 1",
      shift: "1st",
      source: "GMP walk",
      severity: "Medium",
      ageDays: 2,
      opened: "Oct 5, 2026",
      what: "A GMP walk on Oct 5 saw two people enter Line 1 with no hairnet. One person had facial hair and no beard net.",
      sop: {
        code: "SOP-GMP-02",
        version: "v5",
        section: "2.1",
        title: "Hair and beard covering at line entry",
        excerpt: [
          "2.1a Stop at the line entry mirror.",
          "2.1b Put on a clean hairnet before you step in.",
          "2.1c Add a beard net if you have facial hair.",
          "2.1d Check the person next to you and sign the entry sheet."
        ]
      },
      steps: [
        { id: "s1", en: "Stop at the line entry mirror.", es: "Detengase en el espejo de entrada a la linea.", section: "2.1a" },
        { id: "s2", en: "Put on a clean hairnet before you step in.", es: "Pongase una cofia limpia antes de entrar.", section: "2.1b" },
        { id: "s3", en: "Add a beard net if you have facial hair.", es: "Agregue una malla de barba si tiene vello facial.", section: "2.1c" },
        { id: "s4", en: "Check the person next to you and sign the entry sheet.", es: "Revise a la persona a su lado y firme la hoja de entrada.", section: "2.1d" }
      ],
      questions: [
        {
          id: "q1",
          en: "What do you put on before you enter?",
          es: "Que se pone antes de entrar?",
          options: [
            { id: "a", en: "Only gloves", es: "Solo guantes" },
            { id: "b", en: "A clean hairnet, and a beard net if needed", es: "Una cofia limpia, y malla de barba si hace falta" },
            { id: "c", en: "A jacket from home", es: "Una chaqueta de casa" }
          ],
          correct: "b"
        },
        {
          id: "q2",
          en: "When do you need a beard net?",
          es: "Cuando necesita malla de barba?",
          options: [
            { id: "a", en: "Only on Fridays", es: "Solo los viernes" },
            { id: "b", en: "If you have facial hair", es: "Si tiene vello facial" },
            { id: "c", en: "Never", es: "Nunca" }
          ],
          correct: "b"
        },
        {
          id: "q3",
          en: "Where do you sign?",
          es: "Donde firma?",
          options: [
            { id: "a", en: "The entry sheet", es: "La hoja de entrada" },
            { id: "b", en: "The break room board", es: "La pizarra del comedor" },
            { id: "c", en: "You do not sign", es: "No firma" }
          ],
          correct: "a"
        }
      ]
    },
    {
      id: "F-1044",
      title: "Pre-op ATP swab failed on the slicer, line started anyway",
      line: "Line 2",
      shift: "3rd",
      source: "Near miss",
      severity: "High",
      ageDays: 1,
      opened: "Oct 6, 2026",
      what: "The 3rd shift pre-op ATP swab on the slicer failed. The line started. A lead caught it after 10 minutes and held the product.",
      sop: {
        code: "SOP-SAN-11",
        version: "v2",
        section: "3.4",
        title: "Pre-op ATP swab before start-up",
        excerpt: [
          "3.4a Swab the slicer at the marked spot before start-up.",
          "3.4b Read the ATP result. A fail means do not start.",
          "3.4c Reclean the slicer and swab again after a fail.",
          "3.4d Write the pass result and time on the pre-op log."
        ]
      },
      steps: [
        { id: "s1", en: "Swab the slicer at the marked spot before start-up.", es: "Tome la muestra ATP en el punto marcado de la rebanadora antes de arrancar.", section: "3.4a" },
        { id: "s2", en: "Read the ATP result. A fail means do not start.", es: "Lea el resultado ATP. Si falla, no arranque.", section: "3.4b" },
        { id: "s3", en: "Reclean the slicer and swab again after a fail.", es: "Limpie la rebanadora otra vez y tome una nueva muestra si falla.", section: "3.4c" },
        { id: "s4", en: "Write the pass result and time on the pre-op log.", es: "Escriba el resultado aprobado y la hora en el registro de preoperacion.", section: "3.4d" }
      ],
      questions: [
        {
          id: "q1",
          en: "What do you do if the ATP swab fails?",
          es: "Que hace si la muestra ATP falla?",
          options: [
            { id: "a", en: "Start and tell QA later", es: "Arranque y avise a calidad despues" },
            { id: "b", en: "Do not start. Reclean and swab again.", es: "No arranque. Limpie de nuevo y tome otra muestra." },
            { id: "c", en: "Wipe the meter and start", es: "Limpie el medidor y arranque" }
          ],
          correct: "b"
        },
        {
          id: "q2",
          en: "When do you swab the slicer?",
          es: "Cuando toma la muestra de la rebanadora?",
          options: [
            { id: "a", en: "Before start-up", es: "Antes de arrancar" },
            { id: "b", en: "At the first break", es: "En el primer descanso" },
            { id: "c", en: "Only if QA is watching", es: "Solo si calidad esta mirando" }
          ],
          correct: "a"
        },
        {
          id: "q3",
          en: "Where do you write the pass result?",
          es: "Donde escribe el resultado aprobado?",
          options: [
            { id: "a", en: "The pre-op log", es: "El registro de preoperacion" },
            { id: "b", en: "A sticky note", es: "Una nota adhesiva" },
            { id: "c", en: "You remember it", es: "Lo recuerda" }
          ],
          correct: "a"
        }
      ]
    },
    {
      id: "F-1045",
      title: "Forklift crossed the pedestrian lane near the cooler dock",
      line: "Dock",
      shift: "1st",
      source: "Near miss",
      severity: "Medium",
      ageDays: 9,
      opened: "Sep 28, 2026",
      what: "A forklift crossed the pedestrian lane near the cooler dock while two people were walking. No one was hit. The driver did not report it until the next day.",
      sop: {
        code: "SOP-SAF-05",
        version: "v4",
        section: "1.3",
        title: "Forklift crossing at the pedestrian lane",
        excerpt: [
          "1.3a Stop the forklift before the pedestrian lane.",
          "1.3b Look both ways and wait until the lane is clear.",
          "1.3c Cross only at the marked gap.",
          "1.3d Report a near miss before the shift ends."
        ]
      },
      steps: [
        { id: "s1", en: "Stop the forklift before the pedestrian lane.", es: "Detenga el montacargas antes del pasillo peatonal.", section: "1.3a" },
        { id: "s2", en: "Look both ways and wait until the lane is clear.", es: "Mire a ambos lados y espere a que el pasillo este libre.", section: "1.3b" },
        { id: "s3", en: "Cross only at the marked gap.", es: "Cruce solo por el espacio marcado.", section: "1.3c" },
        { id: "s4", en: "Report a near miss before the shift ends.", es: "Reporte un casi accidente antes de que termine el turno.", section: "1.3d" }
      ],
      questions: [
        {
          id: "q1",
          en: "Where do you stop the forklift?",
          es: "Donde detiene el montacargas?",
          options: [
            { id: "a", en: "Inside the pedestrian lane", es: "Dentro del pasillo peatonal" },
            { id: "b", en: "Before the pedestrian lane", es: "Antes del pasillo peatonal" },
            { id: "c", en: "At the cooler door", es: "En la puerta del cuarto frio" }
          ],
          correct: "b"
        },
        {
          id: "q2",
          en: "When can you cross?",
          es: "Cuando puede cruzar?",
          options: [
            { id: "a", en: "When the lane is clear, at the marked gap", es: "Cuando el pasillo este libre, por el espacio marcado" },
            { id: "b", en: "If you honk and keep moving", es: "Si toca la bocina y sigue" },
            { id: "c", en: "Any time the dock is busy", es: "Cuando el muelle esta ocupado" }
          ],
          correct: "a"
        },
        {
          id: "q3",
          en: "When do you report a near miss?",
          es: "Cuando reporta un casi accidente?",
          options: [
            { id: "a", en: "Next week", es: "La proxima semana" },
            { id: "b", en: "Before the shift ends", es: "Antes de que termine el turno" },
            { id: "c", en: "Only if someone is hurt", es: "Solo si alguien sale herido" }
          ],
          correct: "b"
        }
      ]
    }
  ]
};
