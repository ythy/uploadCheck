import * as fs from 'fs';
import * as path from 'path';
import { Stats, Dirent } from 'fs';


export function getFileExtension(path:any){
  return path && path.split('.').pop();
}

export function readJsonFile<T>(path: string){
  return new Promise<T>((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) {
        console.error('ReadJsonFile Error: ' + err);
        reject(err)
      }
      resolve(JSON.parse(data));
    })
  });
}

/**
 * @expamles 
 * const historyPath = path.resolve(_baseDir, _config.history);
 * const isHistoryExist = await access(historyPath);
 */
export function access(path: string) {
  return new Promise<boolean>((resolve, reject) => {
    fs.access(path, fs.constants.W_OK, (err) => {
      if (err) {
        resolve(false)
      }
      resolve(true);
    })
  });
}

export function stat(path: string) {
  return new Promise<Stats>((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (err) {
        reject(err)
      }
      resolve(stats);
    })
  });
}

export function readdir(path: string) {
  return new Promise<Dirent[]>((resolve, reject) => {
    fs.readdir(path, { withFileTypes: true }, (err, files) => {
      if (err) {
        reject(err)
      }
      resolve(files);
    })
  });
}

