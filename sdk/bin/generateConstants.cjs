#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require('child_process');

// match: 1234, -1234
const isNumeric = (str) => (str != null && /^-?[0-9]+$/.test(str))

function getFolderFilesRecursively(folder, extension = null) {
  let files = [];
  fs.readdirSync(folder).forEach(File => {
    const absPath = path.join(folder, File);
    if (fs.statSync(absPath).isDirectory()) {
      if (!absPath.endsWith(`/tests`)) {
        files = files.concat(getFolderFilesRecursively(absPath, extension));
      }
    } else if (!extension || absPath.endsWith(extension)) {
      files.push(absPath);
    }
  });
  return files;
}

function cleanLine(line) {
  let result = '';
  const commentParts = line.split('//');
  result = commentParts[0].trim();
  return result;
}

function getConstantsFromCairoFile(filePath) {
  const mods = {}; // constants
  const enums = {};
  const structs = {};
  const contents = fs.readFileSync(filePath, "utf8");
  const lines = contents.split('\n');
  // parse contents
  let is_test = false;
  let is_errors = false;
  let current_mod = null;
  let current_enum = null;
  let current_struct = null;
  lines.forEach((line, index) => {
    if (current_mod || current_enum || current_struct) {
      // inside mod
      let l = cleanLine(line);
      // console.log(`${current_mod}:[${l}]`)
      if (line[0] == '}') {
        // end mod
        current_mod = null;
        current_enum = null;
        current_struct = null;
        is_errors = false;
        is_test = false;
      } else if (is_errors && l == '}') {
        // end errors
        is_errors = false;
      } else if (!is_test) {
        if (l == 'mod Errors {') {
          // start error
          is_errors = true;
        }
        // can find consts        
        if (!is_errors) {
          if (current_mod && l.startsWith('const ')) {
            if (l.endsWith('{')) {
              for (let i = index + 1; i < lines.length; i++) {
                const ll = cleanLine(lines[i]);
                if (ll.endsWith('};')) {
                  l += ' };';
                  break;
                }
                l += ` ${ll}`;
              }
            }
            // console.log(l)
            mods[current_mod].lines.push(l)
          } else if (current_enum && l) {
            // console.log(l)
            enums[current_enum].lines.push(l)
          } else if (current_struct && l) {
            if (l.endsWith(',')) {
              l = l.slice(0, -1); // remove ','
            }
            if (l.endsWith('felt252') && line.endsWith('shortstring')) {
              l = l.replace('felt252', 'shortstring');
            }
            // console.log(l)
            structs[current_struct].lines.push(l)
          }
        }
      }
    } else if (line == '#[cfg(test)]') {
      is_test = true;
    } else {
      // outside mod/enum
      if ((line.startsWith('mod ') || line.startsWith('pub mod ')) && line.endsWith(' {')) {
        current_mod = line.split(' ').at(-2);
        // console.log(`MOD!!`, current_mod, line)
        if (!is_test) {
          mods[current_mod] = {
            filePath,
            lines: [],
          }
        }
      } else if (line.startsWith('pub enum ') && line.endsWith(' {') && !is_test) {
        current_enum = line.split(' ').at(-2);
        // console.log(`ENUM!!`, current_enum, line)
        enums[current_enum] = {
          filePath,
          lines: [],
        }
      } else if (line.startsWith('pub struct ') && line.endsWith(' {') && !is_test) {
        current_struct = line.split(' ').at(-2);
        // console.log(`STRUCT!!`, current_struct, ':', line)
        structs[current_struct] = {
          filePath,
          lines: [],
        }
      }
    }
  })
  // console.log(mods)
  return {
    mods,
    enums,
    structs,
  }
}

