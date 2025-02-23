module.exports = {
    moodImages: {
        'happy': './assets/haappy.png',
        'normal': './assets/normal.png',
        'tired': './assets/tired.png',
        'confused': './assets/confused.png',
        'awkward': './assets/awkward.png',
        'working': './assets/working.png',
        'celebration': './assets/celebration.png',
        'birthday': './assets/birthday.png',
        'with-girlfriend': './assets/with-girlfriend.png',
        'eating': './assets/eating.png',
        'eating1': './assets/eating1.png',
        'sleeping': './assets/sleeping.png'
    },
    schedule: {
        sleeping: {
            start: '23:30', // 11:30 PM
            end: '07:00'    // 7:00 AM
        }
    },
    rateLimits: {
        profileUpdates: {
            tokensPerInterval: 2,
            interval: "minute"
        }
    }
}; 