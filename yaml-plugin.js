/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-04-05 21:27:55
 * @FilePath     : /yaml-plugin.js
 * @LastEditTime : 2024-04-05 22:37:40
 * @Description  : 去妮玛的 json 格式，我就是要用 yaml 写 i18n
 */
// plugins/vite-plugin-parse-yaml.js
import fs from 'fs';
import yaml from 'js-yaml';
import { resolve } from 'path';

export default function vitePluginYamlI18n(options = {}) {
    // Default options with a fallback
    const DefaultOptions = {
        inDir: 'src/i18n',
        outDir: 'dist/i18n',
    };

    const finalOptions = { ...DefaultOptions, ...options };

    return {
        name: 'vite-plugin-yaml-i18n',
        buildStart() {
            console.log('🌈 Parse I18n: YAML to JSON..');
            const inDir = finalOptions.inDir;
            const outDir = finalOptions.outDir

            if (!fs.existsSync(outDir)) {
                fs.mkdirSync(outDir, { recursive: true });
            }

            //Remove yaml under outDir, which is auto-moved by vite
            const outFiles = fs.readdirSync(outDir);
            for (const file of outFiles) {
                if (file.endsWith('.yaml') || file.endsWith('.yml')) {
                    console.log(`-- Remove yaml file ${file} under dist`);
                    fs.unlinkSync(resolve(outDir, file));
                }
            }

            //Parse yaml file, output to json
            const files = fs.readdirSync(inDir);
            for (const file of files) {
                if (file.endsWith('.yaml') || file.endsWith('.yml')) {
                    console.log(`-- Parsing ${file}`)
                    //检查是否有同名的json文件
                    const jsonFile = file.replace(/\.(yaml|yml)$/, '.json');
                    if (files.includes(jsonFile)) {
                        console.log(`---- File ${jsonFile} already exists, skipping...`);
                        continue;
                    }
                    try {
                        const filePath = resolve(inDir, file);
                        const fileContents = fs.readFileSync(filePath, 'utf8');
                        const parsed = yaml.load(fileContents);
                        const jsonContent = JSON.stringify(parsed, null, 2);
                        const outputFilePath = resolve(outDir, file.replace(/\.(yaml|yml)$/, '.json'));
                        console.log(`---- Writing to ${outputFilePath}`);
                        fs.writeFileSync(outputFilePath, jsonContent);
                    } catch (error) {
                        this.error(`---- Error parsing YAML file ${file}: ${error.message}`);
                    }
                }
            }
        },
    };
}
