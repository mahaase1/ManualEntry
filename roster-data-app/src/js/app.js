class ManualEntryApp {
    constructor() {
        this.currentOperator = '';
        this.currentEvent = '';
        this.roster = [];
        this.measurements = new Map();
        this.currentPersonId = null;
        this.deviceId = this.generateDeviceId();
        
        this.init();
    }

    init() {
        this.loadState();
        this.bindEvents();
        this.restoreSession();
    }

    generateDeviceId() {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    }

    bindEvents() {
        // Startup screen events
        document.getElementById('operator-name').addEventListener('input', this.validateStartup.bind(this));
        document.getElementById('event-name').addEventListener('input', this.validateStartup.bind(this));
        document.getElementById('roster-upload').addEventListener('change', this.handleRosterUpload.bind(this));
        document.getElementById('start-event').addEventListener('click', this.startEvent.bind(this));

        // Main screen events
        document.getElementById('settings-btn').addEventListener('click', this.showSettings.bind(this));
        document.getElementById('export-btn').addEventListener('click', this.exportData.bind(this));
        document.getElementById('name-filter').addEventListener('input', this.filterRoster.bind(this));
        document.getElementById('add-person-btn').addEventListener('click', this.showAddPersonModal.bind(this));
        document.getElementById('back-to-roster').addEventListener('click', this.showRosterView.bind(this));
        document.getElementById('save-measurements').addEventListener('click', this.saveMeasurements.bind(this));

        // Modal events
        document.getElementById('cancel-add-person').addEventListener('click', this.hideAddPersonModal.bind(this));
        document.getElementById('confirm-add-person').addEventListener('click', this.addNewPerson.bind(this));
        document.getElementById('close-settings').addEventListener('click', this.hideSettings.bind(this));
        document.getElementById('purge-data').addEventListener('click', this.showPurgeModal.bind(this));
        document.getElementById('cancel-purge').addEventListener('click', this.hidePurgeModal.bind(this));
        document.getElementById('confirm-purge').addEventListener('click', this.confirmPurge.bind(this));

        // Measurement validation events
        this.bindMeasurementValidation();

        // Auto-save on input (debounced)
        let saveTimeout;
        document.addEventListener('input', () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => this.saveState(), 1000);
        });
    }

    bindMeasurementValidation() {
        const measurements = ['height-shoes', 'height-no-shoes', 'reach', 'wingspan', 'weight', 'hand-length', 'hand-width'];
        
        measurements.forEach(measurement => {
            const input1 = document.getElementById(`${measurement}-1`);
            const input2 = document.getElementById(`${measurement}-2`);
            
            if (input1 && input2) {
                input1.addEventListener('input', () => this.validateMeasurement(measurement));
                input2.addEventListener('input', () => this.validateMeasurement(measurement));
            }
        });
    }

    validateMeasurement(measurement) {
        const input1 = document.getElementById(`${measurement}-1`);
        const input2 = document.getElementById(`${measurement}-2`);
        
        if (input1.value && input2.value) {
            const value1 = parseFloat(input1.value);
            const value2 = parseFloat(input2.value);
            
            if (Math.abs(value1 - value2) < 0.01) {
                input1.className = 'valid';
                input2.className = 'valid';
            } else {
                input1.className = 'error';
                input2.className = 'error';
            }
        } else {
            input1.className = '';
            input2.className = '';
        }
    }

    validateStartup() {
        const operatorName = document.getElementById('operator-name').value.trim();
        const eventName = document.getElementById('event-name').value.trim();
        const rosterFile = document.getElementById('roster-upload').files[0];
        
        const startButton = document.getElementById('start-event');
        startButton.disabled = !(operatorName && eventName && rosterFile);
    }

    handleRosterUpload(event) {
        const file = event.target.files[0];
        if (file && file.name.toLowerCase().endsWith('.csv')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.parseRoster(e.target.result);
                this.validateStartup();
            };
            reader.readAsText(file);
        }
    }

    parseRoster(csvContent) {
        const lines = csvContent.split('\n').filter(line => line.trim());
        this.roster = [];
        
        // Skip header row
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
                const values = this.parseCSVLine(line);
                if (values.length >= 2) {
                    this.roster.push({
                        id: values[0] || '',
                        name: values[1] || '',
                        gender: values[2] || '',
                        present: false,
                        completed: false
                    });
                }
            }
        }
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim().replace(/^"|"$/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim().replace(/^"|"$/g, ''));
        return result;
    }

    startEvent() {
        this.currentOperator = document.getElementById('operator-name').value.trim();
        this.currentEvent = document.getElementById('event-name').value.trim();
        
        document.getElementById('event-title').textContent = this.currentEvent;
        document.getElementById('startup-screen').classList.remove('active');
        document.getElementById('main-screen').classList.add('active');
        
        this.renderRoster();
        this.saveState();
        this.showToast(`Event "${this.currentEvent}" started successfully!`, 'success');
    }

    renderRoster() {
        const grid = document.getElementById('roster-grid');
        const filter = document.getElementById('name-filter').value.toLowerCase();
        
        const filteredRoster = this.roster.filter(person => 
            person.name.toLowerCase().includes(filter)
        );
        
        grid.innerHTML = filteredRoster.map(person => `
            <div class="roster-item ${person.completed ? 'completed' : person.present ? 'present' : ''}" 
                 onclick="app.selectPerson('${this.escapeHtml(person.id || person.name)}')">
                <h4>${this.escapeHtml(person.name)}</h4>
                <p>ID: ${person.id || 'N/A'}</p>
                <p>Gender: ${person.gender}</p>
                <div class="status ${person.completed ? 'completed' : person.present ? 'present' : ''}">
                    ${person.completed ? '✓ Completed' : person.present ? '⏱ Present' : '○ Not checked in'}
                </div>
            </div>
        `).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    filterRoster() {
        this.renderRoster();
    }

    selectPerson(personId) {
        this.currentPersonId = personId;
        const person = this.roster.find(p => (p.id || p.name) === personId);
        
        if (person) {
            document.getElementById('person-name').textContent = person.name;
            document.getElementById('present-checkbox').checked = person.present;
            
            const existing = this.measurements.get(personId);
            if (existing) {
                this.loadMeasurementData(existing);
            } else {
                this.clearMeasurementForm();
            }
            
            this.showMeasurementForm();
        }
    }

    loadMeasurementData(data) {
        const measurements = ['height-shoes', 'height-no-shoes', 'reach', 'wingspan', 'weight', 'hand-length', 'hand-width'];
        
        measurements.forEach(measurement => {
            const key = measurement.replace('-', '_');
            if (data[key]) {
                document.getElementById(`${measurement}-1`).value = data[key].value;
                document.getElementById(`${measurement}-2`).value = data[key].value;
                document.getElementById(`${measurement}-unit`).value = data[key].unit;
                this.validateMeasurement(measurement);
            }
        });
        
        document.getElementById('comments').value = data.comments || '';
    }

    clearMeasurementForm() {
        const measurements = ['height-shoes', 'height-no-shoes', 'reach', 'wingspan', 'weight', 'hand-length', 'hand-width'];
        
        measurements.forEach(measurement => {
            document.getElementById(`${measurement}-1`).value = '';
            document.getElementById(`${measurement}-2`).value = '';
            document.getElementById(`${measurement}-1`).className = '';
            document.getElementById(`${measurement}-2`).className = '';
        });
        
        document.getElementById('comments').value = '';
    }

    showMeasurementForm() {
        document.getElementById('roster-section').classList.add('hidden');
        document.getElementById('measurement-form').classList.remove('hidden');
    }

    showRosterView() {
        document.getElementById('measurement-form').classList.add('hidden');
        document.getElementById('roster-section').classList.remove('hidden');
        this.renderRoster();
    }

    saveMeasurements() {
        const personId = this.currentPersonId;
        const person = this.roster.find(p => (p.id || p.name) === personId);
        
        if (!person) return;

        person.present = document.getElementById('present-checkbox').checked;

        const measurements = ['height-shoes', 'height-no-shoes', 'reach', 'wingspan', 'weight', 'hand-length', 'hand-width'];
        const measurementData = {
            timestamp: new Date().toISOString(),
            operator: this.currentOperator,
            device: this.deviceId,
            comments: document.getElementById('comments').value
        };

        let hasValidMeasurements = false;
        let hasErrors = false;

        measurements.forEach(measurement => {
            const input1 = document.getElementById(`${measurement}-1`);
            const input2 = document.getElementById(`${measurement}-2`);
            const unit = document.getElementById(`${measurement}-unit`).value;
            
            if (input1.value && input2.value) {
                const value1 = parseFloat(input1.value);
                const value2 = parseFloat(input2.value);
                
                if (Math.abs(value1 - value2) < 0.01) {
                    const key = measurement.replace('-', '_');
                    measurementData[key] = {
                        value: value1,
                        unit: unit
                    };
                    hasValidMeasurements = true;
                } else {
                    hasErrors = true;
                    this.showToast(`Validation error: ${measurement.replace('-', ' ')} values do not match`, 'error');
                    return;
                }
            }
        });

        if (hasErrors) {
            return;
        }

        if (hasValidMeasurements || person.present) {
            this.measurements.set(personId, measurementData);
            person.completed = hasValidMeasurements;
            this.saveState();
            this.createBackup();
            this.showToast('Measurements saved successfully!', 'success');
            this.showRosterView();
        } else {
            this.showToast('Please enter at least one measurement or mark as present', 'warning');
        }
    }

    showAddPersonModal() {
        document.getElementById('add-person-modal').classList.remove('hidden');
    }

    hideAddPersonModal() {
        document.getElementById('add-person-modal').classList.add('hidden');
        document.getElementById('new-person-name').value = '';
        document.getElementById('new-person-gender').value = 'M';
    }

    addNewPerson() {
        const name = document.getElementById('new-person-name').value.trim();
        const gender = document.getElementById('new-person-gender').value;
        
        if (name) {
            const newPerson = {
                id: '',
                name: name,
                gender: gender,
                present: false,
                completed: false
            };
            
            this.roster.push(newPerson);
            this.hideAddPersonModal();
            this.renderRoster();
            this.saveState();
            this.showToast(`Added ${name} to roster`, 'success');
        }
    }

    showSettings() {
        document.getElementById('settings-modal').classList.remove('hidden');
    }

    hideSettings() {
        document.getElementById('settings-modal').classList.add('hidden');
    }

    showPurgeModal() {
        document.getElementById('purge-modal').classList.remove('hidden');
        document.getElementById('settings-modal').classList.add('hidden');
    }

    hidePurgeModal() {
        document.getElementById('purge-modal').classList.add('hidden');
        document.getElementById('purge-password').value = '';
    }

    confirmPurge() {
        const password = document.getElementById('purge-password').value;
        if (password === '00000') {
            localStorage.clear();
            this.roster = [];
            this.measurements.clear();
            this.currentOperator = '';
            this.currentEvent = '';
            this.currentPersonId = null;
            
            document.getElementById('main-screen').classList.remove('active');
            document.getElementById('startup-screen').classList.add('active');
            this.hidePurgeModal();
            
            document.getElementById('operator-name').value = '';
            document.getElementById('event-name').value = '';
            document.getElementById('roster-upload').value = '';
            this.validateStartup();
            
            this.showToast('All data has been purged', 'warning');
        } else {
            this.showToast('Incorrect password', 'error');
        }
    }

    exportData() {
        const data = {
            event: this.currentEvent,
            operator: this.currentOperator,
            device: this.deviceId,
            exportTime: new Date().toISOString(),
            roster: this.roster,
            measurements: Object.fromEntries(this.measurements)
        };

        const csvContent = this.generateCSV(data);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const filename = `${this.currentEvent.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}_${Date.now()}.csv`;
        
        this.downloadFile(csvContent, filename);
        this.emailData(csvContent, filename);
    }

    generateCSV(data) {
        let csv = 'ID,Name,Gender,Present,Completed,Timestamp,Operator,Device,Comments,';
        csv += 'Height_Shoes_Value,Height_Shoes_Unit,Height_No_Shoes_Value,Height_No_Shoes_Unit,';
        csv += 'Reach_Value,Reach_Unit,Wingspan_Value,Wingspan_Unit,Weight_Value,Weight_Unit,';
        csv += 'Hand_Length_Value,Hand_Length_Unit,Hand_Width_Value,Hand_Width_Unit\n';

        data.roster.forEach(person => {
            const personId = person.id || person.name;
            const measurements = data.measurements[personId] || {};
            
            csv += `"${person.id || ''}","${person.name.replace(/"/g, '""')}","${person.gender}",${person.present},${person.completed},`;
            csv += `"${measurements.timestamp || ''}","${measurements.operator || ''}","${measurements.device || ''}",`;
            csv += `"${(measurements.comments || '').replace(/"/g, '""')}",`;
            
            const measurementFields = ['height_shoes', 'height_no_shoes', 'reach', 'wingspan', 'weight', 'hand_length', 'hand_width'];
            measurementFields.forEach(field => {
                const measurement = measurements[field];
                if (measurement) {
                    csv += `${measurement.value},"${measurement.unit}",`;
                } else {
                    csv += ',"",';
                }
            });
            
            csv += '\n';
        });

        return csv;
    }

    downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    emailData(csvContent, filename) {
        const subject = encodeURIComponent(`Manual Entry Data - ${this.currentEvent}`);
        const body = encodeURIComponent(`Please find the data collection results for ${this.currentEvent}.\n\nOperator: ${this.currentOperator}\nDevice: ${this.deviceId}\nExport Time: ${new Date().toLocaleString()}\n\nThe CSV file "${filename}" has been downloaded to your device. Please attach it to this email before sending.`);
        
        const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
        window.open(mailtoLink, '_blank');
        
        this.showToast('CSV file downloaded. Email app opened - please attach the file manually.', 'success');
    }

    showToast(message, type = 'error') {
        const toast = document.getElementById('validation-toast');
        const messageElement = document.getElementById('toast-message');
        
        messageElement.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 4000);
    }

    saveState() {
        const state = {
            currentOperator: this.currentOperator,
            currentEvent: this.currentEvent,
            roster: this.roster,
            measurements: Object.fromEntries(this.measurements),
            currentPersonId: this.currentPersonId,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('manualEntryState', JSON.stringify(state));
    }

    loadState() {
        const saved = localStorage.getItem('manualEntryState');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                this.currentOperator = state.currentOperator || '';
                this.currentEvent = state.currentEvent || '';
                this.roster = state.roster || [];
                this.measurements = new Map(Object.entries(state.measurements || {}));
                this.currentPersonId = state.currentPersonId;
            } catch (error) {
                console.error('Error loading saved state:', error);
            }
        }
    }

    restoreSession() {
        if (this.currentOperator && this.currentEvent && this.roster.length > 0) {
            document.getElementById('operator-name').value = this.currentOperator;
            document.getElementById('event-name').value = this.currentEvent;
            document.getElementById('event-title').textContent = this.currentEvent;
            
            document.getElementById('startup-screen').classList.remove('active');
            document.getElementById('main-screen').classList.add('active');
            
            this.renderRoster();
        }
    }

    createBackup() {
        const backupKey = `backup_${this.currentEvent.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
        const data = {
            event: this.currentEvent,
            operator: this.currentOperator,
            roster: this.roster,
            measurements: Object.fromEntries(this.measurements),
            timestamp: new Date().toISOString()
        };
        
        try {
            localStorage.setItem(backupKey, JSON.stringify(data));
            
            const backupKeys = Object.keys(localStorage).filter(key => key.startsWith('backup_'));
            if (backupKeys.length > 5) {
                backupKeys.sort();
                localStorage.removeItem(backupKeys[0]);
            }
        } catch (error) {
            console.warn('Could not create backup due to storage limitations');
        }
    }
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ManualEntryApp();
});

// Handle page visibility changes to save state
document.addEventListener('visibilitychange', () => {
    if (app && document.visibilityState === 'hidden') {
        app.saveState();
    }
});

// Handle beforeunload to save state
window.addEventListener('beforeunload', () => {
    if (app) {
        app.saveState();
    }
});