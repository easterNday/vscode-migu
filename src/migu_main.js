const vscode = require('vscode');//VS Code模块
const puppeteer = require('puppeteer');//无头浏览器
const tool = require("./tools");//工具函数

module.exports = function (context) {
    context.subscriptions.push(
        vscode.commands.registerCommand('MiguReader.Main', function () {

            //获取Cookie
            var cookie = tool.GetCookie();
            //console.log(GetCookie());
            if (cookie.length == 0) {
                vscode.commands.executeCommand('MiguReader.Login');
                return;
            }

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
                await page.goto("https://wap.cmread.com/r/p/index.jsp");

                await Promise.all([
                    page.click(".head-portrait"),//点击头像
                    page.waitForNavigation()//等待页面刷新
                ])

                await Promise.all([
                    page.click(".cardBox > a:nth-child(1)"),//点击最近阅读
                    page.waitForNavigation()//等待页面刷新
                ])

                //获取书名
                tool.bookName = await page.$$eval('.shelflist-bookname.lineOne', el => el.map(el => el.innerHTML));
                tool.bookLink = await page.$$eval('.shelflist-bookinfo > a:nth-child(1)', el => el.map(el => el.href));

                //关闭浏览器
                await browser.close();

                //显示选择面板
                vscode.commands.executeCommand('MiguReader.BookShelf');
            })();
        })
    );
}