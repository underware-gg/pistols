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
  const parts = line.split('//');
  const contents = parts[0].trim();
  const comment = parts[1]?.trim();
  return {
    contents,
    comment,
  };
}

function getConstantsFromCairoFile(filePath) {
  const mods = {}; // constants
  const enums = {};
  const structs = {};
  const custom_types = {};
  const interfaces = {};
  const contents = fs.readFileSync(filePath, "utf8");
  const fileName = filePath.split('/').at(-1);
  const lines = contents.split('\n');
  // parse contents
  let is_test = false;
  let is_interface = false;
  let is_errors = false;
  let current_mod = null;
  let current_enum = null;
  let current_struct = null;
  let current_interface = null;
  lines.forEach((line, index) => {
    let { contents: l, comment } = cleanLine(line);
    if (current_mod || current_enum || current_struct || current_interface) {
      // inside mod
      // console.log(`${current_mod}:[${l}]`)
      if (l == '}') {
        // end mod
        current_mod = null;
        current_enum = null;
        current_struct = null;
        current_interface = null;
        is_errors = false;
        is_test = false;
      } else if (is_errors && l == '}') {
        // end errors
        is_errors = false;
      } else if (!is_test) {
        if (l == 'mod Errors {' || l == 'pub mod Errors {') {
          // start error
          is_errors = true;
        }
        // can find consts        
        if (!is_errors) {
          l = l.replace('pub ', '');
          if (current_mod && l.startsWith('const ')) {
            if (l.endsWith('{')) {
              for (let i = index + 1; i < lines.length; i++) {
                const { contents: ll } = cleanLine(lines[i]);
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
            if (l[0] != '#') {
              enums[current_enum].lines.push(l)
            }
          } else if (current_struct && l) {
            if (l.endsWith(',')) {
              l = l.slice(0, -1); // remove ','
            }
            if (comment == '@generateContants:shortstring') {
              l = l.replace('felt252', 'shortstring');
            }
            // console.log(l)
            structs[current_struct].lines.push(l)
          } else if (current_interface && l) {
            if (l.startsWith('fn ') && comment?.startsWith('@description:')) {
              interfaces[current_interface].functions.push({
                name: l.split('fn ')[1].split('(')[0],
                description: comment.replace('@description:', '').trim(),
              })
              // console.log(`--@`, l)
              // console.log(`--function:`, interfaces[current_interface].functions.at(-1))
            }
          }
        }
      }
    } else if (l == '#[cfg(test)]') {
      is_test = true;
    } else if (l == '#[starknet::interface]') {
      is_interface = true;
    } else {
      // outside mod/enum
      if ((line.startsWith('mod ') || line.startsWith('pub mod ')) && l.endsWith('{')) {
        current_mod = l.split(' ').at(-2);
        // console.log(`[${fileName}] MOD: [${current_mod}] @`, line)
        if (!is_test) {
          mods[current_mod] = {
            filePath,
            lines: [],
          }
        }
      } else if (line.startsWith('pub enum ') && l.endsWith('{') && !is_test) {
        current_enum = l.split(' ').at(-2);
        // console.log(`[${fileName}] ENUM: [${current_enum}] @`, line)
        enums[current_enum] = {
          filePath,
          lines: [],
        }
      } else if (line.startsWith('pub struct ') && l.endsWith('{') && !is_test) {
        current_struct = l.split(' ').at(-2);
        // console.log(`[${fileName}] STRUCT: [${current_struct}] @`, line)
        structs[current_struct] = {
          filePath,
          lines: [],
          force: (comment == '@generateContants:force'),
        }
      } else if (is_interface && line.startsWith('pub trait ') && l.endsWith('{') && !is_test) {
        current_interface = l.split('<').at(0).split(' ').at(-1);
        // console.log(`[${fileName}] INTERFACE: [${current_interface}] @`, line)
        interfaces[current_interface] = {
          filePath,
          functions: [],
        }
      }
      is_interface = false;
    }
  })
  // parse custom types
  Object.keys(structs).forEach((custom_type) => {
    const str = structs[custom_type];
    custom_types[custom_type] = {};
    // console.log(`>>> typeName [${typeName}] :`, str.lines);
    str.lines.forEach(line => {
      if (line.startsWith('#')) return;
      let [name, cairo_type] = line.split(':');
      name = name.trim();
      name = name.replace('pub ', '');
      cairo_type = cairo_type.trim();
      let ts_type = get_cairo_to_typescript_type(cairo_type, enums);
      // console.log(`>>> typeName [${typeName}]>`, ts_type);
      // if (!ts_type) {
      //   console.error(`ERROR: Unknown value type for type [${custom_type}] [${cairo_type}]`)
      // }
      custom_types[custom_type][name] = { name, cairo_type, ts_type };
    });
  })
  // console.log(mods)
  return {
    mods,
    enums,
    structs,
    interfaces,
    custom_types,
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

function get_cairo_to_typescript_type(cairoType, enums, value=null) {
  // felt252 as string
  if (value != null && cairoType == 'felt252' && value.startsWith("'")) {
    return 'string';
  }
  if (enums[cairoType]) {
    // console.log(`---got ENUM`, enums[cairoType]);
    return cairoType;
  }
  let result = cairoToTypescriptType[cairoType];
  return result;
}

function format_ts_value(value, cairo_type, ts_type) {
  let ts_value = value;
  let comment = null;
  // decode selector_from_tag!
  if (cairo_type == 'felt252') {
    if (ts_value.startsWith('selector_from_tag!')) {
      let match = ts_value.match(/"(.*?)"/g)
      if (match) {
        const stdout = execSync(`cd ../dojo && sozo hash compute ${match}`).toString();
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
    ts_value = ts_value.replaceAll('.low', '');
  }
  if (ts_type == 'bigint' || ts_type == 'number') {
    // parse 0x12343, '1234', 1233 * CONST::ETH_TO_WEI
    if (ts_value.startsWith('(') && ts_value.endsWith(')')) {
      ts_value = ts_value.slice(1, -1); // remove () around value
    }
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

function buildFileContents(parsed) {
  let fileContents = '';
  fileContents += `/* Autogenerated file. Do not edit manually. */\n`;
  // fileContents += `import { BigNumberish } from 'starknet';\n`;

  //
  // interfaces
  //
  console.log(`>>> interfaces:`, Object.keys(parsed.interfaces))
  fileContents += `\n\n`;
  fileContents += `//----------------------------------\n`;
  fileContents += `// interfaces\n`;
  fileContents += `//\n`;
  fileContents += `export const INTERFACE_DESCRIPTIONS: any = {\n`;

  const interfaces = parsed.interfaces
  Object.keys(interfaces).forEach((key) => {
    let interfaceName = `${key}`;
    fileContents += `  // from: ${interfaces[key].filePath}\n`;
    fileContents += `  ${interfaceName}: {\n`;
    interfaces[key].functions.forEach((fn) => {
      fileContents += `    ${fn.name}: '${fn.description}',\n`;
    })
    fileContents += `  },\n`;
  })
  fileContents += `}\n`;


  //
  // helpers
  //

  fileContents += `\n`;
  fileContents += `//----------------------------------\n`;
  fileContents += `// helpers\n`;
  fileContents += `//\n`;
  fileContents += `const _indexOrUndefined = (v: number) => (v >= 0 ? v : undefined);\n`

  const exports = []

  //
  // enums
  //
  console.log(`>>> enums:`, Object.keys(parsed.enums))
  fileContents += `\n`;
  fileContents += `//----------------------------------\n`;
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
  // types + constants
  //
  console.log(`>>> constants:`, Object.keys(parsed.mods))
  let custom_types_to_export = new Set(Object.keys(parsed.structs).filter(v => parsed.structs[v].force));
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
      let ts_type = get_cairo_to_typescript_type(cairo_type, parsed.enums, value);
      let ts_value = '';
      let comment;
      if (ts_type) {
        [ts_value, comment] = format_ts_value(value, cairo_type, ts_type);
      } else {
        // cutom types (structs)
        let custom_type_map = parsed.custom_types[cairo_type];
        // console.log(`mod [${modName}] type [${typeName}]:`, value)
        if (custom_type_map === null) {
          console.error(`❌ ERROR: Invalid type [${cairo_type}] from:`, line);
          process.exit(1);
        }
        custom_types_to_export.add(cairo_type);
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
              let { cairo_type: _cairo_type, ts_type: _ts_type } = custom_type_map[_name];
              let [_ts_value, _comment] = format_ts_value(_value, _cairo_type, _ts_type);
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

  fileContents += `\n\n`;
  fileContents += `//----------------------------------\n`;
  fileContents += `// custom types\n`;
  fileContents += `//\n`;
  console.log(`>>> custom_types:`, custom_types_to_export)
  custom_types_to_export.forEach(custom_type => {
    let str = parsed.structs[custom_type];
    if (str) {
      fileContents += `\n// from: ${str.filePath}\n`;
      fileContents += `export type ${custom_type} = {\n`;
      Object.keys(parsed.custom_types[custom_type]).forEach(name => {
        let { cairo_type, ts_type } = parsed.custom_types[custom_type][name];
        if (!ts_type && !Object.keys(parsed.enums).includes(cairo_type)) {
          console.error(`ERROR: Unknown type [${cairo_type}] on [${custom_type}]:\n${str.filePath}`)
          console.error(`❌ ABORTED`);
          process.exit(1);
        }
        fileContents += `  ${name} : ${ts_type ?? cairo_type},\n`;
      });
      fileContents += `};\n`;
    }
  })

  fileContents += `\n\n`;
  fileContents += `//----------------------------------\n`;
  fileContents += `// constants\n`;
  fileContents += `//\n`;
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
  console.log("Usage: npm run generate-constants --src:<SRC_PATH> --out:<OUTPUT_PATH>");
  console.error(`❌ ABORTED`);
  process.exit(1);
}

const srcPath = (arg_src); // keep relative
const jsFilePath = path.resolve(arg_out);

let cairoFiles = getFolderFilesRecursively(srcPath, '.cairo');

// render constants.cairo first
const _hasPrecedence = (a) => (a.endsWith('constants.cairo') || a.endsWith('timestamp.cairo'))
cairoFiles.sort((a, b) => (
  _hasPrecedence(a) ? -1
    : _hasPrecedence(b) ? 1
      : 0
));

let parsed = cairoFiles.reduce((acc, filePath) => {
  const { mods, enums, structs, interfaces, custom_types } = getConstantsFromCairoFile(filePath)
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
  Object.keys(interfaces).forEach((key) => {
    if (interfaces[key].functions.length > 0) {
      if (acc.interfaces[key]) {
        console.error(`❌ ERROR: Duplicated interface [${key}]`)
        process.exit(1);
      }
      acc.interfaces[key] = interfaces[key];
    }
  })
  Object.keys(custom_types).forEach((key) => {
    if (Object.keys(custom_types[key]).length > 0) {
      if (acc.custom_types[key]) {
        console.error(`❌ ERROR: Duplicated custom_types [${key}]`)
        process.exit(1);
      }
      acc.custom_types[key] = custom_types[key];
    }
  })
  return acc;
}, { mods: {}, enums: {}, structs: {}, interfaces: {}, custom_types: {} })
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
