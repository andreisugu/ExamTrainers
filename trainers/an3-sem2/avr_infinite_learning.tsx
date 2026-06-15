import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Play, CheckCircle, XCircle, BookOpen, RotateCcw, Code } from 'lucide-react';

// --- SKELETON DE BAZĂ (HELLO WORLD) ---
const helloWorldSkeleton = `#include <avr/io.h>
#include <avr/interrupt.h>

int main(void) {
    // Scrie codul de inițializare aici
    
    
    while(1) {
        // Bucla principală
        
    }
    return 0;
}`;

// --- DATA & PROBLEM GENERATORS ---

const getTimer2CSBits = (p: number): string[] => {
  switch(p) {
    case 1: return ["CS20"];
    case 8: return ["CS21"];
    case 32: return ["CS20", "CS21"];
    case 64: return ["CS22"];
    case 128: return ["CS20", "CS22"];
    case 256: return ["CS21", "CS22"];
    case 1024: return ["CS20", "CS21", "CS22"];
    default: return [];
  }
};

const generateProblem1 = () => {
  let ms = 0;
  let validOptions: { p: number, n: number }[] = [];
  while (validOptions.length === 0) {
    ms = Math.floor(Math.random() * 260) + 1; // 1 to 260 ms
    for (let p of [1, 8, 32, 64, 128, 256, 1024]) {
      const n = (ms * 1000) / p;
      if (Number.isInteger(n) && n >= 1 && n <= 256) {
        validOptions.push({ p, n });
      }
    }
  }

  const checks = [
    { regex: /^(?!.*_delay_)(?!.*delay_ms)(?!.*delay_us)/, desc: "Respectarea regulilor de bază: Nu folosi întârzieri software (_delay_ms, _delay_us, etc.) - folosește exclusiv Timere." },
    { regex: /(?:TCCR2\s*\|?=\s*.*WGM21|setbit\s*\(\s*TCCR2\s*,\s*WGM21\s*\))/, desc: "Setează bitul WGM21 în TCCR2 pentru modul CTC." },
    {
      test: (code: string) => {
        const hasCS20 = /setbit\s*\(\s*TCCR2\s*,\s*CS20\s*\)|TCCR2\s*\|?=\s*(?:[^;]*\bCS20\b)/.test(code);
        const hasCS21 = /setbit\s*\(\s*TCCR2\s*,\s*CS21\s*\)|TCCR2\s*\|?=\s*(?:[^;]*\bCS21\b)/.test(code);
        const hasCS22 = /setbit\s*\(\s*TCCR2\s*,\s*CS22\s*\)|TCCR2\s*\|?=\s*(?:[^;]*\bCS22\b)/.test(code);
        
        let p = 0;
        if (hasCS20 && !hasCS21 && !hasCS22) p = 1;
        else if (!hasCS20 && hasCS21 && !hasCS22) p = 8;
        else if (hasCS20 && hasCS21 && !hasCS22) p = 32;
        else if (!hasCS20 && !hasCS21 && hasCS22) p = 64;
        else if (hasCS20 && !hasCS21 && hasCS22) p = 128;
        else if (!hasCS20 && hasCS21 && hasCS22) p = 256;
        else if (hasCS20 && hasCS21 && hasCS22) p = 1024;
        
        if (p === 0) return false;
        
        const n = (ms * 1000) / p;
        return Number.isInteger(n) && n >= 1 && n <= 256;
      },
      desc: `Setează un prescaler valid în TCCR2 (1, 8, 32, 64, 128, 256, 1024) care oferă o divizare exactă pentru ${ms} ms.`
    },
    {
      test: (code: string) => {
        const hasCS20 = /setbit\s*\(\s*TCCR2\s*,\s*CS20\s*\)|TCCR2\s*\|?=\s*(?:[^;]*\bCS20\b)/.test(code);
        const hasCS21 = /setbit\s*\(\s*TCCR2\s*,\s*CS21\s*\)|TCCR2\s*\|?=\s*(?:[^;]*\bCS21\b)/.test(code);
        const hasCS22 = /setbit\s*\(\s*TCCR2\s*,\s*CS22\s*\)|TCCR2\s*\|?=\s*(?:[^;]*\bCS22\b)/.test(code);
        
        let p = 0;
        if (hasCS20 && !hasCS21 && !hasCS22) p = 1;
        else if (!hasCS20 && hasCS21 && !hasCS22) p = 8;
        else if (hasCS20 && hasCS21 && !hasCS22) p = 32;
        else if (!hasCS20 && !hasCS21 && hasCS22) p = 64;
        else if (hasCS20 && !hasCS21 && hasCS22) p = 128;
        else if (!hasCS20 && hasCS21 && hasCS22) p = 256;
        else if (hasCS20 && hasCS21 && hasCS22) p = 1024;
        
        if (p === 0) return false;
        
        const n = (ms * 1000) / p;
        if (!Number.isInteger(n) || n < 1 || n > 256) return false;
        
        const ocr = n - 1;
        const ocrRegex = new RegExp(`OCR2\\s*=\\s*${ocr}\\s*;`);
        return ocrRegex.test(code);
      },
      desc: "Calculează N (N = timp_us / prescaler) și setează registrul OCR2 la valoarea corectă N - 1 pentru prescalerul ales."
    },
    { regex: /(?:TIMSK\s*\|?=\s*.*OCIE2|setbit\s*\(\s*TIMSK\s*,\s*OCIE2\s*\))/, desc: "Activează întreruperea Compare Match pentru Timer 2 (OCIE2 în TIMSK)." },
    { regex: /sei\s*\(\s*\)\s*;/, desc: "Activează întreruperile globale folosind sei();" }
  ];

  const guideOptionsText = validOptions.map(opt => {
    const bits = getTimer2CSBits(opt.p).join(', ');
    return `  * Prescaler p = ${opt.p} (${bits}) => N = ${ms * 1000} / ${opt.p} = ${opt.n} pași => OCR2 = ${opt.n - 1}`;
  }).join('\n');
  const guide = `Regula de Aur a Examenului (Matematica Timerelor):\nFormula: T_cycle = p * N * T_CLK_CPU\n- T_CLK_CPU = 1us (la F_osc = 1 MHz)\n- Pentru T_cycle = ${ms}ms (${ms * 1000}us), ecuația devine: ${ms * 1000} = p * N\n\nPrescalerele matematice valide pentru acest interval (N <= 256, întreg) sunt:\n${guideOptionsText}\n\nConfigurare: Timer 2 CTC folosește WGM21=1. Întreruperea se activează prin OCIE2=1 (în TIMSK). Activează întreruperile globale cu sei();`;

  const chosen = validOptions[0];
  const p = chosen.p;
  const n = chosen.n;
  const ocr = n - 1;
  const csBits = getTimer2CSBits(p);
  const solutionCSSets = csBits.map(bit => `setbit(TCCR2, ${bit});`).join('\n    ');

  return {
    type: 'Timer 2 CTC',
    title: 'Ceasul Sistemului (Timer 2 CTC)',
    task: `Configurează Timer 2 în modul CTC pentru a genera o întrerupere la fiecare ${ms} ms.\nFrecvența procesorului este 1 MHz. Alege un prescaler potrivit din cele disponibile pentru acest timer, astfel încât valoarea numărată N să fie un număr întreg mai mic sau egal cu 256.\nScrie logica în fișierul gol (poți crea o funcție separată de inițializare sau o poți pune direct în main).`,
    skeleton: helloWorldSkeleton,
    checks: checks,
    guide: guide,
    solution: `// Exemplu de rezolvare (folosind p = ${p} cu OCR2 = ${ocr}):\nvoid init_timer2() {\n    OCR2 = ${ocr};\n    setbit(TCCR2, WGM21);\n    ${solutionCSSets}\n    setbit(TIMSK, OCIE2);\n    sei();\n}\n\nint main(void) {\n    init_timer2();\n    while(1) {}\n    return 0;\n}`
  };
};

