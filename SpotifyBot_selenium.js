const SpotifyBotSelenium = function (view = true, useProxy = true) {
    this.email_providers = ['gmail.com', 'yahoo.com', 'hotmail.com', 'hotmail.co.uk', 'hotmail.fr', 'outlook.com',
        'icloud.com', 'mail.com', 'live.com', 'yahoo.it', 'yahoo.ca', 'yahoo.in', 'live.se',
        'orange.fr', 'msn.com', 'mail.ru', 'mac.com'];
    this.randint = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    this.userAgentList = [];
    this.proxyList = [];
    this.profileList = [];
    this.view = view;
    this.useProxy = useProxy;
    this.current = 0;
    this.total = 20;

    this.choice = function (arr) {
        return arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;
    }
    this.makeid = function (length) {
        var result = [];
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result.push(characters.charAt(Math.floor(Math.random() *
                charactersLength)));
        }
        return result.join('');
    }

    this.readFile = function (file) {
        const readline = require('readline');
        const fs = require('fs');

        return readline.createInterface({
            input: fs.createReadStream(file),
            //output: process.stdout,
            console: false
        });
    }

    this.saveCreated = function (email, username, password) {
        let fs = require('fs')
        fs.appendFile('created.txt', `${email}:${password}:${username}\n`, function (err) {
            /*if (err) {
                // append failed
            } else {
                // done
            }*/
        })
    }

    this.genCredentails = function () {
        let credentails = {}
        credentails['gender'] = self.choice(['male', 'female'])
        credentails['birth_year'] = self.randint(1970, 2005)
        credentails['birth_month'] = self.randint(1, 12)
        credentails['birth_day'] = self.randint(1, 28)
        credentails['password'] = self.makeid(self.randint(8, 15))
        let username = self.makeid(self.randint(7, 11))
        credentails['username'] = username
        credentails['email'] = username + '@' + self.choice(self.email_providers)
        return credentails
    }

    this.loadUserAgent = function () {
        console.log("Load UserAgent List ...")
        self.readFile("useragents.txt").on('line', function (line) {
            self.userAgentList.push(line)
        })
    }

    this.loadProxyList = function () {
        console.log("Load Proxy List ...")
        self.readFile("proxylist.txt").on('line', function (line) {
            self.proxyList.push(line)
        })
    }

    this.loadProfileList = function () {
        console.log("Load Profile List ...")
        self.readFile("created.txt").on('line', function (line) {
            let email = line.split(":")[0], pass = line.split(":")[1];
            self.profileList.push({
                email: email,
                password: pass
            })
        });
    }

    this.getRandomUserAgent = function () {
        return self.choice(self.userAgentList);
    }

    this.getRandomProxy = function () {
        return self.choice(self.proxyList);
    }

    let self = this;

    this.loadUserAgent();
    this.loadProxyList();
    this.loadProfileList();

    String.prototype.format = function () {
        let formatted = this;
        for (let arg in arguments) {
            formatted = formatted.replace("{" + arg + "}", arguments[arg]);
        }
        return formatted;
    };
}

SpotifyBotSelenium.prototype.createUser = function (cbl) {
    //console.log("Create User Request ...")
    let self = this;
    const request = require('request');
    try {
        create_headers = {
            'User-agent': 'S4A/2.0.15 (com.spotify.s4a; build:201500080; iOS 13.4.0) Alamofire/4.9.0',
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
            'Accept': 'application/json, text/plain;q=0.2, */*;q=0.1',
            'App-Platform': 'IOS',
            'Spotify-App': 'S4A',
            'Accept-Language': 'en-TZ;q=1.0',
            'Accept-Encoding': 'gzip;q=1.0, compress;q=0.5',
            'Spotify-App-Version': '2.0.15'
        }

        create_response = ''

        create_url = 'https://spclient.wg.spotify.com/signup/public/v1/account'

        credentails = self.genCredentails()

        payload = 'creation_point=lite_7e7cf598605d47caba394c628e2735a2&password_repeat={0}&platform=Android-ARM&iagree=true&password={1}&gender={2}&key=a2d4b979dc624757b4fb47de483f3505&birth_day={3}&birth_month={4}&email={5}&birth_year={6}'.format(
            credentails['password'], credentails['password'], credentails['gender'], credentails['birth_day'],
            credentails['birth_month'], credentails['email'], credentails['birth_year']);

        //console.log(credentails)

        function callback(error, response, body) {
            if (!error && response.statusCode === 200) {
                self.saveCreated(credentails['email'], credentails["username"], credentails['password'])
                return cbl(credentails);
            } else {
                console.log(error)
                return cbl(null);
            }
        }

        if (self.useProxy) {
            const options = {
                method: "POST",
                url: create_url,
                body: payload,
                headers: create_headers,
                'content-type': 'application/json',
                'json': true,
                proxy: self.getRandomProxy()
            };
            request(options, callback)
        } else {
            const options = {
                method: "POST",
                url: create_url,
                body: payload,
                'content-type': 'application/json',
                'json': true,
                headers: create_headers,
            };
            request(options, callback)
        }

    } catch (err) {

    }
}

