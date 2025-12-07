const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// قاعدة بيانات محسنة
const licenseDB = {
    status: 'active', // active, suspended, expired
    expiry: '2024-12-31',
    maxDevices: 100,
    connectedDevices: new Set(),
    lastActivity: {}
};

// 1. API للتحقق من الرخصة
app.post('/api/check-license', (req, res) => {
    try {
        const { deviceId } = req.body;
        
        console.log(`📱 [${new Date().toLocaleTimeString()}] جهاز يتصل: ${deviceId}`);
        
        // إذا الرخصة موقوفة
        if (licenseDB.status === 'suspended') {
            return res.json({ 
                status: 'suspended',
                message: 'الرخصة موقوفة مؤقتاً',
                code: 403
            });
        }
        
        // إذا الرخصة منتهية
        if (licenseDB.status === 'expired') {
            return res.json({ 
                status: 'expired',
                message: 'الرخصة منتهية الصلاحية',
                code: 402
            });
        }
        
        // تسجيل الجهاز
        licenseDB.connectedDevices.add(deviceId);
        licenseDB.lastActivity[deviceId] = new Date().toISOString();
        
        // تنظيف الأجهزة القديمة
        cleanupOldDevices();
        
        res.json({
            status: 'active',
            message: '✅ الرخصة نشطة',
            expiry: licenseDB.expiry,
            code: 200
        });
        
    } catch (error) {
        console.error('❌ خطأ في check-license:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 2. إيقاف الرخصة للجميع
app.post('/api/admin/suspend', (req, res) => {
    const { password } = req.body;
    
    // كلمة سر بسيطة (غيرها)
    if (password !== 'admin123') {
        return res.status(401).json({ error: 'غير مصرح' });
    }
    
    licenseDB.status = 'suspended';
    console.log('⛔ تم إيقاف الرخصة لجميع العملاء');
    
    res.json({
        success: true,
        message: `تم إيقاف الرخصة لـ ${licenseDB.connectedDevices.size} عميل`,
        suspendedAt: new Date().toISOString()
    });
});

// 3. تشغيل الرخصة للجميع
app.post('/api/admin/activate', (req, res) => {
    const { password } = req.body;
    
    if (password !== 'admin123') {
        return res.status(401).json({ error: 'غير مصرح' });
    }
    
    licenseDB.status = 'active';
    console.log('✅ تم تشغيل الرخصة للجميع');
    
    res.json({
        success: true,
        message: 'الرخصة مفعلة الآن',
        activatedAt: new Date().toISOString()
    });
});

// 4. صفحة التحكم الرئيسية
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>🚀 تحكم TLS License</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: #333;
                    min-height: 100vh;
                    padding: 20px;
                }
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 15px;
                    padding: 30px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }
                h1 {
                    color: #2c3e50;
                    text-align: center;
                    margin-bottom: 30px;
                    font-size: 28px;
                }
                .status-card {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                    border-left: 4px solid #17a2b8;
                }
                .status-item {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                    padding: 8px 0;
                    border-bottom: 1px solid #eee;
                }
                .status-value {
                    font-weight: bold;
                }
                .active { color: #28a745; }
                .suspended { color: #dc3545; }
                .expired { color: #ffc107; }
                .controls {
                    display: flex;
                    gap: 15px;
                    margin: 30px 0;
                    justify-content: center;
                }
                .btn {
                    padding: 12px 25px;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s;
                    min-width: 200px;
                }
                .btn-activate {
                    background: linear-gradient(135deg, #28a745, #20c997);
                    color: white;
                }
                .btn-suspend {
                    background: linear-gradient(135deg, #dc3545, #e74c3c);
                    color: white;
                }
                .btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                }
                .devices-list {
                    background: white;
                    border-radius: 8px;
                    padding: 15px;
                    margin-top: 20px;
                    max-height: 200px;
                    overflow-y: auto;
                }
                .device-item {
                    padding: 5px 10px;
                    border-bottom: 1px solid #f0f0f0;
                    font-family: monospace;
                    font-size: 12px;
                }
                .password-input {
                    width: 100%;
                    padding: 10px;
                    margin: 10px 0;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 لوحة تحكم TLS License Server</h1>
                
                <div class="status-card">
                    <div class="status-item">
                        <span>حالة الرخصة:</span>
                        <span id="statusText" class="status-value ${licenseDB.status}">${licenseDB.status}</span>
                    </div>
                    <div class="status-item">
                        <span>تاريخ الانتهاء:</span>
                        <span class="status-value">${licenseDB.expiry}</span>
                    </div>
                    <div class="status-item">
                        <span>الأجهزة النشطة:</span>
                        <span id="devicesCount" class="status-value">${licenseDB.connectedDevices.size}</span>
                    </div>
                </div>
                
                <div class="controls">
                    <button class="btn btn-activate" onclick="showPassword('activate')">
                        ✅ تفعيل الرخصة للجميع
                    </button>
                    <button class="btn btn-suspend" onclick="showPassword('suspend')">
                        ⛔ إيقاف الرخصة للجميع
                    </button>
                </div>
                
                <div id="passwordSection" style="display: none;">
                    <input type="password" id="adminPassword" class="password-input" placeholder="أدخل كلمة السر">
                    <button class="btn" onclick="submitAction()" style="width: 100%; background: #007bff; color: white;">
                        تأكيد
                    </button>
                </div>
                
                ${licenseDB.connectedDevices.size > 0 ? `
                <div class="devices-list">
                    <strong>📱 الأجهزة المتصلة:</strong>
                    ${Array.from(licenseDB.connectedDevices).map(device => 
                        `<div class="device-item">${device}</div>`
                    ).join('')}
                </div>
                ` : ''}
            </div>

            <script>
                let currentAction = '';
                
                function showPassword(action) {
                    currentAction = action;
                    document.getElementById('passwordSection').style.display = 'block';
                    document.getElementById('adminPassword').focus();
                }
                
                async function submitAction() {
                    const password = document.getElementById('adminPassword').value;
                    if (!password) {
                        alert('أدخل كلمة السر');
                        return;
                    }
                    
                    const endpoint = currentAction === 'activate' 
                        ? '/api/admin/activate' 
                        : '/api/admin/suspend';
                    
                    try {
                        const response = await fetch(endpoint, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ password })
                        });
                        
                        const data = await response.json();
                        
                        if (response.ok) {
                            alert(data.message);
                            location.reload();
                        } else {
                            alert(data.error || 'خطأ في التنفيذ');
                        }
                    } catch (error) {
                        alert('خطأ في الاتصال بالسيرفر');
                    }
                }
                
                // تحديث تلقائي كل 10 ثواني
                setInterval(() => {
                    location.reload();
                }, 10000);
            </script>
        </body>
        </html>
    `);
});

// 5. تنظيف الأجهزة القديمة
function cleanupOldDevices() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    for (const [deviceId, lastSeen] of Object.entries(licenseDB.lastActivity)) {
        if (new Date(lastSeen) < oneHourAgo) {
            licenseDB.connectedDevices.delete(deviceId);
            delete licenseDB.lastActivity[deviceId];
        }
    }
}

// 6. تنظيف دوري كل ساعة
setInterval(cleanupOldDevices, 60 * 60 * 1000);

app.listen(PORT, () => {
    console.log(`✅ TLS License Server running on port ${PORT}`);
    console.log(`🌐 Dashboard: http://localhost:${PORT}`);
});