const generateProblem2 = () => {
  const percent = [25, 50, 75, 100][Math.floor(Math.random() * 4)];
  const rawOcr = Math.floor((percent / 100) * 255);
  const ocr = percent === 100 ? 254 : rawOcr; // Simulator bug fix
  
  return {
    type: 'Timer 0 Fast PWM',
    title: 'Variația Intensității (Timer 0 Fast PWM)',
    task: `Inițializează Timer 0 în modul Fast PWM (Non-Inverting) pentru a comanda luminozitatea unui LED. \nSetează un factor de umplere de ${percent}%.\nFolosește un prescaler de 8. Semnalul de ieșire este pe pinul PB3 (OC0).`,
    skeleton: helloWorldSkeleton,
    checks: [
      { regex: /^(?!.*_delay_)(?!.*delay_ms)(?!.*delay_us)/, desc: "Respectarea regulilor de bază: Nu folosi întârzieri software (_delay_ms, _delay_us, etc.) - folosește exclusiv Timere." },
      { regex: /(?:DDRB\s*\|?=\s*.*1\s*<<\s*(?:PB)?3|setbit\s*\(\s*DDRB\s*,\s*(?:PB)?3\s*\))/, desc: "Setează pinul PB3 ca ieșire în DDRB (Obligatoriu pentru hardware PWM pe Timer 0)." },
      { regex: /(?:TCCR0\s*\|?=\s*.*WGM00|setbit\s*\(\s*TCCR0\s*,\s*WGM00\s*\))/, desc: "Setează bitul WGM00 în TCCR0 pentru Fast PWM." },
      { regex: /(?:TCCR0\s*\|?=\s*.*WGM01|setbit\s*\(\s*TCCR0\s*,\s*WGM01\s*\))/, desc: "Setează bitul WGM01 în TCCR0 pentru Fast PWM." },
      { regex: /(?:TCCR0\s*\|?=\s*.*COM01|setbit\s*\(\s*TCCR0\s*,\s*COM01\s*\))/, desc: "Setează bitul COM01 pentru modul Non-Inverting." },
      { regex: /(?:TCCR0\s*\|?=\s*.*CS01|setbit\s*\(\s*TCCR0\s*,\s*CS01\s*\))/, desc: "Setează bitul CS01 pentru prescaler de 8." },
      { regex: new RegExp(`OCR0\\s*=\\s*${ocr}\\s*;`), desc: `Calculează factorul de umplere (${percent}% din 255 = ${ocr}) și pune-l în OCR0.` }
    ],
    guide: `Pinul de ieșire hardware pentru Timer 0 este PB3 (OC0). Trebuie făcut Ieșire în DDRB.\nMod Fast PWM: WGM00=1, WGM01=1.\nMod Non-Inverting: COM01=1.\nPrescaler 8: CS01=1.\nValoare OCR0 = (${percent}/100) * 255 = ${ocr} ${percent === 100 ? '(Atenție: SimulIDE dă eroare la 255, folosim 254)' : ''}.\n*Notă Examen: Timer 0 este folosit doar pentru Fast PWM (nu în CTC, conform erorilor de simulator).`,
    solution: `void init_pwm_timer0() {\n    setbit(DDRB, 3);\n    setbit(TCCR0, WGM00);\n    setbit(TCCR0, WGM01);\n    setbit(TCCR0, COM01);\n    setbit(TCCR0, CS01);\n    OCR0 = ${ocr};\n}\n\nint main(void) {\n    init_pwm_timer0();\n    while(1) {}\n    return 0;\n}`
  };
};

const generateProblem3 = () => {
  const pinNum = Math.floor(Math.random() * 8);
  const port = ["PINB", "PINC", "PIND"][Math.floor(Math.random() * 3)];

  return {
    type: 'Debouncing',
    title: 'Mașina de Stări pentru Buton (Debouncing)',
    task: `Scrie o funcție \`unsigned char push_detect(void)\` care să verifice un buton conectat la ${port}, pinul ${pinNum}, activ pe 0 (când este apăsat devine 0).\nTimpul de debouncing cerut este de 20ms. Funcția se bazează pe o variabilă externă \`milisecunde\`. Începe de la zero direct în fișierul de mai jos.`,
    skeleton: helloWorldSkeleton,
    checks: [
      { regex: /^(?!.*_delay_)(?!.*delay_ms)(?!.*delay_us)/, desc: "Respectarea regulilor de bază: Nu folosi întârzieri software (_delay_ms, _delay_us, etc.) - folosește exclusiv Timere." },
      { regex: new RegExp(`(?:${port}\\s*&\\s*\\(?\\s*1\\s*<<\\s*${pinNum}\\s*\\)?|testbit\\s*\\(\\s*${port}\\s*,\\s*${pinNum}\\s*\\))`), desc: `Folosește corect mascarea pentru a citi pinul ${pinNum} din ${port} (ex. PINx & (1<<y)).` },
      { regex: /milisecunde\s*-\s*timp_start\s*\)?\s*>=\s*20/, desc: "Verifică trecerea a 20 de milisecunde pentru debouncing." },
      { regex: /case\s*2\s*:/, desc: "Implementează starea 2: așteaptă eliberarea butonului." },
      { regex: /case\s*3\s*:/, desc: "Implementează starea 3: validează eliberarea timp de 20ms." }
    ],
    guide: `Ai nevoie de un \`switch(stare)\` cu stările 0, 1, 2, 3.\nStarea 0: Buton neapăsat. Verifici dacă se apasă: (PIN & (1<<x)) == 0.\nStarea 1: Aștepți 20ms: (milisecunde - timp_start) >= 20. Returnezi 1 dacă e valid.\nStarea 2: Buton apăsat. Aștepți să se elibereze: (PIN & (1<<x)) != 0.\nStarea 3: Aștepți 20ms ca eliberarea să fie stabilă.\n*Notă Examen: Orice întârziere (20ms) se bazează exclusiv pe variabila globală 'milisecunde' actualizată de timer, delay-urile software fiind strict interzise.`,
    solution: `volatile unsigned int milisecunde = 0;\n\nunsigned char push_detect(void) {\n    static unsigned char stare = 0;\n    static unsigned int timp_start = 0;\n\n    switch(stare) {\n        case 0:\n            if (testbit(${port}, ${pinNum}) == 0) {\n                timp_start = milisecunde;\n                stare = 1;\n            }\n            break;\n        case 1:\n            if (testbit(${port}, ${pinNum}) != 0) {\n                stare = 0;\n            }\n            else if ((milisecunde - timp_start) >= 20) {\n                stare = 2;\n                return 1;\n            }\n            break;\n        case 2:\n            if (testbit(${port}, ${pinNum}) != 0) {\n                timp_start = milisecunde;\n                stare = 3;\n            }\n            break;\n        case 3:\n            if (testbit(${port}, ${pinNum}) == 0) {\n                stare = 2;\n            }\n            else if ((milisecunde - timp_start) >= 20) {\n                stare = 0;\n            }\n            break;\n    }\n    return 0;\n}\n\nint main(void) {\n    while(1) {}\n    return 0;\n}`
  };
};

