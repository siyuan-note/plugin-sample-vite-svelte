import fs from 'fs';
import readline  from 'node:readline';


//************************************ Write you dir here ************************************

//Please write the "workspace/data/plugins" directory here
//请在这里填写你的 "workspace/data/plugins" 目录
let targetDir = '';
//Like this
// const targetDir = `H:\\SiYuanDevSpace\\data\\plugins`;
//********************************************************************************************

const log = console.log;

async function getSiYuanDir() {
    let url = 'http://127.0.0.1:6806/api/system/getWorkspaces';
    let header = {
        // "Authorization": `Token ${token}`,
        "Content-Type": "application/json",
    }
    let conf = {};
    try {
        let response = await fetch(url, {
            method: 'POST',
            headers: header
        });
        if (response.ok) {
            conf = await response.json();
        } else {
            log(`HTTP-Error: ${response.status}`);
            return null;
        }
    } catch (e) {
        log("Error:", e);
        log("Please make sure SiYuan is running!!!");
        return null;
    }
    return conf.data;
}

async function chooseTarget(workspaces) {
    let count = workspaces.length;
    log(`Got ${count} SiYuan ${count > 1 ? 'workspaces' : 'workspace'}`)
    for (let i = 0; i < workspaces.length; i++) {
        log(`[${i}] ${workspaces[i].path}`);
    }

    if (count == 1) {
        return `${workspaces[0].path}/data/plugins`;
    } else {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        let index = await new Promise((resolve, reject) => {
            rl.question(`Please select a workspace[0-${count-1}]: `, (answer) => {
                resolve(answer);
            });
        });
        rl.close();
        return `${workspaces[index].path}/data/plugins`;
    }
}

if (targetDir === '') {
    log('"targetDir" is empty, try to get SiYuan directory automatically....')
    let res = await getSiYuanDir();
    
    if (res === null) {
        log('Failed! You can set the plugin directory in scripts/make_dev_link.js and try again');
        process.exit(1);
    }

    targetDir = await chooseTarget(res);
    log(`Got target directory: ${targetDir}`);
}

//Check
if (!fs.existsSync(targetDir)) {
    log(`Failed! plugin directory not exists: "${targetDir}"`);
    log(`Please set the plugin directory in scripts/make_dev_link.js`);
    process.exit(1);
}


//check if plugin.json exists
if (!fs.existsSync('./plugin.json')) {
    console.error('Failed! plugin.json not found');
    process.exit(1);
}

//load plugin.json
const plugin = JSON.parse(fs.readFileSync('./plugin.json', 'utf8'));
const name = plugin?.name;
if (!name || name === '') {
    log('Failed! Please set plugin name in plugin.json');
    process.exit(1);
}

//dev directory
const devDir = `./dev`;
//mkdir if not exists
if (!fs.existsSync(devDir)) {
    fs.mkdirSync(devDir);
}

const targetPath = `${targetDir}/${name}`;
//如果已经存在，就退出
if (fs.existsSync(targetPath)) {
    log(`Failed! Target directory  ${targetPath} already exists`);
} else {
    //创建软链接
    fs.symlinkSync(`${process.cwd()}/dev`, targetPath, 'junction');
    log(`Done! Created symlink ${targetPath}`);
}

