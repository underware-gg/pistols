#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Sozo 1.8.7 emits a few invalid TypeScript shapes for this world. Keep the
// corrections at the generation boundary and fail closed if upstream output
// changes, rather than relying on undocumented hand edits to generated files.
const generatedDir = process.argv[2];

if (!generatedDir) {
	throw new Error("usage: fix_generated_bindings.mjs <generated-directory>");
}

const contractsPath = join(generatedDir, "contracts.gen.ts");
const modelsPath = join(generatedDir, "models.gen.ts");

const countOccurrences = (source, value) => source.split(value).length - 1;

const replaceGeneratedOccurrences = (source, generated, corrected, expected, label) => {
	const generatedCount = countOccurrences(source, generated);

	if (generatedCount === expected) {
		return source.replaceAll(generated, corrected);
	}

	if (generatedCount === 0 && countOccurrences(source, corrected) >= expected) {
		return source;
	}

	throw new Error(`${label}: expected ${expected} generated occurrence(s), found ${generatedCount}`);
};

const replaceGeneratedBlock = (source, generated, corrected, label) => {
	const generatedCount = countOccurrences(source, generated);
	const correctedCount = countOccurrences(source, corrected);

	if (generatedCount === 1 && correctedCount === 0) {
		return source.replace(generated, corrected);
	}

	if (generatedCount === 0 && correctedCount === 1) {
		return source;
	}

	throw new Error(
		`${label}: expected exactly one generated or corrected block, found ${generatedCount} generated and ${correctedCount} corrected`,
	);
};

let contracts = readFileSync(contractsPath, "utf8");
contracts = replaceGeneratedOccurrences(
	contracts,
	"CairoOption<DuelistProfile>",
	"CairoOption<CairoCustomEnum>",
	2,
	"pack-token DuelistProfile option",
);
contracts = replaceGeneratedOccurrences(
	contracts,
	"Array<MockedValue>",
	"Array<models.MockedValue>",
	6,
	"RNG MockedValue arrays",
);
writeFileSync(contractsPath, contracts);

const playerSettingMarker = "export type PlayerSettingEnum = CairoCustomEnum;\n\n";
const playerSettingValueDefinition = `// Type definition for \`pistols::models::events::PlayerSettingValue\` enum
export const playerSettingValue = [
  'Undefined',
  'Boolean',
] as const;
export type PlayerSettingValue = { [key in typeof playerSettingValue[number]]: string };
export type PlayerSettingValueEnum = CairoCustomEnum;

`;

let models = readFileSync(modelsPath, "utf8");
if (!models.includes("export type PlayerSettingValueEnum = CairoCustomEnum;")) {
	if (countOccurrences(models, playerSettingMarker) !== 1) {
		throw new Error("PlayerSettingValue: PlayerSetting marker was not unique");
	}
	models = models.replace(playerSettingMarker, playerSettingMarker + playerSettingValueDefinition);
}

models = replaceGeneratedBlock(
	models,
	`\t\tApproval: Approval,
\t\tTransfer: Transfer,`,
	`\t\t// Approval: Approval,
\t\t// Transfer: Transfer,`,
	"ERC event schema collisions",
);

models = replaceGeneratedBlock(
	models,
	`\t\tApproval: {
\t\t\towner: "",
\t\t\tspender: "",
\t\tvalue: 0,
\t\t},
\t\tTransfer: {
\t\t\tfrom: "",
\t\t\tto: "",
\t\tvalue: 0,
\t\t},
\t\tApproval: {
\t\t\towner: "",
\t\t\tapproved: "",
\t\ttoken_id: 0,
\t\t},
\t\tApprovalForAll: {
\t\t\towner: "",
\t\t\toperator: "",
\t\t\tapproved: false,
\t\t},
\t\tTransfer: {
\t\t\tfrom: "",
\t\t\tto: "",
\t\ttoken_id: 0,
\t\t},`,
	`\t\t// Approval: {
\t\t// \towner: "",
\t\t// \tspender: "",
\t\t// value: 0,
\t\t// },
\t\t// Transfer: {
\t\t// \tfrom: "",
\t\t// \tto: "",
\t\t// value: 0,
\t\t// },
\t\t// Approval: {
\t\t// \towner: "",
\t\t// \tapproved: "",
\t\t// token_id: 0,
\t\t// },
\t\tApprovalForAll: {
\t\t\towner: "",
\t\t\toperator: "",
\t\t\tapproved: false,
\t\t},
\t\t// Transfer: {
\t\t// \tfrom: "",
\t\t// \tto: "",
\t\t// token_id: 0,
\t\t// },`,
	"ERC event schema defaults",
);

writeFileSync(modelsPath, models);

console.log(`Corrected generated bindings in ${generatedDir}`);
