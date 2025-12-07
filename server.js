const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// قاعدة بيانات بسيطة
let licenseStatus = 'active'; // active أو suspended
let connectedDevices = [];

// 1. API للتحقق من الرخصة
app.post('/api/check-license', (req, res) => {
    const { deviceId } = req.body;
    
    console.log('📱 جهاز يتصل:', deviceId);
    
    if (licenseStatus === 'suspended') {
        return res.json({ 
            status: 'suspended',
            message: 'الرخصة موقوفة'
        });
    }
    
    // حفظ الجهاز إذا جديد
    if (!connectedDevices.includes(deviceId)) {
        connectedDevices.push(deviceId);
    }
    
    res.json({
        status: 'active',
        message: 'مرحباً! الرخصة نشطة ✅'
    });
});

// 2. API لإيقاف الرخصة (أنت اللي تستخدمه)
app.post('/api/suspend-license', (req, res) => {
    licenseStatus = 'suspended';
    connectedDevices = [];
    
    console.log('⛔ تم إيقاف الرخصة لجميع العملاء');
    
    res.json({
        success: true,
        message: 'تم إيقاف الرخصة لـ ' + connectedDevices.length + ' عميل'
    });
});

// 3. API لتشغيل الرخصة
app.post('/api/activate-license', (req, res) => {
    licenseStatus = 'active';
    
    console.log('✅ تم تشغيل الرخصة');
    
    res.json({
        success: true,
        message: 'الرخصة مفعلة الآن'
    });
});

// 4. صفحة بسيطة للتحكم
app.get('/', (req, res) => {
    res.send(`
        <html>
        <body style="font-family: Arial; padding: 20px;">
            <h1>🚀 لوحة تحكم الرخصة</h1>
            <p>الحالة الحالية: <strong>${licenseStatus}</strong></p>
            <p>عدد الأجهزة المتصلة: ${connectedDevices.length}</p>
            <br>
            <button onclick="activateLicense()" style="background: green; color: white; padding: 10px; border: none; margin: 5px;">
                ✅ تفعيل الرخصة للجميع
            </button>
            <button onclick="suspendLicense()" style="background: red; color: white; padding: 10px; border: none; margin: 5px;">
                ⛔ إيقاف الرخصة للجميع
            </button>
            <script>
                async function suspendLicense() {
                    await fetch('/api/suspend-license', { method: 'POST' });
                    alert('تم إيقاف الرخصة!');
                    location.reload();
                }
                async function activateLicense() {
                    await fetch('/api/activate-license', { method: 'POST' });
                    alert('تم تفعيل الرخصة!');
                    location.reload();
                }
            </script>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`🚀 السيرفر شغال على: http://localhost:${PORT}`);
});