const cairoToTypescriptType = {
  bool: "boolean",
  i8: "number",
  u8: "number",
  i16: "number",
  u16: "number",
  i32: "number",
  u32: "number",
  usize: "number",
  u64: "bigint",
  i64: "bigint",
  i128: "bigint",
  u128: "bigint",
  u256: "bigint",
  felt252: "bigint",
  contractaddress: "bigint",
  bytearray: "string",
  enum: "string",
  shortstring: "string",
};
let customTypeMap = {
}

function get_cairo_to_typescript_type(cairoType, parsed, value=null) {
  // felt252 as string
  if (value != null && cairoType == 'felt252' && value.startsWith("'")) {
    return 'string';
  }
  if (parsed.enums[cairoType]) {
    // console.log(`---got ENUM`, parsed.enums[cairoType]);
    return cairoType;
  }
  let result = cairoToTypescriptType[cairoType];
  return result;
}

// returns [typeMap, contents]
function get_custom_type_contents(custom_type, parsed) {
  if (customTypeMap[custom_type]) {
    // already parsed
    return [customTypeMap[custom_type], ''];
  }
  let str = parsed.structs[custom_type];
  if (str) {
    customTypeMap[custom_type] = {};
    let contents = `\n// from: ${str.filePath}\n`;
    contents += `export type ${custom_type} = {\n`;
    // console.log(`>>> typeName [${typeName}] :`, str.lines);
    str.lines.forEach(line => {
      let [name, cairo_type] = line.split(':');
      name = name.trim();
      cairo_type = cairo_type.trim();
      let ts_type = get_cairo_to_typescript_type(cairo_type, parsed);
      // console.log(`>>> typeName [${typeName}]>`, ts_type);
      if (!ts_type) {
        console.error(`ERROR: Unknown value type for type [${custom_type}] [${cairo_type}]`)
      }
      contents += `  ${name} : ${ts_type},\n`;
      customTypeMap[custom_type][name] = [cairo_type, ts_type];
    });
    contents += `};\n`;
    return [customTypeMap[custom_type], contents];
  }
  // not parsed / error
  return [null, null];
}

