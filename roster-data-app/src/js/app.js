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
        
        // New setup properties
        this.measurementUnits = {
            height: 'inches',
            reach: 'inches', 
            wingspan: 'inches',
            vertical: 'inches',
            approach: 'inches',
            broad: 'inches'
        };
        this.adjustments = {
            height_shoes: { M: 0, F: 0 },
            height_no_shoes: { M: 0, F: 0 },
            reach: { M: 0, F: 0 },
            wingspan: { M: 0, F: 0 },
            weight: { M: 0, F: 0 },
            hand_length: { M: 0, F: 0 },
            hand_width: { M: 0, F: 0 },
            vertical: { M: 0, F: 0 },
            approach: { M: 0, F: 0 },
            broad: { M: 0, F: 0 }
        };
        
        // Station View properties
        this.currentView = 'athlete'; // 'athlete' or 'station'
        this.currentStation = '';
        this.selectedPersonInStation = null;
        
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
    }

    showStartupScreen() {
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        document.getElementById('startup-screen').classList.add('active');
        this.logActivity('STARTUP_SCREEN_OPENED');
    }

    showSpreadsheetView() {
        // Ensure we have necessary data
        if (!this.currentOperator || !this.currentEvent) {
            this.showToast('Please complete the startup process first', 'warning');
            return;
        }
        
        if (this.roster.length === 0) {
            this.showToast('Please upload a roster first', 'warning');
            return;
        }
        
        // Hide other sections
        const sections = ['roster-section', 'measurement-form', 'checkin-section', 'setup-screen', 'startup-screen'];
        sections.forEach(sectionId => {
            const element = document.getElementById(sectionId);
            if (element) element.classList.add('hidden');
        });
        
        // Show spreadsheet view
        const spreadsheetView = document.getElementById('spreadsheet-view');
        if (spreadsheetView) {
            spreadsheetView.classList.remove('hidden');
            this.renderSpreadsheet();
            this.logActivity('SPREADSHEET_VIEW_OPENED');
        } else {
            this.showToast('Spreadsheet view not available', 'error');
        }
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
        if (!container) {
            console.error('Spreadsheet container not found');
            this.showToast('Unable to load spreadsheet view', 'error');
            return;
        }
        
        if (this.roster.length === 0) {
            container.innerHTML = '<p class="no-data">No roster data available. Please upload a roster first.</p>';
            return;
        }

        // Create table HTML with all required columns
        let tableHTML = '<table class="spreadsheet-table"><thead><tr>';
        
        // Basic info headers
        tableHTML += '<th class="name-column header">Name</th>';
        tableHTML += '<th>ID</th>';
        tableHTML += '<th>Gender</th>';
        tableHTML += '<th>Present</th>';
        tableHTML += '<th>Anthros Complete</th>';
        tableHTML += '<th>Measures Complete</th>';
        tableHTML += '<th>Source</th>';
        
        // Measurement headers with all new columns
        const measurementTypes = [
            { key: 'height_shoes', label: 'Height w/ Shoes', hasDisplay: true },
            { key: 'height_no_shoes', label: 'Height w/o Shoes', hasDisplay: true },
            { key: 'reach', label: 'Reach', hasDisplay: true },
            { key: 'wingspan', label: 'Wingspan', hasDisplay: true },
            { key: 'weight', label: 'Weight', hasDisplay: false },
            { key: 'hand_length', label: 'Hand Length', hasDisplay: false },
            { key: 'hand_width', label: 'Hand Width', hasDisplay: false },
            { key: 'vertical', label: 'Vertical', hasDisplay: false },
            { key: 'approach', label: 'Approach', hasDisplay: false },
            { key: 'broad', label: 'Broad', hasDisplay: false }
        ];

        measurementTypes.forEach(type => {
            tableHTML += `<th>${type.label}</th>`;
            tableHTML += `<th>Unit</th>`;
            tableHTML += `<th>Adjustment</th>`;
            tableHTML += `<th>Override</th>`;
            tableHTML += `<th>Adjusted ${type.label}</th>`;
            if (type.hasDisplay) {
                tableHTML += `<th>${type.label} (ft/in)</th>`;
            }
        });

        // Reporting columns
        tableHTML += '<th>Vertical for Reporting</th>';
        tableHTML += '<th>Approach for Reporting</th>';
        tableHTML += '<th>Comments</th>';
        tableHTML += '</tr></thead><tbody>';

        // Data rows
        this.roster.forEach(person => {
            const personId = person.id || person.name;
            const measurement = this.measurements.get(personId) || {};
            
            tableHTML += '<tr>';
            // Name column - editable in edit mode
            if (this.editMode) {
                tableHTML += `<td class="name-column">
                    <input type="text" class="name-edit-input" 
                           data-person="${this.escapeHtml(personId)}"
                           value="${this.escapeHtml(person.name)}" 
                           placeholder="Name">
                </td>`;
            } else {
                tableHTML += `<td class="name-column">${this.escapeHtml(person.name)}</td>`;
            }
            
            tableHTML += `<td>${this.escapeHtml(person.id || '')}</td>`;
            
            // Gender column - editable in edit mode
            if (this.editMode) {
                tableHTML += `<td class="measurement-cell">
                    <select class="gender-edit-select" data-person="${this.escapeHtml(personId)}">
                        <option value="M" ${person.gender === 'M' ? 'selected' : ''}>M</option>
                        <option value="F" ${person.gender === 'F' ? 'selected' : ''}>F</option>
                    </select>
                </td>`;
            } else {
                tableHTML += `<td>${this.escapeHtml(person.gender)}</td>`;
            }
            tableHTML += `<td class="present-indicator ${person.present ? 'present' : 'absent'}">${person.present ? '✓' : '✗'}</td>`;
            tableHTML += `<td class="completion-indicator">${this.getAnthrosCompletedStatus(personId)}</td>`;
            tableHTML += `<td class="completion-indicator">${this.getMeasuresCompletedStatus(personId)}</td>`;
            tableHTML += `<td class="source-indicator">${person.source === 'added' ? 'Added' : 'Roster'}</td>`;
            
            // Measurement columns
            measurementTypes.forEach(type => {
                const data = measurement[type.key];
                const adjustmentValue = this.adjustments[type.key] ? this.adjustments[type.key][person.gender] || 0 : 0;
                const overrideValue = measurement[`${type.key}_override`] || 0;
                
                // Raw measurement value
                if (this.editMode) {
                    tableHTML += `<td class="measurement-cell">
                        <input type="number" step="0.01" class="measurement-input" 
                               data-person="${this.escapeHtml(personId)}" 
                               data-measurement="${type.key}"
                               value="${data ? data.value : ''}" 
                               placeholder="Enter">
                    </td>`;
                } else {
                    tableHTML += `<td class="measurement-display">${data ? data.value : ''}</td>`;
                }
                
                // Unit
                const unit = this.getMeasurementUnit(type.key);
                tableHTML += `<td class="measurement-display">${unit}</td>`;
                
                // Adjustment
                tableHTML += `<td class="measurement-display">${adjustmentValue}</td>`;
                
                // Override
                if (this.editMode) {
                    tableHTML += `<td class="measurement-cell">
                        <input type="number" step="0.01" class="measurement-input" 
                               data-person="${this.escapeHtml(personId)}" 
                               data-measurement="${type.key}_override"
                               value="${overrideValue}" 
                               placeholder="0">
                    </td>`;
                } else {
                    tableHTML += `<td class="measurement-display">${overrideValue}</td>`;
                }
                
                // Adjusted value
                let adjustedValue = '';
                if (data && data.value) {
                    const rawValueInInches = this.convertToInches(data.value, data.unit || unit);
                    const rawAdjusted = overrideValue !== 0 ? 
                        rawValueInInches + overrideValue : 
                        rawValueInInches + adjustmentValue;
                    adjustedValue = this.roundMeasurement(rawAdjusted, type.key).toFixed(2);
                }
                tableHTML += `<td class="measurement-display">${adjustedValue}</td>`;
                
                // Display version (feet/inches for height, wingspan, reach)
                if (type.hasDisplay) {
                    const displayValue = adjustedValue ? this.inchesToFeetAndInches(parseFloat(adjustedValue)) : '';
                    tableHTML += `<td class="measurement-display">${displayValue}</td>`;
                }
            });

            // Reporting columns
            const adjustedReach = this.getAdjustedMeasurementValue(measurement, 'reach', person.gender);
            const adjustedVertical = this.getAdjustedMeasurementValue(measurement, 'vertical', person.gender);
            const adjustedApproach = this.getAdjustedMeasurementValue(measurement, 'approach', person.gender);
            
            const verticalForReporting = (adjustedVertical && adjustedReach) ? (adjustedVertical - adjustedReach).toFixed(2) : '';
            const approachForReporting = (adjustedApproach && adjustedReach) ? (adjustedApproach - adjustedReach).toFixed(2) : '';
            
            tableHTML += `<td class="measurement-display">${verticalForReporting}</td>`;
            tableHTML += `<td class="measurement-display">${approachForReporting}</td>`;
            
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
            
            // Add event listeners for name and gender editing
            container.querySelectorAll('.name-edit-input').forEach(input => {
                input.addEventListener('change', this.handleNameChange.bind(this));
                input.addEventListener('blur', this.handleNameChange.bind(this));
            });
            
            container.querySelectorAll('.gender-edit-select').forEach(select => {
                select.addEventListener('change', this.handleGenderChange.bind(this));
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
        } else if (measurementType.endsWith('_override')) {
            // Handle override values
            measurementData[measurementType] = parseFloat(value) || 0;
        } else if (measurementType.endsWith('_unit')) {
            const baseType = measurementType.replace('_unit', '');
            if (!measurementData[baseType]) {
                measurementData[baseType] = { value: '', unit: value };
            } else {
                measurementData[baseType].unit = value;
            }
        } else {
            // Handle regular measurement values
            const unit = this.getMeasurementUnit(measurementType);
            if (!measurementData[measurementType]) {
                measurementData[measurementType] = { value: parseFloat(value) || '', unit: unit };
            } else {
                measurementData[measurementType].value = parseFloat(value) || '';
                if (!measurementData[measurementType].unit) {
                    measurementData[measurementType].unit = unit;
                }
            }
        }

        // Update measurements and person status
        this.measurements.set(personId, measurementData);
        const person = this.roster.find(p => (p.id || p.name) === personId);
        if (person) {
            // No longer setting person.completed - allowing re-entry
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

    handleNameChange(event) {
        const input = event.target;
        const personId = input.getAttribute('data-person');
        const newName = input.value.trim();
        
        if (newName) {
            const person = this.roster.find(p => (p.id || p.name) === personId);
            if (person) {
                const oldName = person.name;
                person.name = newName;
                this.saveState();
                this.logActivity('PERSON_NAME_UPDATED', { 
                    personId: personId,
                    oldName: oldName,
                    newName: newName
                });
                this.showToast('Name updated successfully', 'success');
            }
        }
    }

    handleGenderChange(event) {
        const select = event.target;
        const personId = select.getAttribute('data-person');
        const newGender = select.value;
        
        const person = this.roster.find(p => (p.id || p.name) === personId);
        if (person) {
            const oldGender = person.gender;
            person.gender = newGender;
            this.saveState();
            this.logActivity('PERSON_GENDER_UPDATED', { 
                personId: personId,
                oldGender: oldGender,
                newGender: newGender
            });
            this.showToast('Gender updated successfully', 'success');
            
            // Re-render to update adjustment displays if needed
            this.renderSpreadsheet();
        }
    }

    bindEvents() {
        // Startup screen events
        document.getElementById('operator-name').addEventListener('input', this.validateStartup.bind(this));
        document.getElementById('event-name').addEventListener('input', this.validateStartup.bind(this));
        document.getElementById('roster-upload').addEventListener('change', this.handleRosterUpload.bind(this));
        
        // Setup measurements button - add both click and touch events for iPad compatibility
        const setupButton = document.getElementById('setup-measurements');
        setupButton.addEventListener('click', this.showSetupScreen.bind(this));
        setupButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.showSetupScreen();
        });
        
        // Setup screen events
        document.getElementById('back-to-startup').addEventListener('click', this.showStartupScreen.bind(this));
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

        // View mode events
        document.getElementById('view-mode').addEventListener('change', this.switchView.bind(this));
        
        // Station view events
        document.getElementById('station-select').addEventListener('change', this.selectStation.bind(this));
        document.getElementById('back-to-athlete-view').addEventListener('click', this.showAthleteView.bind(this));
        document.getElementById('station-name-filter').addEventListener('input', this.filterStationRoster.bind(this));
        document.getElementById('station-save-btn').addEventListener('click', this.saveStationMeasurement.bind(this));
        
        // Station measurement input events
        document.getElementById('station-value-1').addEventListener('input', this.updateStationDisplay.bind(this));
        document.getElementById('station-value-2').addEventListener('input', this.updateStationDisplay.bind(this));
        document.getElementById('station-override').addEventListener('input', this.updateStationDisplay.bind(this));

        // Spreadsheet view events
        document.getElementById('toggle-edit-mode').addEventListener('click', this.toggleEditMode.bind(this));
        document.getElementById('back-to-main').addEventListener('click', this.showMainView.bind(this));

        // Modal events
        document.getElementById('cancel-add-person').addEventListener('click', this.hideAddPersonModal.bind(this));
        document.getElementById('confirm-add-person').addEventListener('click', this.addNewPerson.bind(this));
        document.getElementById('close-settings').addEventListener('click', this.hideSettings.bind(this));
        document.getElementById('measurement-setup-btn').addEventListener('click', this.showMeasurementSetup.bind(this));
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
        const overrideInput = document.getElementById(`${measurement}-override`);
        
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

        // Get unit from setup settings
        const unit = this.getMeasurementUnit(measurement);
        const adjustmentOverride = parseFloat(overrideInput.value) || 0;

        // Get or create measurement data
        let measurementData = this.measurements.get(personId) || {
            timestamp: new Date().toISOString(),
            operator: this.currentOperator,
            device: this.deviceId,
            comments: document.getElementById('comments').value || ''
        };

        // Calculate adjustments - convert to inches first
        const key = measurement.replace('-', '_');
        const valueInInches = this.convertToInches(value1, unit);
        const baseAdjustment = this.adjustments[key] ? this.adjustments[key][person.gender] || 0 : 0;
        const finalAdjustment = adjustmentOverride !== 0 ? adjustmentOverride : baseAdjustment;
        const rawAdjustedValue = valueInInches + finalAdjustment;
        const adjustedValue = this.roundMeasurement(rawAdjustedValue, key);

        // Update the specific measurement
        measurementData[key] = {
            value: value1,  // Original value as entered
            unit: unit,     // Original unit
            valueInInches: valueInInches,  // Converted to inches for calculations
            adjustment: baseAdjustment,
            adjustmentOverride: adjustmentOverride,
            adjustedValue: adjustedValue
        };

        // Update measurements and person status
        this.measurements.set(personId, measurementData);
        
        // No longer setting person.completed - allowing re-entry

        this.saveState();
        this.logActivity('INDIVIDUAL_MEASUREMENT_SAVED', { 
            person: person.name, 
            measurement: measurement,
            value: value1,
            unit: unit,
            adjustment: baseAdjustment,
            adjustmentOverride: adjustmentOverride,
            adjustedValue: adjustedValue
        });
        
        // Automatically save to CSV file
        const csvContent = this.generateIndividualMeasurementCSV(person, measurementData);
        const savedFilename = this.appendToCSVFile(csvContent, true);
        
        this.showToast(`${measurement.replace('-', ' ')} saved successfully! (Auto-saved to ${savedFilename})`, 'success');
    }

    getMeasurementUnit(measurement) {
        // Map measurement names to unit settings
        const unitMap = {
            'height-shoes': 'height',
            'height-no-shoes': 'height',
            'reach': 'reach',
            'wingspan': 'wingspan',
            'weight': 'lbs', // Fixed unit
            'hand-length': 'inches', // Fixed unit
            'hand-width': 'inches', // Fixed unit
            'vertical': 'vertical',
            'approach': 'approach',
            'broad': 'broad'
        };
        
        const unitKey = unitMap[measurement];
        if (unitKey === 'lbs' || unitKey === 'inches') {
            return unitKey;
        }
        return this.measurementUnits[unitKey] || 'inches';
    }

    convertToInches(value, unit) {
        if (unit === 'cm') {
            return value / 2.54;
        }
        return value; // Already in inches
    }

    inchesToFeetAndInches(inches) {
        const feet = Math.floor(inches / 12);
        const remainingInches = Math.round((inches % 12) * 100) / 100;
        return `${feet}'${remainingInches}"`;
    }

    validateStartup() {
        const operatorName = document.getElementById('operator-name').value.trim();
        const eventName = document.getElementById('event-name').value.trim();
        const rosterFile = document.getElementById('roster-upload').files[0];
        
        const setupButton = document.getElementById('setup-measurements');
        const isValid = operatorName && eventName && (rosterFile || this.roster.length > 0);
        
        if (setupButton) {
            setupButton.disabled = !isValid;
            setupButton.style.opacity = isValid ? '1' : '0.5';
        }
        
        return isValid;
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
            filename: document.getElementById('roster-upload').files[0] ? document.getElementById('roster-upload').files[0].name : 'unknown'
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
        // Save setup settings first
        this.saveSetupSettings();
        
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
        
        // Hide all screens and show main screen
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        document.getElementById('main-screen').classList.add('active');
        
        this.renderRoster();
        this.updateMeasurementUnitDisplays();
        this.saveState();
        this.logActivity('EVENT_STARTED', { 
            eventName: this.currentEvent, 
            operator: this.currentOperator,
            units: this.measurementUnits,
            adjustments: this.adjustments
        });
        this.showToast(`Event "${this.currentEvent}" started successfully!`, 'success');
    }

    renderRoster() {
        const grid = document.getElementById('roster-grid');
        const filter = document.getElementById('name-filter').value.toLowerCase();
        
        const filteredRoster = this.roster.filter(person => 
            person.name.toLowerCase().includes(filter)
        );
        
        grid.innerHTML = filteredRoster.map(person => {
            const personId = person.id || person.name;
            const anthrosStatus = this.getAnthrosCompletedStatus(personId);
            const measuresStatus = this.getMeasuresCompletedStatus(personId);
            
            return `
            <div class="roster-item ${person.present ? 'present' : ''}" 
                 onclick="app.selectPerson('${this.escapeHtml(personId)}')">
                <h4>${this.escapeHtml(person.name)}</h4>
                <p>ID: ${person.id || 'N/A'}</p>
                <p>Gender: ${person.gender}</p>
                <div class="status ${person.present ? 'present' : ''}">
                    ${person.present ? '⏱ Present' : '○ Not checked in'}
                </div>
                <div class="completion-status">
                    <small>Anthros: ${anthrosStatus} | Measures: ${measuresStatus}</small>
                </div>
            </div>`;
        }).join('');
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
            
            // Update adjustment displays for this person's gender
            this.updateAdjustmentDisplays(person.gender);
            
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

    updateAdjustmentDisplays(gender) {
        const measurements = ['height-shoes', 'height-no-shoes', 'reach', 'wingspan', 'weight', 'hand-length', 'hand-width', 'vertical', 'approach', 'broad'];
        
        measurements.forEach(measurement => {
            const key = measurement.replace('-', '_');
            const adjustment = this.adjustments[key] ? this.adjustments[key][gender] || 0 : 0;
            
            // Find or create adjustment display element
            let displayElement = document.getElementById(`${measurement}-adjustment-display`);
            if (!displayElement) {
                // Create and insert the display element
                const measurementItem = document.getElementById(`${measurement}-1`).closest('.measurement-item');
                if (measurementItem) {
                    const label = measurementItem.querySelector('label');
                    if (label) {
                        const adjustmentSpan = document.createElement('span');
                        adjustmentSpan.id = `${measurement}-adjustment-display`;
                        adjustmentSpan.className = 'adjustment-display';
                        adjustmentSpan.textContent = adjustment !== 0 ? ` (Adj: ${adjustment > 0 ? '+' : ''}${adjustment}")` : '';
                        label.appendChild(adjustmentSpan);
                    }
                }
            } else {
                displayElement.textContent = adjustment !== 0 ? ` (Adj: ${adjustment > 0 ? '+' : ''}${adjustment}")` : '';
            }
        });
    }

    loadMeasurementData(data) {
        const measurements = ['height-shoes', 'height-no-shoes', 'reach', 'wingspan', 'weight', 'hand-length', 'hand-width', 'vertical', 'approach', 'broad'];
        
        measurements.forEach(measurement => {
            const key = measurement.replace('-', '_');
            if (data[key]) {
                document.getElementById(`${measurement}-1`).value = data[key].value || '';
                document.getElementById(`${measurement}-2`).value = data[key].value || '';
                
                // Load override values if they exist
                const overrideElement = document.getElementById(`${measurement}-override`);
                if (overrideElement && data[key].adjustmentOverride) {
                    overrideElement.value = data[key].adjustmentOverride;
                }
                
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
            
            // Clear override values
            const overrideElement = document.getElementById(`${measurement}-override`);
            if (overrideElement) {
                overrideElement.value = '';
            }
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
        
        if (!person) {
            this.showToast('No person selected', 'error');
            return;
        }

        const measurements = ['height-shoes', 'height-no-shoes', 'reach', 'wingspan', 'weight', 'hand-length', 'hand-width', 'vertical', 'approach', 'broad'];
        let measurementData = this.measurements.get(personId) || {
            timestamp: new Date().toISOString(),
            operator: this.currentOperator,
            device: this.deviceId,
            comments: document.getElementById('comments').value || ''
        };

        let hasValidMeasurements = false;
        let hasErrors = false;

        measurements.forEach(measurement => {
            const input1 = document.getElementById(`${measurement}-1`);
            const input2 = document.getElementById(`${measurement}-2`);
            const overrideInput = document.getElementById(`${measurement}-override`);
            
            if (input1 && input1.value && input2 && input2.value) {
                const value1 = parseFloat(input1.value);
                const value2 = parseFloat(input2.value);
                
                if (Math.abs(value1 - value2) < 0.01) {
                    const key = measurement.replace('-', '_');
                    const unit = this.getMeasurementUnit(measurement);
                    const override = overrideInput ? (parseFloat(overrideInput.value) || 0) : 0;
                    
                    // Calculate adjustments
                    const baseAdjustment = this.adjustments[key] ? this.adjustments[key][person.gender] || 0 : 0;
                    const finalAdjustment = override !== 0 ? override : baseAdjustment;
                    const adjustedValue = value1 + finalAdjustment;
                    
                    measurementData[key] = {
                        value: value1,
                        unit: unit,
                        adjustment: baseAdjustment,
                        adjustmentOverride: override,
                        adjustedValue: adjustedValue
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
            // Update comments if changed
            measurementData.comments = document.getElementById('comments').value || '';
            
            this.measurements.set(personId, measurementData);
            // No longer setting person.completed - allowing re-entry
            this.saveState();
            this.createBackup();
            this.logActivity('MEASUREMENTS_SAVED', { 
                person: person.name, 
                measurementsCount: Object.keys(measurementData).filter(k => !['timestamp', 'operator', 'device', 'comments'].includes(k)).length
            });
            
            // Update roster display
            this.renderRoster();
            
            this.showToast(`Measurements saved successfully!`, 'success');
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

    showMeasurementSetup() {
        document.getElementById('settings-modal').classList.add('hidden');
        
        // Use the same screen transition pattern as other methods
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        document.getElementById('setup-screen').classList.add('active');
        
        // Load current settings to populate the form
        this.loadSetupSettings();
        
        this.logActivity('MEASUREMENT_SETUP_OPENED_FROM_SETTINGS');
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

    confirmReset() {
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
            this.clearWebAppCache();
            
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

    clearWebAppCache() {
        try {
            // Clear Service Worker cache if available
            if ('serviceWorker' in navigator && 'caches' in window) {
                caches.keys().then(cacheNames => {
                    const deletePromises = cacheNames.map(cacheName => caches.delete(cacheName));
                    return Promise.all(deletePromises);
                }).then(() => {
                    console.log('Service Worker caches cleared');
                });
            }

            // Clear browser cache by reloading without cache
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                    for (let registration of registrations) {
                        registration.unregister();
                    }
                    console.log('Service Workers unregistered');
                });
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

        // Generate all three reports
        const csvContent = this.generateCSV(data);
        const logContent = this.generateLogCSV(data);
        const perMeasurementContent = this.generatePerMeasurementCSV(data);
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const filename = `${this.currentEvent.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}_${Date.now()}.csv`;
        const logFilename = `${this.currentEvent.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}_${Date.now()}_LOG.csv`;
        const perMeasurementFilename = `${this.currentEvent.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}_${Date.now()}_PER_MEASUREMENT.csv`;
        
        // Email with all three attachments
        this.emailDataWithAttachments(csvContent, filename, logContent, logFilename, perMeasurementContent, perMeasurementFilename);
        
        this.logActivity('DATA_EXPORTED', { 
            filename: filename, 
            logFilename: logFilename,
            perMeasurementFilename: perMeasurementFilename,
            totalRecords: this.roster.length 
        });
    }

    generateCSV(data) {
        // Header with all new columns
        let csv = 'ID,Name,Gender,Present,Completed,Source,Timestamp,Operator,Device,Comments,';
        
        // All measurement columns with adjustments, overrides, and reporting
        csv += 'Height_Shoes_Value,Height_Shoes_Unit,Height_Shoes_Adjustment,Height_Shoes_Override,Height_Shoes_Adjusted,Height_Shoes_Display,';
        csv += 'Height_No_Shoes_Value,Height_No_Shoes_Unit,Height_No_Shoes_Adjustment,Height_No_Shoes_Override,Height_No_Shoes_Adjusted,Height_No_Shoes_Display,';
        csv += 'Reach_Value,Reach_Unit,Reach_Adjustment,Reach_Override,Reach_Adjusted,Reach_Display,';
        csv += 'Wingspan_Value,Wingspan_Unit,Wingspan_Adjustment,Wingspan_Override,Wingspan_Adjusted,Wingspan_Display,';
        csv += 'Weight_Value,Weight_Unit,Weight_Adjustment,Weight_Override,Weight_Adjusted,';
        csv += 'Hand_Length_Value,Hand_Length_Unit,Hand_Length_Adjustment,Hand_Length_Override,Hand_Length_Adjusted,';
        csv += 'Hand_Width_Value,Hand_Width_Unit,Hand_Width_Adjustment,Hand_Width_Override,Hand_Width_Adjusted,';
        csv += 'Vertical_Value,Vertical_Unit,Vertical_Adjustment,Vertical_Override,Vertical_Adjusted,';
        csv += 'Approach_Value,Approach_Unit,Approach_Adjustment,Approach_Override,Approach_Adjusted,';
        csv += 'Broad_Value,Broad_Unit,Broad_Adjustment,Broad_Override,Broad_Adjusted,';
        csv += 'Vertical_For_Reporting,Approach_For_Reporting\n';

        data.roster.forEach(person => {
            const personId = person.id || person.name;
            const measurements = data.measurements[personId] || {};
            
            csv += `"${person.id || ''}","${person.name.replace(/"/g, '""')}","${person.gender}",${person.present},${person.completed},"${person.source || 'roster'}",`;
            csv += `"${measurements.timestamp || ''}","${measurements.operator || ''}","${measurements.device || ''}",`;
            csv += `"${(measurements.comments || '').replace(/"/g, '""')}",`;
            
            const measurementTypes = [
                { key: 'height_shoes', hasDisplay: true },
                { key: 'height_no_shoes', hasDisplay: true },
                { key: 'reach', hasDisplay: true },
                { key: 'wingspan', hasDisplay: true },
                { key: 'weight', hasDisplay: false },
                { key: 'hand_length', hasDisplay: false },
                { key: 'hand_width', hasDisplay: false },
                { key: 'vertical', hasDisplay: false },
                { key: 'approach', hasDisplay: false },
                { key: 'broad', hasDisplay: false }
            ];

            measurementTypes.forEach(type => {
                const measurement = measurements[type.key];
                const adjustmentValue = this.adjustments[type.key] ? this.adjustments[type.key][person.gender] || 0 : 0;
                const overrideValue = measurements[`${type.key}_override`] || 0;
                
                // Original value and unit
                if (measurement) {
                    csv += `${measurement.value},"${measurement.unit}",`;
                } else {
                    csv += ',"",';
                }
                
                // Adjustment and override
                csv += `${adjustmentValue},${overrideValue},`;
                
                // Adjusted value
                let adjustedValue = '';
                if (measurement && measurement.value) {
                    const unit = this.getMeasurementUnit(type.key);
                    const rawValueInInches = this.convertToInches(measurement.value, measurement.unit || unit);
                    adjustedValue = overrideValue !== 0 ? 
                        (rawValueInInches + overrideValue).toFixed(2) : 
                        (rawValueInInches + adjustmentValue).toFixed(2);
                }
                csv += `${adjustedValue},`;
                
                // Display version (feet/inches)
                if (type.hasDisplay) {
                    const displayValue = adjustedValue ? this.inchesToFeetAndInches(parseFloat(adjustedValue)) : '';
                    csv += `"${displayValue}",`;
                }
            });

            // Reporting columns
            const adjustedReach = this.getAdjustedMeasurementValue(measurements, 'reach', person.gender);
            const adjustedVertical = this.getAdjustedMeasurementValue(measurements, 'vertical', person.gender);
            const adjustedApproach = this.getAdjustedMeasurementValue(measurements, 'approach', person.gender);
            
            const verticalForReporting = (adjustedVertical && adjustedReach) ? (adjustedVertical - adjustedReach).toFixed(2) : '';
            const approachForReporting = (adjustedApproach && adjustedReach) ? (adjustedApproach - adjustedReach).toFixed(2) : '';
            
            csv += `${verticalForReporting},${approachForReporting}\n`;
        });

        return csv;
    }

    generateIndividualMeasurementCSV(personData, measurementData) {
        // Create CSV header with all new columns
        let csv = 'Event,Operator,Device,Save_Timestamp,ID,Name,Gender,Present,Completed,Source,Measurement_Timestamp,Comments,';
        
        // Original measurement columns
        csv += 'Height_Shoes_Value,Height_Shoes_Unit,Height_Shoes_Adjustment,Height_Shoes_Override,Height_Shoes_Adjusted,Height_Shoes_Display,';
        csv += 'Height_No_Shoes_Value,Height_No_Shoes_Unit,Height_No_Shoes_Adjustment,Height_No_Shoes_Override,Height_No_Shoes_Adjusted,Height_No_Shoes_Display,';
        csv += 'Reach_Value,Reach_Unit,Reach_Adjustment,Reach_Override,Reach_Adjusted,Reach_Display,';
        csv += 'Wingspan_Value,Wingspan_Unit,Wingspan_Adjustment,Wingspan_Override,Wingspan_Adjusted,Wingspan_Display,';
        csv += 'Weight_Value,Weight_Unit,Weight_Adjustment,Weight_Override,Weight_Adjusted,';
        csv += 'Hand_Length_Value,Hand_Length_Unit,Hand_Length_Adjustment,Hand_Length_Override,Hand_Length_Adjusted,';
        csv += 'Hand_Width_Value,Hand_Width_Unit,Hand_Width_Adjustment,Hand_Width_Override,Hand_Width_Adjusted,';
        csv += 'Vertical_Value,Vertical_Unit,Vertical_Adjustment,Vertical_Override,Vertical_Adjusted,';
        csv += 'Approach_Value,Approach_Unit,Approach_Adjustment,Approach_Override,Approach_Adjusted,';
        csv += 'Broad_Value,Broad_Unit,Broad_Adjustment,Broad_Override,Broad_Adjusted,';
        csv += 'Vertical_For_Reporting,Approach_For_Reporting\n';

        // Add the person's data row
        csv += `"${this.currentEvent}","${this.currentOperator}","${this.deviceId}","${new Date().toISOString()}",`;
        csv += `"${personData.id || ''}","${personData.name.replace(/"/g, '""')}","${personData.gender}",${personData.present},${personData.completed},"${personData.source || 'roster'}",`;
        csv += `"${measurementData.timestamp || ''}","${(measurementData.comments || '').replace(/"/g, '""')}",`;
        
        const measurementTypes = [
            { key: 'height_shoes', hasDisplay: true },
            { key: 'height_no_shoes', hasDisplay: true },
            { key: 'reach', hasDisplay: true },
            { key: 'wingspan', hasDisplay: true },
            { key: 'weight', hasDisplay: false },
            { key: 'hand_length', hasDisplay: false },
            { key: 'hand_width', hasDisplay: false },
            { key: 'vertical', hasDisplay: false },
            { key: 'approach', hasDisplay: false },
            { key: 'broad', hasDisplay: false }
        ];

        measurementTypes.forEach(type => {
            const measurement = measurementData[type.key];
            const adjustmentValue = this.adjustments[type.key] ? this.adjustments[type.key][personData.gender] || 0 : 0;
            const overrideValue = measurementData[`${type.key}_override`] || 0;
            
            // Original value and unit
            if (measurement) {
                csv += `${measurement.value},"${measurement.unit}",`;
            } else {
                csv += ',"",';
            }
            
            // Adjustment and override
            csv += `${adjustmentValue},${overrideValue},`;
            
            // Adjusted value
            let adjustedValue = '';
            if (measurement && measurement.value) {
                const unit = this.getMeasurementUnit(type.key);
                const rawValueInInches = this.convertToInches(measurement.value, measurement.unit || unit);
                adjustedValue = overrideValue !== 0 ? 
                    (rawValueInInches + overrideValue).toFixed(2) : 
                    (rawValueInInches + adjustmentValue).toFixed(2);
            }
            csv += `${adjustedValue},`;
            
            // Display version (feet/inches)
            if (type.hasDisplay) {
                const displayValue = adjustedValue ? this.inchesToFeetAndInches(parseFloat(adjustedValue)) : '';
                csv += `"${displayValue}",`;
            }
        });

        // Reporting columns
        const adjustedReach = this.getAdjustedMeasurementValue(measurementData, 'reach', personData.gender);
        const adjustedVertical = this.getAdjustedMeasurementValue(measurementData, 'vertical', personData.gender);
        const adjustedApproach = this.getAdjustedMeasurementValue(measurementData, 'approach', personData.gender);
        
        const verticalForReporting = (adjustedVertical && adjustedReach) ? (adjustedVertical - adjustedReach).toFixed(2) : '';
        const approachForReporting = (adjustedApproach && adjustedReach) ? (adjustedApproach - adjustedReach).toFixed(2) : '';
        
        csv += `${verticalForReporting},${approachForReporting}\n`;
        return csv;
    }

    generatePerMeasurementCSV(data) {
        // Header for per-measurement report
        let csv = 'Event,Operator,Device,Export_Time,ID,Name,Gender,Present,Completed,Source,';
        csv += 'Measurement_Type,Raw_Value,Unit,Adjustment,Override,Adjusted_Value,Display_Value\n';

        const measurementTypes = [
            { key: 'height_shoes', label: 'Height w/ Shoes', hasDisplay: true },
            { key: 'height_no_shoes', label: 'Height w/o Shoes', hasDisplay: true },
            { key: 'reach', label: 'Reach', hasDisplay: true },
            { key: 'wingspan', label: 'Wingspan', hasDisplay: true },
            { key: 'weight', label: 'Weight', hasDisplay: false },
            { key: 'hand_length', label: 'Hand Length', hasDisplay: false },
            { key: 'hand_width', label: 'Hand Width', hasDisplay: false },
            { key: 'vertical', label: 'Vertical', hasDisplay: false },
            { key: 'approach', label: 'Approach', hasDisplay: false },
            { key: 'broad', label: 'Broad', hasDisplay: false }
        ];

        data.roster.forEach(person => {
            const personId = person.id || person.name;
            const measurements = data.measurements[personId] || {};
            
            measurementTypes.forEach(type => {
                const measurement = measurements[type.key];
                if (measurement && measurement.value) {
                    const adjustmentValue = this.adjustments[type.key] ? this.adjustments[type.key][person.gender] || 0 : 0;
                    const overrideValue = measurements[`${type.key}_override`] || 0;
                    
                    // Calculate adjusted value
                    const unit = this.getMeasurementUnit(type.key);
                    const rawValueInInches = this.convertToInches(measurement.value, measurement.unit || unit);
                    const adjustedValue = overrideValue !== 0 ? 
                        (rawValueInInches + overrideValue).toFixed(2) : 
                        (rawValueInInches + adjustmentValue).toFixed(2);
                    
                    // Display version
                    const displayValue = type.hasDisplay ? this.inchesToFeetAndInches(parseFloat(adjustedValue)) : adjustedValue;
                    
                    csv += `"${data.event}","${data.operator}","${data.device}","${data.exportTime}",`;
                    csv += `"${person.id || ''}","${person.name.replace(/"/g, '""')}","${person.gender}",${person.present},${person.completed},"${person.source || 'roster'}",`;
                    csv += `"${type.label}","${measurement.value}","${measurement.unit || unit}",${adjustmentValue},${overrideValue},"${adjustedValue}","${displayValue}"\n`;
                }
            });
        });

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

    emailDataWithAttachments(csvContent, filename, logContent = '', logFilename = '', perMeasurementContent = '', perMeasurementFilename = '') {
        // Create file objects for attachments
        const files = [];
        
        // Main data file
        files.push(new File([csvContent], filename, { type: 'text/csv' }));
        
        // Log file if provided
        if (logContent) {
            files.push(new File([logContent], logFilename, { type: 'text/csv' }));
        }
        
        // Per-measurement file if provided
        if (perMeasurementContent) {
            files.push(new File([perMeasurementContent], perMeasurementFilename, { type: 'text/csv' }));
        }
        
        // Create email subject and body
        const subject = `Manual Entry Data - ${this.currentEvent} - ${new Date().toLocaleDateString()}`;
        const body = `Manual Entry Data Collection Results

Event: ${this.currentEvent}
Operator: ${this.currentOperator}
Export Time: ${new Date().toLocaleString()}

📊 Data Summary:
• Total Roster: ${this.roster.length} people
• Completed Measurements: ${this.roster.filter(p => p.completed).length} people
• Present at Event: ${this.roster.filter(p => p.present).length} people

The measurement data is attached as CSV files.`;

        // Try native sharing with file attachments first
        if (navigator.share && navigator.canShare && navigator.canShare({ files })) {
            const shareData = {
                title: subject,
                text: body,
                files: files
            };
            
            navigator.share(shareData)
                .then(() => {
                    this.showToast('📧 Files attached and ready to email!', 'success');
                })
                .catch((error) => {
                    if (error.name !== 'AbortError') {
                        // If native sharing fails, try alternative method
                        this.createEmailWithAttachments(subject, body, files);
                    }
                });
        } else {
            // Alternative method for email with attachments
            this.createEmailWithAttachments(subject, body, files);
        }
    }

    createEmailWithAttachments(subject, body, files) {
        // Create data URLs for the files
        const attachments = [];
        let processedFiles = 0;
        
        files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                attachments[index] = {
                    name: file.name,
                    data: e.target.result,
                    type: file.type
                };
                
                processedFiles++;
                if (processedFiles === files.length) {
                    // All files processed, create email
                    this.openEmailWithDataAttachments(subject, body, attachments);
                }
            };
            reader.readAsDataURL(file);
        });
    }

    openEmailWithDataAttachments(subject, body, attachments) {
        // Create a temporary form to handle file attachments
        const form = document.createElement('form');
        form.method = 'POST';
        form.enctype = 'multipart/form-data';
        form.style.display = 'none';
        
        // Add subject
        const subjectInput = document.createElement('input');
        subjectInput.type = 'hidden';
        subjectInput.name = 'subject';
        subjectInput.value = subject;
        form.appendChild(subjectInput);
        
        // Add body
        const bodyInput = document.createElement('input');
        bodyInput.type = 'hidden';
        bodyInput.name = 'body';
        bodyInput.value = body;
        form.appendChild(bodyInput);
        
        // Add attachments
        attachments.forEach((attachment, index) => {
            const fileInput = document
            fileInput.type = 'hidden';
            fileInput.name = `attachment_${index}`;
            fileInput.value = attachment.data;
            form.appendChild(fileInput);
            
            const nameInput = document.createElement('input');
            nameInput.type = 'hidden';
            nameInput.name = `attachment_${index}_name`;
            nameInput.value = attachment.name;
            form.appendChild(nameInput);
        });
        
        document.body.appendChild(form);
        
        // Try to use a service or direct email client integration
        if (this.tryDirectEmailIntegration(subject, body, attachments)) {
            document.body.removeChild(form);
            return;
        }
        
        // Fallback: Use mailto with embedded data (limited but works)
        const emailBody = encodeURIComponent(body + '\n\nAttached Files:\n' + 
            attachments.map(att => `• ${att.name}`).join('\n'));
        const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${emailBody}`;
        
        window.location.href = mailtoUrl;
        document.body.removeChild(form);
        
        // Also save files for manual attachment as backup
        attachments.forEach(att => {
            this.downloadFileFromDataURL(att.data, att.name);
        });
        
        this.showToast('📧 Email opened with file attachments!', 'success');
    }

    tryDirectEmailIntegration(subject, body, attachments) {
        // Try iOS Mail integration if available
        if (navigator.userAgent.includes('iPad') || navigator.userAgent.includes('iPhone')) {
            // Create mailto URL with file references
            try {
                const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                
                // Use iOS share sheet which can handle attachments
                if (window.webkit && window.webkit.messageHandlers) {
                    // Try to communicate with native iOS app if available
                    const message = {
                        action: 'email',
                        subject: subject,
                        body: body,
                        attachments: attachments
                    };
                    
                    window.webkit.messageHandlers.email.postMessage(message);
                    return true;
                }
                
                // Standard iOS email approach
                window.location.href = mailtoUrl;
                return true;
            } catch (error) {
                return false;
            }
        }
        
        return false;
    }

    downloadFileFromDataURL(dataURL, filename) {
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Keep the original method for compatibility
    emailDataWithAttachment(csvContent, filename, logContent = '', logFilename = '') {
        return this.emailDataWithAttachments(csvContent, filename, logContent, logFilename);
    }

    fallbackEmailMethod(subject, body) {
        // Open the email app
        const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
        
        try {
            window.location.href = mailtoUrl;
            this.showToast('Email opened. Files saved to Downloads folder - attach from there.', 'success');
        } catch (error) {
            console.error('Error opening email:', error);
            this.showToast('Error opening email. Files saved to Downloads folder.', 'error');
        }
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
            console.warn('Could not save backup to app storage due to storage limitations');
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
            measurementUnits: this.measurementUnits,
            adjustments: this.adjustments,
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
                
                // Load setup data
                if (state.measurementUnits) {
                    this.measurementUnits = { ...this.measurementUnits, ...state.measurementUnits };
                }
                if (state.adjustments) {
                    this.adjustments = { ...this.adjustments, ...state.adjustments };
                }
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

    showSetupScreen() {
        const operatorName = document.getElementById('operator-name').value.trim();
        const eventName = document.getElementById('event-name').value.trim();
        const hasRoster = this.roster.length > 0;
        
        // Detailed validation with specific error messages
        if (!operatorName) {
            this.showToast('Please enter the operator name first', 'warning');
            document.getElementById('operator-name').focus();
            return;
        }
        
        if (!eventName) {
            this.showToast('Please enter the event name first', 'warning');
            document.getElementById('event-name').focus();
            return;
        }
        
        if (!hasRoster) {
            this.showToast('Please upload a roster CSV file first', 'warning');
            document.getElementById('roster-upload').focus();
            return;
        }
        
        // All validations passed, proceed to setup screen
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        document.getElementById('setup-screen').classList.add('active');
        
        // Load saved settings if they exist
        this.loadSetupSettings();
        this.logActivity('SETUP_SCREEN_OPENED');
    }

    loadSetupSettings() {
        // Load measurement units
        Object.keys(this.measurementUnits).forEach(measurement => {
            const element = document.getElementById(`${measurement}-unit`);
            if (element) {
                element.value = this.measurementUnits[measurement];
            }
        });

        // Load adjustments
        Object.keys(this.adjustments).forEach(measurement => {
            ['M', 'F'].forEach(gender => {
                const element = document.getElementById(`adj-${measurement.replace('_', '-')}-${gender}`);
                if (element) {
                    element.value = this.adjustments[measurement][gender];
                }
            });
        });

        // Update unit displays in measurement form
        this.updateMeasurementUnitDisplays();
    }

    saveSetupSettings() {
        // Save measurement units
        Object.keys(this.measurementUnits).forEach(measurement => {
            const element = document.getElementById(`${measurement}-unit`);
            if (element) {
                this.measurementUnits[measurement] = element.value;
            }
        });

        // Save adjustments
        Object.keys(this.adjustments).forEach(measurement => {
            ['M', 'F'].forEach(gender => {
                const element = document.getElementById(`adj-${measurement.replace('_', '-')}-${gender}`);
                if (element) {
                    this.adjustments[measurement][gender] = parseFloat(element.value) || 0;
                }
            });
        });

        this.saveState();
        this.logActivity('SETUP_SETTINGS_SAVED', { 
            units: this.measurementUnits, 
            adjustments: this.adjustments 
        });
    }

    updateMeasurementUnitDisplays() {
        // Update unit displays in measurement form
        const unitMappings = {
            'height-unit-display': this.measurementUnits.height,
            'height-unit-display-2': this.measurementUnits.height,
            'reach-unit-display': this.measurementUnits.reach,
            'wingspan-unit-display': this.measurementUnits.wingspan,
            'vertical-unit-display': this.measurementUnits.vertical,
            'approach-unit-display': this.measurementUnits.approach,
            'broad-unit-display': this.measurementUnits.broad
        };

        Object.entries(unitMappings).forEach(([elementId, unit]) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = `(${unit})`;
            }
        });
    }

    getAdjustedMeasurementValue(measurement, measurementType, gender) {
        const data = measurement[measurementType];
        if (!data || !data.value) return null;
        
        const unit = this.getMeasurementUnit(measurementType);
        const valueInInches = this.convertToInches(data.value, data.unit || unit);
        const adjustmentValue = this.adjustments[measurementType] ? this.adjustments[measurementType][gender] || 0 : 0;
        const overrideValue = measurement[`${measurementType}_override`] || 0;
        
        const rawAdjusted = overrideValue !== 0 ? 
            valueInInches + overrideValue : 
            valueInInches + adjustmentValue;
            
        // Apply rounding based on measurement type
        return this.roundMeasurement(rawAdjusted, measurementType);
    }

    roundMeasurement(value, measurementType) {
        // Anthro measurements (height, reach, wingspan, weight, hand sizes) - round to 0.25 inch
        const anthroTypes = ['height_shoes', 'height_no_shoes', 'reach', 'wingspan', 'weight', 'hand_length', 'hand_width'];
        // Vertical and approach - round to 0.5 inch
        const jumpTypes = ['vertical', 'approach'];
        
        if (anthroTypes.includes(measurementType)) {
            return Math.round(value * 4) / 4; // Round to nearest 0.25
        } else if (jumpTypes.includes(measurementType)) {
            return Math.round(value * 2) / 2; // Round to nearest 0.5
        } else {
            return Math.round(value * 100) / 100; // Default: round to 0.01 (broad jump)
        }
    }

    getAnthrosCompletedStatus(personId) {
        const measurement = this.measurements.get(personId) || {};
        const anthroTypes = ['height_shoes', 'height_no_shoes', 'reach', 'wingspan', 'weight', 'hand_length', 'hand_width'];
        const completed = anthroTypes.filter(type => measurement[type] && measurement[type].value).length;
        return `${completed}/${anthroTypes.length}`;
    }

    getMeasuresCompletedStatus(personId) {
        const measurement = this.measurements.get(personId) || {};
        const measureTypes = ['vertical', 'approach', 'broad'];
        const completed = measureTypes.filter(type => measurement[type] && measurement[type].value).length;
        return `${completed}/${measureTypes.length}`;
    }

    // Station View Methods
    switchView() {
        const viewMode = document.getElementById('view-mode').value;
        this.currentView = viewMode;
        
        if (viewMode === 'station') {
            this.showStationView();
        } else {
            this.showAthleteView();
        }
        
        this.saveState();
    }

    showStationView() {
        document.getElementById('roster-section').classList.add('hidden');
        document.getElementById('measurement-form').classList.add('hidden');
        document.getElementById('station-view').classList.remove('hidden');
        
        // Initialize station if not set
        if (!this.currentStation) {
            this.currentStation = 'height-shoes';
            document.getElementById('station-select').value = this.currentStation;
        }
        
        this.selectStation();
        this.renderStationRoster();
        this.logActivity('STATION_VIEW_OPENED', { station: this.currentStation });
    }

    showAthleteView() {
        document.getElementById('station-view').classList.add('hidden');
        document.getElementById('roster-section').classList.remove('hidden');
        document.getElementById('view-mode').value = 'athlete';
        this.currentView = 'athlete';
        this.selectedPersonInStation = null;
        this.logActivity('ATHLETE_VIEW_OPENED');
    }

    selectStation() {
        const newStation = document.getElementById('station-select').value;
        
        // Check if there's unsaved data in current station
        if (this.currentStation && this.selectedPersonInStation && this.hasUnsavedStationData()) {
            if (!confirm(`You have unsaved data for ${this.currentStation}. Do you want to change to ${newStation} and lose this data?`)) {
                // Revert the dropdown selection
                document.getElementById('station-select').value = this.currentStation;
                return;
            }
        }
        
        this.currentStation = newStation;
        this.selectedPersonInStation = null;
        
        // Update station measurement form
        this.updateStationMeasurementForm();
        this.renderStationRoster();
        
        this.logActivity('STATION_SELECTED', { station: this.currentStation });
    }

    hasUnsavedStationData() {
        const value1 = document.getElementById('station-value-1').value.trim();
        const value2 = document.getElementById('station-value-2').value.trim();
        const override = document.getElementById('station-override').value.trim();
        
        return value1 !== '' || value2 !== '' || override !== '';
    }

    updateStationMeasurementForm() {
        const stationLabels = {
            'height-shoes': `Height with Shoes (${this.getMeasurementUnit('height')})`,
            'height-no-shoes': `Height without Shoes (${this.getMeasurementUnit('height')})`,
            'reach': `Reach (${this.getMeasurementUnit('reach')})`,
            'wingspan': `Wingspan (${this.getMeasurementUnit('wingspan')})`,
            'weight': 'Weight (lbs)',
            'hand-length': 'Hand Length (inches)',
            'hand-width': 'Hand Width (inches)',
            'vertical': `Vertical Jump (${this.getMeasurementUnit('vertical')})`,
            'approach': `Approach Jump (${this.getMeasurementUnit('approach')})`,
            'broad': `Broad Jump (${this.getMeasurementUnit('broad')})`
        };

        document.getElementById('station-measurement-label').textContent = stationLabels[this.currentStation] || '';
        
        // Clear inputs
        document.getElementById('station-value-1').value = '';
        document.getElementById('station-value-2').value = '';
        document.getElementById('station-override').value = '';
        document.getElementById('station-display-value').textContent = '';
        
        // Hide inputs until person is selected
        document.getElementById('station-measurement-inputs').classList.add('hidden');
        document.getElementById('station-person-name').textContent = 'Select a person';
    }

    renderStationRoster() {
        const container = document.getElementById('station-roster-grid');
        container.innerHTML = '';
        
        // Apply search filter
        const searchTerm = document.getElementById('station-name-filter').value.toLowerCase();
        const filteredRoster = this.roster.filter(person => 
            person.name.toLowerCase().includes(searchTerm)
        );

        // Sort roster: incomplete measurements first, then alphabetically
        filteredRoster.sort((a, b) => {
            const aHasMeasurement = this.hasMeasurement(a.id || a.name, this.currentStation);
            const bHasMeasurement = this.hasMeasurement(b.id || b.name, this.currentStation);
            
            if (aHasMeasurement !== bHasMeasurement) {
                return aHasMeasurement ? 1 : -1;
            }
            return a.name.localeCompare(b.name);
        });

        filteredRoster.forEach(person => {
            const personId = person.id || person.name;
            const hasMeasurement = this.hasMeasurement(personId, this.currentStation);
            
            const item = document.createElement('div');
            item.className = 'station-roster-item';
            if (hasMeasurement) item.classList.add('completed');
            if (this.selectedPersonInStation === personId) item.classList.add('selected');
            
            const statusClass = person.present ? 'present' : 'absent';
            const statusText = person.present ? 'Present' : 'Absent';
            
            // Include ID after name to prevent confusion with identical names
            const displayName = person.id ? `${person.name} (ID: ${person.id})` : person.name;
            
            item.innerHTML = `
                <span>${displayName}</span>
                <span class="roster-status ${statusClass}">${statusText}</span>
            `;
            
            item.addEventListener('click', () => this.selectPersonInStation(personId, person.name));
            container.appendChild(item);
        });
    }

    hasMeasurement(personId, measurementType) {
        const measurements = this.measurements.get(personId);
        if (!measurements) return false;
        
        const key = measurementType.replace('-', '_');
        return measurements[key] && measurements[key].value !== undefined && measurements[key].value !== '';
    }

    selectPersonInStation(personId, personName) {
        this.selectedPersonInStation = personId;
        
        // Update UI
        document.getElementById('station-person-name').textContent = personName;
        document.getElementById('station-measurement-inputs').classList.remove('hidden');
        
        // Load existing measurement if any
        this.loadStationMeasurement();
        
        // Re-render roster to show selection
        this.renderStationRoster();
        
        this.logActivity('STATION_PERSON_SELECTED', { 
            person: personName, 
            station: this.currentStation 
        });
    }

    loadStationMeasurement() {
        if (!this.selectedPersonInStation) return;
        
        const measurements = this.measurements.get(this.selectedPersonInStation) || {};
        const key = this.currentStation.replace('-', '_');
        const measurementData = measurements[key];
        
        if (measurementData) {
            // Load values - since they must match in our system, use the same value for both
            document.getElementById('station-value-1').value = measurementData.value || '';
            document.getElementById('station-value-2').value = measurementData.value || '';
            document.getElementById('station-override').value = measurementData.adjustmentOverride || '';
        } else {
            // Clear values if no measurement exists
            document.getElementById('station-value-1').value = '';
            document.getElementById('station-value-2').value = '';
            document.getElementById('station-override').value = '';
        }
        
        // Update display
        this.updateStationDisplay();
    }

    updateStationDisplay() {
        const value1 = parseFloat(document.getElementById('station-value-1').value);
        const value2 = parseFloat(document.getElementById('station-value-2').value);
        const override = parseFloat(document.getElementById('station-override').value) || 0;
        
        if (isNaN(value1) || isNaN(value2)) {
            document.getElementById('station-display-value').textContent = '';
            return;
        }
        
        if (Math.abs(value1 - value2) > 0.5) {
            document.getElementById('station-display-value').textContent = 'Values differ by more than 0.5';
            document.getElementById('station-display-value').style.color = 'red';
            return;
        }
        
        const person = this.roster.find(p => (p.id || p.name) === this.selectedPersonInStation);
        const gender = person ? person.gender : 'M';
        const measurementType = this.currentStation;
        
        // Calculate adjusted value
        const avgValue = (value1 + value2) / 2;
        const adjustmentValue = this.adjustments[measurementType] ? this.adjustments[measurementType][gender] || 0 : 0;
        const finalAdjustment = override !== 0 ? override : adjustmentValue;
        const adjustedValue = avgValue + finalAdjustment;
        
        // Display format
        let displayText = `Avg: ${avgValue.toFixed(2)}`;
        if (finalAdjustment !== 0) {
            displayText += ` + ${finalAdjustment.toFixed(1)} = ${adjustedValue.toFixed(2)}`;
        }
        
        // Add feet/inches display for applicable measurements
        if (['height-shoes', 'height-no-shoes', 'reach', 'wingspan'].includes(measurementType)) {
            const inInches = this.convertToInches(adjustedValue, this.getMeasurementUnit(measurementType.replace('-', '_')));
            displayText += `\n(${this.inchesToFeetAndInches(inInches)})`;
        }
        
        document.getElementById('station-display-value').textContent = displayText;
        document.getElementById('station-display-value').style.color = '#333';
    }

    saveStationMeasurement() {
        if (!this.selectedPersonInStation) return;
        
        const value1 = parseFloat(document.getElementById('station-value-1').value);
        const value2 = parseFloat(document.getElementById('station-value-2').value);
        const override = parseFloat(document.getElementById('station-override').value) || 0;
        
        if (isNaN(value1) || isNaN(value2)) {
            this.showToast('Please enter both measurement values', 'error');
            return;
        }
        
        if (Math.abs(value1 - value2) > 0.5) {
            this.showToast('Values differ by more than 0.5 - please verify', 'warning');
            return;
        }
        
        // Save the measurement using existing logic
        this.saveIndividualMeasurement(this.currentStation);
        
        // Clear form and move to next person
        this.clearStationForm();
        this.moveToNextPerson();
        
        this.showToast('Measurement saved successfully!', 'success');
    }

    clearStationForm() {
        document.getElementById('station-value-1').value = '';
        document.getElementById('station-value-2').value = '';
        document.getElementById('station-override').value = '';
        document.getElementById('station-display-value').textContent = '';
    }

    moveToNextPerson() {
        // Find next person without this measurement
        const currentIndex = this.roster.findIndex(p => (p.id || p.name) === this.selectedPersonInStation);
        
        for (let i = 1; i < this.roster.length; i++) {
            const nextIndex = (currentIndex + i) % this.roster.length;
            const nextPerson = this.roster[nextIndex];
            const nextPersonId = nextPerson.id || nextPerson.name;
            
            if (!this.hasMeasurement(nextPersonId, this.currentStation)) {
                this.selectPersonInStation(nextPersonId, nextPerson.name);
                return;
            }
        }
        
        // If all have measurements, just select the next person
        if (this.roster.length > 1) {
            const nextIndex = (currentIndex + 1) % this.roster.length;
            const nextPerson = this.roster[nextIndex];
            this.selectPersonInStation(nextPerson.id || nextPerson.name, nextPerson.name);
        }
    }

    filterStationRoster() {
        this.renderStationRoster();
    }

    // Override saveIndividualMeasurement to work with station inputs
    saveIndividualMeasurement(measurementType) {
        let personId, value1, value2, override;
        
        if (this.currentView === 'station' && this.selectedPersonInStation) {
            // Station view inputs
            personId = this.selectedPersonInStation;
            value1 = parseFloat(document.getElementById('station-value-1').value);
            value2 = parseFloat(document.getElementById('station-value-2').value);
            override = parseFloat(document.getElementById('station-override').value) || 0;
        } else {
            // Athlete view inputs
            personId = this.currentPersonId;
            value1 = parseFloat(document.getElementById(`${measurementType}-1`).value);
            value2 = parseFloat(document.getElementById(`${measurementType}-2`).value);
            override = parseFloat(document.getElementById(`${measurementType}-override`).value) || 0;
        }
        
        if (!personId) {
            this.showToast('No person selected', 'error');
            return;
        }
        
        const person = this.roster.find(p => (p.id || p.name) === personId);
        if (!person) {
            this.showToast('Person not found', 'error');
            return;
        }
        
        // Validation
        if (isNaN(value1) || isNaN(value2)) {
            this.showToast('Please enter both measurement values', 'error');
            return;
        }
        
        if (Math.abs(value1 - value2) >= 0.01) {
            this.showToast(`${measurementType.replace('-', ' ')} values do not match`, 'error');
            return;
        }
        
        // Get unit from setup settings
        const unit = this.getMeasurementUnit(measurementType);
        
        // Get or create measurement data using same format as original method
        let measurementData = this.measurements.get(personId) || {
            timestamp: new Date().toISOString(),
            operator: this.currentOperator,
            device: this.deviceId,
            comments: this.currentView === 'station' ? '' : (document.getElementById('comments').value || '')
        };

        // Calculate adjustments
        const key = measurementType.replace('-', '_');
        const baseAdjustment = this.adjustments[key] ? this.adjustments[key][person.gender] || 0 : 0;
        const finalAdjustment = override !== 0 ? override : baseAdjustment;
        const adjustedValue = value1 + finalAdjustment;

        // Update the specific measurement using same format as original
        measurementData[key] = {
            value: value1,
            unit: unit,
            adjustment: baseAdjustment,
            adjustmentOverride: override,
            adjustedValue: adjustedValue
        };

        // Update measurements and person status
        this.measurements.set(personId, measurementData);
        
        // No longer setting person.completed - allowing re-entry

        // Update display
        if (this.currentView === 'station') {
            this.updateStationDisplay();
            this.renderStationRoster();
        } else {
            this.renderRoster();
        }
        
        // Save state and log activity
        this.saveState();
        this.logActivity('MEASUREMENT_SAVED', {
            person: person.name,
            measurement: measurementType,
            value1: value1,
            value2: value1, // Since they must match
            override: override,
            adjusted: adjustedValue,
            view: this.currentView
        });
        
        this.showToast(`${measurementType.replace('-', ' ')} saved!`, 'success');
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