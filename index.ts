#!/usr/bin/env node
export {}

import commandLineArgs, { OptionDefinition } from 'command-line-args'
import fs from 'fs'
import path from 'path'

const optionDefinitions: OptionDefinition[] = [
    { name: 'dir', defaultOption: true, defaultValue: "." },
    { name: 'base', alias: 'b', type: String, defaultValue: "base.prisma" },
    { name: 'output', alias: 'o', type: String, defaultValue: "schema.prisma" },
]

const {
    dir,
    base,
    output,
} = commandLineArgs(optionDefinitions, { partial: false })
const fullDirPath = path.join(process.cwd(), dir);
const fullBasePath = path.join(fullDirPath, base);
const fullOutputPath = path.join(fullDirPath, output);

function main() {
    if (!fileExists(fullBasePath)) {
        throw new Error(`Base file ${base} does not exist`)
    }

    // Get base file contents
    const baseFileContents = getFileContents(fullBasePath);
    validateBase(baseFileContents);

    // Get all other file contents
    const otherContents: string[] = []
    getDfsContents(fullDirPath, otherContents);

    // Get all contents
    const contents = removeExtraBlankLines([baseFileContents, ...otherContents].join("\n\n"));

    // Write content
    writeToFile(fullOutputPath, contents);
}

function fileExists(filepath: string) {
    return fs.existsSync(filepath);
}

function getFileContents(filepath: string) {
    return fs.readFileSync(filepath, 'utf8');
}

function getDfsContents(filepath: string, contents: string[]) {
    const files = fs.readdirSync(filepath);
    for (const file of files) {
        const fullPath = path.join(filepath, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
            getDfsContents(fullPath, contents);
        } else if (fullPath !== fullBasePath && fullPath !== fullOutputPath && fullPath.endsWith(".prisma")) {
            const fileContents = getFileContents(fullPath);
            validateOther(fileContents);
            contents.push(fileContents);
        }
    }
}

function writeToFile(filepath: string, contents: string) {
    if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
    }
    fs.writeFileSync(filepath, contents, {
        encoding: 'utf8',
        flag: 'w',
    });
}

function removeExtraBlankLines(content: string) {
    const EOL = content.match(/\r\n/gm) ? "\r\n" : "\n";
    const regExp = new RegExp("(" + EOL + "){3,}", "gm");
    return content.replace(regExp, EOL + EOL);
}

function validateBase(content: string) {
    const lines = content.split("\n");
    let datasourceCount = 0;
    let generatorCount = 0;
    for (const line of lines) {
        if (line.trim().startsWith("datasource")) {
            datasourceCount++;
        } else if (line.trim().startsWith("generator")) {
            generatorCount++;
        }
    }
    const isValidBase = datasourceCount === 1 && generatorCount >= 1
    if (!isValidBase) {
        throw new Error("Base file must contain a datasource and at least one generator")
    }
}

function validateOther(content: string) {
    const lines = content.split("\n");
    for (const line of lines) {
        if (line.trim().startsWith("datasource")) {
            throw new Error("Non-base schemas cannot contain a datasource")
        } else if (line.trim().startsWith("generator")) {
            throw new Error("Non-base schemas cannot contain a generator")
        }
    }
}

main();
