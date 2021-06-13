const SpotifyBotSelenium = require("./SpotifyBot_selenium");

const bot = new SpotifyBotSelenium(true, true);
bot.createUser(function (response) {
    if (response !== null) {
        console.log("Resp : ", response)
        setTimeout(function () {
            bot.login(response.email, response.password, "https://open.spotify.com/playlist/07yFncG0CKMsMfOjkgiKTs")
        }, 1000)
    }
});
//bot.AllMode();

//accounts.spotify.com/fr/login?continue=https://open.spotify.com/playlist/07yFncG0CKMsMfOjkgiKTs
