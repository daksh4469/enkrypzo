const fs = require('fs');
 
const encrypt = require('node-file-encrypt');
 
let filePath = './tmp/test.txt'; 
let encryptPath = '';
 
{ // encrypt file
    let f = new encrypt.FileEncrypt(filePath);
    f.openSourceFile();
    f.encrypt('111111');
    encryptPath = f.encryptFilePath;
    console.log("encrypt sync done",encryptPath);
}
 
{ // decrypt file
    fs.unlink(filePath, function() {});
    let f = new encrypt.FileEncrypt(encryptPath);
    f.openSourceFile();
    f.decrypt('111111');
    console.log("decrypt sync done");
}
 
{ // get original file name from encrypted file
    let f = new encrypt.FileEncrypt(encryptPath);
    f.openSourceFile();
    console.log(f.info('111111'));
}
 
// { // encrypt & decrypt file async
//     let f = new encrypt.FileEncrypt(filePath);
//     f.openSourceFile();
//     f.encryptAsync('111111').then(function() {
//         encryptPath = f.encryptFilePath;
//         console.log("encrypt async done");
//         fs.unlink(filePath, function() {});
//         let d = new encrypt.FileEncrypt(encryptPath);
//         d.openSourceFile();
//         d.decryptAsync('111111').then(function() {
//             console.log("decrypt async done");
//         });
//     });
// }