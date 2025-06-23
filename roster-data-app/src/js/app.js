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
        document.getElementById('home-screen').classList.remove('active');
        document.getElementById('startup-screen').classList.add('active');
        this.logActivity('APP_STARTED', { from: 'home_screen' });
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
            
            // Measurements
            const measurements = ['height_shoes', 'height_no_shoes', 'reach', 'wingspan', 'weight', 'hand_length', 'hand_width'];
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
            const hasValidMeasurements = ['height_shoes', 'height_no_shoes', 'reach', 'wingspan', 'weight', 'hand_length', 'hand_width']
                .some(type => measurementData[type] && measurementData[type].value);
            person.completed = hasValidMeasurements;
        }

        this.saveState();
        this.logActivity('MEASUREMENT_UPDATED', { 
            person: personId, 
            measurement: measurementType, 
            value: value 
        });
    }

    bindEvents() {
        // Home screen events
        document.getElementById('continue-to-app').addEventListener('click', this.showStartupScreen.bind(this));

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
        document.getElementById('back-to-roster').addEventListener('click', this.showRosterView.bind(this));
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
            document.getElementById('present-checkbox').checked = person.present;
            
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
            this.logActivity('MEASUREMENTS_SAVED', { 
                person: person.name, 
                measurementsCount: Object.keys(measurementData).filter(k => k !== 'timestamp' && k !== 'operator' && k !== 'device' && k !== 'comments').length,
                present: person.present,
                completed: person.completed
            });
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
            this.logActivity('PERSON_ADDED', { name: name, gender: gender });
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
            fileList.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">No saved files found in Manual entry directory.</p>';
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
            measurements: Object.fromEntries(this.measurements),
            activityLog: this.activityLog
        };

        const csvContent = this.generateCSV(data);
        const logContent = this.generateLogCSV(data);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const filename = `${this.currentEvent.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}_${Date.now()}.csv`;
        const logFilename = `${this.currentEvent.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}_${Date.now()}_LOG.csv`;
        
        // Save to local subdirectory
        this.saveToLocalDirectory(csvContent, filename);
        this.saveToLocalDirectory(logContent, logFilename);
        
        // Download files and auto-attach to email
        this.downloadFile(csvContent, filename);
        this.downloadFile(logContent, logFilename);
        this.emailDataWithAttachment(csvContent, filename, logContent, logFilename);
        
        this.logActivity('DATA_EXPORTED', { 
            filename: filename, 
            logFilename: logFilename,
            totalRecords: this.roster.length 
        });
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
        const subject = encodeURIComponent(`Manual Entry Data - ${this.currentEvent}`);
        
        // Create data URLs for the files
        const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const csvDataUrl = URL.createObjectURL(csvBlob);
        
        let logDataUrl = '';
        if (logContent) {
            const logBlob = new Blob([logContent], { type: 'text/csv;charset=utf-8;' });
            logDataUrl = URL.createObjectURL(logBlob);
        }
        
        // Enhanced email body with file information
        const attachmentInfo = logContent ? 
            `Two files have been generated:
1. "${filename}" - Main data export with all measurements
2. "${logFilename}" - Activity log with timestamp sequence of all entries` :
            `The CSV file "${filename}" contains all measurement data`;

        const body = encodeURIComponent(`Please find the data collection results for ${this.currentEvent}.

Operator: ${this.currentOperator}
Device: ${this.deviceId}
Export Time: ${new Date().toLocaleString()}

Data Summary:
- Total Roster: ${this.roster.length} people
- Completed Measurements: ${this.roster.filter(p => p.completed).length} people
- Present: ${this.roster.filter(p => p.present).length} people
- Activity Log Entries: ${this.activityLog.length} actions

${attachmentInfo}

Files have been automatically saved to your device's "Manual entry" folder.

Note: Files will be automatically attached if your email client supports data URLs, otherwise they have been downloaded to your Downloads folder for manual attachment.`);
        
        // Try to open email with attachments
        let mailtoLink = `mailto:?subject=${subject}&body=${body}`;
        if (logContent) {
            mailtoLink += `&attachment=${csvDataUrl};filename=${filename}&attachment=${logDataUrl};filename=${logFilename}`;
        } else {
            mailtoLink += `&attachment=${csvDataUrl};filename=${filename}`;
        }
        
        // Fallback for clients that don't support attachment parameter
        const fallbackMailtoLink = `mailto:?subject=${subject}&body=${body}`;
        
        // Try the enhanced version first, fallback to standard if needed
        try {
            window.open(mailtoLink, '_blank');
            this.showToast(`Files saved to "Manual entry" folder and email opened with ${logContent ? 'data and log' : 'data'} attachments!`, 'success');
        } catch (error) {
            window.open(fallbackMailtoLink, '_blank');
            this.showToast('Files saved locally. Email opened - files available in Downloads for attachment.', 'success');
        }
        
        // Clean up the blob URLs after a delay
        setTimeout(() => {
            URL.revokeObjectURL(csvDataUrl);
            if (logDataUrl) URL.revokeObjectURL(logDataUrl);
        }, 10000);
    }

    saveToLocalDirectory(content, filename) {
        try {
            // Create a "Manual entry" subdirectory key
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
            
            console.log(`File saved to Manual entry directory: ${filename}`);
            
        } catch (error) {
            console.warn('Could not save to local directory due to storage limitations:', error);
            this.showToast('Warning: Could not save to local directory due to storage limits', 'warning');
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