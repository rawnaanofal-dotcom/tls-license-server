const express = require('express');
const app = express();

app.use(express.json());

let licenseStatus = 'active';
let connectedDevices = [];

app.post('/api/check-license', (req, res) => {
    const { deviceId } = req.body;
    console.log('📱 جهاز يتصل:', deviceId);
    
    if (!connectedDevices.includes(deviceId)) {
        connectedDevices.push(deviceId);
    }
    
    res.json({ 
        status: licenseStatus,
        message: licenseStatus === 'active' ? '✅ الرخصة نشطة' : '⛔ الرخصة موقوفة',
        devices: connectedDevices.length
    });
});

app.post('/api/admin/suspend', (req, res) => {
    licenseStatus = 'suspended';
    res.json({ 
        success: true, 
        message: 'تم إيقاف الرخصة للجميع',
        suspendedAt: new Date().toISOString()
    });
});

app.post('/api/admin/activate', (req, res) => {
    licenseStatus = 'active';
    res.json({ 
        success: true, 
        message: 'تم تشغيل الرخصة للجميع',
        activatedAt: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.send(`
        <html>
        <body style="font-family: Arial; padding: 30px; text-align: center;">
            <h1>🚀 TLS License Control Panel</h1>
            <p>Status: <strong>${licenseStatus}</strong></p>
            <p>Connected Devices: ${connectedDevices.length}</p>
            <br>
            <button onclick="activate()" style="padding: 12px 24px; background: green; color: white; border: none; margin: 5px;">
                ✅ Activate License
            </button>
            <button onclick="suspend()" style="padding: 12px 24px; background: red; color: white; border: none; margin: 5px;">
                ⛔ Suspend License
            </button>
            <script>
                async function suspend() {
                    await fetch('/api/admin/suspend', {method: 'POST'});
                    alert('License Suspended!');
                    location.reload();
                }
                async function activate() {
                    await fetch('/api/admin/activate', {method: 'POST'});
                    alert('License Activated!');
                    location.reload();
                }
            </script>
        </body>
        </html>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 Dashboard: https://tls-control-server-production.up.railway.app`);
});
