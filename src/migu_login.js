const vscode = require('vscode');//VS Code模块
const puppeteer = require('puppeteer');//无头浏览器
const path = require("path");//路径操作
const tool = require("./tools");//工具函数

//展示扫码登录的二维码
/**
 * @param {vscode.ExtensionContext} context
 */
function ShowQRCode(context) {
    var panel = vscode.window.createWebviewPanel(
        'QRCodeWebview', // viewType
        "扫码登录", // 视图标题
        vscode.ViewColumn.Beside, // 显示在编辑器的哪个部位
        {
            enableScripts: true, // 启用JS，默认禁用
            retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
        }
    );
    //vscode-resource专用路径
    var sourcePath = vscode.Uri.file(path.join(context.extensionPath, 'QRCode.png')).with({ scheme: 'vscode-resource' }).toString();
    //面板显示
    panel.webview.html = '<html><body><img src="' + sourcePath + '"/></body></html>';
    //返回面板
    return panel;
}

module.exports = function (context) {
    // 注册Login命令
    context.subscriptions.push(
        vscode.commands.registerCommand('MiguReader.Login', function () {
            //每次执行命令时都将执行您放置在此处的代码
            (async () => {
                var browser = await puppeteer.launch({
                    headless: true,
                    ignoreHTTPSErrors: false, // 在导航期间忽略 HTTPS 错误
                    args: [
                        '--start-maximized',
                        "--disable-web-security",
                        "--disable-setuid-sandbox",
                        "--no-sandbox",
                        "--disable-gpu",
                        "--disable-dev-shm-usage",
                        "--no-first-run",
                        "--no-zygote",
                        "--disable-popup-blocking"
                    ],
                    dumpio: false
                });

                //打开第一页
                var page = (await browser.pages())[0];

                //反反爬虫设置
                await Promise.all([
                    page.setUserAgent(tool.UA),
                    // 允许运行js
                    page.setJavaScriptEnabled(true),
                    // 设置页面视口的大小
                    //page.setViewport({ width: 1100, height: 1080 }),
                ]);
                //反反爬设置
                await page.evaluateOnNewDocument(() => {
                    Object.defineProperty(navigator, "webdriver", {
                        get: () => false
                    });
                });

                //网页跳转
                await page.goto(
                    'https://graph.qq.com/oauth2.0/show?which=Login&display=pc&which=ConfirmPage&display=&response_type=code&client_id=101416376&redirect_uri=https%3A%2F%2Fpassport.migu.cn%2Fqqlogin%3FcallbackURL%3D&state=204001%3B2%7Chttps%253A%252F%252Fwap.cmread.com%252Fr%252Fp%252FcenterV1_1.jsp%253Bjsessionid%253D402A7B72BFC147AAF07A98D7CA1E2467.8ngFwnsvW.2.0%253Flayout%253D2%2526ln%253D9762_482049_98716618_11_1_L3%2526vt%253D2&scope=get_user_info',
                    { waitUntil: 'load' }
                )
                //var html = await page.$eval('#ptlogin_iframe', el => el.innerHTML);
                let body = await page.$('#ptlogin_iframe');
                await body.screenshot({
                    path: path.join(context.extensionPath, 'QRCode.png')
                });

                //状态信息更改
                vscode.window.setStatusBarMessage('正在登陆咪咕阅读……');

                //展示二维码扫码
                let panel = ShowQRCode(context);

                //等待页面跳转
                await page.waitForNavigation({ timeout: 0 });

                //销毁WEbview
                panel.dispose();
                //状态信息更改
                vscode.window.setStatusBarMessage("");

                //获取cookie
                let cookie = await page.cookies();

                //存储Cookie
                // 最后一个参数，为true时表示写入全局配置，为false或不传时则只写入工作区配置
                vscode.workspace.getConfiguration().update('MiguReader.set.Cookie', cookie, true);

                //消息提示
                vscode.window.showInformationMessage('咪咕Cookie保存成功!');

                //退出浏览器
                await browser.close();

                //执行读取小说
                vscode.commands.executeCommand('MiguReader.Main');
            })();
        })
    );
};