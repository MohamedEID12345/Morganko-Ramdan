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
