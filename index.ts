import * as fs from "fs";
import * as path from "path";
import { Dirent } from "fs";
import {
  readJsonFile,
  access,
  readdir,
  stat,
  getFileExtension,
  copy,
  mkdir,
  readTxtFile,
} from "./lib/fileUtils";
import DBUtils from "./lib/DBUtils";
const SftpClient = require("ssh2-sftp-client");

interface IConfig {
  entry: string; //编译文件夹入口
  entry_css: string; //编译CSS文件夹入口
  extension: string[]; //保存记录的文件后缀名
  host: string; //数据库HOST
  user: string; //数据库用户名
  password: string; //数据库密码
  database: string; //数据库名
  updateEntry: string; //更新目录入口
  compileEntry: string; //编译目录入口
  remote_entry_script: string; //ftp script目录路径
  remote_entry_styles: string; //ftp styles目录路径
  remote_entry_jsp: string; //ftp jsp路径
  local_entry_jsp: string[]; //本地 jsp路径
  copiedFiles: string[]; //固定要复制的文件
  ftp_store: string; //ftp配置文件
}

interface IDCConfig {
  entry: string; //IDC上传操作目录
  file_list: string; //需要上传的文件列表
  remote_entry_test: string;
  remote_entry_idc: string;
  ftp_store: string; //ftp配置文件
}

interface IFTP {
  ftp_host_test: string;
  ftp_user_test: string;
  ftp_pw_test: string;
  ftp_host_idc_node1: string;
  ftp_user_idc_node1: string;
  ftp_pw_idc_node1: string;
  ftp_host_idc_node2: string;
  ftp_user_idc_node2: string;
  ftp_pw_idc_node2: string;
}

interface IFile {
  name: string;
  size: number;
  date: number;
}

const _baseDir = process.cwd();
const CONFIG_FILE = "upload_check_config.json";
const IDC_CONFIG_FILE = "upload_idc_config.json";
let _config = {} as IConfig; //必备参数
let _IDCConfig = {} as IDCConfig; //必备参数
let _ftp = {} as IFTP; //必备参数

export async function insertVersion(version: string, types: string) {
  const jspTypes = types.split(",");
  console.log("start insertVersion: " + version + " ,types: " + types);
  _config = await loadConfig();
  _ftp = await loadAbsoluteConfig(_config.ftp_store);

  const rootFiles = await readdir(path.resolve(_baseDir, _config.entry));
  const files: IFile[] = [];
  const rootCSSFiles = await readdir(path.resolve(_baseDir, _config.entry_css));
  const cssFiles: IFile[] = [];
  await recordByDir(path.resolve(_baseDir, _config.entry), rootFiles, files);
  await recordByDir(
    path.resolve(_baseDir, _config.entry_css),
    rootCSSFiles,
    cssFiles
  );

  const dbUtils = new DBUtils(_config);
  await dbUtils.addVersion(version, JSON.stringify([...files, ...cssFiles]));
  console.log("end insertVersion: " + version);

  const compares = await dbUtils.getLastTwoFils();
  console.log(
    "start compareVersion : " +
      `${compares[0].version} vs ${compares[1].version}`
  );
  const modules: string[] = [];
  const oldFileList: IFile[] = JSON.parse(compares[1].files);
  const newFileList: IFile[] = JSON.parse(compares[0].files);
  newFileList.forEach((file: IFile) => {
    const old = oldFileList.find((f) => f.name === file.name);
    if (!old || (old && old.date !== file.date)) {
      modules.push(file.name.split("\\").join("/"));
    }
  });

  console.log("start update modules: " + modules.join(","));
  dbUtils
    .updateJtracTo45(version, modules.join(","))
    .then(async (result) => {
      dbUtils.close();
      if (!result.changedRows || result.changedRows < 1) {
        console.log(`error in update jtrac: changedRows < 1`);
      } else {
        console.log(
          `update jtrac status success: changedRows ( ${result?.changedRows} )`
        );
        //开始上传FTP
        console.log("start upload files ");
        const client = new SftpClient();
        await client.connect({
          host: _ftp.ftp_host_test,
          port: 22,
          username: _ftp.ftp_user_test,
          password: _ftp.ftp_pw_test,
        });
        let modulesCombinedJS: string[] = [];
        let modulesCombinedCSS: string[] = [];
        modules.forEach((originPath) => {
          if (getFileExtension(originPath) === "js") {
            modulesCombinedJS.push(
              originPath,
              originPath + ".gz",
              originPath + ".map"
            );
          } else {
            //css
            modulesCombinedCSS.push(originPath, originPath + ".gz");
          }
        });
        for (const modulePath of modulesCombinedJS) {
          console.log("upload file: " + modulePath);
          const result = await client
            .put(
              path.join(_config.entry, modulePath),
              _config.remote_entry_script + modulePath
            )
            .catch((err: any) => {
              console.log("upload file error: " + err);
            });
          console.log("upload file result: " + result);
        }
        for (const modulePathCSS of modulesCombinedCSS) {
          console.log("upload css: " + modulePathCSS);
          const resultCSS = await client
            .put(
              path.join(_config.entry_css, modulePathCSS),
              _config.remote_entry_styles + modulePathCSS
            )
            .catch((err: any) => {
              console.log("upload css error: " + err);
            });
          console.log("upload css result: " + resultCSS);
        }
        const jspList = _config.local_entry_jsp.filter((_, i) => {
          return jspTypes.includes(String(i));
        });
        for (const jspFile of jspList) {
          console.log("upload jsp: " + jspFile);
          const resultJSP = await client
            .put(jspFile, _config.remote_entry_jsp + path.basename(jspFile))
            .catch((err: any) => {
              console.log("upload jsp error: " + err);
            });
          console.log("upload jsp result: " + resultJSP);
        }
        console.log("end upload files ");
        client.end();
      }
    })
    .catch((error) => {
      dbUtils.close();
      console.log(`error in in update jtrac: `, error);
      throw error;
    });
}