const generateProblem4 = () => {
  return {
    type: 'Integrare',
    title: 'Structura Principală (Main Loop & ISR)',
    task: `Construiește arhitectura principală a programului:\n1. Declară variabila globală pentru milisecunde.\n2. Scrie rutina de întrerupere (ISR) pentru Timer 2.\n3. În main(), inițializează PC7 ca ieșire și creează bucla infinită unde se apelează \`push_detect()\` (presupune că funcția este definită deja). Schimbă starea (Toggle) pinului PC7 la o apăsare validă.`,
    skeleton: helloWorldSkeleton,
    checks: [
      { regex: /^(?!.*_delay_)(?!.*delay_ms)(?!.*delay_us)/, desc: "Respectarea regulilor de bază: Nu folosi întârzieri software (_delay_ms, _delay_us, etc.) - folosește exclusiv Timere." },
      { regex: /volatile\s+(?:unsigned\s+)?(?:int|long|short)\s+milisecunde\s*(?:=\s*0)?\s*;/, desc: "Declară variabila globală `milisecunde` folosind cuvântul cheie `volatile`." },
      { regex: /ISR\s*\(\s*TIMER2_COMP_vect\s*\)/, desc: "Definește corect vectorul de întrerupere pentru Timer 2: `ISR(TIMER2_COMP_vect)`." },
      { regex: /milisecunde\s*\+\+\s*;/, desc: "Incrementează variabila milisecunde în interiorul ISR-ului." },
      { regex: /if\s*\(\s*push_detect\s*\(\s*\)\s*==\s*1\s*\)/, desc: "Apelează funcția push_detect() în interiorul buclei while(1)." },
      { regex: /(?:PORTC\s*\^=\s*\(?\s*1\s*<<\s*7\s*\)?|PORTC\s*=\s*PORTC\s*\^\s*\(?\s*1\s*<<\s*7\s*\)?|setbit\s*\(\s*PORTC\s*,\s*7\s*\)|clrbit\s*\(\s*PORTC\s*,\s*7\s*\))/, desc: "Comută (Toggle / XOR) pinul PC7 la detectarea apăsării cu XOR (^=)." }
    ],
    guide: `1. Variabilele modificate în ISR și citite în main() trebuie declarate cu 'volatile' (ex: volatile unsigned int milisecunde).\n2. Vectorul pentru Timer 2 la Compare Match este TIMER2_COMP_vect.\n3. Toggle-ul unui pin se face rapid cu operația bitwise XOR (^=). Exemplu: PORTC ^= (1 << 7);`,
    solution: `volatile unsigned int milisecunde = 0;\n\nISR(TIMER2_COMP_vect) {\n    milisecunde++;\n}\n\n// Funcție de formă, ca să compileze mental\nunsigned char push_detect(void) { return 0; }\n\nint main(void) {\n    setbit(DDRC, 7);\n    \n    while(1) {\n        if (push_detect() == 1) {\n            PORTC ^= (1 << 7);\n        }\n    }\n    return 0;\n}`
  };
};

const getTimer1CSBits = (p: number): string[] => {
  switch(p) {
    case 1: return ["CS10"];
    case 8: return ["CS11"];
    case 64: return ["CS10", "CS11"];
    case 256: return ["CS12"];
    case 1024: return ["CS10", "CS12"];
    default: return [];
  }
};