SpotifyBotSelenium.prototype.login = function (username, password, redirect = "https://open.spotify.com/playlist/07yFncG0CKMsMfOjkgiKTs", nb = 1) {

    let self = this;
    let login_url = "https://accounts.spotify.com/fr/login/"

    let username_elem = 'login-username'
    let password_elem = 'login-password'
    let login_button_elem = 'login-button'
    let cookie_button_elem = 'onetrust-accept-btn-handler'

    const {Builder, By, Key, until} = require('selenium-webdriver');

    const chrome = require('selenium-webdriver/chrome');
    let options = new chrome.Options();
    let usg = `user-agent="${self.getRandomUserAgent()}"`;
    //options.addArguments([usg]);
    //options.addArguments(`--proxy-server=${self.getRandomProxy()}`);
    //options.addArguments('headless'); // note: without dashes
    options.addArguments("window-size=1280,800");
    //options.addArguments('disable-gpu');
    //let service = new chrome.ServiceBuilder("chromedriver.exe");

    // const firefox = require('selenium-webdriver/firefox');

    (async function example() {
        let driver = await new Builder().forBrowser('chrome')
            //.setChromeService(service)
            .setChromeOptions(options)
            //.withCapabilities(options.toCapabilities())
            .build();
        try {
            await driver.get(login_url);
            await driver.findElement(By.id(username_elem)).sendKeys(username);
            await driver.findElement(By.id(password_elem)).sendKeys(password);
            //await driver.wait(null, 2000);
            await driver.findElement(By.id(login_button_elem)).click();
            await driver.wait(until.urlIs("https://accounts.spotify.com/fr/status"), 2500);
            await driver.get(redirect);
            await driver.sleep(self.randint(2000, 5000));
            await driver.findElement(By.id(cookie_button_elem)).click();
            await driver.sleep(self.randint(2000, 4000));
            await driver.executeAsyncScript(function (nb) {
                let callback = arguments[arguments.length - 1]

                let doc = document.querySelectorAll('[role="row"]')[nb];
                doc.querySelector('button').click();

                callback(doc.innerText);

            }, nb).then(function (innerText) {
                console.log("Successful login with : ", username);
                console.log("Now playing", innerText);
                console.log("Current : ", self.current);
            });
            await driver.sleep(self.randint(50000, 80000));
            await driver.quit();

        } finally {
            if (self.current >= self.total) {
                await driver.quit();
            } else {
                if (self.current === self.total) {
                    await driver.quit();
                } else {
                    self.current++;
                    self.createUser(function (response) {
                        if (response !== null) {
                            console.log("Resp : ", response)
                            setTimeout(function () {
                                self.login(response.email, response.password, "https://open.spotify.com/playlist/07yFncG0CKMsMfOjkgiKTs")
                            }, 1000)
                        }
                    });
                }
            }
        }
    })();

    //

}

SpotifyBotSelenium.prototype.loginMode = function (username, password, redirect = "https://open.spotify.com/playlist/07yFncG0CKMsMfOjkgiKTs", nb) {

    let self = this;
    let login_url = "https://accounts.spotify.com/fr/login/"

    let username_elem = 'login-username'
    let password_elem = 'login-password'
    let login_button_elem = 'login-button'
    let cookie_button_elem = 'onetrust-accept-btn-handler'

    const {Builder, By, Key, until} = require('selenium-webdriver');

    const chrome = require('selenium-webdriver/chrome');
    let options = new chrome.Options();
    let usg = `user-agent="${self.getRandomUserAgent()}"`;
    //options.addArguments([usg]);
    //options.addArguments(`--proxy-server=${self.getRandomProxy()}`);
    //options.addArguments('headless'); // note: without dashes
    options.addArguments("window-size=1280,800");
    //let service = new chrome.ServiceBuilder("chromedriver.exe");
    // const firefox = require('selenium-webdriver/firefox');

    (async function example() {
        let driver = await new Builder().forBrowser('chrome')
            //.setChromeService(service)
            .setChromeOptions(options)
            .build();
        try {
            console.log("Try to login with ...", username)
            await driver.get(login_url);
            await driver.findElement(By.id(username_elem)).sendKeys(username);
            await driver.findElement(By.id(password_elem)).sendKeys(password);
            //await driver.wait(null, 2000);
            await driver.findElement(By.id(login_button_elem)).click();
            await driver.wait(until.urlIs("https://accounts.spotify.com/fr/status"), 2500);
            await driver.get(redirect);
            await driver.sleep(self.randint(2000, 5000));
            await driver.findElement(By.id(cookie_button_elem)).click();
            await driver.sleep(self.randint(2000, 4000));
            await driver.executeAsyncScript(function (nb) {
                let callback = arguments[arguments.length - 1];

                let doc = document.querySelectorAll('[role="row"]')[nb];
                doc.querySelector('button').click();

                callback(doc.innerText);

            }, nb).then(function (innerText) {
                console.log("Successful login with : ", username);
                console.log("Now playing", innerText);
            });
            await driver.sleep(self.randint(60000, 120000));
            await driver.quit();
        } finally {
            await driver.sleep(self.randint(60000, 120000));
            console.log("Finish the job :)");
            await driver.quit();
        }
    })();

    //

}

SpotifyBotSelenium.prototype.AllMode = async function (max = 20) {

    let self = this;

    setTimeout(function () {
        self.profileList.forEach(function (entry) {
            setTimeout(function () {
                self.loginMode(entry.email, entry.password, "https://open.spotify.com/playlist/07yFncG0CKMsMfOjkgiKTs", 1)
            }, 5000)

        })
    }, 5000)

}


module.exports = SpotifyBotSelenium;