export async function compareVersion(newVersion: string, oldVersion: string) {
  console.log("start compareVersion : " + `${newVersion} vs ${oldVersion}`);
  _config = await loadConfig();
  const dbUtils = new DBUtils(_config);

  const newFiles = await dbUtils.getFilsByVersion(newVersion);
  const oldFiles = await dbUtils.getFilsByVersion(oldVersion);
  dbUtils.close();
  if (!oldFiles?.[0]?.version || !newFiles?.[0]?.version) {
    console.log("invalid version !");
    return;
  }
  const changedFiles: any[] = [];
  const copiedFiles: string[] = [];
  const oldFileList: IFile[] = JSON.parse(oldFiles[0].files);
  const newFileList: IFile[] = JSON.parse(newFiles[0].files);
  newFileList.forEach((file: IFile) => {
    const old = oldFileList.find((f) => f.name === file.name);
    if (!old || (old && old.date !== file.date)) {
      changedFiles.push(
        JSON.stringify({
          name: file.name,
          newDate: dateFormat(file.date),
          oldDate: old?.date ? dateFormat(old?.date) : "",
        })
      );
      copiedFiles.push(file.name.split("\\").join("/"));
    }
  });
  console.log("result:", `\n${changedFiles.join("\n")}`);
  console.log(`  ----------------------------------------------------
  --------------------- Copy↓ -----------------------
  ----------------------------------------------------`);
  console.log(`${copiedFiles.join("\n")}`);
}

export async function compareLastVersion() {
  _config = await loadConfig();
  const dbUtils = new DBUtils(_config);
  const files = await dbUtils.getLastTwoFils();
  dbUtils.close();
  if (files?.length !== 2) {
    console.log("invalid row length !");
    return;
  }
  console.log(
    "start compareVersion : " + `${files[0].version} vs ${files[1].version}`
  );
  const changedFiles: any[] = [];
  const copiedFiles: string[] = [];
  const oldFileList: IFile[] = JSON.parse(files[1].files);
  const newFileList: IFile[] = JSON.parse(files[0].files);
  newFileList.forEach((file: IFile) => {
    const old = oldFileList.find((f) => f.name === file.name);
    if (!old || (old && old.date !== file.date)) {
      changedFiles.push(
        JSON.stringify({
          name: file.name,
          newDate: dateFormat(file.date),
          oldDate: old?.date ? dateFormat(old?.date) : "",
        })
      );
      copiedFiles.push(file.name.split("\\").join("/"));
    }
  });
  console.log("result:", `\n${changedFiles.join("\n")}`);
  console.log(`  ----------------------------------------------------
  --------------------- Copy↓ -----------------------
  ----------------------------------------------------`);
  console.log(`${copiedFiles.join("\n")}`);
}