const generateProblem5 = () => {
  let ms = 0;
  let validOptions: { p: number, n: number }[] = [];
  while (validOptions.length === 0) {
    // Pick a random ms from 10 to 2000 ms, rounded to multiples of 10 to favor even division
    ms = (Math.floor(Math.random() * 200) + 1) * 10;
    for (let p of [1, 8, 64, 256, 1024]) {
      const n = (ms * 1000) / p;
      if (Number.isInteger(n) && n >= 1 && n <= 65536) {
        validOptions.push({ p, n });
      }
    }
  }

  const checksList = [
    { regex: /^(?!.*_delay_)(?!.*delay_ms)(?!.*delay_us)/, desc: "Respectarea regulilor de bază: Nu folosi întârzieri software (_delay_ms, _delay_us, etc.) - folosește exclusiv Timere." },
    { regex: /(?:TCCR1B\s*\|?=\s*.*WGM12|setbit\s*\(\s*TCCR1B\s*,\s*WGM12\s*\))/, desc: "Setează bitul WGM12 în TCCR1B pentru modul CTC." },
    {
      test: (code: string) => {
        const hasCS10 = /setbit\s*\(\s*TCCR1B\s*,\s*CS10\s*\)|TCCR1B\s*\|?=\s*(?:[^;]*\bCS10\b)/.test(code);
        const hasCS11 = /setbit\s*\(\s*TCCR1B\s*,\s*CS11\s*\)|TCCR1B\s*\|?=\s*(?:[^;]*\bCS11\b)/.test(code);
        const hasCS12 = /setbit\s*\(\s*TCCR1B\s*,\s*CS12\s*\)|TCCR1B\s*\|?=\s*(?:[^;]*\bCS12\b)/.test(code);
        
        let p = 0;
        if (hasCS10 && !hasCS11 && !hasCS12) p = 1;
        else if (!hasCS10 && hasCS11 && !hasCS12) p = 8;
        else if (hasCS10 && hasCS11 && !hasCS12) p = 64;
        else if (!hasCS10 && !hasCS11 && hasCS12) p = 256;
        else if (hasCS10 && !hasCS11 && hasCS12) p = 1024;
        
        if (p === 0) return false;
        
        const n = (ms * 1000) / p;
        return Number.isInteger(n) && n >= 1 && n <= 65536;
      },
      desc: `Setează un prescaler valid în TCCR1B (1, 8, 64, 256, 1024) care oferă o divizare exactă pentru ${ms} ms.`
    },
    {
      test: (code: string) => {
        const hasCS10 = /setbit\s*\(\s*TCCR1B\s*,\s*CS10\s*\)|TCCR1B\s*\|?=\s*(?:[^;]*\bCS10\b)/.test(code);
        const hasCS11 = /setbit\s*\(\s*TCCR1B\s*,\s*CS11\s*\)|TCCR1B\s*\|?=\s*(?:[^;]*\bCS11\b)/.test(code);
        const hasCS12 = /setbit\s*\(\s*TCCR1B\s*,\s*CS12\s*\)|TCCR1B\s*\|?=\s*(?:[^;]*\bCS12\b)/.test(code);
        
        let p = 0;
        if (hasCS10 && !hasCS11 && !hasCS12) p = 1;
        else if (!hasCS10 && hasCS11 && !hasCS12) p = 8;
        else if (hasCS10 && hasCS11 && !hasCS12) p = 64;
        else if (!hasCS10 && !hasCS11 && hasCS12) p = 256;
        else if (hasCS10 && !hasCS11 && hasCS12) p = 1024;
        
        if (p === 0) return false;
        
        const n = (ms * 1000) / p;
        if (!Number.isInteger(n) || n < 1 || n > 65536) return false;
        
        const ocr = n - 1;
        const ocrRegex = new RegExp(`OCR1A\\s*=\\s*${ocr}\\s*;`);
        return ocrRegex.test(code);
      },
      desc: "Calculează N (N = timp_us / prescaler) și setează registrul OCR1A la valoarea corectă N - 1 pentru prescalerul ales."
    },
    { regex: /(?:TIMSK\s*\|?=\s*.*OCIE1A|setbit\s*\(\s*TIMSK\s*,\s*OCIE1A\s*\))/, desc: "Activează întreruperea Compare Match A pentru Timer 1 (OCIE1A în TIMSK)." },
    { regex: /sei\s*\(\s*\)\s*;/, desc: "Activează întreruperile globale folosind sei();" }
  ];

  const guideOptionsText = validOptions.map(opt => {
    const bits = getTimer1CSBits(opt.p).join(', ');
    return `  * Prescaler p = ${opt.p} (${bits}) => N = ${ms * 1000} / ${opt.p} = ${opt.n} pași => OCR1A = ${opt.n - 1}`;
  }).join('\n');
  const guide = `Regula de Aur a Examenului (Matematica Timerelor):\nFormula: T_cycle = p * N * T_CLK_CPU\n- T_CLK_CPU = 1us (la F_osc = 1 MHz)\n- Pentru T_cycle = ${ms}ms (${ms * 1000}us), ecuația devine: ${ms * 1000} = p * N\n\nPrescalerele matematice valide pentru acest interval (N <= 65536, întreg) sunt:\n${guideOptionsText}\n\nConfigurare CTC: WGM12=1 (în TCCR1B). Prescalerul se alege din cele de mai sus. Activare întrerupere Compare Match A: OCIE1A=1 în TIMSK. Activează întreruperile globale cu sei();`;

  const chosen = validOptions[0];
  const p = chosen.p;
  const n = chosen.n;
  const ocr = n - 1;
  const csBits = getTimer1CSBits(p);
  const solutionCSSets = csBits.map(bit => `setbit(TCCR1B, ${bit});`).join('\n    ');

  return {
    type: 'Timer 1 CTC',
    title: 'Timp Mare ("Tancul" - Timer 1 CTC)',
    task: `Configurează Timer 1 (pe 16-biți) în modul CTC pentru a genera o întrerupere la fiecare ${ms} ms (pentru amânări lungi).\nFrecvența procesorului este 1 MHz. Alege un prescaler potrivit din cele disponibile pentru acest timer, astfel încât valoarea numărată N să fie un număr întreg mai mic sau egal cu 65536.\nScrie logica completă în \`main\`.`,
    skeleton: helloWorldSkeleton,
    checks: checksList,
    guide: guide,
    solution: `// Exemplu de rezolvare (folosind p = ${p} cu OCR1A = ${ocr}):\nvoid init_timer1() {\n    OCR1A = ${ocr};\n    setbit(TCCR1B, WGM12);\n    ${solutionCSSets}\n    setbit(TIMSK, OCIE1A);\n    sei();\n}\n\nint main(void) {\n    init_timer1();\n    while(1) {}\n    return 0;\n}`
  };
};

