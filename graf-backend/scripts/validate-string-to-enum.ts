#!/usr/bin/env node

/**
 * Script para validar que strings en el sistema no se hayan reemplazado por enums.
 * También detecta enums y miembros de enums que no se están utilizando.
 * Ignora valores por defecto del sistema como "number", "string", etc.
 * Genera un reporte detallado.
 *
 * Adaptado para Graf Backend
 */

import * as fs from 'fs';
import * as path from 'path';

// Obtener __dirname
const projectRoot = process.cwd();
const __dirname = path.join(projectRoot, 'scripts');

// CLI args
const args = process.argv.slice(2);
const VERBOSE = args.includes('--verbose');

// Directorios a analizar
const BACKEND_SRC = path.join(__dirname, '../src');

// Patrones de archivos a excluir
const EXCLUDED_PATTERNS = [
  /\.test\.ts$/,
  /\.spec\.ts$/,
  /node_modules/,
  /\.d\.ts$/,
  /dist\//,
  /coverage\//,
  /\.js$/,
];

// Patrones de archivos que contienen definiciones (catalogs, configs, IDs)
const CATALOG_DEFINITION_PATTERNS = [
  /Catalog\.ts$/,
  /Catalogs\.ts$/,
  /Configs?\.ts$/,
  /Registry\.ts$/,
  /Definitions?\.ts$/,
  /Data\.ts$/,
  /Constants\.ts$/,
  /Enums?\.ts$/,
  /Seeds?\.ts$/,
  /Fixtures?\.ts$/,
  /Mocks?\.ts$/,
  /\.entity\.ts$/,
  /\.dto\.ts$/,
];

