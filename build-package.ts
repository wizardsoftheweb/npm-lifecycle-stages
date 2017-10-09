import * as fs from "fs";
import { EOL } from "os";
import * as path from "path";
import * as shelljs from "shelljs";
import * as winston from "winston";

import * as util from "util";

const logger = new winston.Logger({
    level: "silly",
    transports: [
        new (winston.transports.Console)({
            colorize: true,
            timestamp: true,
        }),
    ],
});

/* tslint:disable-next-line:no-var-requires */
const config = require("./package.json");
const tmp = path.join(__dirname, ".lifecycleTmp");

shelljs.cd(__dirname);

if (!shelljs.which("git")) {
    logger.error("git required for publication");
    throw new Error("git not found");
}

logger.info("Cleaning up previous build(s)");

shelljs.rm("-rf", path.join(__dirname, "dist"));
shelljs.rm("-rf", tmp);
shelljs.mkdir("-p", tmp);

logger.info("Linting src/");
npmRun("lint");

logger.info("Building dist/ with comments");
npmRun("compile:declarations");
shelljs.rm("-rf", path.join(__dirname, "dist", "bin", "*.d.ts"));
shelljs.sed(
    "-i",
    /env ts-node/,
    "env node",
    path.join(__dirname, "dist", "bin", "*.js"),
);
const filenames = shelljs.find(path.join(__dirname, "dist", "bin", "*.js"));
for (const filename of filenames) {
    shelljs.mv(filename, filename.replace(/\.js$/, ""));
}

logger.info("Starting declaration file bundle");

logger.verbose("Searching dist/ for declaration files");
const unbundledDeclarations = shelljs.find(path.join(__dirname, "dist"))
    .filter((filename: string) => {
        return filename.match(/\.d\.ts$/);
    });

logger.verbose("Loading declarations");
let declaration = "";
for (const filename of unbundledDeclarations) {
    logger.silly(`Loading and cleaning ${filename}`);
    const contents = (fs.readFileSync(filename, "utf8") as any)
        // remove leading exports or full line exports
        .replace(/^(\s*)?export ?(?:\{.*\}.*;)?/gmi, "$1");
    logger.silly("Appending to namespace declarations");
    declaration += contents.replace(/^(\s*)declare ?/gmi, "$1");
}

let match: any;
// Move references
const references = [];
const refRegExp = /^\s*(\/\/\/ <.*)\s*$/gm;
logger.verbose("Searching for references");
/* tslint:disable-next-line:no-conditional-assignment */
while (match = refRegExp.exec(declaration)) {
    const reference = match[1];
    if (references.indexOf(reference) === -1) {
        logger.silly(`Found ${reference}`);
        references.push(reference);
    }
}

interface IImports {
    [source: string]: {
        mask: string;
        components: string[];
    };
}

// Condense imports
const imports: IImports = {};
const importRegExp = /^\s*import (\{\s?([\s\S]*?)\s?\}|(\* as \w+)) from ("[^\"]*");$/gmi;
logger.verbose("Searching for imports");
/* tslint:disable-next-line:no-conditional-assignment */
while (match = importRegExp.exec(declaration)) {
    if (/^"\w/y.test(match[4])) {
        logger.silly(`Found external import ${match[0]}`);
        const found: any = imports[match[4]] || {
            components: [],
            mask: match[3] || "",
            source: match[4],
        };
        const components = (match[2] || "").trim().split(",");
        for (const component of components) {
            const trimmedComponent = component.trim();
            logger.silly(`Found and trimmed ${trimmedComponent}`);
            if (trimmedComponent.length > 0 && found.components.indexOf(trimmedComponent) === -1) {
                found.components.push(trimmedComponent);
                found.components.sort();
            }
        }
        imports[match[4]] = found;
    } else {
        logger.silly(`Found local import ${match[0]}`);
    }
}
logger.verbose("Compiling import header");
let importString = "";
const sources = Object.keys(imports);
sources.sort();
for (const source of sources) {
    if (imports.hasOwnProperty(source)) {
        importString += `\
import \
${
            imports[source].components.length > 0
                ? "{\n    " + imports[source].components.join(",\n    ") + ",\n}"
                : ""
            }\
${imports[source].mask.length > 0 ? imports[source].mask : ""}\
 from ${source.replace("./", "./dist/lib/")};
`;
    }
}

logger.verbose("Tidying declaration body");
declaration = declaration
    // remove references
    .replace(refRegExp, "")
    // remove imports
    .replace(importRegExp, "")
    // remove empty lines
    .replace(/\n\s*\n/g, EOL)
    // indent declarations
    .replace(/\n/g, EOL + "    ")
    // remove final newline
    .replace(/^([\s\S]*)\n\s*$/gy, "$1")
    .trim();

logger.verbose("Filling and tidying index.d.ts template");
const declarationFile = `\
// Type definitions for npm-lifecycle-stages ${config.version.replace(/\.\d+$/, "")}
// Project: ${config.repository.url.replace(/^\w+:(.+?(?=\.git$))(\.git)?$/i, "https:$1")}
// Definitions by: CJ Harries <https://github.com/thecjharries>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

${references.join(EOL) + EOL + EOL}\
${importString}\

declare namespace NpmLifecycleStages {
    ${declaration}
}

export = NpmLifecycleStages;
`
    // replace tabs with spaces
    .replace(/\t/, "    ")
    // remove trailing whitespace
    .replace(/\s*\n$/m, EOL);

logger.verbose("Removing commented build");
shelljs.rm("-rf", path.join(__dirname, "dist"));

logger.info("Building dist/ for publication");
npmRun("compile:npm");

const outFile = path.join(__dirname, "dist", "index.d.ts");
logger.verbose(`Writing ${outFile}`);
fs.writeFileSync(outFile, declarationFile, "utf8");

logger.info("Finished declaration file bundle");

function execResult(command: string): string {
    return (shelljs.exec(command, { silent: true }).stdout as string).trim();
}

function exec(command: string, errorMessage: string = ""): void {
    const child = shelljs.exec(command, { silent: true }) as shelljs.ExecOutputReturnValue;
    if ((child.stderr as string).length > 0 || child.code !== 0) {
        // Apparently some processes log error to stdout. Others don't log.
        const messageWithFallbacks = (
            (child.stderr || child.stdout)
            || errorMessage
        )
            || "Someone was too lazy to write a message for this";
        logger.error(child.stderr || child.stdout);
        throw new Error(errorMessage || messageWithFallbacks);
    }
    if ((child.stdout as string).trim().length > 0) {
        logger.verbose(`Results:\n${child.stdout as string}`);
    }
}

function npmRun(script: string): void {
    exec(
        config.scripts[script],
        `Unable to complete ${script}; please fix and check 'npm run ${script}' before continuing`,
    );
}
