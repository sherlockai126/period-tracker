class PeriodTracker {
    constructor() {
        this.periods = JSON.parse(localStorage.getItem('periods')) || [];
        this.symptoms = JSON.parse(localStorage.getItem('symptoms')) || [];
        this.averageCycleLength = 28; // Default cycle length
        this.init();
    }

    init() {
        // Bind event listeners
        document.getElementById('save-date-btn').addEventListener('click', () => this.savePeriodDate());
        document.getElementById('save-symptom-btn').addEventListener('click', () => this.saveSymptom());
        
        // Set today's date as default for symptom logging
        document.getElementById('symptom-date').value = new Date().toISOString().split('T')[0];
        
        // Load existing data
        this.updateDisplay();
        this.checkReminders();
    }

    savePeriodDate() {
        const dateInput = document.getElementById('period-date');
        const date = dateInput.value;
        
        if (!date) {
            alert('Please select a date');
            return;
        }

        // Check if date already exists
        const existingPeriod = this.periods.find(p => p.date === date);
        if (existingPeriod) {
            alert('Period date already recorded for this date');
            return;
        }

        this.periods.push({
            date: date,
            timestamp: new Date().toISOString()
        });

        // Sort periods by date (most recent first)
        this.periods.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Calculate average cycle length
        this.calculateAverageCycle();
        
        // Save to localStorage
        localStorage.setItem('periods', JSON.stringify(this.periods));
        
        // Clear input and update display
        dateInput.value = '';
        this.updateDisplay();
        this.checkReminders();
        
        alert('Period date saved successfully!');
    }

    saveSymptom() {
        const dateInput = document.getElementById('symptom-date');
        const symptomsInput = document.getElementById('symptoms');
        
        const date = dateInput.value;
        const symptomsText = symptomsInput.value.trim();
        
        if (!date || !symptomsText) {
            alert('Please fill in both date and symptoms');
            return;
        }

        this.symptoms.push({
            date: date,
            symptoms: symptomsText,
            timestamp: new Date().toISOString()
        });

        // Sort symptoms by date (most recent first)
        this.symptoms.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Save to localStorage
        localStorage.setItem('symptoms', JSON.stringify(this.symptoms));
        
        // Clear inputs and update display
        symptomsInput.value = '';
        this.updateDisplay();
        
        alert('Symptoms saved successfully!');
    }

    calculateAverageCycle() {
        if (this.periods.length < 2) return;
        
        const cycleLengths = [];
        for (let i = 0; i < this.periods.length - 1; i++) {
            const current = new Date(this.periods[i].date);
            const previous = new Date(this.periods[i + 1].date);
            const diffDays = Math.abs((current - previous) / (1000 * 60 * 60 * 24));
            cycleLengths.push(diffDays);
        }
        
        this.averageCycleLength = Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length);
    }

    checkReminders() {
        const remindersDiv = document.getElementById('reminders');
        
        if (this.periods.length === 0) {
            remindersDiv.innerHTML = '<p class="no-data">Record your first period to get reminders</p>';
            return;
        }

        const lastPeriod = new Date(this.periods[0].date);
        const nextPeriod = new Date(lastPeriod.getTime() + (this.averageCycleLength * 24 * 60 * 60 * 1000));
        const reminderDate = new Date(nextPeriod.getTime() - (3 * 24 * 60 * 60 * 1000)); // 3 days before
        const today = new Date();
        
        const daysUntilNext = Math.ceil((nextPeriod - today) / (1000 * 60 * 60 * 24));
        const daysUntilReminder = Math.ceil((reminderDate - today) / (1000 * 60 * 60 * 24));
        
        let reminderHTML = '';
        
        if (daysUntilReminder <= 0 && daysUntilNext > 0) {
            // Show urgent reminder
            reminderHTML += `
                <div class="reminder urgent">
                    <h4>⚠️ Period Expected Soon!</h4>
                    <p>Your next period is expected in ${daysUntilNext} day(s).</p>
                    <p><strong>Prepare:</strong> Stock up on pads/tampons, keep warm clothes ready, have warm water/tea available</p>
                </div>
            `;
        } else if (daysUntilNext > 0) {
            reminderHTML += `
                <div class="reminder">
                    <h4>📅 Next Period Prediction</h4>
                    <p>Expected date: ${nextPeriod.toDateString()}</p>
                    <p>Days remaining: ${daysUntilNext}</p>
                    <p>Reminder will be sent ${daysUntilReminder} day(s) from now</p>
                </div>
            `;
        } else {
            reminderHTML += `
                <div class="reminder">
                    <h4>🔄 Cycle Update Needed</h4>
                    <p>Your expected period date has passed. Please record your recent period if it has started.</p>
                </div>
            `;
        }
        
        remindersDiv.innerHTML = reminderHTML;
    }

    updateDisplay() {
        this.updateCycleInfo();
        this.updatePeriodHistory();
        this.updateSymptomHistory();
    }

    updateCycleInfo() {
        const cycleInfoDiv = document.getElementById('cycle-info');
        
        if (this.periods.length === 0) {
            cycleInfoDiv.innerHTML = '<p class="no-data">No period data recorded yet</p>';
            return;
        }

        const lastPeriod = this.periods[0];
        const daysSinceLastPeriod = Math.floor((new Date() - new Date(lastPeriod.date)) / (1000 * 60 * 60 * 24));
        
        cycleInfoDiv.innerHTML = `
            <h4>Cycle Information</h4>
            <p><strong>Last period:</strong> ${new Date(lastPeriod.date).toDateString()}</p>
            <p><strong>Days since last period:</strong> ${daysSinceLastPeriod}</p>
            <p><strong>Average cycle length:</strong> ${this.averageCycleLength} days</p>
            <p><strong>Total periods recorded:</strong> ${this.periods.length}</p>
        `;
    }

    updatePeriodHistory() {
        const historyDiv = document.getElementById('period-history');
        
        if (this.periods.length === 0) {
            historyDiv.innerHTML = '<p class="no-data">No period history available</p>';
            return;
        }

        let historyHTML = '';
        this.periods.forEach((period, index) => {
            const date = new Date(period.date);
            let cycleLength = '';
            
            if (index < this.periods.length - 1) {
                const nextPeriod = new Date(this.periods[index + 1].date);
                const days = Math.abs((date - nextPeriod) / (1000 * 60 * 60 * 24));
                cycleLength = ` (${Math.round(days)} day cycle)`;
            }
            
            historyHTML += `
                <div class="period-entry">
                    <h4>${date.toDateString()}${cycleLength}</h4>
                    <p>Recorded: ${new Date(period.timestamp).toLocaleString()}</p>
                </div>
            `;
        });
        
        historyDiv.innerHTML = historyHTML;
    }

    updateSymptomHistory() {
        const symptomHistoryDiv = document.getElementById('symptom-history');
        
        if (this.symptoms.length === 0) {
            symptomHistoryDiv.innerHTML = '<p class="no-data">No symptoms recorded yet</p>';
            return;
        }

        let historyHTML = '';
        this.symptoms.forEach(symptom => {
            historyHTML += `
                <div class="symptom-entry">
                    <h4>${new Date(symptom.date).toDateString()}</h4>
                    <p>${symptom.symptoms}</p>
                    <small>Recorded: ${new Date(symptom.timestamp).toLocaleString()}</small>
                </div>
            `;
        });
        
        symptomHistoryDiv.innerHTML = historyHTML;
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PeriodTracker();
});