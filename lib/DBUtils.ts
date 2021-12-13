import * as mysql from 'mysql';

const DB_NAME = 'h5_mp_history';
const CURRENT_TIMESTAMP = { toSqlString: function() { return 'CURRENT_TIMESTAMP()'; } };

export default class DBUtils{

  connection:mysql.Connection;

  constructor(config:mysql.ConnectionConfig){
    this.connection = mysql.createConnection(config);
    this.connection.connect();
  }

  addVersion(version:string, files:string){
    this.connection.query(`INSERT INTO ${DB_NAME} SET ?`, { 
      version, files, 
      created_time: CURRENT_TIMESTAMP,
    }, function(error, results, fields) {
      if (error) throw error;
    });
  }

  getFilsByVersion(version:string){
    return new Promise<any>((resolve, reject)=>{
      // error will be an Error if one occurred during the query
      // results will contain the results of the query
      // fields will contain information about the returned results fields (if any)
      this.connection.query(`SELECT * FROM ${DB_NAME} WHERE version = ?`, [version], (error, results, fields)=> {
        if (error){
          throw error;
          reject(error);
        }else{
          resolve(results);
        }
      });
    }) 
  }

  close(){
    this.connection.end();
  }

}
 