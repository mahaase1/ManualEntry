class ManualEntryApp {
    constructor() {
        this.currentOperator = '';
        this.currentEvent = '';
        this.roster = [];
        this.measurements = new Map();
        this.currentPersonId = null;
        this.deviceId = this.generateDeviceId();
        this.activityLog = [];
        this.editMode = false;
        this.checkinEditMode = false;
        
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

    logActivity(action, details = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action: action,
            operator: this.currentOperator,
            event: this.currentEvent,
            device: this.deviceId,
            details: details
        };
        this.activityLog.push(logEntry);
        console.log('Activity logged:', logEntry);
    }

    showStartupScreen() {
        // Direct navigation to startup screen - no home screen anymore
        document.getElementById('startup-screen').classList.add('active');
        this.logActivity('APP_STARTED');
    }

    showSpreadsheetView() {
        document.getElementById('roster-section').classList.add('hidden');
        document.getElementById('measurement-form').classList.add('hidden');
        document.getElementById('spreadsheet-view').classList.remove('hidden');
        this.renderSpreadsheet();
        this.logActivity('SPREADSHEET_VIEW_OPENED');
    }

    showMainView() {
        document.getElementById('spreadsheet-view').classList.add('hidden');
        document.getElementById('checkin-section').classList.add('hidden');
        document.getElementById('roster-section').classList.remove('hidden');
        this.renderRoster();
        this.logActivity('MAIN_VIEW_OPENED');
    }

    toggleEditMode() {
        this.editMode = !this.editMode;
        const button = document.getElementById('toggle-edit-mode');
        if (this.editMode) {
            button.textContent = '📝 Edit Mode: ON';
            button.classList.add('edit-active');
        } else {
            button.textContent = '📝 Edit Mode: OFF';
            button.classList.remove('edit-active');
        }
        this.renderSpreadsheet();
        this.logActivity('EDIT_MODE_TOGGLED', { editMode: this.editMode });
    }

    renderSpreadsheet() {
        const container = document.getElementById('spreadsheet-container');
        if (!container) return;

        // Create table HTML
        let tableHTML = '<table class="spreadsheet-table"><thead><tr>';
        
        // Headers
        tableHTML += '<th class="name-column header">Name</th>';
        tableHTML += '<th>ID</th>';
        tableHTML += '<th>Gender</th>';
        tableHTML += '<th>Present</th>';
        tableHTML += '<th>Completed</th>';
        tableHTML += '<th>Source</th>';
        tableHTML += '<th>Height w/ Shoes</th>';
        tableHTML += '<th>Unit</th>';
        tableHTML += '<th>Height w/o Shoes</th>';
        tableHTML += '<th>Unit</th>';
        tableHTML += '<th>Reach</th>';
        tableHTML += '<th>Unit</th>';
        tableHTML += '<th>Wingspan</th>';
        tableHTML += '<th>Unit</th>';
        tableHTML += '<th>Weight</th>';
        tableHTML += '<th>Unit</th>';
        tableHTML += '<th>Hand Length</th>';
        tableHTML += '<th>Unit</th>';
        tableHTML += '<th>Hand Width</th>';
        tableHTML += '<th>Unit</th>';
        tableHTML += '<th>Vertical</th>';
        tableHTML += '<th>Unit</th>';
        tableHTML += '<th>Approach</th>';
        tableHTML += '<th>Unit</th>';
        tableHTML += '<th>Broad</th>';
        tableHTML += '<th>Unit</th>';
        tableHTML += '<th>Comments</th>';
        tableHTML += '</tr></thead><tbody>';

        // Data rows
        this.roster.forEach(person => {
            const personId = person.id || person.name;
            const measurement = this.measurements.get(personId) || {};
            
            tableHTML += '<tr>';
            tableHTML += `<td class="name-column">${this.escapeHtml(person.name)}</td>`;
            tableHTML += `<td>${this.escapeHtml(person.id || '')}</td>`;
            tableHTML += `<td>${this.escapeHtml(person.gender)}</td>`;
            tableHTML += `<td class="present-indicator ${person.present ? 'present' : 'absent'}">${person.present ? '✓' : '✗'}</td>`;
            tableHTML += `<td class="completed-indicator ${person.completed ? 'completed' : 'incomplete'}">${person.completed ? '✓' : '○'}</td>`;
            tableHTML += `<td class="source-indicator">${person.source === 'added' ? 'Added' : 'Roster'}</td>`;
            
            // Measurements
            const measurements = ['height_shoes', 'height_no_shoes', 'reach', 'wingspan', 'weight', 'hand_length', 'hand_width', 'vertical', 'approach', 'broad'];
            measurements.forEach(measurementType => {
                const data = measurement[measurementType];
                if (this.editMode) {
                    tableHTML += `<td class="measurement-cell">
                        <input type="number" step="0.01" class="measurement-input" 
                               data-person="${this.escapeHtml(personId)}" 
                               data-measurement="${measurementType}"
                               value="${data ? data.value : ''}" 
                               placeholder="Enter">
                    </td>`;
                    tableHTML += `<td class="measurement-cell">
                        <select class="measurement-input" 
                                data-person="${this.escapeHtml(personId)}" 
                                data-measurement="${measurementType}_unit">
                            <option value="inches" ${data && data.unit === 'inches' ? 'selected' : ''}>inches</option>
                            <option value="cm" ${data && data.unit === 'cm' ? 'selected' : ''}>cm</option>
                            <option value="lbs" ${data && data.unit === 'lbs' ? 'selected' : ''}>lbs</option>
                            <option value="kg" ${data && data.unit === 'kg' ? 'selected' : ''}>kg</option>
                        </select>
                    </td>`;
                } else {
                    tableHTML += `<td class="measurement-display">${data ? data.value : ''}</td>`;
                    tableHTML += `<td class="measurement-display">${data ? data.unit : ''}</td>`;
                }
            });
            
            // Comments
            if (this.editMode) {
                tableHTML += `<td class="measurement-cell">
                    <input type="text" class="measurement-input" 
                           data-person="${this.escapeHtml(personId)}" 
                           data-measurement="comments"
                           value="${measurement.comments || ''}" 
                           placeholder="Comments">
                </td>`;
            } else {
                tableHTML += `<td class="measurement-display">${measurement.comments || ''}</td>`;
            }
            
            tableHTML += '</tr>';
        });

        tableHTML += '</tbody></table>';
        container.innerHTML = tableHTML;

        // Add event listeners for edit mode
        if (this.editMode) {
            container.querySelectorAll('.measurement-input').forEach(input => {
                input.addEventListener('change', this.handleSpreadsheetInput.bind(this));
                input.addEventListener('blur', this.handleSpreadsheetInput.bind(this));
            });
        }
    }

    handleSpreadsheetInput(event) {
        const input = event.target;
        const personId = input.getAttribute('data-person');
        const measurementType = input.getAttribute('data-measurement');
        const value = input.value;

        // Get or create measurement data
        let measurementData = this.measurements.get(personId) || {
            timestamp: new Date().toISOString(),
            operator: this.currentOperator,
            device: this.deviceId,
            comments: ''
        };

        if (measurementType === 'comments') {
            measurementData.comments = value;
        } else if (measurementType.endsWith('_unit')) {
            const baseType = measurementType.replace('_unit', '');
            if (!measurementData[baseType]) {
                measurementData[baseType] = { value: '', unit: value };
            } else {
                measurementData[baseType].unit = value;
            }
        } else {
            if (!measurementData[measurementType]) {
                measurementData[measurementType] = { value: parseFloat(value) || '', unit: 'inches' };
            } else {
                measurementData[measurementType].value = parseFloat(value) || '';
            }
        }

        // Update measurements and person status
        this.measurements.set(personId, measurementData);
        const person = this.roster.find(p => (p.id || p.name) === personId);
        if (person) {
            const hasValidMeasurements = ['height_shoes', 'height_no_shoes', 'reach', 'wingspan', 'weight', 'hand_length', 'hand_width', 'vertical', 'approach', 'broad']
                .some(type => measurementData[type] && measurementData[type].value);
            person.completed = hasValidMeasurements;
        }

        this.saveState();
        this.logActivity('MEASUREMENT_UPDATED', { 
            person: personId, 
            measurement: measurementType, 
            value: value 
        });
        
        // Automatically save to CSV file in 'Manual entry' directory for spreadsheet updates
        const personData = this.roster.find(p => (p.id || p.name) === personId);
        if (personData && measurementData) {
            const csvContent = this.generateIndividualMeasurementCSV(personData, measurementData);
            this.appendToCSVFile(csvContent, true);
        }
    }

    bindEvents() {
        // Startup screen events
        document.getElementById('operator-name').addEventListener('input', this.validateStartup.bind(this));
        document.getElementById('event-name').addEventListener('input', this.validateStartup.bind(this));
        document.getElementById('roster-upload').addEventListener('change', this.handleRosterUpload.bind(this));
        document.getElementById('start-event').addEventListener('click', this.startEvent.bind(this));

        // Main screen events
        document.getElementById('spreadsheet-btn').addEventListener('click', this.showSpreadsheetView.bind(this));
        document.getElementById('settings-btn').addEventListener('click', this.showSettings.bind(this));
        document.getElementById('export-btn').addEventListener('click', this.exportData.bind(this));
        document.getElementById('name-filter').addEventListener('input', this.filterRoster.bind(this));
        document.getElementById('add-person-btn').addEventListener('click', this.showAddPersonModal.bind(this));
        document.getElementById('checkin-btn').addEventListener('click', this.showCheckinSection.bind(this));
        document.getElementById('back-to-roster').addEventListener('click', this.showRosterView.bind(this));
        document.getElementById('back-to-roster-from-checkin').addEventListener('click', this.showRosterView.bind(this));
        document.getElementById('toggle-checkin-edit').addEventListener('click', this.toggleCheckinEditMode.bind(this));
        document.getElementById('save-measurements').addEventListener('click', this.saveMeasurements.bind(this));

        // Spreadsheet view events
        document.getElementById('toggle-edit-mode').addEventListener('click', this.toggleEditMode.bind(this));
        document.getElementById('back-to-main').addEventListener('click', this.showMainView.bind(this));

        // Modal events
        document.getElementById('cancel-add-person').addEventListener('click', this.hideAddPersonModal.bind(this));
        document.getElementById('confirm-add-person').addEventListener('click', this.addNewPerson.bind(this));
        document.getElementById('close-settings').addEventListener('click', this.hideSettings.bind(this));
        document.getElementById('view-files-btn').addEventListener('click', this.showFileManagement.bind(this));
        document.getElementById('close-file-management').addEventListener('click', this.hideFileManagement.bind(this));
        document.getElementById('reset-data').addEventListener('click', this.showResetModal.bind(this));
        document.getElementById('cancel-reset').addEventListener('click', this.hideResetModal.bind(this));
        document.getElementById('confirm-reset').addEventListener('click', this.confirmReset.bind(this));

        // Measurement validation events
        this.bindMeasurementValidation();
        this.bindIndividualSaveButtons();

        // Auto-save on input (debounced)
        let saveTimeout;
        document.addEventListener('input', () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => this.saveState(), 1000);
        });
    }

    bindIndividualSaveButtons() {
        // Add event listeners for individual measurement save buttons
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('measurement-save-btn')) {
                const measurement = event.target.getAttribute('data-measurement');
                this.saveIndividualMeasurement(measurement);
            }
        });
    }

    bindMeasurementValidation() {
        const measurements = ['height-shoes', 'height-no-shoes', 'reach', 'wingspan', 'weight', 'hand-length', 'hand-width', 'vertical', 'approach', 'broad'];
        
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

    saveIndividualMeasurement(measurement) {
        const personId = this.currentPersonId;
        const person = this.roster.find(p => (p.id || p.name) === personId);
        
        if (!person) {
            this.showToast('No person selected', 'error');
            return;
        }

        const input1 = document.getElementById(`${measurement}-1`);
        const input2 = document.getElementById(`${measurement}-2`);
        const unit = document.getElementById(`${measurement}-unit`).value;
        
        if (!input1.value || !input2.value) {
            this.showToast(`Please enter both ${measurement.replace('-', ' ')} values`, 'warning');
            return;
        }

        const value1 = parseFloat(input1.value);
        const value2 = parseFloat(input2.value);
        
        if (Math.abs(value1 - value2) >= 0.01) {
            this.showToast(`${measurement.replace('-', ' ')} values do not match`, 'error');
            return;
        }

        // Get or create measurement data
        let measurementData = this.measurements.get(personId) || {
            timestamp: new Date().toISOString(),
            operator: this.currentOperator,
            device: this.deviceId,
            comments: document.getElementById('comments').value || ''
        };

        // Update the specific measurement
        const key = measurement.replace('-', '_');
        measurementData[key] = {
            value: value1,
            unit: unit
        };

        // Update measurements and person status
        this.measurements.set(personId, measurementData);
        
        // Check if person has any valid measurements
        const hasValidMeasurements = ['height_shoes', 'height_no_shoes', 'reach', 'wingspan', 'weight', 'hand_length', 'hand_width', 'vertical', 'approach', 'broad']
            .some(type => measurementData[type] && measurementData[type].value);
        person.completed = hasValidMeasurements;

        this.saveState();
        this.logActivity('INDIVIDUAL_MEASUREMENT_SAVED', { 
            person: person.name, 
            measurement: measurement,
            value: value1,
            unit: unit
        });
        
        // Automatically save to CSV file
        const csvContent = this.generateIndividualMeasurementCSV(person, measurementData);
        const savedFilename = this.appendToCSVFile(csvContent, true);
        
        this.showToast(`${measurement.replace('-', ' ')} saved successfully! (Auto-saved to ${savedFilename})`, 'success');
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
                        completed: false,
                        source: 'roster' // Mark as imported from roster
                    });
                }
            }
        }
        
        this.logActivity('ROSTER_IMPORTED', { 
            totalPeople: this.roster.length,
            filename: document.getElementById('roster-upload').files[0]?.name || 'unknown'
        });
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
        
        // Check for duplicate event names and append timestamp if needed
        const existingEvents = this.getLocalDirectoryFiles()
            .filter(file => file.event === this.currentEvent)
            .map(file => file.filename);
        
        if (existingEvents.length > 0) {
            const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
            this.currentEvent = `${this.currentEvent}_${timestamp}`;
            this.showToast(`Event name was duplicated. Renamed to: ${this.currentEvent}`, 'warning');
        }
        
        document.getElementById('event-title').textContent = this.currentEvent;
        document.getElementById('startup-screen').classList.remove('active');
        document.getElementById('main-screen').classList.add('active');
        
        this.renderRoster();
        this.saveState();
        this.logActivity('EVENT_STARTED', { eventName: this.currentEvent, operator: this.currentOperator });
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
            
            const existing = this.measurements.get(personId);
            if (existing) {
                this.loadMeasurementData(existing);
            } else {
                this.clearMeasurementForm();
            }
            
            this.showMeasurementForm();
            this.logActivity('PERSON_SELECTED', { person: person.name, id: person.id });
        }
    }

    loadMeasurementData(data) {
        const measurements = ['height-shoes', 'height-no-shoes', 'reach', 'wingspan', 'weight', 'hand-length', 'hand-width', 'vertical', 'approach', 'broad'];
        
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
        const measurements = ['height-shoes', 'height-no-shoes', 'reach', 'wingspan', 'weight', 'hand-length', 'hand-width', 'vertical', 'approach', 'broad'];
        
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
        document.getElementById('checkin-section').classList.add('hidden');
        document.getElementById('spreadsheet-view').classList.add('hidden');
        document.getElementById('roster-section').classList.remove('hidden');
        this.renderRoster();
    }

    saveMeasurements() {
        const personId = this.currentPersonId;
        const person = this.roster.find(p => (p.id || p.name) === personId);
        
        if (!person) return;

        const measurements = ['height-shoes', 'height-no-shoes', 'reach', 'wingspan', 'weight', 'hand-length', 'hand-width', 'vertical', 'approach', 'broad'];
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

        if (hasValidMeasurements) {
            this.measurements.set(personId, measurementData);
            person.completed = hasValidMeasurements;
            this.saveState();
            this.createBackup();
            this.logActivity('MEASUREMENTS_SAVED', { 
                person: person.name, 
                measurementsCount: Object.keys(measurementData).filter(k => k !== 'timestamp' && k !== 'operator' && k !== 'device' && k !== 'comments').length,
                completed: person.completed
            });
            
            // Automatically save to CSV file
            const csvContent = this.generateIndividualMeasurementCSV(person, measurementData);
            const savedFilename = this.appendToCSVFile(csvContent, false);
            
            this.showToast(`Measurements saved successfully! (Auto-saved to ${savedFilename})`, 'success');
            this.showRosterView();
        } else {
            this.showToast('Please enter at least one measurement', 'warning');
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
                completed: false,
                source: 'added' // Mark as manually added
            };
            
            this.roster.push(newPerson);
            this.hideAddPersonModal();
            this.renderRoster();
            this.saveState();
            this.logActivity('PERSON_ADDED', { name: name, gender: gender, source: 'added' });
            this.showToast(`Added ${name} to roster`, 'success');
        }
    }

    showSettings() {
        document.getElementById('settings-modal').classList.remove('hidden');
    }

    hideSettings() {
        document.getElementById('settings-modal').classList.add('hidden');
    }

    showFileManagement() {
        document.getElementById('settings-modal').classList.add('hidden');
        document.getElementById('file-management-modal').classList.remove('hidden');
        this.renderFileList();
    }

    hideFileManagement() {
        document.getElementById('file-management-modal').classList.add('hidden');
        document.getElementById('settings-modal').classList.remove('hidden');
    }

    renderFileList() {
        const fileList = document.getElementById('file-list');
        const files = this.getLocalDirectoryFiles();
        
        if (files.length === 0) {
            fileList.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">No backup files found in app storage.<br><br>📂 Main CSV files are saved to your iPad\'s Downloads folder.<br>This list shows backup copies only.</p>';
            return;
        }
        
        fileList.innerHTML = files.map(file => `
            <div class="file-item">
                <div class="file-info">
                    <h4>${this.escapeHtml(file.filename)}</h4>
                    <p>Event: ${this.escapeHtml(file.event)}</p>
                    <p>Operator: ${this.escapeHtml(file.operator)}</p>
                    <p>Date: ${new Date(file.timestamp).toLocaleDateString()}</p>
                    <p>Size: ${(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <div class="file-actions">
                    <button onclick="app.downloadSavedFile('${file.key}', '${this.escapeHtml(file.filename)}')" 
                            style="background: #007AFF; margin-bottom: 8px;">📤 Download</button>
                    <button onclick="app.deleteSavedFile('${file.key}')" 
                            style="background: #dc3545;">🗑️ Delete</button>
                </div>
            </div>
        `).join('');
    }

    downloadSavedFile(fileKey, filename) {
        try {
            const content = localStorage.getItem(fileKey);
            if (content) {
                this.downloadFile(content, filename);
                this.showToast(`Downloaded: ${filename}`, 'success');
            } else {
                this.showToast('File not found', 'error');
            }
        } catch (error) {
            this.showToast('Error downloading file', 'error');
        }
    }

    deleteSavedFile(fileKey) {
        if (confirm('Are you sure you want to delete this file?')) {
            if (this.deleteFromLocalDirectory(fileKey)) {
                this.renderFileList();
                this.showToast('File deleted successfully', 'success');
            } else {
                this.showToast('Error deleting file', 'error');
            }
        }
    }

    showResetModal() {
        document.getElementById('reset-modal').classList.remove('hidden');
        document.getElementById('settings-modal').classList.add('hidden');
    }

    hideResetModal() {
        document.getElementById('reset-modal').classList.add('hidden');
        document.getElementById('reset-password').value = '';
    }

    async confirmReset() {
        const password = document.getElementById('reset-password').value;
        if (password === '00000') {
            // Clear localStorage data
            localStorage.clear();
            
            // Clear app state
            this.roster = [];
            this.measurements.clear();
            this.currentOperator = '';
            this.currentEvent = '';
            this.currentPersonId = null;
            
            // Clear web app cache for fresh start
            await this.clearWebAppCache();
            
            // Return to startup screen
            document.getElementById('main-screen').classList.remove('active');
            document.getElementById('startup-screen').classList.add('active');
            this.hideResetModal();
            
            // Clear form inputs
            document.getElementById('operator-name').value = '';
            document.getElementById('event-name').value = '';
            document.getElementById('roster-upload').value = '';
            this.validateStartup();
            
            this.showToast('App reset for new event - cache cleared', 'success');
        } else {
            this.showToast('Incorrect password', 'error');
        }
    }

    async clearWebAppCache() {
        try {
            // Clear Service Worker cache if available
            if ('serviceWorker' in navigator && 'caches' in window) {
                const cacheNames = await caches.keys();
                const deletePromises = cacheNames.map(cacheName => caches.delete(cacheName));
                await Promise.all(deletePromises);
                console.log('Service Worker caches cleared');
            }

            // Clear browser cache by reloading without cache
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let registration of registrations) {
                    await registration.unregister();
                }
                console.log('Service Workers unregistered');
            }

            // Clear application cache (deprecated but may still be used)
            if (window.applicationCache && window.applicationCache.update) {
                window.applicationCache.update();
            }

            console.log('Web app cache clearing completed');
        } catch (error) {
            console.warn('Cache clearing failed:', error);
            // Don't show error to user as this is not critical
        }
    }

    exportData() {
        const data = {
            event: this.currentEvent,
            operator: this.currentOperator,
            device: this.deviceId,
            exportTime: new Date().toISOString(),
            roster: this.roster,
            measurements: Object.fromEntries(this.measurements),
            activityLog: this.activityLog
        };

        const csvContent = this.generateCSV(data);
        const logContent = this.generateLogCSV(data);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const filename = `${this.currentEvent.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}_${Date.now()}.csv`;
        const logFilename = `${this.currentEvent.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}_${Date.now()}_LOG.csv`;
        
        // Email with attachments (this will handle downloading and local storage)
        this.emailDataWithAttachment(csvContent, filename, logContent, logFilename);
        
        this.logActivity('DATA_EXPORTED', { 
            filename: filename, 
            logFilename: logFilename,
            totalRecords: this.roster.length 
        });
    }

    generateCSV(data) {
        let csv = 'ID,Name,Gender,Present,Completed,Source,Timestamp,Operator,Device,Comments,';
        csv += 'Height_Shoes_Value,Height_Shoes_Unit,Height_No_Shoes_Value,Height_No_Shoes_Unit,';
        csv += 'Reach_Value,Reach_Unit,Wingspan_Value,Wingspan_Unit,Weight_Value,Weight_Unit,';
        csv += 'Hand_Length_Value,Hand_Length_Unit,Hand_Width_Value,Hand_Width_Unit,';
        csv += 'Vertical_Value,Vertical_Unit,Approach_Value,Approach_Unit,Broad_Value,Broad_Unit\n';

        data.roster.forEach(person => {
            const personId = person.id || person.name;
            const measurements = data.measurements[personId] || {};
            
            csv += `"${person.id || ''}","${person.name.replace(/"/g, '""')}","${person.gender}",${person.present},${person.completed},"${person.source || 'roster'}",`;
            csv += `"${measurements.timestamp || ''}","${measurements.operator || ''}","${measurements.device || ''}",`;
            csv += `"${(measurements.comments || '').replace(/"/g, '""')}",`;
            
            const measurementFields = ['height_shoes', 'height_no_shoes', 'reach', 'wingspan', 'weight', 'hand_length', 'hand_width', 'vertical', 'approach', 'broad'];
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

    generateIndividualMeasurementCSV(personData, measurementData) {
        // Create CSV header if this is the first record
        let csv = 'Event,Operator,Device,Save_Timestamp,ID,Name,Gender,Present,Completed,Source,Measurement_Timestamp,Comments,';
        csv += 'Height_Shoes_Value,Height_Shoes_Unit,Height_No_Shoes_Value,Height_No_Shoes_Unit,';
        csv += 'Reach_Value,Reach_Unit,Wingspan_Value,Wingspan_Unit,Weight_Value,Weight_Unit,';
        csv += 'Hand_Length_Value,Hand_Length_Unit,Hand_Width_Value,Hand_Width_Unit,';
        csv += 'Vertical_Value,Vertical_Unit,Approach_Value,Approach_Unit,Broad_Value,Broad_Unit\n';

        // Add the person's data row
        csv += `"${this.currentEvent}","${this.currentOperator}","${this.deviceId}","${new Date().toISOString()}",`;
        csv += `"${personData.id || ''}","${personData.name.replace(/"/g, '""')}","${personData.gender}",${personData.present},${personData.completed},"${personData.source || 'roster'}",`;
        csv += `"${measurementData.timestamp || ''}","${(measurementData.comments || '').replace(/"/g, '""')}",`;
        
        const measurementFields = ['height_shoes', 'height_no_shoes', 'reach', 'wingspan', 'weight', 'hand_length', 'hand_width', 'vertical', 'approach', 'broad'];
        measurementFields.forEach(field => {
            const measurement = measurementData[field];
            if (measurement) {
                csv += `${measurement.value},"${measurement.unit}",`;
            } else {
                csv += ',"",';
            }
        });
        
        csv += '\n';
        return csv;
    }

    appendToCSVFile(csvContent, isIndividualSave = false) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const timeOnly = new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('-')[0];
        const saveType = isIndividualSave ? 'individual' : 'full';
        const filename = `${this.currentEvent.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}_${saveType}_saves.csv`;
        
        // Check if file already exists in the directory
        const directoryKey = 'ManualEntry_Directory';
        let directoryIndex = JSON.parse(localStorage.getItem(directoryKey) || '[]');
        const existingFile = directoryIndex.find(file => file.filename === filename);
        
        let finalContent = csvContent;
        
        if (existingFile) {
            // Append to existing file (remove header from new content)
            const existingContent = localStorage.getItem(existingFile.key) || '';
            const csvLines = csvContent.split('\n');
            const dataLines = csvLines.slice(1).join('\n'); // Remove header
            finalContent = existingContent + dataLines;
            
            // Update existing file
            localStorage.setItem(existingFile.key, finalContent);
            existingFile.size = finalContent.length;
            existingFile.timestamp = new Date().toISOString();
            localStorage.setItem(directoryKey, JSON.stringify(directoryIndex));
        } else {
            // Create new file
            this.saveToLocalDirectory(finalContent, filename);
        }
        
        return filename;
    }

    generateLogCSV(data) {
        let csv = 'Timestamp,Action,Operator,Event,Device,Details\n';
        
        data.activityLog.forEach(logEntry => {
            csv += `"${logEntry.timestamp}","${logEntry.action}","${logEntry.operator || ''}","${logEntry.event || ''}","${logEntry.device || ''}",`;
            csv += `"${JSON.stringify(logEntry.details).replace(/"/g, '""')}"\n`;
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

    emailDataWithAttachment(csvContent, filename, logContent = '', logFilename = '') {
        const subject = encodeURIComponent(`Results for ${this.currentEvent} and ${this.currentOperator}`);
        
        // Create blobs for the files
        const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        let logBlob = null;
        if (logContent) {
            logBlob = new Blob([logContent], { type: 'text/csv;charset=utf-8;' });
        }
        
        // First, always save files to Downloads folder on iPad
        this.saveToDownloadsFolder(csvContent, filename);
        if (logContent) {
            this.saveToDownloadsFolder(logContent, logFilename);
        }
        
        // Enhanced email body for iPad
        const attachmentInfo = logContent ? 
            `Two CSV files have been saved to your iPad's Downloads folder and will be attached:

📄 "${filename}" - Main data export with all measurements
📄 "${logFilename}" - Activity log with timestamp sequence

Files are saved to Downloads folder and accessible via the Files app.` :
            `📄 The CSV file "${filename}" has been saved to your iPad's Downloads folder and will be attached.

File is saved to Downloads folder and accessible via the Files app.`;

        const body = encodeURIComponent(`Manual Entry Data Collection Results

Event: ${this.currentEvent}
Operator: ${this.currentOperator}
Device: ${this.deviceId}
Export Time: ${new Date().toLocaleString()}

📊 Data Summary:
• Total Roster: ${this.roster.length} people
• Completed Measurements: ${this.roster.filter(p => p.completed).length} people
• Present at Event: ${this.roster.filter(p => p.present).length} people
• Activity Log Entries: ${this.activityLog.length} actions

${attachmentInfo}

CSV files are saved to your iPad's Downloads folder for attachment or sharing.
This email was generated automatically by the Manual Entry iPad app.`);
        
        // iPad-optimized email approach with Web Share API for file attachment
        if (navigator.share && navigator.canShare) {
            // Check if we can share files
            const testShareData = {
                files: [new File([csvBlob], filename, { type: 'text/csv' })]
            };
            
            if (navigator.canShare(testShareData)) {
                const shareData = {
                    title: `Results for ${this.currentEvent} and ${this.currentOperator}`,
                    text: `Data collection results for ${this.currentEvent}. Files: ${filename}${logContent ? `, ${logFilename}` : ''}`,
                    files: logContent ? [
                        new File([csvBlob], filename, { type: 'text/csv' }),
                        new File([logBlob], logFilename, { type: 'text/csv' })
                    ] : [new File([csvBlob], filename, { type: 'text/csv' })]
                };
                
                navigator.share(shareData)
                    .then(() => {
                        this.showToast(`Files attached to email and saved to Downloads folder!`, 'success');
                    })
                    .catch((error) => {
                        console.log('Web Share API failed, using mail link:', error);
                        this.openMailWithDownloadedFiles(subject, body, filename, logFilename);
                    });
                return;
            }
        }
        
        // Fallback to mailto with downloaded files
        this.openMailWithDownloadedFiles(subject, body, filename, logFilename);
    }

    saveToDownloadsFolder(content, filename) {
        try {
            // Create downloadable blob
            const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            // Create download link and trigger download
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = filename;
            downloadLink.style.display = 'none';
            
            // Add to DOM, click, and remove
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Clean up the blob URL
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);
            
            // Also save to our localStorage directory for backup
            this.saveToLocalDirectory(content, filename);
            
            // Show immediate feedback to user
            this.showToast(`💾 ${filename} saved to Downloads folder`, 'success');
            console.log(`File saved to Downloads folder: ${filename}`);
            
        } catch (error) {
            console.error('Error saving to Downloads folder:', error);
            this.showToast('Error saving file to Downloads folder', 'error');
        }
    }

    openMailWithDownloadedFiles(subject, body, filename, logFilename = '') {
        // Enhanced mailto for iPad Mail app with downloaded files
        const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
        
        // Open the email app
        try {
            // Use window.location for better iPad compatibility
            window.location.href = mailtoLink;
            
            // Show success message with instructions
            setTimeout(() => {
                const fileList = logFilename ? 
                    `Files saved to Downloads folder:\n• ${filename}\n• ${logFilename}` :
                    `File saved to Downloads folder:\n• ${filename}`;
                    
                this.showToast(`📧 Mail app opened! ${fileList}\n\nFiles are in Downloads folder. Use 📎 attachment button in Mail to attach them.`, 'success');
            }, 500);
            
        } catch (error) {
            // Ultimate fallback
            window.open(mailtoLink, '_blank');
            this.showToast('Email opened. Files saved to Downloads folder - attach from there.', 'success');
        }
    }

    saveToLocalDirectory(content, filename) {
        try {
            // Create a backup storage directory in localStorage (for app file management only)
            const directoryKey = 'ManualEntry_Directory';
            const fileKey = `ManualEntry_${filename}_${Date.now()}`;
            
            // Get existing directory index or create new one
            let directoryIndex = JSON.parse(localStorage.getItem(directoryKey) || '[]');
            
            // Add file metadata to directory index
            const fileMetadata = {
                filename: filename,
                timestamp: new Date().toISOString(),
                event: this.currentEvent,
                operator: this.currentOperator,
                size: content.length,
                key: fileKey
            };
            
            directoryIndex.push(fileMetadata);
            
            // Keep only the last 10 files to manage storage
            if (directoryIndex.length > 10) {
                const oldFile = directoryIndex.shift();
                localStorage.removeItem(oldFile.key);
            }
            
            // Save the file content
            localStorage.setItem(fileKey, content);
            
            // Update directory index
            localStorage.setItem(directoryKey, JSON.stringify(directoryIndex));
            
            console.log(`File backup saved to app storage: ${filename}`);
            
        } catch (error) {
            console.warn('Could not save backup to app storage due to storage limitations:', error);
            this.showToast('Warning: Could not save backup copy due to storage limits', 'warning');
        }
    }

    getLocalDirectoryFiles() {
        try {
            const directoryKey = 'ManualEntry_Directory';
            return JSON.parse(localStorage.getItem(directoryKey) || '[]');
        } catch (error) {
            console.error('Error reading local directory:', error);
            return [];
        }
    }

    deleteFromLocalDirectory(fileKey) {
        try {
            const directoryKey = 'ManualEntry_Directory';
            let directoryIndex = JSON.parse(localStorage.getItem(directoryKey) || '[]');
            
            // Remove file from directory index
            directoryIndex = directoryIndex.filter(file => file.key !== fileKey);
            
            // Remove file content
            localStorage.removeItem(fileKey);
            
            // Update directory index
            localStorage.setItem(directoryKey, JSON.stringify(directoryIndex));
            
            return true;
        } catch (error) {
            console.error('Error deleting from local directory:', error);
            return false;
        }
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
            activityLog: this.activityLog,
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
                this.activityLog = state.activityLog || [];
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

    // Check-in Section Methods
    showCheckinSection() {
        document.getElementById('roster-section').classList.add('hidden');
        document.getElementById('measurement-form').classList.add('hidden');
        document.getElementById('spreadsheet-view').classList.add('hidden');
        document.getElementById('checkin-section').classList.remove('hidden');
        this.renderCheckinGrid();
        this.logActivity('CHECKIN_VIEW_OPENED');
    }

    toggleCheckinEditMode() {
        this.checkinEditMode = !this.checkinEditMode;
        const button = document.getElementById('toggle-checkin-edit');
        if (this.checkinEditMode) {
            button.textContent = '📝 Edit Mode: ON';
            button.classList.add('edit-active');
        } else {
            button.textContent = '📝 Edit Mode: OFF';
            button.classList.remove('edit-active');
        }
        this.renderCheckinGrid();
        this.logActivity('CHECKIN_EDIT_MODE_TOGGLED', { editMode: this.checkinEditMode });
    }

    renderCheckinGrid() {
        const grid = document.getElementById('checkin-grid');
        if (!grid) return;

        grid.innerHTML = this.roster.map(person => {
            const personId = person.id || person.name;
            const sourceLabel = person.source === 'added' ? 'Added' : 'Roster';
            const sourceBadgeClass = person.source === 'added' ? 'added' : 'roster';
            
            let genderEdit = '';
            if (this.checkinEditMode) {
                genderEdit = `
                    <div class="checkin-gender-edit">
                        <select onchange="app.updatePersonGender('${this.escapeHtml(personId)}', this.value)">
                            <option value="M" ${person.gender === 'M' ? 'selected' : ''}>Male</option>
                            <option value="F" ${person.gender === 'F' ? 'selected' : ''}>Female</option>
                            <option value="Other" ${person.gender === 'Other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                `;
            }

            return `
                <div class="checkin-item ${person.present ? 'present' : ''}" 
                     onclick="app.togglePersonPresence('${this.escapeHtml(personId)}')">
                    <div class="checkin-person-info">
                        <h4>${this.escapeHtml(person.name)}</h4>
                        <p>ID: ${person.id || 'N/A'}</p>
                        <p>Gender: ${person.gender}</p>
                        <span class="source-badge ${sourceBadgeClass}">${sourceLabel}</span>
                        ${genderEdit}
                    </div>
                    <div class="checkin-status">
                        ${person.present ? '✓' : '○'}
                    </div>
                </div>
            `;
        }).join('');
    }

    togglePersonPresence(personId) {
        const person = this.roster.find(p => (p.id || p.name) === personId);
        if (person) {
            person.present = !person.present;
            this.saveState();
            this.renderCheckinGrid();
            this.logActivity('PRESENCE_TOGGLED', { 
                person: person.name, 
                present: person.present 
            });
            
            const status = person.present ? 'checked in' : 'checked out';
            this.showToast(`${person.name} ${status}`, 'success');
        }
    }

    updatePersonGender(personId, newGender) {
        const person = this.roster.find(p => (p.id || p.name) === personId);
        if (person) {
            const oldGender = person.gender;
            person.gender = newGender;
            this.saveState();
            this.logActivity('GENDER_UPDATED', { 
                person: person.name, 
                oldGender: oldGender,
                newGender: newGender 
            });
            this.showToast(`Updated gender for ${person.name}`, 'success');
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