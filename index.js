require('dotenv').config();
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const readline = require('readline');

const API_ID = parseInt(process.env.API_ID);
const API_HASH = process.env.API_HASH;

const stringSession = new StringSession("");

function prompt(question) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

(async () => {
    const client = new TelegramClient(stringSession, API_ID, API_HASH, {
        connectionRetries: 5,
    });

    await client.start({
        phoneNumber: async () => await prompt("Введите номер телефона: "),
        password: async () => await prompt("Введите пароль (если есть): "),
        phoneCode: async () => await prompt("Введите код из Telegram: "),
        onError: (err) => console.log(err),
    });

    console.log("\n✅ Авторизация успешна!");
    console.log("\n📝 Скопируйте эту строку и добавьте в Railway как переменную SESSION_STRING:\n");
    console.log(client.session.save());
    console.log("\n");

    process.exit(0);
})();