// Patrones de línea que indican definición de ID (no uso de enum)
const ID_DEFINITION_PATTERNS = [
  /^\s*id:\s*["']/,
  /^\s*name:\s*["']/,
  /^\s*_id:\s*["']/,
  /^\s*key:\s*["']/,
  /^\s*code:\s*["']/,
  /^\s*label:\s*["']/,
  /^\s*title:\s*["']/,
  /^\s*description:\s*["']/,
  /^\s*\w+Id:\s*["']/,
  /^\s*\[\s*["']/,
  /export\s+const\s+\w+\s*=\s*["']/,
  /console\.(log|error|warn|info)\(/,
  /throw\s+new\s+Error\(/,
  /Error\(/,
  /\.emit\(/,
  /\.on\(/,
  /\.once\(/,
  /\.subscribe\(/,
  /logger\./,
  /LOG\./,
  /^\s*\/\//,
  /^\s*\*/,
  /["'][^"']*\$\{/,
];

// Patrones de contextos TypeScript (no son código ejecutable)
const TYPESCRIPT_CONTEXT_PATTERNS = [
  /\w+\["[^"]+"\]/,
  /Extract<[^>]+,\s*\{\s*type:\s*["'][^"']+["']\s*\}>/,
  /:\s*Extract<[^>]+,\s*\{\s*type:\s*["'][^"']+["']\s*\}>/,
  /Partial<\w+\["[^"]+"\]>/,
  /:\s*\w+\["[^"]+"\]/,
  /as\s+\w+\["[^"]+"\]/,
];

// Patrones de búsqueda de substring
const SUBSTRING_SEARCH_PATTERNS = [
  /\.includes\(["'][^"']+["']\)/,
  /\.startsWith\(["'][^"']+["']\)/,
  /\.endsWith\(["'][^"']+["']\)/,
  /\.indexOf\(["'][^"']+["']\)/,
  /\.search\(["'][^"']+["']\)/,
  /\.match\(["'][^"']+["']\)/,
];

// Patrones de propiedades CSS
const CSS_PROPERTY_PATTERNS = [
  /position:\s*["'][^"']+["']/,
  /display:\s*["'][^"']+["']/,
  /flexDirection:\s*["'][^"']+["']/,
  /alignItems:\s*["'][^"']+["']/,
  /justifyContent:\s*["'][^"']+["']/,
  /overflow:\s*["'][^"']+["']/,
  /cursor:\s*["'][^"']+["']/,
  /textAlign:\s*["'][^"']+["']/,
  /float:\s*["'][^"']+["']/,
  /visibility:\s*["'][^"']+["']/,
];

// Patrones de claves de configuración (no son valores de enum)
const CONFIG_KEY_PATTERNS = [
  /defaultKey:\s*["'][^"']+["']/,
  /triggerEvent:\s*["'][^"']+["']/,
  /^\s*type:\s*["'][^"']+["']/,
  /\{[^}]*\btype:\s*["'][^"']+["'][^}]*\}/,
];

// Patrones de navegación/wizard/step keys
const NAVIGATION_STEP_PATTERNS = [
  /currentStep\s*===\s*["'][^"']+["']/,
  /step\s*===\s*["'][^"']+["']/,
  /case\s+["'](customer|products|review|details|summary|confirmation)["']\s*:/,
  /bg=\{currentStep\s*===\s*["'][^"']+["']/,
  /className=\{.*currentStep\s*===\s*["'][^"']+["']/,
];

// Valores por defecto del sistema a ignorar
const SYSTEM_DEFAULT_VALUES = new Set([
  // Tipos primitivos
  'number',
  'string',
  'boolean',
  'object',
  'undefined',
  'null',
  'function',
  'symbol',
  'bigint',
  // Valores comunes de JavaScript/TypeScript
  'true',
  'false',
  'void',
  'any',
  'unknown',
  'never',
  // Métodos comunes
  'toString',
  'valueOf',
  'hasOwnProperty',
  'constructor',
  'prototype',
  // HTTP y web
  'get',
  'post',
  'put',
  'delete',
  'patch',
  'options',
  'head',
  'http',
  'https',
  'localhost',
  // Valores de configuración comunes
  'id',
  'name',
  'type',
  'value',
  'key',
  'data',
  'error',
  'success',
  'status',
  'message',
  'code',
]);

// Patrones para encontrar strings literales que podrían ser enums
const STRING_LITERAL_PATTERNS = [
  {
    name: 'Comparaciones',
    regex: /(===|!==|==|!=)\s*["']([a-zA-Z_][a-zA-Z0-9_]*?)["']/gi,
    captureGroup: 2,
  },
  {
    name: 'Asignaciones',
    regex: /:\s*["']([a-zA-Z_][a-zA-Z0-9_]*?)["']\s*[,;\)\}]/g,
    captureGroup: 1,
  },
  {
    name: 'Case statements',
    regex: /case\s+["']([a-zA-Z_][a-zA-Z0-9_]*?)["']\s*:/gi,
    captureGroup: 1,
  },
  {
    name: 'Return statements',
    regex: /return\s+["']([a-zA-Z_][a-zA-Z0-9_]*?)["']/gi,
    captureGroup: 1,
  },
  {
    name: 'Operaciones Set/Map',
    regex: /\.(set|add|has|get|delete)\(["']([a-zA-Z_][a-zA-Z0-9_]*?)["']/gi,
    captureGroup: 2,
  },
  {
    name: 'Métodos de array',
    regex:
      /\.(push|find|filter|some|every)\(["']([a-zA-Z_][a-zA-Z0-9_]*?)["']/gi,
    captureGroup: 2,
  },
  {
    name: 'Switch statements',
    regex:
      /switch\s*\([^)]{0,200}\)\s*\{[^}]{0,500}case\s+["']([a-zA-Z_][a-zA-Z0-9_]*?)["']/gi,
    captureGroup: 1,
  },
  {
    name: 'Template literals',
    regex: /`\$\{(\w+)\.([A-Z_][A-Z0-9_]*)\}`/g,
    captureGroup: 2,
  },
];

interface StringOccurrence {
  file: string;
  line: number;
  column: number;
  pattern: string;
  stringLiteral: string;
  lineContent: string;
  context: string;
  isFalsePositive: boolean;
  falsePositiveReason?: string;
}

interface EnumValues {
  enumName: string;
  values: Set<string>;
  members: Map<string, string>;
  file: string;
  usageCount: number;
  memberUsageCounts: Map<string, number>;
}

/**
 * Obtiene todos los archivos TypeScript recursivamente
 */
function getAllFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) {
    return fileList;
  }

  const files = fs.readdirSync(dir);
  const realDirPath = fs.realpathSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);

    try {
      const realFilePath = fs.realpathSync(filePath);
      if (!realFilePath.startsWith(realDirPath)) {
        console.warn(`⚠️  Omitiendo symlink fuera del proyecto: ${filePath}`);
        return;
      }
    } catch {
      return;
    }

    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (
      file.endsWith('.ts') &&
      !EXCLUDED_PATTERNS.some((pattern) => pattern.test(filePath))
    ) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Extrae todos los valores y miembros de los enums de un archivo
 */
function extractEnumValues(filePath: string): EnumValues[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const enums: EnumValues[] = [];

  const enumRegex = /export\s+enum\s+(\w+)\s*\{([^}]{0,10000})\}/gs;
  let match;

  while ((match = enumRegex.exec(content)) !== null) {
    const enumName = match[1];
    const enumBody = match[2];
    const values = new Set<string>();
    const members = new Map<string, string>();
    const memberUsageCounts = new Map<string, number>();

    const memberRegex = /([a-zA-Z0-9_]+)\s*=\s*["']([^"']{0,100})["']/g;
    let memberMatch;

    while ((memberMatch = memberRegex.exec(enumBody)) !== null) {
      const memberName = memberMatch[1];
      const value = memberMatch[2];

      if (value && !SYSTEM_DEFAULT_VALUES.has(value)) {
        values.add(value);
        members.set(memberName, value);
        memberUsageCounts.set(memberName, 0);
      }
    }

    if (values.size > 0) {
      enums.push({
        enumName,
        values,
        members,
        file: filePath,
        usageCount: 0,
        memberUsageCounts,
      });
    }
  }

  return enums;
}

/**
 * Encuentra todas las ocurrencias de strings literales en un archivo
 */
function findStringLiterals(
  filePath: string,
  content: string,
): Omit<StringOccurrence, 'isFalsePositive' | 'falsePositiveReason'>[] {
  const occurrences: Omit<
    StringOccurrence,
    'isFalsePositive' | 'falsePositiveReason'
  >[] = [];
  const lines = content.split('\n');

  STRING_LITERAL_PATTERNS.forEach((pattern) => {
    let match;
    const regex = getCachedRegex(pattern.regex.source, pattern.regex.flags);

    while ((match = regex.exec(content)) !== null) {
      const stringLiteral = match[pattern.captureGroup];

      if (
        !stringLiteral ||
        SYSTEM_DEFAULT_VALUES.has(stringLiteral) ||
        stringLiteral.length < 2
      ) {
        continue;
      }

      if (stringLiteral.length > 50 || /[^a-zA-Z0-9_]/.test(stringLiteral)) {
        continue;
      }

      const lineNumber = content.substring(0, match.index).split('\n').length;
      const line = lines[lineNumber - 1] || '';
      const column = match.index - content.lastIndexOf('\n', match.index) - 1;

      const contextStart = Math.max(0, lineNumber - 2);
      const contextEnd = Math.min(lines.length, lineNumber + 1);
      const context = lines
        .slice(contextStart, contextEnd)
        .map((l, i) => {
          const num = contextStart + i + 1;
          const marker = num === lineNumber ? '>>>' : '   ';
          return `${marker} ${num.toString().padStart(4, ' ')}: ${l}`;
        })
        .join('\n');

      occurrences.push({
        file: filePath,
        line: lineNumber,
        column,
        pattern: pattern.name,
        stringLiteral,
        lineContent: line.trim(),
        context,
      });
    }
  });

  return occurrences;
}

/**
 * Encuentra todos los enums en el backend
 */
function findAllEnums(backendSrc: string): Map<string, EnumValues> {
  const enumMap = new Map<string, EnumValues>();

  const enumFiles = getAllFiles(backendSrc);
  enumFiles.forEach((file) => {
    const enums = extractEnumValues(file);
    enums.forEach((enumData) => {
      enumMap.set(enumData.enumName, enumData);
    });
  });

  return enumMap;
}

// Cache de regex compiladas
const regexCache = new Map<string, RegExp>();

function getCachedRegex(pattern: string, flags: string = 'g'): RegExp {
  const key = `${pattern}::${flags}`;
  if (!regexCache.has(key)) {
    regexCache.set(key, new RegExp(pattern, flags));
  }
  return regexCache.get(key)!;
}

/**
 * Cuenta los usos de Enums y sus miembros en el código
 */
function countEnumUsages(
  filePath: string,
  content: string,
  enumMap: Map<string, EnumValues>,
) {
  enumMap.forEach((enumData, enumName) => {
    const enumUsageRegex = getCachedRegex(`\\b${enumName}\\b`, 'g');
    const matches = content.match(enumUsageRegex);
    if (matches) {
      enumData.usageCount += matches.length;
    }

    enumData.members.forEach((memberValue, memberName) => {
      const usagePositions = new Set<number>();

      const memberUsageRegex = getCachedRegex(
        `\\b${enumName}\\.${memberName}\\b`,
        'g',
      );
      let memberMatch;
      while ((memberMatch = memberUsageRegex.exec(content)) !== null) {
        usagePositions.add(memberMatch.index);
      }

      if (memberValue.length >= 3 && !SYSTEM_DEFAULT_VALUES.has(memberValue)) {
        const escapedValue = memberValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const valueRegex = getCachedRegex(`["'\`]${escapedValue}["'\`]`, 'g');
        let valueMatch;
        while ((valueMatch = valueRegex.exec(content)) !== null) {
          if (!usagePositions.has(valueMatch.index)) {
            usagePositions.add(valueMatch.index);
          }
        }
      }

      if (usagePositions.size > 0) {
        enumData.memberUsageCounts.set(
          memberName,
          (enumData.memberUsageCounts.get(memberName) || 0) +
            usagePositions.size,
        );
      }
    });
  });
}

/**
 * Procesa un archivo de forma asíncrona
 */
async function processFile(
  filePath: string,
  valueToEnums: Map<string, string[]>,
  enumMap: Map<string, EnumValues>,
  isCatalogFile: boolean,
): Promise<StringOccurrence[]> {
  return new Promise((resolve) => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const occurrences: StringOccurrence[] = [];

      const foundOccurrences = findStringLiterals(filePath, content);

      foundOccurrences.forEach((occ) => {
        if (valueToEnums.has(occ.stringLiteral)) {
          const lineContent = occ.lineContent;
          const isIdDefinition = ID_DEFINITION_PATTERNS.some((pattern) =>
            pattern.test(lineContent),
          );

          if (isCatalogFile && isIdDefinition) {
            if (VERBOSE) {
              console.log(
                `   ⚪ Ignorando (catálogo): "${
                  occ.stringLiteral
                }" en ${path.basename(filePath)}:${occ.line}`,
              );
            }
            return;
          }

          if (isIdDefinition) {
            if (VERBOSE) {
              console.log(
                `   ⚪ Ignorando (def ID): "${
                  occ.stringLiteral
                }" en ${path.basename(filePath)}:${occ.line}`,
              );
            }
            return;
          }

          const isTypeContext = TYPESCRIPT_CONTEXT_PATTERNS.some((pattern) =>
            pattern.test(lineContent),
          );
          if (isTypeContext) {
            if (VERBOSE) {
              console.log(
                `   ⚪ Ignorando (tipo TS): "${
                  occ.stringLiteral
                }" en ${path.basename(filePath)}:${occ.line}`,
              );
            }
            return;
          }

          const isSubstringSearch = SUBSTRING_SEARCH_PATTERNS.some((pattern) =>
            pattern.test(lineContent),
          );
          if (isSubstringSearch) {
            if (VERBOSE) {
              console.log(
                `   ⚪ Ignorando (substring): "${
                  occ.stringLiteral
                }" en ${path.basename(filePath)}:${occ.line}`,
              );
            }
            return;
          }

          const isCSSProperty = CSS_PROPERTY_PATTERNS.some((pattern) =>
            pattern.test(lineContent),
          );
          if (isCSSProperty) {
            if (VERBOSE) {
              console.log(
                `   ⚪ Ignorando (CSS): "${
                  occ.stringLiteral
                }" en ${path.basename(filePath)}:${occ.line}`,
              );
            }
            return;
          }

          const isConfigKey = CONFIG_KEY_PATTERNS.some((pattern) =>
            pattern.test(lineContent),
          );
          if (isConfigKey) {
            if (VERBOSE) {
              console.log(
                `   ⚪ Ignorando (config key): "${
                  occ.stringLiteral
                }" en ${path.basename(filePath)}:${occ.line}`,
              );
            }
            return;
          }

          const isNavigationStep = NAVIGATION_STEP_PATTERNS.some((pattern) =>
            pattern.test(lineContent),
          );
          if (isNavigationStep) {
            if (VERBOSE) {
              console.log(
                `   ⚪ Ignorando (navigation/step): "${
                  occ.stringLiteral
                }" en ${path.basename(filePath)}:${occ.line}`,
              );
            }
            return;
          }

          occurrences.push({
            ...occ,
            isFalsePositive: false,
          });
        }
      });

      countEnumUsages(filePath, content, enumMap);

      resolve(occurrences);
    } catch (error) {
      console.error(`   ⚠️  Error leyendo ${filePath}:`, error);
      resolve([]);
    }
  });
}

/**
 * Función principal
 */
async function main() {
  console.log('🔍 Validando strings y uso de Enums en Graf Backend...\n');

  console.log('📚 Extrayendo enums existentes...');
  const enumMap = findAllEnums(BACKEND_SRC);
  console.log(`   Encontrados ${enumMap.size} enums\n`);

  const valueToEnums = new Map<string, string[]>();

  enumMap.forEach((enumData, enumName) => {
    enumData.values.forEach((value) => {
      if (!valueToEnums.has(value)) {
        valueToEnums.set(value, []);
      }
      valueToEnums.get(value)!.push(enumName);
    });
  });

  console.log(`   Total de valores únicos en enums: ${valueToEnums.size}\n`);

  console.log('🔎 Analizando código fuente...\n');

  const backendFiles = getAllFiles(BACKEND_SRC);
  const allFiles = [...backendFiles];

  console.log(`   Analizando ${allFiles.length} archivos...\n`);

  const BATCH_SIZE = 50;
  const missingEnumOccurrences: StringOccurrence[] = [];

  for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
    const batch = allFiles.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map((filePath) => {
      const isCatalogFile = CATALOG_DEFINITION_PATTERNS.some((pattern) =>
        pattern.test(filePath),
      );
      return processFile(filePath, valueToEnums, enumMap, isCatalogFile);
    });

    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach((occurrences) => {
      missingEnumOccurrences.push(...occurrences);
    });

    if (VERBOSE) {
      console.log(
        `   Procesados ${Math.min(i + BATCH_SIZE, allFiles.length)}/${
          allFiles.length
        } archivos...`,
      );
    }
  }

  // --- REPORTE 1: Strings que deberían ser Enums ---

  const missingByString = new Map<string, StringOccurrence[]>();
  missingEnumOccurrences.forEach((occ) => {
    if (!missingByString.has(occ.stringLiteral)) {
      missingByString.set(occ.stringLiteral, []);
    }
    missingByString.get(occ.stringLiteral)!.push(occ);
  });

  const sortedMissing = Array.from(missingByString.entries()).sort(
    (a, b) => b[1].length - a[1].length,
  );

  console.log('📊 REPORTE DE USO DE STRINGS LITERALES (POSIBLES ENUMS)\n');
  console.log('='.repeat(80));
  console.log(
    `Total de ocurrencias detectadas: ${missingEnumOccurrences.length}`,
  );
  console.log('='.repeat(80));
  console.log();

  if (sortedMissing.length === 0) {
    console.log(
      '✅ ¡Excelente! No se detectaron strings literales que deban ser enums.\n',
    );
  } else {
    sortedMissing
      .slice(0, 50)
      .forEach(([stringLiteral, occurrences], index) => {
        const possibleEnums = valueToEnums.get(stringLiteral) || [];
        console.log(
          `${(index + 1).toString().padStart(3, ' ')}. "${stringLiteral}" (${
            occurrences.length
          } ocurrencias)`,
        );
        console.log(`      Posibles Enums: ${possibleEnums.join(', ')}`);

        const examples = occurrences.slice(0, 3);
        examples.forEach((occ) => {
          const relativePath = path.relative(
            path.join(__dirname, '..'),
            occ.file,
          );
          console.log(`      ${relativePath}:${occ.line} (${occ.pattern})`);
        });
        if (occurrences.length > 3) {
          console.log(`      ... y ${occurrences.length - 3} más`);
        }
        console.log();
      });
  }

  // --- REPORTE 2: Enums sin uso ---

  console.log('📉 REPORTE DE ENUMS SIN USO\n');
  console.log('='.repeat(80));

  const unusedEnums: EnumValues[] = [];

  enumMap.forEach((enumData) => {
    if (enumData.usageCount === 0) {
      unusedEnums.push(enumData);
    }
  });

  if (unusedEnums.length === 0) {
    console.log('✅ Todos los Enums definidos están en uso.\n');
  } else {
    console.log(`📊 ${unusedEnums.length} Enums no usados:\n`);
    unusedEnums.forEach((e) => {
      const relativePath = path.relative(path.join(__dirname, '..'), e.file);
      console.log(`   - ${e.enumName} (en ${relativePath})`);
    });
    console.log();
  }

  // Guardar reporte completo en JSON
  const reportPath = path.join(__dirname, '../enum-validation-report.json');
  const report = {
    summary: {
      totalEnums: enumMap.size,
      unusedEnums: unusedEnums.length,
      missingEnumOccurrences: missingEnumOccurrences.length,
    },
    unusedEnums: unusedEnums.map((e) => ({
      name: e.enumName,
      file: path.relative(path.join(__dirname, '..'), e.file),
    })),
    missingEnumUsages: sortedMissing.map(([stringLiteral, occurrences]) => ({
      stringLiteral,
      possibleEnums: valueToEnums.get(stringLiteral),
      count: occurrences.length,
      occurrences: occurrences.map((occ) => ({
        file: path.relative(path.join(__dirname, '..'), occ.file),
        line: occ.line,
        lineContent: occ.lineContent,
      })),
    })),
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // --- RESUMEN FINAL ---
  console.log('\n' + '═'.repeat(80));
  console.log('📋 RESUMEN FINAL');
  console.log('═'.repeat(80));

  if (missingEnumOccurrences.length === 0 && unusedEnums.length === 0) {
    console.log('✅ ESTADO: LIMPIO - Enums correctamente definidos y usados');
  } else if (missingEnumOccurrences.length === 0) {
    console.log(
      '✅ ESTADO: LIMPIO - No hay strings que deban convertirse a enums',
    );
  } else if (missingEnumOccurrences.length <= 5) {
    console.log(
      `⚠️  ESTADO: CASI LIMPIO - ${missingEnumOccurrences.length} string(s) pendiente(s) de revisar`,
    );
  } else {
    console.log(
      `❌ ESTADO: PENDIENTE - ${missingEnumOccurrences.length} strings deben convertirse a enums`,
    );
  }

  console.log(`\n   📊 Strings a corregir: ${missingEnumOccurrences.length}`);
  console.log(`   📚 Enums sin uso: ${unusedEnums.length}`);
  console.log('\n✅ Reporte completo guardado en: ' + reportPath);
}

// Ejecutar main y manejar errores
main().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
