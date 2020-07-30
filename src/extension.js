//模块“vscode”包含VS代码扩展性API
//导入该模块并在下面的代码中使用别名vscode引用它
const vscode = require('vscode');

//此方法在您的扩展被激活时调用
//您的扩展在第一次执行命令时被激活
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	//使用控制台输出诊断信息(console.log)和错误(console.error)
	//这行代码只在激活扩展时执行一次
	console.log('恭喜，您的扩展"MiguReader"已被激活！');
	require('./migu_login')(context); // helloworld
	require('./migu_main')(context); // helloworld
	require('./migu_bookshelf')(context); // helloworld
}
exports.activate = activate;

//此方法在停用扩展时调用
function deactivate() {
	console.log('您的扩展"MiguReader"已被释放！')
}

module.exports = {
	activate,
	deactivate
}
