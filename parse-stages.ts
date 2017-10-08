import * as fs from "fs";
import * as path from "path";
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

const tmpDir = path.join(__dirname, ".lifecycleTmp");
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

logger.verbose(`Cleaning ${tmpDir}`);
// shelljs.rm("-rf", tmpDir);
shelljs.mkdir(tmpDir);

logger.verbose(`Cloning npm`);
shelljs.cd(tmpDir);
shelljs.exec("git clone https://github.com/npm/npm.git");
shelljs.cd("npm");
// shelljs.exec("npm install");

logger.verbose("Parsing find...awk");
const rawFindAwk = shelljs.exec(findAwk, { silent: true }).stdout as string;
const findAwkStages = rawFindAwk.trim().split("\n").sort();
(logger.silly as any)(findAwkStages);

logger.verbose("Parsing awk...doc");
const rawAwkDocs = shelljs.exec(awkDocs, { silent: true }).stdout as string;
const awkDocsStages = rawAwkDocs.trim().split("\n").sort();
(logger.silly as any)(awkDocsStages);

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
(logger.silly as any)(stages);

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
