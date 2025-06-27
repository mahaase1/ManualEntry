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
        
        // Bind 10-key trigger buttons
        this.bind10KeyTriggers();
    }

    bind10KeyTriggers() {
        // Bind 10-key triggers for athlete view
        document.querySelectorAll('.tenkey-trigger-btn[data-measurement]').forEach(button => {
            button.addEventListener('click', (e) => {
                const measurement = e.target.getAttribute('data-measurement');
                this.open10Key(measurement, 'athlete');
            });
        });

        // Bind 10-key trigger for station view
        document.getElementById('station-tenkey-btn').addEventListener('click', () => {
            const currentMeasurement = this.currentStationMeasurement;
            if (currentMeasurement) {
                this.open10Key(currentMeasurement, 'station');
            }
        });

        // Bind 10-key modal controls
        this.bind10KeyControls();
    }

    bind10KeyControls() {
        const modal = document.getElementById('tenkey-modal');
        const displayInput = document.getElementById('tenkey-display-input');
        const statusSpan = document.getElementById('tenkey-entry-status');
        const fieldLabel = document.getElementById('tenkey-field-label');
        const confirmLabel = document.getElementById('tenkey-confirm-label');
        const saveBtn = document.getElementById('tenkey-save');
        
        // Number buttons
        document.querySelectorAll('.tenkey-number').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const number = e.target.getAttribute('data-number');
                this.handle10KeyInput(number);
            });
        });

        // Action buttons
        document.querySelectorAll('.tenkey-btn[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.getAttribute('data-action');
                this.handle10KeyAction(action);
            });
        });

        // Control buttons
        document.getElementById('tenkey-close').addEventListener('click', () => this.close10Key());
        document.getElementById('tenkey-cancel').addEventListener('click', () => this.close10Key());
        document.getElementById('tenkey-save').addEventListener('click', () => this.save10KeyMeasurement());

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (!modal.classList.contains('hidden')) {
                this.handle10KeyKeyboard(e);
            }
        });
    }

    open10Key(measurement, mode) {
        this.tenKeyState = {
            measurement: measurement,
            mode: mode,
            currentValue: '',
            firstEntry: '',
            secondEntry: '',
            stage: 'first', // 'first', 'second', 'complete'
            isActive: true
        };

        // Set title and labels
        const measurementLabels = {
            'height-shoes': 'Height with Shoes',
            'height-no-shoes': 'Height without Shoes',
            'reach': 'Reach',
            'wingspan': 'Wingspan',
            'weight': 'Weight',
            'hand-length': 'Hand Length',
            'hand-width': 'Hand Width',
            'vertical': 'Vertical Jump',
            'approach': 'Approach Jump',
            'broad': 'Broad Jump'
        };

        document.getElementById('tenkey-title').textContent = measurementLabels[measurement] || 'Enter Measurement';
        document.getElementById('tenkey-display-input').value = '';
        document.getElementById('tenkey-entry-status').textContent = 'Enter first value';
        document.getElementById('tenkey-field-label').classList.remove('hidden');
        document.getElementById('tenkey-confirm-label').classList.add('hidden');
        document.getElementById('tenkey-save').classList.add('hidden');

        // Show modal
        document.getElementById('tenkey-modal').classList.remove('hidden');
    }

    close10Key() {
        document.getElementById('tenkey-modal').classList.add('hidden');
        this.tenKeyState = null;
    }

    handle10KeyInput(digit) {
        if (!this.tenKeyState || !this.tenKeyState.isActive) return;

        const currentValue = this.tenKeyState.currentValue + digit;
        this.tenKeyState.currentValue = currentValue;
        document.getElementById('tenkey-display-input').value = currentValue;
    }

    handle10KeyAction(action) {
        if (!this.tenKeyState || !this.tenKeyState.isActive) return;

        const displayInput = document.getElementById('tenkey-display-input');
        const statusSpan = document.getElementById('tenkey-entry-status');
        const fieldLabel = document.getElementById('tenkey-field-label');
        const confirmLabel = document.getElementById('tenkey-confirm-label');
        const saveBtn = document.getElementById('tenkey-save');

        switch (action) {
            case 'clear':
                this.tenKeyState.currentValue = '';
                displayInput.value = '';
                break;

            case 'backspace':
                this.tenKeyState.currentValue = this.tenKeyState.currentValue.slice(0, -1);
                displayInput.value = this.tenKeyState.currentValue;
                break;

            case 'decimal':
                if (!this.tenKeyState.currentValue.includes('.')) {
                    this.tenKeyState.currentValue += '.';
                    displayInput.value = this.tenKeyState.currentValue;
                }
                break;

            case 'enter':
                this.handle10KeyEnter();
                break;
        }
    }

    handle10KeyEnter() {
        if (!this.tenKeyState || !this.tenKeyState.isActive) return;

        const currentValue = this.tenKeyState.currentValue.trim();
        if (!currentValue || isNaN(parseFloat(currentValue))) {
            this.showToast('Please enter a valid number', 'warning');
            return;
        }

        const displayInput = document.getElementById('tenkey-display-input');
        const statusSpan = document.getElementById('tenkey-entry-status');
        const fieldLabel = document.getElementById('tenkey-field-label');
        const confirmLabel = document.getElementById('tenkey-confirm-label');
        const saveBtn = document.getElementById('tenkey-save');

        if (this.tenKeyState.stage === 'first') {
            // Store first entry and prepare for second
            this.tenKeyState.firstEntry = currentValue;
            this.tenKeyState.currentValue = '';
            this.tenKeyState.stage = 'second';

            displayInput.value = '';
            statusSpan.textContent = 'Confirm the value';
            fieldLabel.classList.add('hidden');
            confirmLabel.classList.remove('hidden');

        } else if (this.tenKeyState.stage === 'second') {
            // Check if entries match
            this.tenKeyState.secondEntry = currentValue;

            if (this.tenKeyState.firstEntry === this.tenKeyState.secondEntry) {
                // Values match - ready to save
                this.tenKeyState.stage = 'complete';
                statusSpan.textContent = 'Values match! Ready to save.';
                statusSpan.style.color = '#4caf50';
                saveBtn.classList.remove('hidden');
                displayInput.style.borderColor = '#4caf50';

            } else {
                // Values don't match - start over
                this.showToast('Values do not match. Please try again.', 'warning');
                this.tenKeyState.firstEntry = '';
                this.tenKeyState.secondEntry = '';
                this.tenKeyState.currentValue = '';
                this.tenKeyState.stage = 'first';

                displayInput.value = '';
                displayInput.style.borderColor = '#ddd';
                statusSpan.textContent = 'Enter first value';
                statusSpan.style.color = '#666';
                fieldLabel.classList.remove('hidden');
                confirmLabel.classList.add('hidden');
                saveBtn.classList.add('hidden');
            }
        }
    }

    save10KeyMeasurement() {
        if (!this.tenKeyState || this.tenKeyState.stage !== 'complete') return;

        const measurement = this.tenKeyState.measurement;
        const value = parseFloat(this.tenKeyState.firstEntry);
        const mode = this.tenKeyState.mode;

        if (mode === 'athlete') {
            // Update athlete view inputs
            document.getElementById(`${measurement}-1`).value = value;
            document.getElementById(`${measurement}-2`).value = value;
            
            // Trigger save automatically
            const saveBtn = document.querySelector(`[data-measurement="${measurement}"]`);
            if (saveBtn && saveBtn.classList.contains('measurement-save-btn')) {
                saveBtn.click();
            }

        } else if (mode === 'station') {
            // Update station view inputs
            document.getElementById('station-value-1').value = value;
            document.getElementById('station-value-2').value = value;
            
            // Trigger save automatically
            document.getElementById('station-save-btn').click();
        }

        this.close10Key();
        this.showToast(`${this.tenKeyState.measurement.replace('-', ' ')} saved successfully!`, 'success');
    }

    handle10KeyKeyboard(e) {
        if (!this.tenKeyState || !this.tenKeyState.isActive) return;

        // Prevent default for keys we handle
        const handledKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', 'Enter', 'Backspace', 'Delete', 'Escape'];
        if (handledKeys.includes(e.key)) {
            e.preventDefault();
        }

        // Handle number keys
        if (e.key >= '0' && e.key <= '9') {
            this.handle10KeyInput(e.key);
        } 
        // Handle decimal
        else if (e.key === '.') {
            this.handle10KeyAction('decimal');
        }
        // Handle enter
        else if (e.key === 'Enter') {
            this.handle10KeyEnter();
        }
        // Handle backspace/delete
        else if (e.key === 'Backspace' || e.key === 'Delete') {
            this.handle10KeyAction('backspace');
        }
        // Handle escape
        else if (e.key === 'Escape') {
            this.close10Key();
        }
    }

    // Station Mode Methods
    selectStation(event) {
        const stationSelect = event.target;
        this.currentStation = stationSelect.value;
        this.currentStationMeasurement = stationSelect.value; // Set for 10-key
        
        if (this.currentStation) {
            document.getElementById('station-measurement-label').textContent = 
                stationSelect.options[stationSelect.selectedIndex].text;
            
            // Show measurement inputs if person is selected
            if (this.selectedPersonInStation) {
                document.getElementById('station-measurement-inputs').classList.remove('hidden');
                this.loadStationMeasurement();
            }
        } else {
            document.getElementById('station-measurement-inputs').classList.add('hidden');
        }
        
        this.logActivity('STATION_SELECTED', { station: this.currentStation });
    }

    filterStationRoster(event) {
        const filter = event.target.value.toLowerCase();
        const grid = document.getElementById('station-roster-grid');
        
        if (!grid) return;
        
        grid.querySelectorAll('.station-person-card').forEach(card => {
            const name = card.querySelector('.person-name').textContent.toLowerCase();
            const number = card.querySelector('.person-number').textContent.toLowerCase();
            
            if (name.includes(filter) || number.includes(filter)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    saveStationMeasurement() {
        if (!this.selectedPersonInStation || !this.currentStation) {
            this.showToast('Please select a person and station', 'error');
            return;
        }

        const value1 = parseFloat(document.getElementById('station-value-1').value);
        const value2 = parseFloat(document.getElementById('station-value-2').value);
        const override = parseFloat(document.getElementById('station-override').value) || 0;

        if (isNaN(value1) || isNaN(value2)) {
            this.showToast('Please enter valid measurements', 'error');
            return;
        }

        if (Math.abs(value1 - value2) > 1) {
            this.showToast('Measurements differ by more than 1 unit', 'error');
            return;
        }

        const average = (value1 + value2) / 2;
        const finalValue = average + override;

        // Save measurement
        const measurementKey = `${this.selectedPersonInStation.id}_${this.currentStation}`;
        this.measurements.set(measurementKey, {
            personId: this.selectedPersonInStation.id,
            measurement: this.currentStation,
            value1: value1,
            value2: value2,
            average: average,
            adjustment: override,
            finalValue: finalValue,
            timestamp: new Date().toISOString(),
            operator: this.currentOperator,
            event: this.currentEvent,
            device: this.deviceId
        });

        // Clear inputs
        document.getElementById('station-value-1').value = '';
        document.getElementById('station-value-2').value = '';
        document.getElementById('station-override').value = '';
        document.getElementById('station-display-value').textContent = '';

        // Update display
        this.updateStationPersonCard(this.selectedPersonInStation);
        
        this.logActivity('MEASUREMENT_SAVED', {
            personId: this.selectedPersonInStation.id,
            measurement: this.currentStation,
            value: finalValue
        });

        this.showToast(`${this.currentStation.replace('-', ' ')} saved successfully!`, 'success');
        this.saveState();
    }

    updateStationDisplay() {
        const value1 = parseFloat(document.getElementById('station-value-1').value);
        const value2 = parseFloat(document.getElementById('station-value-2').value);
        const override = parseFloat(document.getElementById('station-override').value) || 0;

        if (!isNaN(value1) && !isNaN(value2)) {
            const average = (value1 + value2) / 2;
            const finalValue = average + override;
            const unit = this.measurementUnits[this.currentStation] || '';
            
            document.getElementById('station-display-value').textContent = 
                `Average: ${average.toFixed(2)} + ${override.toFixed(2)} = ${finalValue.toFixed(2)} ${unit}`;
        } else {
            document.getElementById('station-display-value').textContent = '';
        }
    }

    loadStationMeasurement() {
        if (!this.selectedPersonInStation || !this.currentStation) return;

        const measurementKey = `${this.selectedPersonInStation.id}_${this.currentStation}`;
        const measurement = this.measurements.get(measurementKey);

        if (measurement) {
            document.getElementById('station-value-1').value = measurement.value1;
            document.getElementById('station-value-2').value = measurement.value2;
            document.getElementById('station-override').value = measurement.adjustment || 0;
            this.updateStationDisplay();
        } else {
            // Clear inputs for new measurement
            document.getElementById('station-value-1').value = '';
            document.getElementById('station-value-2').value = '';
            document.getElementById('station-override').value = '';
            document.getElementById('station-display-value').textContent = '';
        }
    }

    updateStationPersonCard(person) {
        // Update the visual indicator on the person card to show measurement status
        const card = document.querySelector(`[data-person-id="${person.id}"]`);
        if (card && this.currentStation) {
            const measurementKey = `${person.id}_${this.currentStation}`;
            const hasMeasurement = this.measurements.has(measurementKey);
            
            if (hasMeasurement) {
                card.classList.add('has-measurement');
            } else {
                card.classList.remove('has-measurement');
            }
        }
    }

    // Station Roster Methods
    renderStationRoster() {
        const grid = document.getElementById('station-roster-grid');
        if (!grid) return;

        grid.innerHTML = '';

        this.roster.forEach(person => {
            const card = document.createElement('div');
            card.className = 'station_person-card';
            card.setAttribute('data-person-id', person.id);
            
            card.innerHTML = `
                <div class="person-name">${person.last_name}, ${person.first_name}</div>
                <div class="person-number">#${person.number || 'N/A'}</div>
                <div class="person-details">${person.position || ''} | ${person.class || ''}</div>
            `;

            card.addEventListener('click', () => this.selectStationPerson(person));
            grid.appendChild(card);

            // Update measurement status if station is selected
            if (this.currentStation) {
                this.updateStationPersonCard(person);
            }
        });
    }

    selectStationPerson(person) {
        // Clear previous selection
        document.querySelectorAll('.station-person-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Select new person
        this.selectedPersonInStation = person;
        const card = document.querySelector(`[data-person-id="${person.id}"]`);
        if (card) {
            card.classList.add('selected');
        }

        // Update UI
        document.getElementById('station-person-name').textContent = `${person.first_name} ${person.last_name}`;

        // Show measurement inputs if station is selected
        if (this.currentStation) {
            document.getElementById('station-measurement-inputs').classList.remove('hidden');
            this.loadStationMeasurement();
        }

        this.logActivity('STATION_PERSON_SELECTED', { personId: person.id });
    }

    // View switching methods
    showStationView() {
        this.currentView = 'station';
        document.getElementById('athlete-view').classList.add('hidden');
        document.getElementById('station-view').classList.remove('hidden');
        
        // Render roster for station view
        this.renderStationRoster();
        
        this.logActivity('STATION_VIEW_OPENED');
    }

    showAthleteView() {
        this.currentView = 'athlete';
        document.getElementById('station-view').classList.add('hidden');
        document.getElementById('athlete-view').classList.remove('hidden');
        
        this.logActivity('ATHLETE_VIEW_OPENED');
    }

    switchView(event) {
        const selectedView = event.target.value;
        
        if (selectedView === 'station') {
            this.showStationView();
        } else {
            this.showAthleteView();
        }
    }
}