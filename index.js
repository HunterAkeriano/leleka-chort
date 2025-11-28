require('dotenv').config();
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const { Api } = require("telegram/tl");

const API_ID = parseInt(process.env.API_ID);
const API_HASH = process.env.API_HASH;
const TARGET_USERNAME = process.env.TARGET_USERNAME;
const TARGET_CHAT = process.env.TARGET_CHAT;
const SESSION_STRING = process.env.SESSION_STRING;

// Проверка наличия SESSION_STRING
if (!SESSION_STRING) {
    console.error("❌ SESSION_STRING не найдена!");
    console.error("Запустите auth.js локально для получения session string");
    process.exit(1);
}

const stringSession = new StringSession(SESSION_STRING);

(async () => {
    try {
        const client = new TelegramClient(stringSession, API_ID, API_HASH, {
            connectionRetries: 5,
        });

        // Подключение БЕЗ запроса телефона (используется сохраненная сессия)
        await client.connect();

        console.log("✅ Клиент подключен");

        const chatEntity = await client.getEntity(TARGET_CHAT);
        const userEntity = await client.getEntity(TARGET_USERNAME);

        console.log(`Отслеживаем чат: ${chatEntity.title || TARGET_CHAT} (ID: ${chatEntity.id})`);
        console.log(`Отслеживаем пользователя: ${userEntity.username || TARGET_USERNAME} (ID: ${userEntity.id})`);
        console.log(`Тип чата: ${chatEntity.className}`);

        client.addEventHandler(async (event) => {
            try {
                const message = event.message;
                if (!message) return;

                const isSameChat = message.peerId?.channelId?.equals(chatEntity.id) ||
                    message.peerId?.chatId?.equals(chatEntity.id);
                const isSameUser = message.senderId?.equals(userEntity.id);

                if (isSameChat && isSameUser) {
                    console.log("🎯 Найдено целевое сообщение! Удаляем...");

                    if (chatEntity.className === "Channel") {
                        await client.invoke(
                            new Api.channels.DeleteMessages({
                                channel: chatEntity,
                                id: [message.id],
                            })
                        );
                    } else {
                        await client.invoke(
                            new Api.messages.DeleteMessages({
                                id: [message.id],
                                revoke: true,
                            })
                        );
                    }

                    console.log("✅ Сообщение удалено");
                }
            } catch (error) {
                console.error("Ошибка при обработке сообщения:", error);
            }
        }, new NewMessage({}));

        console.log("👀 Бот активен и следит за сообщениями...");

    } catch (error) {
        console.error("❌ Критическая ошибка:", error);
        process.exit(1);
    }
})();