const generateProblem6 = () => {
  const percent = [25, 50, 75][Math.floor(Math.random() * 3)];
  const ocr = Math.floor((percent / 100) * 255);

  return {
    type: 'Timer 1 Fast PWM',
    title: 'Semnal PWM cu Timer 1 (8-bit Fast PWM)',
    task: `Inițializează Timer 1 în modul Fast PWM 8-bit (Non-Inverting) pentru a genera semnal PWM pe pinul PD5 (OC1A).\nSetează un factor de umplere de ${percent}%.\nFolosește un prescaler de 64.`,
    skeleton: helloWorldSkeleton,
    checks: [
      { regex: /^(?!.*_delay_)(?!.*delay_ms)(?!.*delay_us)/, desc: "Respectarea regulilor de bază: Nu folosi întârzieri software (_delay_ms, _delay_us, etc.) - folosește exclusiv Timere." },
      { regex: /(?:DDRD\s*\|?=\s*.*1\s*<<\s*(?:PD)?5|setbit\s*\(\s*DDRD\s*,\s*(?:PD)?5\s*\))/, desc: "Setează pinul PD5 (OC1A) ca ieșire în DDRD." },
      { regex: /(?:TCCR1A\s*\|?=\s*.*WGM10|setbit\s*\(\s*TCCR1A\s*,\s*WGM10\s*\))/, desc: "Setează WGM10 în TCCR1A pentru Fast PWM 8-bit." },
      { regex: /(?:TCCR1B\s*\|?=\s*.*WGM12|setbit\s*\(\s*TCCR1B\s*,\s*WGM12\s*\))/, desc: "Setează WGM12 în TCCR1B pentru Fast PWM 8-bit." },
      { regex: /(?:TCCR1A\s*\|?=\s*.*COM1A1|setbit\s*\(\s*TCCR1A\s*,\s*COM1A1\s*\))/, desc: "Setează COM1A1 în TCCR1A pentru modul Non-Inverting pe OC1A." },
      { regex: /(?:TCCR1B\s*\|?=\s*.*CS11|setbit\s*\(\s*TCCR1B\s*,\s*CS11\s*\))/, desc: "Setează CS11 în TCCR1B pentru prescaler de 64." },
      { regex: /(?:TCCR1B\s*\|?=\s*.*CS10|setbit\s*\(\s*TCCR1B\s*,\s*CS10\s*\))/, desc: "Setează CS10 în TCCR1B pentru prescaler de 64." },
      { regex: new RegExp(`OCR1A\\s*=\\s*${ocr}\\s*;`), desc: `Calculează valoarea pentru ${percent}% (${ocr}) și o pune în OCR1A.` }
    ],
    guide: `Timer 1, deși are 16-biți, poate opera în mod Fast PWM 8-bit. Aceasta necesită WGM10=1 (TCCR1A) și WGM12=1 (TCCR1B).\nModul Non-Inverting pe canalul A cere COM1A1=1 (TCCR1A).\nPrescaler 64 necesită CS11=1 și CS10=1 (TCCR1B).\nPinul de ieșire hardware pentru canalul A (OC1A) este PD5, deci DDRD trebuie setat corespunzător.\nOCR1A va dicta Duty Cycle-ul: ${percent}% din 255 este ${ocr}.`,
    solution: `void init_pwm_timer1() {\n    setbit(DDRD, 5);\n    // Fast PWM 8-bit (WGM10 + WGM12), Non-Inverting (COM1A1)\n    setbit(TCCR1A, WGM10);\n    setbit(TCCR1A, COM1A1);\n    // Prescaler 64 (CS11 + CS10)\n    setbit(TCCR1B, WGM12);\n    setbit(TCCR1B, CS11);\n    setbit(TCCR1B, CS10);\n    \n    OCR1A = ${ocr};\n}\n\nint main(void) {\n    init_pwm_timer1();\n    while(1) {}\n    return 0;\n}`
  };
};

const problemGenerators = [generateProblem1, generateProblem2, generateProblem3, generateProblem4, generateProblem5, generateProblem6];