export async function copyCompileFiles(version: string) {
  _config = await loadConfig();
  const dbUtils = new DBUtils(_config);
  dbUtils.getJtracByVersion(version).then(async (jtracFiles) => {
    dbUtils.close();
    if (!jtracFiles?.length || jtracFiles?.length === 0) {
      console.log("error in search");
      return;
    }

    for (const jtrac of jtracFiles) {
      console.log(`start copy jtrac: ${jtrac.jtrac_no}`);
      const filelist = jtrac.file_list?.split(",");
      for (const file of filelist) {
        const result = await copy(
          file,
          _config.updateEntry,
          _config.compileEntry
        ).catch((error) => {
          console.log(`error in copy ${file}: `, error);
          throw error;
        });
        if (result) {
          console.log("copied: ", file);
        }
      }
    }

    for (const fixedFile of _config.copiedFiles) {
      const result = await copy(
        fixedFile,
        _config.updateEntry,
        _config.compileEntry
      ).catch((error) => {
        console.log(`error in copy ${fixedFile}: `, error);
        throw error;
      });
      if (result) {
        console.log("copied: ", fixedFile);
      }
    }
  });
}

export async function uploadIDC() {
  _IDCConfig = await loadConfig<IDCConfig>(IDC_CONFIG_FILE);
  _ftp = await loadAbsoluteConfig(_IDCConfig.ftp_store);

  const fileText = await readTxtFile(path.resolve(_IDCConfig.file_list));
  if (!fileText) {
    log("error in read file list", "red");
    return;
  }
  const fileList = fileText.replace(/\r/g, "").split("\n");
  const uploadEntry = path.resolve(
    _IDCConfig.entry,
    "work",
    dateFormat(new Date().getTime()).replace(/:/g, "-")
  );
  const idcRoot = path.resolve(uploadEntry, "backup");
  const testRoot = path.resolve(uploadEntry, "upload");
  await mkdir(idcRoot);
  await mkdir(testRoot);

  fileList.forEach((file, index) => {
    const ext = getFileExtension(file);
    if (ext === "js") {
      fileList[index] = "/static/mp/script/" + file;
      fileList.push(fileList[index] + ".gz", fileList[index] + ".map");
    } else if (ext === "css") {
      //css
      fileList[index] = "/static/mp/styles/" + file;
      fileList.push(fileList[index] + ".gz");
    }
  });

  //开始备份
  log("start backup idc", "yellow");
  const clientBackup = new SftpClient();
  await clientBackup.connect({
    host: _ftp.ftp_host_idc_node1,
    port: 22,
    username: _ftp.ftp_user_idc_node1,
    password: _ftp.ftp_pw_idc_node1,
  });

  for (const uploadFile of fileList) {
    const remoteFile = _IDCConfig.remote_entry_idc + uploadFile;
    const localFile = path.join(idcRoot, uploadFile);
    await mkdir(path.dirname(localFile));
    const writeStream = fs.createWriteStream(localFile);
    const result = await clientBackup
      .get(remoteFile, writeStream)
      .catch((err: any) => {
        log("download idc error: " + err, "red");
      });
    if (result) {
      log("download idc success: " + remoteFile, "green");
    }
  }
  log("end backup idc", "yellow");
  clientBackup.end();
  //备份结束
  log("---------------------------------------------------------", "cyan");
  log("---------------------------------------------------------", "cyan");
  //开始下载待传文件
  log("start download files from test server", "yellow");
  const clientTest = new SftpClient();
  await clientTest.connect({
    host: _ftp.ftp_host_test,
    port: 22,
    username: _ftp.ftp_user_test,
    password: _ftp.ftp_pw_test,
  });

  for (const downloadFile of fileList) {
    const remoteFile = _IDCConfig.remote_entry_test + downloadFile;
    const localFile = path.join(testRoot, downloadFile);
    await mkdir(path.dirname(localFile));
    const writeStream = fs.createWriteStream(localFile);
    const result = await clientTest
      .get(remoteFile, writeStream)
      .catch((err: any) => {
        log("download test error: " + err, "red");
      });
    if (result) {
      log("download test success: " + remoteFile, "green");
    }
  }
  log("end download files from test server", "yellow");
  clientTest.end();
  //下载待传文件结束
  log("---------------------------------------------------------", "cyan");
  log("---------------------------------------------------------", "cyan");
  //开始上传
  log("start upload files to node1", "yellow");
  const clientNode1 = new SftpClient();
  await clientNode1.connect({
    host: _ftp.ftp_host_idc_node1,
    port: 22,
    username: _ftp.ftp_user_idc_node1,
    password: _ftp.ftp_pw_idc_node1,
  });
  for (const uploadFile1 of fileList) {
    const remoteFile = _IDCConfig.remote_entry_idc + uploadFile1;
    const localFile = path.join(testRoot, uploadFile1);
    const result = await clientNode1
      .put(localFile, remoteFile)
      .catch((err: any) => {
        log("upload node1 error: " + err, "red");
      });
    if (result) {
      log("upload node1 success: " + remoteFile, "green");
    }
  }
  log("end upload files to node1", "yellow");
  clientNode1.end();
  log("---------------------------------------------------------", "cyan");
  log("---------------------------------------------------------", "cyan");
  log("start upload files to node2", "yellow");
  const clientNode2 = new SftpClient();
  await clientNode2.connect({
    host: _ftp.ftp_host_idc_node2,
    port: 22,
    username: _ftp.ftp_user_idc_node2,
    password: _ftp.ftp_pw_idc_node2,
  });
  for (const uploadFile2 of fileList) {
    const remoteFile = _IDCConfig.remote_entry_idc + uploadFile2;
    const localFile = path.join(testRoot, uploadFile2);
    const result = await clientNode2
      .put(localFile, remoteFile)
      .catch((err: any) => {
        log("upload node2 error: " + err, "red");
      });
    if (result) {
      log("upload node2 success: " + remoteFile, "green");
    }
  }
  log("end upload files to node2", "yellow");
  clientNode2.end();
  //上传结束
}

