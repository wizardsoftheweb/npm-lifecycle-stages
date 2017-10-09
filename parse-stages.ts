import * as fs from "fs";
import * as path from "path";
import * as semver from "semver";
import * as shelljs from "shelljs";
import * as winston from "winston";

const logger = new winston.Logger({
    level: "silly",
    transports: [
        new (winston.transports.Console)({
            colorize: true,
            timestamp: true,
        }),
    ],
});

const npmTmpDir = path.join(__dirname, ".npmTmp");
const src = path.join(__dirname, "src");

const necessaryCommands = [
    "awk",
    "diff",
    "find",
    "git",
    "sort",
    "uniq",
];

for (const command of necessaryCommands) {
    if (!shelljs.which(command)) {
        throw new Error(`${command} necessary to parse npm`);
    }
}

const findAwk = `\
find . -type f -exec awk '\
match($0, /lifecycle.*?[,\\(]\\s*['\\''\"]([a-zA-Z.]+)['\\''\"]/, a){\
    match(a[1], /(pre|post)*(.+)/, b);\
    gsub(/pare/, \"prepare\", b[2]);\
    gsub(/publishOnly/, \"prepublishOnly\", b[2]);\
    print b[2];\
}' {} \\+ | sort | uniq`;

const awkDocs = `\
awk '\
BEGIN{ RS=\"\\n\\n\\n+\"; }\
match($0, /## DESCRIPTION[^\\#]*/, a) {\
    $0 = a[0];\
    while(match($0, /\\n\\*([^\:]*)/, b)) {\
        split(b[1], c, \",\");\
        for (i in c) {\
            gsub(/(pre|post)/, \"\", c[i]);\
            gsub(/pare/, \"prepare\", c[i]);\
            gsub(/publishOnly/, \"prepublishOnly\", c[i]);\
            gsub(/ /, \"\", c[i]); print c[i];\
        }\
        $0 = substr($0, RSTART + RLENGTH);\
    }\
}' doc/misc/npm-scripts.md | sort | uniq`;

logger.info("Parsing lifecycles");

logger.verbose("Checking versions");
const registryVersion = (shelljs.exec("npm show npm version", { silent: true }).stdout as string).trim();
logger.silly(`Registry: ${registryVersion}`);
let localVersion: string;
try {
    /* tslint:disable-next-line:no-var-requires */
    localVersion = require(`${npmTmpDir}/package.json`).version;
    logger.silly(`Local: ${localVersion}`);
} catch (error) {
    logger.silly("Unable to find local copy of NPM");
    localVersion = "0.0.0";
    logger.verbose(`Cleaning ${npmTmpDir}`);
    shelljs.rm("-rf", npmTmpDir);
    shelljs.mkdir(npmTmpDir);
}
if (semver.gt(registryVersion, localVersion)) {
    logger.info("Pulling upstream updates");
    logger.verbose(`Cloning npm`);
    shelljs.cd(npmTmpDir);
    shelljs.exec("git clone https://github.com/npm/npm.git .");
    shelljs.exec("git fetch --all --tags");
    shelljs.exec("git rev-parse --verify test && git branch -D test || echo 0");
    shelljs.exec(`git checkout 'tags/${registryVersion}' -b lifecycle-local`);
    shelljs.exec("npm install");
}

shelljs.cd(npmTmpDir);
logger.verbose("Parsing find...awk");
const rawFindAwk = shelljs.exec(findAwk, { silent: true }).stdout as string;
const findAwkStages = rawFindAwk.trim().split("\n").sort();
(logger.silly as any)(`find...awk: [${findAwkStages.join(", ")}]`);
logger.verbose("Parsing awk...doc");
const rawAwkDocs = shelljs.exec(awkDocs, { silent: true }).stdout as string;
const awkDocsStages = rawAwkDocs.trim().split("\n").sort();
(logger.silly as any)(`awk...docs: [${awkDocsStages.join(", ")}]`);

logger.verbose("Comparing stages");
for (let index = 0, max = Math.max(findAwkStages.length, awkDocsStages.length); index < max; index++) {
    if (findAwkStages[index] !== awkDocsStages[index]) {
        throw new Error(`Something's not right`);
    }
}

logger.verbose("Generating complete lifecycle set");
const stages = findAwkStages.reduce((accumulator: string[], current: string): string[] => {
    return current.match(/^pre/)
        ? accumulator.concat(current)
        : accumulator.concat("pre" + current, current, "post" + current);
}, [] as string[]);
stages.sort();
(logger.silly as any)(`Full stages: [${stages.join(", ")}]`);

logger.info("Regenerating package src");

logger.verbose("Removing src/");
shelljs.cd(__dirname);
shelljs.rm("-rf", src);

logger.verbose("Rebuilding src/");
shelljs.mkdir(src);

const lifecycleStagesContents = `\
const NpmLifecycleStages: string[] = [
    "${stages.join('",\n    "')}",
];

enum ENpmLifecycleStages {
    ${stages.reduce(
        (accumulator: string, current: string): string => {
            return accumulator + "    " + current + " = \"" + current + "\",\n";
        },
        "",
    )}\
}

export {
    ENpmLifecycleStages,
    NpmLifecycleStages,
};
`;

fs.writeFileSync(
    path.join(src, "index.ts"),
    lifecycleStagesContents,
    "utf-8",
);
/* tslint:disable-next-line:no-var-requires */
localVersion = require(`${npmTmpDir}/package.json`).version;
if (localVersion === registryVersion) {
    shelljs.exec(`npm version ${registryVersion}`);
} else {
    throw new Error(`Version mismatch; local: ${localVersion}; registry: ${registryVersion}`);
}
