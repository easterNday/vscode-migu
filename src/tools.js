const vscode = require('vscode');//VSCode模块

// 设置浏览器信息
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/63.0.3239.84 Chrome/63.0.3239.84 Safari/537.36";

//所有小说信息
var bookName = [];
var bookLink = [];

//获取本地储存的Cookie
function GetCookie() {
    return vscode.workspace.getConfiguration().get('MiguReader.set.Cookie');
}

module.exports = {
    GetCookie,
    UA,
    bookName,
    bookLink
}