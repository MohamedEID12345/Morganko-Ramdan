// توليد UUID إذا لم يكن موجوداً
if (!localStorage.getItem('device_id')) {
    const uuid = 'device-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
    localStorage.setItem('device_id', uuid);
}

// إضافة تأثيرات صوتية بسيطة (اختياري)
function playClick() {
    // const audio = new Audio('/sounds/click.mp3');
    // audio.play();
}
async function getAdvancedFingerprint() {
    // استثناء للجهاز الخاص بك (المهندس محمد عيد)
    // يمكنك تغيير هذا الكود لأي كلمة سر تضعها أنت في جهازك فقط
    if (localStorage.getItem('admin_master_access') === 'MOHAMED_EID_2026') {
        return 'MASTER-DEVICE-BYPASS';
    }

    const nav = window.navigator;
    const screen = window.screen;
    
    // تجميع خصائص فريدة للجهاز
    let fingerprint = nav.userAgent + nav.language + screen.colorDepth + screen.width + screen.height + nav.hardwareConcurrency;
    
    // إضافة بصمة الكانفاس (Canvas Fingerprinting) لتمييز الأجهزة المتطابقة
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillText("Ramadan-Morgan-2026", 2, 2);
    fingerprint += canvas.toDataURL();

    // تشفير البصمة لتحويلها لكود قصير
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
        let char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return 'FINGERPRINT-' + Math.abs(hash);
}

// تخزين البصمة فور التحميل
(async () => {
    const fp = await getAdvancedFingerprint();
    localStorage.setItem('device_id', fp);
})();