function buildFileContents(parsed) {
  let fileContents = '';
  fileContents += `/* Autogenerated file. Do not edit manually. */\n`;
  // fileContents += `import { BigNumberish } from 'starknet';\n`;

  fileContents += `\n`;
  fileContents += `//\n`;
  fileContents += `// helpers\n`;
  fileContents += `//\n`;
  fileContents += `const _indexOrUndefined = (v: number) => (v >= 0 ? v : undefined);\n`

  const exports = []

  //
  // enums
  //
  fileContents += `\n`;
  fileContents += `//\n`;
  fileContents += `// enums\n`;
  fileContents += `//\n`;

  const enumNames = []
  const enums = parsed.enums
  Object.keys(enums).forEach((key) => {
    let enumName = `${key}`;
    let enumContents = `export enum ${enumName} {\n`;
    let index = 0;
    enums[key].lines.forEach((line) => {
      // remove 'const ' and ';'
      let type = line;
      type = type.split(',')[0]; // remove , at the end
      type = type.split(':')[0];     // remove type
      type = type.trim();
      if (type) {
        // enumContents += `  ${type} = '${type}', // ${index}\n`;
        enumContents += `  ${type} = '${type}', // ${index}\n`;
        index++;
      }
    })
    enumContents += `};\n`;
    // write contents
    fileContents += '\n';
    fileContents += `// from: ${enums[key].filePath}\n`;
    fileContents += enumContents;
    
    // converters
    // export const getArchetypeValue = (name: Archetype): number => _indexOrUndefined(Object.keys(Archetype).indexOf(name));
    // export const getArchetypeFromValue = (value: number): Archetype => Object.keys(Archetype)[value] as Archetype;
    // export const getArchetypeMap = (): Record<Archetype, number> => Object.keys(Archetype).reduce((acc, v, index) => { acc[v as Archetype] = index; return acc; }, {} as Record<Archetype, number>);
    fileContents += `export const get${enumName}Value = (name: ${enumName}): number | undefined => _indexOrUndefined(Object.keys(${enumName}).indexOf(name));\n`
    fileContents += `export const get${enumName}FromValue = (value: number): ${enumName} | undefined => Object.keys(${enumName})[value] as ${enumName};\n`
    fileContents += `export const get${enumName}Map = (): Record<${enumName}, number> => Object.keys(${enumName}).reduce((acc, v, index) => { acc[v as ${enumName}] = index; return acc; }, {} as Record<${enumName}, number>);\n`

    // exports
    enumNames.push(enumName)
    exports.push(enumName);
  })
  
  //
  // constants
  //
  fileContents += `\n`;
  fileContents += `//\n`;
  fileContents += `// constants\n`;
  fileContents += `//\n`;

  const _format_ts_value = (value, cairo_type, ts_type) => {
    let ts_value = value;
    let comment = null;
    // decode selector_from_tag!
    if (cairo_type == 'felt252') {
      if (ts_value.startsWith('selector_from_tag!')) {
        let match = ts_value.match(/"(.*?)"/g)
        if (match) {
          const stdout = execSync(`sozo hash ${match}`).toString();
          const hash = stdout.match(/0x[A-Fa-f0-9]*/g)
          // console.log(`>>> match [${match}] hash [${hash}]`)
          if (hash) {
            comment = ts_value
            ts_value = hash.toString()
          }
        }
      }
    }
    if (ts_type != 'string') {
      // replace enum separator
      // es: Rarity::Common, CONST::ETH_TO_WEI
      ts_value = ts_value.replaceAll('::', '.');
    }
    if (ts_type == 'bigint' || ts_type == 'number') {
      // parse 0x12343, '1234', 1233 * CONST::ETH_TO_WEI
      const operands = ts_value.split('*');
      ts_value = (operands.length == 1) ? '' : '(';
      operands.forEach((operand, index) => {
        if (index > 0) {
          ts_value += ` * `;
        }
        const op = operand.trim();
        const op2 = op.replaceAll('_', '');
        if (op.startsWith('0x')) {
          if (ts_type == 'bigint') {
            ts_value += `BigInt('${op}')`;
          } else {
            ts_value += op;
          }
        } else if (isNumeric(op2)) {
          // 1234, -1234, 1_000, -1_000
          ts_value += op2;
          if (ts_type == 'bigint') {
            ts_value += `n`;
          }
        } else {
          ts_value += op;
        }
      })
      if (operands.length > 1) ts_value += ')';
    }
    return [ts_value, comment];
  }

  let constantsContents = '';
  const mods = parsed.mods
  Object.keys(mods).forEach((key) => {
    let modName = `${key}`;
    let typeName = `type_${modName}`;
    let typeContents = `type ${typeName} = {\n`;
    let valuesContents = `export const ${modName}: ${typeName} = {\n`;
    mods[key].lines.forEach((line, lineIndex) => {
      // remove 'const ' and ';'
      const l = line.slice('const '.length, -1);
      const [_decl, _value] = l.split('=');
      const [_name, _type] = _decl.split(':');
      const name = _name.trim();
      const cairo_type = _type.trim();
      const value = _value.trim();
      let ts_type = get_cairo_to_typescript_type(cairo_type, parsed, value);
      let ts_value = '';
      let comment;
      if (ts_type) {
        [ts_value, comment] = _format_ts_value(value, cairo_type, ts_type);
      } else {
        // cutom types (structs)
        let [custom_type_map, custom_type_contents] = get_custom_type_contents(cairo_type, parsed);
        // console.log(`mod [${modName}] type [${typeName}]:`, value)
        if (custom_type_contents === null) {
          console.error(`❌ ERROR: Invalid type [${cairo_type}] from:`, line);
          process.exit(1);
        }
        fileContents += custom_type_contents;
        // separate values
        // value ex: EnvCardPoints { name: 'No Tactics', rarity: Rarity::Special, chances: 0, damage: 0, }
        ts_type = cairo_type; // struct name
        let start = value.indexOf('{');
        if (start > 0) {
          ts_value += '{\n';
          const valueLines = value.slice(start + 1, -1).split(',');
          // console.log(`>>>`, valueLines)
          valueLines.forEach(l => {
            var sep = l.indexOf(':');
            if (sep >= 0) {
              let _name = l.slice(0, sep).trim();
              let _value = l.slice(sep + 1).trim();
              let [_cairo_type, _ts_type] = custom_type_map[_name];
              let [_ts_value, _comment] = _format_ts_value(_value, _cairo_type, _ts_type);
              // console.log(`----- [${l}] k:[${_name}] v:[${_value}], _cairo_type:[${_cairo_type}] _ts_type:[${_ts_type}] = [${_ts_value}]`)
              ts_value += `    ${_name}: ${_ts_value},${_comment ? ` // ${_comment}` : ''}\n`;
            }
          })
          ts_value += '  }';
        }
      }
      typeContents += `  ${name}: ${ts_type}, // cairo: ${cairo_type}\n`;
      valuesContents += `  ${name}: ${ts_value},${comment ? ` // ${comment}` : ''}\n`;
    })
    typeContents += `};\n`;
    valuesContents += `};\n`;
    // write contents
    constantsContents += '\n';
    constantsContents += `// from: ${mods[key].filePath}\n`;
    constantsContents += typeContents;
    constantsContents += valuesContents;
    // exports
    exports.push(modName);
  })
  fileContents += constantsContents;

  return fileContents;
}

