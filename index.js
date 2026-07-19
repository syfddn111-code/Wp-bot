const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({ auth: state, printQRInTerminal: true });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (u) => {
        if (u.qr) qrcode.generate(u.qr, { small: true });
        if (u.connection === 'close') startBot();
        if (u.connection === 'open') console.log('Bot Serverdə Aktivdir!');
    });

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const jid = msg.key.remoteJid;
        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();

        if (text.match(/https?:\/\/\S+/)) {
            const url = text.match(/https?:\/\/\S+/)[0];
            await sock.sendMessage(jid, { text: 'Hazırlanır, gözləyin...' });
            
            try {
                // Cobalt API - Serverlərdə ən stabil işləyən sistemdir
                const res = await axios.post('https://api.cobalt.tools/api/json', {
                    url: url,
                    downloadMode: text.includes('2') ? 'audio' : 'video', // Sadəlik üçün
                    videoQuality: '720'
                }, { headers: { 'Accept': 'application/json' } });

                if (res.data?.url) {
                    await sock.sendMessage(jid, { [text.includes('2') ? 'audio' : 'video']: { url: res.data.url } });
                } else {
                    await sock.sendMessage(jid, { text: 'Yükləmək mümkün olmadı.' });
                }
            } catch (e) {
                await sock.sendMessage(jid, { text: 'Xəta baş verdi.' });
            }
        }
    });
}
startBot();
