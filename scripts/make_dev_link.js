import fs from 'fs';


//************************************ Write you dir here ************************************

//Please write the "workspace/data/plugins" directory here
//请在这里填写你的 "workspace/data/plugins" 目录
const targetDir = '';
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
            process.exit(1);
        }
    } catch (e) {
        log("Error:", e);
        process.exit(1);
    }
    return conf.data;
}

if (targetDir === '') {
    let res = await getSiYuanDir();
    log(res);
    process.exit(0);
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
    log('Failed! Target directory already exists');
    process.exit(1);
}

//创建软链接
fs.symlinkSync(`${process.cwd()}/dev`, targetPath, 'junction');
log(`Done! Created symlink ${targetPath}`);

