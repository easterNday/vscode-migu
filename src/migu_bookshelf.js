const vscode = require('vscode');//VS Code模块
const puppeteer = require('puppeteer');//无头浏览器
const path = require("path");//路径操作
const fs = require('fs');//文件操作
const tool = require("./tools");//工具函数

//模板网页转化为WebView
function GetHTML(context,content,link_before,link_next) {
    let html = fs.readFileSync(path.join(context.extensionPath, "src", 'readTemplate.html'), 'utf-8');
    html = html.replace("content", content);
    html = html.replace("link_next", link_next);
    html = html.replace("link_before", link_before);
    return html;
}

module.exports = function (context) {
    context.subscriptions.push(
        vscode.commands.registerCommand('MiguReader.BookShelf', function () {
            // 初始化选项列表清单
            let items = [];
            for (var i = 0; i < tool.bookName.length; i++) {
                items.push({ label: tool.bookName[i], detail: tool.bookLink[i] });
            }

            vscode.window.showQuickPick(
                items,
                {
                    canPickMany: false,
                    ignoreFocusOut: true,
                    matchOnDescription: true,
                    matchOnDetail: true,
                    placeHolder: '选择要看的小说'
                })
                .then(function (msg) {
                    var cookie = tool.GetCookie();
                    // 导入设备描述库
                    puppeteer.launch({
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
                    }).then(async browser => {
                        //打开第一页
                        var page = (await browser.pages())[0];

                        //反反爬虫设置
                        await Promise.all([
                            // 模拟iPhone X
                            await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1'),
                            await page.setViewport({ width: 375, height: 812 }),
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

                        //注入cookie
                        for (let co of cookie) {
                            let cookietmp = {
                                name: co.name,
                                value: co.value,
                                domain: co.domain,
                                httponly: co.httponly
                            }
                            await page.setCookie(cookietmp);
                        }

                        //打开网页
                        await page.goto(msg.detail);
                        //获取小说内容
                        var content = await page.$eval('.readContent.read_text2', el => el.innerHTML);

                        // 创建webview
                        var panel = vscode.window.createWebviewPanel(
                            'BookWebView', // viewType
                            "摸鱼页面", // 视图标题
                            vscode.ViewColumn.Beside, // 显示在编辑器的哪个部位
                            {
                                enableScripts: true, // 启用JS，默认禁用
                                retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
                            })
                        
                        //页面内容变化
                        panel.webview.html = GetHTML(context,content,await page.$eval('div.charpterBox > a:nth-child(1)', el => el.href),await page.$eval('div.charpterBox > a:nth-child(3)', el => el.href));
                        
                        //监听小说变化
                        panel.webview.onDidReceiveMessage(message => {
                            console.log(message);
                            //打开网页
                            page.goto(message).then(async () => {
                                //var content = await page.$eval('.charpterContent', el => el.innerText);
                                var content = await page.$eval('.readContent.read_text2', el => el.innerHTML);

                                panel.webview.html = GetHTML(context,content,await page.$eval('div.charpterBox > a:nth-child(1)', el => el.href),await page.$eval('div.charpterBox > a:nth-child(3)', el => el.href));
                            });
                        }, undefined, context.subscriptions);
                    });
                })
        })
    );
}