// --- SYNTAX HIGHLIGHTER ---
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlightC(code) {
  let res = "";
  let i = 0;
  while (i < code.length) {
    // Comentariu Multi-linie
    if (code.startsWith("/*", i)) {
      let end = code.indexOf("*/", i + 2);
      if (end === -1) end = code.length; else end += 2;
      res += `<span class="text-[#6A9955] italic">${escapeHtml(code.slice(i, end))}</span>`;
      i = end; continue;
    }
    // Comentariu Single-linie
    if (code.startsWith("//", i)) {
      let end = code.indexOf("\n", i + 2);
      if (end === -1) end = code.length;
      res += `<span class="text-[#6A9955] italic">${escapeHtml(code.slice(i, end))}</span>`;
      i = end; continue;
    }
    // Directive Preprocesor (#include, #define)
    if (code[i] === '#' && (i === 0 || code[i-1] === '\n')) {
      let end = code.indexOf("\n", i + 1);
      if (end === -1) end = code.length;
      res += `<span class="text-[#C586C0]">${escapeHtml(code.slice(i, end))}</span>`;
      i = end; continue;
    }
    // String-uri ("...")
    if (code[i] === '"') {
      let end = i + 1;
      while(end < code.length && (code[end] !== '"' || code[end-1] === '\\')) end++;
      if (end < code.length) end++;
      res += `<span class="text-[#CE9178]">${escapeHtml(code.slice(i, end))}</span>`;
      i = end; continue;
    }
    // Numere (decimale sau hexazecimale)
    if (/\d/.test(code[i]) || (code[i] === '.' && i+1<code.length && /\d/.test(code[i+1]))) {
      let match = code.slice(i).match(/^(0x[0-9a-fA-F]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(?:[uUlLfF]+)?)/);
      if (match) {
         res += `<span class="text-[#B5CEA8]">${match[0]}</span>`;
         i += match[0].length; continue;
      }
    }
    // Cuvinte (Cuvinte cheie, tipuri, funcții, registre)
    if (/[a-zA-Z_]/.test(code[i])) {
      let match = code.slice(i).match(/^[a-zA-Z_]\w*/);
      if (match) {
        let word = match[0];
        let nextStr = code.slice(i + word.length);
        let isFunction = /^\s*\(/.test(nextStr);
        let spanClass = "text-[#D4D4D4]";
        
        const keywordsControl = ['if','else','while','for','switch','case','break','return'];
        const keywordsType = ['int','char','void','long','short','float','double','volatile','static','unsigned'];
        
        if (keywordsControl.includes(word)) {
           spanClass = "text-[#C586C0] font-semibold";
        } else if (keywordsType.includes(word)) {
           spanClass = "text-[#569CD6]";
        } else if (word === 'ISR') {
           spanClass = "text-[#C586C0] font-bold";
        } else if (/^[A-Z][A-Z0-9_]*$/.test(word)) {
           spanClass = "text-[#4FC1FF] font-mono"; // Registre si Macrouri AVR
        } else if (isFunction) {
           spanClass = "text-[#DCDCAA]"; // Functii
        } else {
           spanClass = "text-[#9CDCFE]"; // Variabile clasice
        }
        
        res += `<span class="${spanClass}">${word}</span>`;
        i += word.length; continue;
      }
    }
    // Operatori C
    if (/[+\-*/%&|^=<>!~]/.test(code[i])) {
      res += `<span class="text-[#D4D4D4]">${escapeHtml(code[i])}</span>`;
      i++; continue;
    }

    // Restul caracterelor (, ; { } etc)
    res += escapeHtml(code[i]);
    i++;
  }
  return res + (res.endsWith('\n') ? ' ' : '');
}

// --- C CODE FORMATTER ---
function formatCCode(code: string): string {
  const lines = code.split('\n');
  let indentLevel = 0;
  const indentStep = '    '; // 4 spaces
  const result: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    if (line === '') {
      if (result.length > 0 && result[result.length - 1] !== '') {
        result.push('');
      }
      continue;
    }
    
    let openBraces = 0;
    let closeBraces = 0;
    for (let char of line) {
      if (char === '{') openBraces++;
      if (char === '}') closeBraces++;
    }
    
    let preDecrement = 0;
    if (line.startsWith('}')) {
      preDecrement = closeBraces;
      if (openBraces > 0 && line.endsWith('{')) {
        preDecrement = Math.max(0, closeBraces - openBraces);
      }
    }
    
    let currentIndent = Math.max(0, indentLevel - preDecrement);
    
    const isCaseOrDefault = /^(case\s+[^:]+|default)\s*:/.test(line);
    let renderIndent = currentIndent;
    if (isCaseOrDefault && renderIndent > 0) {
      renderIndent -= 1;
    }
    
    const isPreprocessor = line.startsWith('#');
    const indentStr = isPreprocessor ? '' : indentStep.repeat(renderIndent);
    
    line = line.replace(/\b(if|while|for|switch)\s*\(/g, '$1 (');
    line = line.replace(/\s*\{\s*$/g, ' {');
    
    result.push(indentStr + line);
    
    indentLevel = Math.max(0, indentLevel + openBraces - closeBraces);
  }
  
  while (result.length > 0 && result[result.length - 1] === '') {
    result.pop();
  }
  
  return result.join('\n');
}

// --- GET ALTERNATIVES FOR A SOLUTION LINE ---
function getAlternativesForLine(line: string): string[] {
  const trimmed = line.trim();
  const alternatives: string[] = [];

  // 1. Global variable declaration (symmetric)
  if (/^volatile\s+(?:unsigned\s+)?(?:int|long|short)\s+milisecunde\s*(?:=\s*0)?\s*;/.test(trimmed)) {
    if (trimmed.includes('=')) {
      alternatives.push("volatile unsigned int milisecunde;");
    } else {
      alternatives.push("volatile unsigned int milisecunde = 0;");
    }
  }

  // 2. Bitwise Toggle (XOR) on PC7
  if (/^PORTC\s*\^=\s*\(?\s*1\s*<<\s*7\s*\)?\s*;/.test(trimmed)) {
    alternatives.push("PORTC ^= 1 << 7;");
    alternatives.push("PORTC = PORTC ^ (1 << 7);");
    alternatives.push("PORTC = PORTC ^ 1 << 7;");
    alternatives.push("setbit(PORTC, 7); // (sau clrbit într-o structură condițională)");
  }

  // 3. setbit(REG, BIT); => alternatives: REG |= (1 << BIT); and REG |= 1 << BIT;
  const macroSetbitMatch = trimmed.match(/^setbit\s*\(\s*([A-Za-z0-9_]+)\s*,\s*([A-Za-z0-9_]+)\s*\)\s*;?/);
  if (macroSetbitMatch) {
    const reg = macroSetbitMatch[1];
    const bit = macroSetbitMatch[2];
    alternatives.push(`${reg} |= (1 << ${bit});`);
    alternatives.push(`${reg} |= 1 << ${bit};`);
  }

  // 4. clrbit(REG, BIT); => alternatives: REG &= ~(1 << BIT);
  const macroClrbitMatch = trimmed.match(/^clrbit\s*\(\s*([A-Za-z0-9_]+)\s*,\s*([A-Za-z0-9_]+)\s*\)\s*;?/);
  if (macroClrbitMatch) {
    const reg = macroClrbitMatch[1];
    const bit = macroClrbitMatch[2];
    alternatives.push(`${reg} &= ~(1 << ${bit});`);
  }

  // 5. testbit(PIN, BIT) in conditions => alternatives: (PIN & (1 << BIT))
  const testbitRegex = /testbit\s*\(\s*([A-Za-z0-9_]+)\s*,\s*([A-Za-z0-9_]+)\s*\)/g;
  if (testbitRegex.test(trimmed)) {
    testbitRegex.lastIndex = 0;
    const replaced = trimmed.replace(testbitRegex, (_, reg, bit) => `(${reg} & (1 << ${bit}))`);
    alternatives.push(replaced);
  }

  // 6. DDRx or PORTx or TIMSK |= (1 << BIT) => alternatives: setbit(REG, BIT);
  const setbitMatch = trimmed.match(/^([A-Za-z0-9_]+)\s*\|=\s*\(?\s*1\s*<<\s*([A-Za-z0-9_]+)\s*\)?\s*;/);
  if (setbitMatch) {
    const reg = setbitMatch[1];
    const bit = setbitMatch[2];
    alternatives.push(`setbit(${reg}, ${bit});`);
  }

  // 7. REG &= ~(1 << BIT) => alternatives: clrbit(REG, BIT);
  const clrbitMatch = trimmed.match(/^([A-Za-z0-9_]+)\s*&=\s*~\s*\(?\s*1\s*<<\s*([A-Za-z0-9_]+)\s*\)?\s*;/);
  if (clrbitMatch) {
    const reg = clrbitMatch[1];
    const bit = clrbitMatch[2];
    alternatives.push(`clrbit(${reg}, ${bit});`);
  }

  // 8. Button reading / pin reading (masking) in conditions: (PIN & (1 << BIT)) => testbit(PIN, BIT)
  const pinReadRegex = /\((PIN[A-D])\s*&\s*\(\s*1\s*<<\s*(\d+)\s*\)\)/g;
  if (pinReadRegex.test(trimmed)) {
    pinReadRegex.lastIndex = 0;
    const replaced = trimmed.replace(pinReadRegex, (_, pin, bit) => `testbit(${pin}, ${bit})`);
    alternatives.push(replaced);
  }

  // 9. Multi-bit setting using ORed shifts (e.g. TCCR1B = (1 << WGM12) | (1 << CS11);)
  const multiBitMatch = trimmed.match(/^([A-Za-z0-9_]+)\s*\|?=\s*(.*);/);
  if (multiBitMatch) {
    const reg = multiBitMatch[1];
    const rightSide = multiBitMatch[2];
    const bitRegex = /\(?\s*1\s*<<\s*([A-Za-z0-9_]+)\s*\)?/g;
    const bits: string[] = [];
    let match;
    while ((match = bitRegex.exec(rightSide)) !== null) {
      bits.push(match[1]);
    }
    if (bits.length >= 2) {
      const setbitSequence = bits.map(bit => `setbit(${reg}, ${bit});`).join('\n');
      alternatives.push(setbitSequence);
    }
  }

  return alternatives;
}

// --- SOLUTION LINE COMPONENT WITH PREMIUM PORTAL TOOLTIP ---
function SolutionLine({ line }: { line: string }) {
  const [isHovered, setIsHovered] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, height: 0 });
  const alternatives = getAlternativesForLine(line);
  const hasAlternatives = alternatives.length > 0;
  
  const highlighted = highlightC(line);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      height: rect.height
    });
    setIsHovered(true);
  };

  if (!hasAlternatives) {
    return (
      <div 
        className="min-h-[1.625rem] px-1 py-0.5 whitespace-pre font-mono text-xs"
        dangerouslySetInnerHTML={{ __html: highlighted || ' ' }}
      />
    );
  }

  return (
    <div 
      className="relative group min-h-[1.625rem] px-1 py-0.5 whitespace-pre rounded transition-colors duration-150 cursor-help hover:bg-slate-800/80 hover:shadow-sm"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span 
        className="border-b border-dashed border-indigo-400/60 pb-[1px]"
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
      
      {isHovered && createPortal(
        <div 
          style={{ 
            position: 'absolute', 
            top: `${coords.top + coords.height + 8}px`, 
            left: `${coords.left}px`,
          }}
          className="z-[9999] bg-[#16161a] border border-[#2b2b36] rounded-lg shadow-xl p-3.5 text-xs w-[340px] whitespace-normal font-sans text-slate-300 animate-slide-in select-none"
        >
          <div className="flex items-center space-x-1.5 mb-2.5 text-indigo-400 font-semibold text-[10px] uppercase tracking-wider">
            <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span>Variante alternative acceptate:</span>
          </div>
          <div className="space-y-2 font-mono text-[10.5px]">
            {alternatives.map((alt, i) => (
              <div key={i} className="bg-[#1f1f28] px-2.5 py-1.5 rounded border border-[#2b2b36]/60 whitespace-pre">
                <code className="text-[#e3e3e3]" dangerouslySetInnerHTML={{ __html: highlightC(alt) }} />
              </div>
            ))}
          </div>
          {/* Arrow pointing up */}
          <div className="absolute left-6 bottom-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-[#2b2b36]"></div>
        </div>,
        document.body
      )}
    </div>
  );
}

