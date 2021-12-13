
import * as fs from 'fs';
import * as path from 'path';
import { Dirent } from 'fs';
import { readJsonFile, access, readdir, stat, getFileExtension } from './lib/fileUtils';
import DBUtils from './lib/DBUtils';

interface IConfig {
  entry: string; //编译文件夹入口
  extension: string[];//保存记录的文件后缀名
  host: string;//数据库HOST
  user: string;//数据库用户名
  password: string;//数据库密码
  database: string;//数据库名
}

interface IVersion {
  version: string;
  fileList: IFile[];
}

interface IFile {
  name: string;
  size: number;
  date: number;
}


const _baseDir = process.cwd();
const CONFIG_FILE = 'upload_check_config.json';
let _config = {} as IConfig; //必备参数

export async function insertVersion(version:string){
  console.log('start insertVersion: ' + version);
  _config = await loadConfig();
  const rootFiles = await readdir(path.resolve(_baseDir, _config.entry));
  const files: IFile[] = [];
  await recordByDir(path.resolve(_baseDir, _config.entry), rootFiles, files);
  const dbUtils = new DBUtils(_config);
  dbUtils.addVersion(version, JSON.stringify(files));
  dbUtils.close();
}
 
export async function compareVersion(newVersion: string, oldVersion: string) {
  console.log('start compareVersion : ' + `${newVersion} vs ${oldVersion}`);
  _config = await loadConfig();
  const dbUtils = new DBUtils(_config);

  const newFiles = await dbUtils.getFilsByVersion(newVersion);
  const oldFiles = await dbUtils.getFilsByVersion(oldVersion);
  dbUtils.close();
  if (!oldFiles?.[0]?.version || !newFiles?.[0]?.version){
    console.log('invalid version !');
    return;
  }
  const changedFiles:any[] = [];
  const oldFileList:IFile[] =  JSON.parse(oldFiles[0].files);
  const newFileList:IFile[] = JSON.parse(newFiles[0].files);
  newFileList.forEach((file: IFile) => {
    const old = oldFileList.find(f => f.name === file.name);
    if (!old || (old && old.date !== file.date)){
      changedFiles.push(JSON.stringify({
        name: file.name,
        newDate: dateFormat(file.date),
        oldDate: old?.date ? dateFormat(old?.date) : '',
      }));
    }
  });
  console.log('result: \n', changedFiles.join('\n'));
}

function loadConfig(){
  return readJsonFile<IConfig>(path.resolve(_baseDir, CONFIG_FILE));
}

async function recordByDir(rootPath: string, dir: Dirent[], data: IFile[]) {
  return new Promise<any>(async (resolve, reject) => {
    const filesFilter = dir.filter(filefilter => {
      return (filefilter.isFile() && _config.extension.includes(getFileExtension(filefilter.name))) || filefilter.isDirectory();
    });
    for (const file of filesFilter) {
      const fileName = path.resolve(rootPath, file.name);
      if (file.isDirectory()) {
        const files = await readdir(fileName);
        const record = await recordByDir(fileName, files, data);
      } else {
        const fileStat = await stat(fileName);
        data.push({
          name: fileName.substr(path.resolve(_baseDir, _config.entry).length),
          size: fileStat.size,
          date: fileStat.mtimeMs,
        });
      }
    }
    resolve(true);
  });
}

//弃用 writeHistory(historyPath, _historyInfo);
function writeHistory(path: string, data: any) {
  return new Promise<boolean>((resolve, reject) => {
    fs.writeFile(path, JSON.stringify(data), (err) => {
      if (err) {
        resolve(false)
      }
      resolve(true);
    })
  });
}

function dateFormat(timestamp:number){
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    hour12: false,
  });
}