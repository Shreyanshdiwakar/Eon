const cron = require('node-cron');
const config = require('../config');

class TimeManager {
    constructor(client, profileManager) {
        this.client = client;
        this.profileManager = profileManager;
        this.lastMood = 'normal';
        this.scheduledEatingTimes = [];
        this.generateEatingTimes();
    }

    generateEatingTimes() {
        // Clear previous times
        this.scheduledEatingTimes = [];
        
        // Generate 4 random times between 8 AM and 10 PM
        for (let i = 0; i < 4; i++) {
            // Generate time between 8:00 (480 minutes) and 22:00 (1320 minutes)
            const minutes = Math.floor(Math.random() * (1320 - 480) + 480);
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            
            this.scheduledEatingTimes.push({
                time: `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`,
                executed: false
            });
        }
        
        // Sort times chronologically
        this.scheduledEatingTimes.sort((a, b) => this.timeToMinutes(a.time) - this.timeToMinutes(b.time));
        console.log('Scheduled eating times for today:', this.scheduledEatingTimes.map(t => t.time));
    }

    startScheduler() {
        // Reset eating times at midnight
        cron.schedule('0 0 * * *', () => {
            this.generateEatingTimes();
        });

        // Check every minute for scheduled events
        cron.schedule('* * * * *', async () => {
            try {
                const now = new Date();
                const currentTime = now.toLocaleTimeString('en-US', { 
                    hour12: false, 
                    hour: '2-digit', 
                    minute: '2-digit'
                });

                // Check for sleeping time
                const isSleepingTime = this.isWithinSleepingHours(currentTime);
                
                if (isSleepingTime) {
                    this.lastMood = 'sleeping';
                    await this.profileManager.updateProfilePicture(null, 'sleeping');
                } else {
                    // Check for eating times
                    for (const schedule of this.scheduledEatingTimes) {
                        if (schedule.time === currentTime && !schedule.executed) {
                            schedule.executed = true;
                            const eatingMood = Math.random() < 0.5 ? 'eating' : 'eating1';
                            this.lastMood = eatingMood;
                            await this.profileManager.updateProfilePicture(null, eatingMood);
                            console.log(`Eating time! Changed to ${eatingMood} at ${currentTime}`);
                            
                            // Schedule return to normal after 30 minutes
                            setTimeout(async () => {
                                if (this.lastMood === eatingMood) {  // Only change if no other mood was set
                                    await this.profileManager.updateProfilePicture(null, 'normal');
                                    this.lastMood = 'normal';
                                    console.log(`Returned to normal mood after eating at ${new Date().toLocaleTimeString()}`);
                                }
                            }, 30 * 60 * 1000);  // 30 minutes
                        }
                    }

                    // Handle wake-up time
                    const fiveMinutesAgo = new Date(now - 5 * 60000);
                    const previousTime = fiveMinutesAgo.toLocaleTimeString('en-US', { 
                        hour12: false, 
                        hour: '2-digit', 
                        minute: '2-digit'
                    });
                    
                    if (this.isWithinSleepingHours(previousTime) && !this.isWithinSleepingHours(currentTime)) {
                        this.lastMood = 'normal';
                        await this.profileManager.updateProfilePicture(null, 'normal');
                        console.log('Woke up, updated to normal mode:', currentTime);
                    }
                }
            } catch (error) {
                console.error('Error in scheduler:', error);
            }
        });
    }

    isWithinSleepingHours(currentTime) {
        const { start, end } = config.schedule.sleeping;
        
        const currentMinutes = this.timeToMinutes(currentTime);
        const startMinutes = this.timeToMinutes(start);
        const endMinutes = this.timeToMinutes(end);
        
        if (startMinutes > endMinutes) {
            return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
        } else {
            return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
        }
    }

    timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }
}

module.exports = TimeManager; 