// --- MAIN APP COMPONENT ---

export default function App() {
  const [problem, setProblem] = useState(generateProblem1());
  const [code, setCode] = useState(problem.skeleton);
  const [feedback, setFeedback] = useState([]);
  const [showSolution, setShowSolution] = useState(false);
  const [leftWidth, setLeftWidth] = useState(450);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  React.useEffect(() => {
    if (!isResizing) return;

    const doResize = (e: MouseEvent) => {
      const newWidth = Math.max(250, Math.min(800, e.clientX));
      setLeftWidth(newWidth);
    };

    const stopResize = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', doResize);
    window.addEventListener('mouseup', stopResize);

    return () => {
      window.removeEventListener('mousemove', doResize);
      window.removeEventListener('mouseup', stopResize);
    };
  }, [isResizing]);

  const loadNewProblem = () => {
    const randomGen = problemGenerators[Math.floor(Math.random() * problemGenerators.length)];
    const newProb = randomGen();
    setProblem(newProb);
    setCode(newProb.skeleton);
    setFeedback([]);
    setShowSolution(false);
  };

  const handleKeyDown = (e) => {
    const textarea = e.target;
    const { selectionStart, selectionEnd, value } = textarea;
    
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        // Outdent (remove up to 4 spaces from current line)
        const currentLineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
        const currentLine = value.substring(currentLineStart, selectionStart);
        
        let spacesToRemove = 0;
        if (currentLine.startsWith('    ')) {
          spacesToRemove = 4;
        } else {
          const match = currentLine.match(/^ +/);
          if (match) {
            spacesToRemove = match[0].length;
          }
        }
        
        if (spacesToRemove > 0) {
          textarea.setSelectionRange(currentLineStart, currentLineStart + spacesToRemove);
          document.execCommand('delete');
          textarea.setSelectionRange(selectionStart - spacesToRemove, selectionStart - spacesToRemove);
        }
      } else {
        // Indent (insert 4 spaces)
        document.execCommand('insertText', false, '    ');
      }
      return;
    }
    
    // Auto-close pairs
    const pairs = {
      '{': '}',
      '(': ')',
      '[': ']',
      '"': '"',
      "'": "'",
    };
    
    if (pairs[e.key] !== undefined) {
      e.preventDefault();
      const char = e.key;
      const closingChar = pairs[char];
      
      if (selectionStart !== selectionEnd) {
        const selectedText = value.substring(selectionStart, selectionEnd);
        document.execCommand('insertText', false, char + selectedText + closingChar);
        textarea.setSelectionRange(selectionStart + 1, selectionEnd + 1);
      } else {
        document.execCommand('insertText', false, char + closingChar);
        textarea.setSelectionRange(selectionStart + 1, selectionStart + 1);
      }
      return;
    }
    
    // Skip typing a closing bracket if it's already there
    const closers = ['}', ')', ']', '"', "'"];
    if (closers.includes(e.key) && value[selectionStart] === e.key) {
      e.preventDefault();
      textarea.setSelectionRange(selectionStart + 1, selectionStart + 1);
      return;
    }
    
    // Deleting pairs on Backspace
    if (e.key === 'Backspace' && selectionStart === selectionEnd) {
      const prevChar = value[selectionStart - 1];
      const nextChar = value[selectionStart];
      if (
        (prevChar === '{' && nextChar === '}') ||
        (prevChar === '(' && nextChar === ')') ||
        (prevChar === '[' && nextChar === ']') ||
        (prevChar === '"' && nextChar === '"') ||
        (prevChar === "'" && nextChar === "'")
      ) {
        e.preventDefault();
        textarea.setSelectionRange(selectionStart - 1, selectionStart + 1);
        document.execCommand('delete');
        return;
      }
    }
    
    // Auto-indent on Enter
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentLineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
      const currentLine = value.substring(currentLineStart, selectionStart);
      const leadingSpacesMatch = currentLine.match(/^\s*/);
      const leadingSpaces = leadingSpacesMatch ? leadingSpacesMatch[0] : '';
      
      let extraIndent = '';
      const trimmedLine = currentLine.trim();
      if (trimmedLine.endsWith('{')) {
        extraIndent = '    ';
      }
      
      let inserted = '\n' + leadingSpaces + extraIndent;
      const nextChar = value[selectionStart];
      let adjustCursor = 0;
      
      if (trimmedLine.endsWith('{') && nextChar === '}') {
        inserted += '\n' + leadingSpaces;
        adjustCursor = - (leadingSpaces.length + 1);
      }
      
      document.execCommand('insertText', false, inserted);
      if (adjustCursor !== 0) {
        const newPos = selectionStart + inserted.length + adjustCursor;
        textarea.setSelectionRange(newPos, newPos);
      }
      return;
    }
    
    // Ctrl + / toggle comments
    if (e.key === '/' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const currentLineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
      let currentLineEnd = value.indexOf('\n', selectionStart);
      if (currentLineEnd === -1) currentLineEnd = value.length;
      
      const currentLine = value.substring(currentLineStart, currentLineEnd);
      let newLine;
      
      if (currentLine.trim().startsWith('//')) {
        newLine = currentLine.replace('// ', '').replace('//', '');
      } else {
        const match = currentLine.match(/^(\s*)/);
        const ws = match ? match[1] : '';
        newLine = ws + '// ' + currentLine.substring(ws.length);
      }
      
      textarea.setSelectionRange(currentLineStart, currentLineEnd);
      document.execCommand('insertText', false, newLine);
      
      const cursorOffset = newLine.length - currentLine.length;
      const newCursorPos = selectionStart + cursorOffset;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      return;
    }
  };

  const verifyCode = () => {
    const newFeedback = problem.checks.map((check: any) => {
      const isPassed = typeof check.test === 'function' ? check.test(code) : (check.regex ? check.regex.test(code) : false);
      return { desc: check.desc, passed: isPassed };
    });
    setFeedback(newFeedback as any);
  };

  const isAllPassed = feedback.length > 0 && feedback.every(f => f.passed);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Code className="w-6 h-6 text-green-400" />
          <h1 className="text-xl font-bold tracking-wide">AVR Examen Trainer (ATmega16)</h1>
        </div>
        <button 
          onClick={loadNewProblem}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded transition font-medium"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Problemă Nouă</span>
        </button>
      </header>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col lg:flex-row overflow-hidden ${isResizing ? 'select-none' : ''}`}>
        
        {/* Left Panel: Instructions & Feedback */}
        <section 
          style={{ width: isLeftCollapsed ? 0 : `${leftWidth}px`, display: isLeftCollapsed ? 'none' : 'flex' }}
          className="bg-white border-r border-slate-200 p-6 flex flex-col overflow-y-auto shrink-0 relative transition-all duration-150"
        >
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full uppercase tracking-wider">
                {problem.type}
              </span>
              <button
                onClick={() => setIsLeftCollapsed(true)}
                title="Ascunde panoul stâng"
                className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">{problem.title}</h2>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-slate-700 whitespace-pre-wrap leading-relaxed">
              {problem.task}
            </div>
          </div>

          <div className="mb-6">
            <button 
              onClick={verifyCode}
              className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition shadow-sm"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Verifică Soluția</span>
            </button>
          </div>

          {feedback.length > 0 && (
            <div className="mb-6 animate-in slide-in-from-top-2">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center">
                {isAllPassed ? <CheckCircle className="w-5 h-5 text-green-500 mr-2" /> : <XCircle className="w-5 h-5 text-red-500 mr-2" />}
                Rezultat Verificare
              </h3>
              <ul className="space-y-3">
                {feedback.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-3 p-3 rounded bg-slate-50 border border-slate-100">
                    {item.passed ? 
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /> : 
                      <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    }
                    <span className={`text-sm ${item.passed ? 'text-slate-600' : 'text-slate-800 font-medium'}`}>
                      {item.desc}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-auto pt-6 border-t border-slate-200">
            <button 
              onClick={() => setShowSolution(!showSolution)}
              className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              {showSolution ? "Ascunde Ghidul" : "Arată Ghidul și Soluția"}
            </button>
            
            {showSolution && (
              <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-sm animate-in fade-in">
                <h4 className="font-bold text-indigo-900 mb-2">Ghid de rezolvare:</h4>
                <p className="text-indigo-800 whitespace-pre-wrap mb-4">{problem.guide}</p>
                <h4 className="font-bold text-indigo-900 mb-2">Soluție Corectă:</h4>
                <div className="bg-[#1e1e1e] text-[#D4D4D4] p-3.5 rounded-lg overflow-x-auto font-mono text-xs shadow-inner flex flex-col">
                  {problem.solution.split('\n').map((line, idx) => (
                    <SolutionLine key={idx} line={line} />
                  ))}
                </div>
              </div>
            )}
          </div>

        </section>

        {/* Resizer Handle */}
        {!isLeftCollapsed && (
          <div
            onMouseDown={startResize}
            className={`hidden lg:block w-1 hover:w-1.5 bg-slate-200 hover:bg-indigo-500 cursor-col-resize select-none transition-all duration-150 z-20 ${isResizing ? 'bg-indigo-600 w-1.5' : ''}`}
          />
        )}
 
        {/* Right Panel: Code Editor */}
        <section className={`flex-1 bg-[#1e1e1e] flex flex-col ${isResizing ? 'pointer-events-none' : ''}`}>
          <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center text-slate-400 text-sm font-mono select-none">
            <span className="flex items-center space-x-2">
              {isLeftCollapsed && (
                <button
                  onClick={() => setIsLeftCollapsed(false)}
                  title="Arată panoul stâng"
                  className="mr-2 p-1 rounded bg-slate-700 hover:bg-slate-600 text-indigo-400 hover:text-indigo-300 transition-colors flex items-center justify-center"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              <span>main.c</span>
            </span>
            <button
              onClick={() => setCode(formatCCode(code))}
              title="Formatează Codul (Aranjează indentația)"
              className="flex items-center space-x-1.5 px-3 py-1 rounded bg-[#25252b] hover:bg-slate-750 hover:text-white text-slate-300 transition-all border border-slate-700/50 active:scale-95 text-xs font-semibold font-sans"
            >
              <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.656 48.656 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3M3 12a48.654 48.654 0 011.04-6.62M3 12l3 3m-3-3l-3 3M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM10.5 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM14.25 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              <span>Formatează</span>
            </button>
          </div>
          <div className="flex-1 flex overflow-hidden relative">
            {/* Line Numbers Column */}
            <div 
              id="line-numbers"
              className="w-12 bg-[#1c1c1c] text-[#5a5a5a] font-mono text-[15px] py-6 pr-3 text-right select-none border-r border-slate-800/40 overflow-hidden h-full"
              style={{ lineHeight: '1.625', fontSize: '15px' }}
            >
              {code.split('\n').map((_, index) => (
                <div key={index}>{index + 1}</div>
              ))}
            </div>
            
            {/* Editor Container */}
            <div className="flex-1 relative overflow-hidden h-full">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                onScroll={(e) => {
                  const pre = document.getElementById('syntax-pre');
                  if (pre) {
                    pre.scrollTop = e.target.scrollTop;
                    pre.scrollLeft = e.target.scrollLeft;
                  }
                  const lineNumbers = document.getElementById('line-numbers');
                  if (lineNumbers) {
                    lineNumbers.scrollTop = e.target.scrollTop;
                  }
                }}
                spellCheck="false"
                className="absolute inset-0 w-full h-full py-6 px-4 bg-transparent text-transparent caret-white outline-none resize-none whitespace-pre font-mono text-[15px] leading-relaxed z-10"
                style={{ tabSize: 4 }}
              />
              <pre
                id="syntax-pre"
                className="absolute inset-0 w-full h-full py-6 px-4 pointer-events-none whitespace-pre overflow-hidden font-mono text-[15px] leading-relaxed z-0 text-[#D4D4D4]"
                style={{ tabSize: 4 }}
                dangerouslySetInnerHTML={{ __html: highlightC(code) }}
              />
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}