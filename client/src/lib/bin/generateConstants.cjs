#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require('child_process');

function getFolderFilesRecursively(folder, extension = null) {
  let files = [];
  fs.readdirSync(folder).forEach(File => {
    const absPath = path.join(folder, File);
    if (fs.statSync(absPath).isDirectory()) {
      files = files.concat(getFolderFilesRecursively(absPath));
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
      if (line.startsWith('mod ') && line.endsWith(' {')) {
        current_mod = line.slice(4, -2);
        // console.log(`MOD!!`, current_mod, line)
        if (!is_test) {
          mods[current_mod] = {
            filePath,
            lines: [],
          }
        }
      } else if (line.startsWith('enum ') && line.endsWith(' {') && !is_test) {
        current_enum = line.slice(5, -2);
        // console.log(`ENUM!!`, current_enum, line)
        enums[current_enum] = {
          filePath,
          lines: [],
        }
      } else if (line.startsWith('struct ') && line.endsWith(' {') && !is_test) {
        current_struct = line.slice(7, -2);
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
  u64: "BigNumberish",
  i64: "BigNumberish",
  i128: "BigNumberish",
  u128: "BigNumberish",
  u256: "BigNumberish",
  felt252: "BigNumberish",
  contractaddress: "BigNumberish",
  enum: "string",
  shortstring: "string",
};
let customTypes = {
}

function get_cairo_to_typescript_type(cairoType, value=null) {
  if (value != null
    && (cairoType == 'felt252' || cairoType == 'ByteArray')
    && (value.startsWith('"') || value.startsWith("'"))) {
      return 'string';
    }
  let result = cairoToTypescriptType[cairoType];
  return result;
}

function get_custom_type_contents(typeName, structs) {
  if (customTypes[typeName]) {
    // already parsed
    return '';
  }
  let str = structs[typeName];
  if (str) {
    let contents = `\n// from: ${str.filePath}\n`;
    contents += `export type ${typeName} = {\n`;
    // console.log(`>>> typeName [${typeName}] :`, str.lines);
    str.lines.forEach(line => {
      let [name, type] = line.split(':');
      name = name.trim();
      type = type.trim();
      let tsType = get_cairo_to_typescript_type(type);
      // console.log(`>>> typeName [${typeName}]>`, tsType);
      if (!tsType) {
        console.error(`ERROR: Unknown value type for type [${typeName}] [${type}]`)
      }
      contents += `  ${name} : ${tsType},\n`;
    });
    contents += `};\n`;
    // ok!
    customTypes[typeName] = true;
    return contents
  }
  // not parsed / error
  return null;
}

function buildFileContents(constants) {
  let fileContents = '';
  fileContents += `/* Autogenerated file. Do not edit manually. */\n`;
  fileContents += `import { BigNumberish } from 'starknet';\n`;

  const exports = []

  //
  // constants
  //
  fileContents += `\n`;
  fileContents += `//\n`;
  fileContents += `// constants\n`;
  fileContents += `//\n`;

  let constantsContents = '';
  const mods = constants.mods
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
      const type = _type.trim();
      const value = _value.trim();
      let ts_type = get_cairo_to_typescript_type(type, value);
      let ts_value = (ts_type == 'BigNumberish') ? `'${value}'` : value;
      let comment = null
      if (!ts_type) {
        // cutom types (s)
        let custom_type_contents = get_custom_type_contents(type, constants.structs);
        if (custom_type_contents === null) {
          console.error(`ERROR: Invalid type [${type}] from:`, line);
          process.exit(1);
        }
        fileContents += custom_type_contents;
        ts_type = type;
        let start = ts_value.indexOf('{');
        if (start > 0) {
          ts_value = ts_value.slice(start);
          ts_value = ts_value.replace('{ ', '{\n    ');
          ts_value = ts_value.replaceAll(', ', ',\n    ');
          ts_value = ts_value.replaceAll('    }', '  }');
        }
      }
      // decode selector_from_tag!
      if (type == 'felt252') {
        if (ts_value.startsWith('\'selector_from_tag!')) {
          let match = ts_value.match(/"(.*?)"/g)
          if (match) {
            const stdout = execSync(`sozo hash ${match}`).toString();
            const hash = stdout.match(/0x[A-Fa-f0-9]*/g)
            if (hash) {
              comment = ts_value
              ts_value = `'${hash}'`
            }
          }
        }
      }
      typeContents += `  ${name}: ${ts_type}, // cairo: ${type}\n`;
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

  //
  // enums
  //
  fileContents += `\n`;
  fileContents += `//\n`;
  fileContents += `// enums\n`;
  fileContents += `//\n`;

  const enumNames = []
  const enums = constants.enums
  Object.keys(enums).forEach((key) => {
    let enumName = `${key}`;
    let enumDictName = `${key}NameToValue`;
    let enumContents = `export enum ${enumName} {\n`;
    let dictContents = `export const ${enumDictName}: Record<string, ${enumName}> = {\n`;
    let index = 0;
    enums[key].lines.forEach((line) => {
      // remove 'const ' and ';'
      let type = line;
      type = type.split(',')[0]; // remove , at the end
      type = type.split(':')[0];     // remove type
      type = type.trim();
      if (type) {
        // enumContents += `  ${type} = '${type}', // ${index}\n`;
        enumContents += `  ${type} = ${index},\n`;
        dictContents += `  '${type}': ${enumName}.${type},\n`;
        index++;
      }
    })
    enumContents += `};\n`;
    dictContents += `};\n`;
    // write contents
    fileContents += '\n';
    fileContents += `// from: ${enums[key].filePath}\n`;
    fileContents += enumContents;
    fileContents += dictContents;
    fileContents += `export const get${enumName} = (name: string | number): ${enumName} => (${enumDictName}[name as string]);\n`
    // exports
    enumNames.push(enumName)
    exports.push(enumName);
    exports.push(enumDictName);
  })

  return fileContents;
}

//----------------------
// Execution
//

// Check for the required arguments
if (process.argv.length !== 4) {
  console.log(
    "Usage: npm run create-constants <SRC_PATH> <OUTPUT_PATH>",
    "Usage: npm run create-constants --game=<GAME_SLUG> --profile=<PROFILE>"
  );
  process.exit(1);
}

// Extract paths from command-line arguments
// const srcPath = path.resolve(process.argv[2]);
const srcPath = (process.argv[2]); // keep relative
const jsFilePath = path.resolve(process.argv[3]);

// console.log(`process.argv`, process.argv)
// console.log(`srcPath [${process.argv[2]}] > [${srcPath}]`)
// console.log(`jsFilePath [${process.argv[3]}] > [${jsFilePath}]`)

let cairoFiles = getFolderFilesRecursively(srcPath, '.cairo');

let constants = cairoFiles.reduce((acc, filePath) => {
  const { mods, enums, structs } = getConstantsFromCairoFile(filePath)
  Object.keys(mods).forEach((key) => {
    if (mods[key].lines.length > 0) {
      if (acc.mods[key]) {
        console.error(`ERROR: Duplicated mod [${key}]`)
        process.exit(1);
      }
      acc.mods[key] = mods[key];
    }
  })
  Object.keys(enums).forEach((key) => {
    if (enums[key].lines.length > 0) {
      if (acc.enums[key]) {
        console.error(`ERROR: Duplicated enum [${key}]`)
        process.exit(1);
      }
      acc.enums[key] = enums[key];
    }
  })
  Object.keys(structs).forEach((key) => {
    if (structs[key].lines.length > 0) {
      if (acc.structs[key]) {
        console.error(`ERROR: Duplicated struct [${key}]`)
        process.exit(1);
      }
      acc.structs[key] = structs[key];
    }
  })
  return acc;
}, { mods: {}, enums: {}, structs: {} })
console.log(constants)

const fileContents = buildFileContents(constants)
// console.log(fileContents)

fs.writeFile(jsFilePath, fileContents, (err) => {
  if (err) {
    console.error("ERROR: error writing file:", err);
  } else {
    console.log("Constants file generated successfully:", jsFilePath);
  }
});
