import * as mysql from 'mysql';

const DB_H5_HISTORY = 'h5_mp_history';
const DB_JTRAC_LIST = 'jtrac_list';
const CURRENT_TIMESTAMP = { toSqlString: function() { return 'CURRENT_TIMESTAMP()'; } };

export default class DBUtils{

  connection:mysql.Connection;

  constructor(config:mysql.ConnectionConfig){
    this.connection = mysql.createConnection(config);
    this.connection.connect();
  }

  addVersion(version:string, files:string){
    return new Promise<any>((resolve, reject) => {
      this.connection.query(`INSERT INTO ${DB_H5_HISTORY} SET ?`, {
        version, files,
        created_time: CURRENT_TIMESTAMP,
      }, function(error, results, fields) {
        if (error){
          throw error;
          reject(error);
        }else {
          resolve(results);
        }
      });
    })
  }

  getFilsByVersion(version:string){
    return new Promise<any>((resolve, reject)=>{
      // error will be an Error if one occurred during the query
      // results will contain the results of the query
      // fields will contain information about the returned results fields (if any)
      this.connection.query(`SELECT * FROM ${DB_H5_HISTORY} WHERE version = ?`, [version], (error, results, fields) => {
        if (error){
          throw error;
          reject(error);
        }else{
          resolve(results);
        }
      });
    }) 
  }

  getLastTwoFils() {
    return new Promise<any>((resolve, reject) => {
      // error will be an Error if one occurred during the query
      // results will contain the results of the query
      // fields will contain information about the returned results fields (if any)
      this.connection.query(`SELECT * FROM ${DB_H5_HISTORY} ORDER BY id DESC LIMIT 2`, (error, results, fields) => {
        if (error) {
          throw error;
          reject(error);
        } else {
          resolve(results);
        }
      });
    })
  }

  getJtracInfo(jtrac:string){
    return new Promise<any>((resolve, reject) => {
      // error will be an Error if one occurred during the query
      // results will contain the results of the query
      // fields will contain information about the returned results fields (if any)
      this.connection.query(`SELECT * FROM ${DB_JTRAC_LIST} WHERE jtrac_no = ? AND status = 'A'`, [jtrac], (error, results, fields) => {
        if (error) {
          throw error;
          reject(error);
        } else {
          resolve(results);
        }
      });
    })
  }

  getJtracByVersion(version: string) {
    return new Promise<any>((resolve, reject) => {
      // error will be an Error if one occurred during the query
      // results will contain the results of the query
      // fields will contain information about the returned results fields (if any)
      this.connection.query(`SELECT * FROM ${DB_JTRAC_LIST} WHERE version = ? AND status = 'A'`, [version], (error, results, fields) => {
        if (error) {
          throw error;
          reject(error);
        } else {
          resolve(results);
        }
      });
    })
  }

   /*
   *  OkPacket {
   *  fieldCount: 0,
   *  affectedRows: 1,
   *  insertId: 0,
   *  serverStatus: 34,
   *  warningCount: 0,
   *  message: '(Rows matched: 1  Changed: 1  Warnings: 0',
   *  protocol41: true,
   *  changedRows: 1
   *  }
   */
  updateJtracTo45(version: string, modules: string) {
    return new Promise<any>((resolve, reject) => {
      this.connection.query(`UPDATE ${DB_JTRAC_LIST} SET status = 'B', module_list = ? WHERE version = ? AND status = 'A' `, [modules, version], (error, results, fields) => {
        if (error) {
          throw error;
          reject(error);
        } else {
          resolve(results);
        }
      });
    })
  }



  close(){
    this.connection.end();
  }



}
 