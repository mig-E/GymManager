const mysql = require('mysql');

let pool = mysql.createPool({
    connectionLimit: 10,
    host           : 'classmysql.engr.oregonstate.edu',
    user           : 'cs340_lugomi',
    password       : '0125',
    database       : 'cs340_lugomi'
});

// var pool = mysql.createPool({
//     connectionLimit : 10,
//     host            : 'localhost',
//     user            : 'cs340',
//     password        : '2194',
//     database        : 'Gym'
// })

module.exports.pool = pool;