export async function uploadIDCCheck() {
  _IDCConfig = await loadConfig<IDCConfig>(IDC_CONFIG_FILE);
  const fileText = await readTxtFile(path.resolve(_IDCConfig.file_list));
  if (!fileText) {
    log("error in read file list", "red");
    return;
  }
  log(fileText, "yellow");
}

function log(
  info: string,
  color: "green" | "red" | "yellow" | "blue" | "cyan" | "normal" = "normal"
) {
  if (color === "normal") {
    console.log(info);
  } else if (color === "red") {
    console.log("\x1b[31m%s\x1b[0m", info);
  } else if (color === "green") {
    console.log("\x1b[32m%s\x1b[0m", info);
  } else if (color === "yellow") {
    console.log("\x1b[33m%s\x1b[0m", info);
  } else if (color === "blue") {
    console.log("\x1b[34m%s\x1b[0m", info);
  } else if (color === "cyan") {
    console.log("\x1b[36m%s\x1b[0m", info);
  }
}

function loadConfig<T = IConfig>(file = CONFIG_FILE) {
  return readJsonFile<T>(path.resolve(_baseDir, file));
}

function loadAbsoluteConfig<T = IFTP>(paths) {
  return readJsonFile<T>(paths);
}

async function recordByDir(rootPath: string, dir: Dirent[], data: IFile[]) {
  return new Promise<any>(async (resolve, reject) => {
    const filesFilter = dir.filter((filefilter) => {
      return (
        (filefilter.isFile() &&
          _config.extension.includes(getFileExtension(filefilter.name))) ||
        filefilter.isDirectory()
      );
    });
    for (const file of filesFilter) {
      const fileName = path.resolve(rootPath, file.name);
      if (file.isDirectory()) {
        const files = await readdir(fileName);
        const record = await recordByDir(fileName, files, data);
      } else {
        const fileStat = await stat(fileName);
        data.push({
          name: fileName.substr(path.resolve(_baseDir, _config.entry).length), //注意这里_config.entry和_config.entry_css长度一致
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
        resolve(false);
      }
      resolve(true);
    });
  });
}

function dateFormat(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });
}