//----------------------
// Execution
//
console.log("executing [generateConstants.cjs]...", process.argv)

// Check for the required arguments...
let arg_src = null
let arg_out = null
process.argv.forEach(arg => {
  const parts = arg.split(':')
  if (parts[0] == '--src') {
    arg_src = parts[1]
  } else if (parts[0] == '--out') {
    arg_out = parts[1]
  }
})

if (!arg_src || !arg_out) {
  console.log("Usage: npm run create-constants --src:<SRC_PATH> --out:<OUTPUT_PATH>");
  console.error(`❌ ABORTED`)
  process.exit(1);
}

const srcPath = (arg_src); // keep relative
const jsFilePath = path.resolve(arg_out);

let cairoFiles = getFolderFilesRecursively(srcPath, '.cairo');

// render constants.cairo first
cairoFiles.sort((a, b) => (
  a.endsWith('constants.cairo') ? -1
    : b.endsWith('constants.cairo') ? 1
      : 0
));

let parsed = cairoFiles.reduce((acc, filePath) => {
  const { mods, enums, structs } = getConstantsFromCairoFile(filePath)
  Object.keys(mods).forEach((key) => {
    if (mods[key].lines.length > 0) {
      if (acc.mods[key]) {
        console.error(`❌ ERROR: Duplicated mod [${key}]`)
        process.exit(1);
      }
      acc.mods[key] = mods[key];
    }
  })
  Object.keys(enums).forEach((key) => {
    if (enums[key].lines.length > 0) {
      if (acc.enums[key]) {
        console.error(`❌ ERROR: Duplicated enum [${key}]`)
        process.exit(1);
      }
      acc.enums[key] = enums[key];
    }
  })
  Object.keys(structs).forEach((key) => {
    if (structs[key].lines.length > 0) {
      if (acc.structs[key]) {
        console.error(`❌ ERROR: Duplicated struct [${key}]`)
        process.exit(1);
      }
      acc.structs[key] = structs[key];
    }
  })
  return acc;
}, { mods: {}, enums: {}, structs: {} })
// console.log(parsed)

const fileContents = buildFileContents(parsed)
// console.log(fileContents)

fs.writeFile(jsFilePath, fileContents, (err) => {
  if (err) {
    console.error("ERROR: error writing file:", err);
  } else {
    console.log("Constants file generated successfully:", jsFilePath);
  }
});
