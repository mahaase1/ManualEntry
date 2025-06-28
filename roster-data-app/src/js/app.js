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
        
        // Bind setup screen inputs for auto-save
        this.bindSetupInputs();
    }

    bindSetupInputs() {
        // Unit selection auto-save
        document.querySelectorAll('#setup-screen select').forEach(select => {
            select.addEventListener('change', () => {
                this.saveSetupValues();
            });
        });

        // Adjustment inputs auto-save (debounced)
        let saveTimeout;
        document.querySelectorAll('#adjustments-table input').forEach(input => {
            input.addEventListener('input', () => {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    this.saveSetupValues();
                }, 1000);
            });
        });
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
            const selectedOption = stationSelect.options[stationSelect.selectedIndex];
            document.getElementById('station-measurement-label').textContent = selectedOption.text;
            
            // Show measurement inputs when station is selected (regardless of person selection)
            const inputsElement = document.getElementById('station-measurement-inputs');
            if (inputsElement) {
                inputsElement.classList.remove('hidden');
                
                // Update label based on person selection
                if (this.selectedPersonInStation) {
                    document.getElementById('station-measurement-label').textContent = 
                        `${selectedOption.text} for ${this.selectedPersonInStation.name}`;
                    this.loadStationMeasurement();
                } else {
                    document.getElementById('station-measurement-label').textContent = 
                        `${selectedOption.text} - Select a person`;
                }
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
            card.className = 'station-person-card';
            const personId = person.id || person.name;
            card.setAttribute('data-person-id', personId);
            
            card.innerHTML = `
                <div class="person-name">${person.name || 'Unknown'}</div>
                <div class="person-number">ID: ${person.id || 'N/A'}</div>
                <div class="person-details">${[person.position, person.class].filter(x => x).join(' | ') || 'No details'}</div>
            `;

            card.addEventListener('click', () => {
                console.log('Station card clicked:', person); // Debug
                this.selectStationPerson(person);
            });
            grid.appendChild(card);

            // Update measurement status if station is selected
            if (this.currentStation) {
                this.updateStationPersonCard(person);
            }
        });
    }

    selectStationPerson(person) {
        console.log('Station person selected:', person); // Debug
        
        // Clear previous selection
        document.querySelectorAll('.station-person-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Select new person
        this.selectedPersonInStation = person;
        const card = document.querySelector(`[data-person-id="${person.id || person.name}"]`);
        if (card) {
            card.classList.add('selected');
            console.log('Card selected:', card); // Debug
        } else {
            console.log('Card not found for:', person.id || person.name); // Debug
        }

        // Update UI
        const nameElement = document.getElementById('station-person-name');
        if (nameElement) {
            nameElement.textContent = person.name || 'Unknown';
            console.log('Updated person name display'); // Debug
        } else {
            console.log('station-person-name element not found'); // Debug
        }

        // Show measurement inputs when person is selected (regardless of station selection)
        const inputsElement = document.getElementById('station-measurement-inputs');
        if (inputsElement) {
            inputsElement.classList.remove('hidden');
            console.log('Showed measurement inputs'); // Debug
            
            // Update the measurement label
            if (this.currentStation) {
                const stationSelect = document.getElementById('station-select');
                const selectedOption = stationSelect.options[stationSelect.selectedIndex];
                document.getElementById('station-measurement-label').textContent = 
                    `${selectedOption.text} for ${person.name}`;
                this.loadStationMeasurement();
            } else {
                document.getElementById('station-measurement-label').textContent = 
                    `Select a station to enter measurements for ${person.name}`;
            }
        } else {
            console.log('station-measurement-inputs element not found'); // Debug
        }

        this.logActivity('STATION_PERSON_SELECTED', { personId: person.id });
    }

    // View switching methods
    showStationView() {
        this.currentView = 'station';
        // Hide athlete/roster sections
        document.getElementById('roster-section').classList.add('hidden');
        document.getElementById('measurement-form').classList.add('hidden');
        // Show station view
        document.getElementById('station-view').classList.remove('hidden');
        
        // Render roster for station view
        this.renderStationRoster();
        
        this.logActivity('STATION_VIEW_OPENED');
    }

    showAthleteView() {
        this.currentView = 'athlete';
        // Hide station view
        document.getElementById('station-view').classList.add('hidden');
        // Show athlete sections
        document.getElementById('roster-section').classList.remove('hidden');
        
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

    // Setup Screen Methods
    showMeasurementSetup() {
        this.showSetupScreen();
    }

    showSetupScreen() {
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        document.getElementById('setup-screen').classList.add('active');
        
        // Load current settings
        this.loadSetupValues();
        
        this.logActivity('SETUP_SCREEN_OPENED');
    }

    loadSetupValues() {
        // Load units
        Object.keys(this.measurementUnits).forEach(measurement => {
            const unitSelect = document.getElementById(`${measurement}-unit`);
            if (unitSelect) {
                unitSelect.value = this.measurementUnits[measurement];
            }
        });

        // Load adjustments
        Object.keys(this.adjustments).forEach(measurement => {
            ['M', 'F'].forEach(gender => {
                const input = document.getElementById(`adj-${measurement.replace('_', '-')}-${gender}`);
                if (input) {
                    input.value = this.adjustments[measurement][gender];
                }
            });
        });
    }

    saveSetupValues() {
        // Save units
        Object.keys(this.measurementUnits).forEach(measurement => {
            const unitSelect = document.getElementById(`${measurement}-unit`);
            if (unitSelect) {
                this.measurementUnits[measurement] = unitSelect.value;
            }
        });

        // Save adjustments
        Object.keys(this.adjustments).forEach(measurement => {
            ['M', 'F'].forEach(gender => {
                const input = document.getElementById(`adj-${measurement.replace('_', '-')}-${gender}`);
                if (input) {
                    this.adjustments[measurement][gender] = parseFloat(input.value) || 0;
                }
            });
        });

        // Save to localStorage
        this.saveState();
        
        this.logActivity('SETUP_VALUES_SAVED');
        this.showToast('Setup saved successfully!', 'success');
    }

    startEvent() {
        // Save setup values first
        this.saveSetupValues();
        
        // Get startup form values
        const operatorName = document.getElementById('operator-name').value;
        const eventName = document.getElementById('event-name').value;
        const locationElement = document.getElementById('location');
        const dateElement = document.getElementById('event-date');
        const location = locationElement ? locationElement.value : '';
        const date = dateElement ? dateElement.value : '';
        
        if (!operatorName || !eventName) {
            this.showToast('Please fill in operator name and event name', 'error');
            return;
        }

        // Set current values
        this.currentOperator = operatorName;
        this.currentEvent = eventName;
        
        // Update event title display
        document.getElementById('event-title').textContent = 
            `${eventName} - ${operatorName}${location ? ` @ ${location}` : ''}`;

        // Show main screen
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        document.getElementById('main-screen').classList.add('active');
        
        // Show roster view initially
        this.showRosterView();
        
        this.logActivity('EVENT_STARTED', {
            event: eventName,
            operator: operatorName,
            location: location,
            date: date
        });
        
        this.saveState();
    }

    showRosterView() {
        // Hide other sections
        document.getElementById('spreadsheet-view').classList.add('hidden');
        document.getElementById('checkin-section').classList.add('hidden');
        document.getElementById('measurement-form').classList.add('hidden');
        
        // Show roster section
        document.getElementById('roster-section').classList.remove('hidden');
        
        // Render roster
        this.renderRoster();
        
        this.logActivity('ROSTER_VIEW_OPENED');
    }

    renderRoster() {
        const rosterGrid = document.getElementById('roster-grid');
        if (!rosterGrid) {
            console.error('Roster grid not found');
            return;
        }

        // Clear existing roster
        rosterGrid.innerHTML = '';

        if (this.roster.length === 0) {
            rosterGrid.innerHTML = '<p class="no-data">No roster uploaded. Please upload a CSV file to get started.</p>';
            return;
        }

        // Render each person in the roster
        this.roster.forEach(person => {
            const personCard = document.createElement('div');
            personCard.className = 'roster-item';
            personCard.setAttribute('data-person-id', person.id || person.name);

            // Add status classes
            if (person.present) {
                personCard.classList.add('present');
            }
            if (person.completed) {
                personCard.classList.add('completed');
            }

            // Create card content
            const personId = person.id || person.name;
            const measurements = this.measurements.get(personId);
            const anthrosComplete = this.getAnthrosCompletedCount(personId);
            const measuresComplete = this.getMeasuresCompletedCount(personId);
            
            personCard.innerHTML = `
                <h4>${person.name || 'Unknown'}</h4>
                <p><strong>ID:</strong> ${person.id || 'N/A'}</p>
                <p><strong>Gender:</strong> ${person.gender || 'N/A'}</p>
                <p><strong>Number:</strong> ${person.number || 'N/A'}</p>
                <p class="status ${person.present ? 'present' : ''}">${person.present ? 'Present' : 'Not checked in'}</p>
                <p class="completion-status">Anthros: ${anthrosComplete}/4, Measures: ${measuresComplete}/3</p>
            `;

            // Add click event to open measurement form
            personCard.addEventListener('click', () => {
                this.selectPersonForMeasurement(person);
            });

            rosterGrid.appendChild(personCard);
        });
    }

    selectPersonForMeasurement(person) {
        this.currentPersonId = person.id || person.name;
        
        // Hide roster section and show measurement form
        document.getElementById('roster-section').classList.add('hidden');
        document.getElementById('measurement-form').classList.remove('hidden');
        
        // Update measurement form header
        const header = document.querySelector('#measurement-form h3');
        if (header) {
            header.textContent = `Measurements for ${person.name}`;
        }
        
        // Load existing measurements if any
        this.loadPersonMeasurements(person);
        
        // Rebind measurement save buttons now that the form is visible
        this.bindIndividualSaveButtons();
        
        this.logActivity('PERSON_SELECTED', { personId: this.currentPersonId });
    }

    loadPersonMeasurements(person) {
        const personId = person.id || person.name;
        const measurements = this.measurements.get(personId);
        
        if (measurements) {
            // Load existing measurements into form inputs
            Object.keys(measurements).forEach(key => {
                if (key !== 'timestamp' && key !== 'operator' && key !== 'device' && key !== 'comments') {
                    const measurement = measurements[key];
                    if (measurement && typeof measurement === 'object' && measurement.value) {
                        const input1 = document.getElementById(`${key}-1`);
                        const input2 = document.getElementById(`${key}-2`);
                        if (input1) input1.value = measurement.value;
                        if (input2) input2.value = measurement.value;
                    }
                }
            });
            
            // Load comments
            const commentsField = document.getElementById('comments');
            if (commentsField && measurements.comments) {
                commentsField.value = measurements.comments;
            }
        }
    }

    getAnthrosCompletedCount(personId) {
        const measurements = this.measurements.get(personId);
        if (!measurements) return 0;
        
        const anthroTypes = ['height_shoes', 'height_no_shoes', 'reach', 'wingspan'];
        return anthroTypes.filter(type => measurements[type] && measurements[type].value).length;
    }

    getMeasuresCompletedCount(personId) {
        const measurements = this.measurements.get(personId);
        if (!measurements) return 0;
        
        const measureTypes = ['vertical', 'approach', 'broad'];
        return measureTypes.filter(type => measurements[type] && measurements[type].value).length;
    }

    getAnthrosCompletedStatus(personId) {
        const count = this.getAnthrosCompletedCount(personId);
        const status = count === 4 ? 'completed' : 'incomplete';
        return `<span class="${status}">${count}/4</span>`;
    }

    getMeasuresCompletedStatus(personId) {
        const count = this.getMeasuresCompletedCount(personId);
        const status = count === 3 ? 'completed' : 'incomplete';
        return `<span class="${status}">${count}/3</span>`;
    }

    validateStartup() {
        const operatorName = document.getElementById('operator-name').value.trim();
        const eventName = document.getElementById('event-name').value.trim();
        const rosterFile = document.getElementById('roster-upload').files.length > 0;
        
        const setupButton = document.getElementById('setup-measurements');
        if (setupButton) {
            setupButton.disabled = !(operatorName && eventName && rosterFile);
        }
    }

    handleRosterUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.csv')) {
            this.showToast('Please select a CSV file', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csv = e.target.result;
                this.parseRosterCSV(csv);
                this.validateStartup();
                this.showToast('Roster uploaded successfully!', 'success');
            } catch (error) {
                console.error('Error parsing CSV:', error);
                this.showToast('Error parsing CSV file. Please check the format.', 'error');
            }
        };
        reader.readAsText(file);
    }

    parseRosterCSV(csvText) {
        const lines = csvText.trim().split('\n');
        this.roster = [];
        
        lines.forEach((line, index) => {
            if (line.trim()) {
                const parts = line.split(',').map(part => part.trim());
                if (parts.length >= 3) {
                    const person = {
                        id: parts[0],
                        name: parts[1],
                        gender: parts[2],
                        number: parts[3] || '',
                        position: parts[4] || '',
                        class: parts[5] || '',
                        present: false,
                        completed: false,
                        source: 'roster'
                    };
                    this.roster.push(person);
                }
            }
        });
        
        this.logActivity('ROSTER_UPLOADED', { count: this.roster.length });
        this.saveState();
    }

    showToast(message, type = 'info') {
        // Remove existing toasts
        document.querySelectorAll('.toast').forEach(toast => toast.remove());
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }

    saveState() {
        const state = {
            currentOperator: this.currentOperator,
            currentEvent: this.currentEvent,
            roster: this.roster,
            measurements: Array.from(this.measurements.entries()),
            measurementUnits: this.measurementUnits,
            adjustments: this.adjustments,
            activityLog: this.activityLog
        };
        localStorage.setItem('manualEntryAppState', JSON.stringify(state));
    }

    loadState() {
        try {
            const saved = localStorage.getItem('manualEntryAppState');
            if (saved) {
                const state = JSON.parse(saved);
                this.currentOperator = state.currentOperator || '';
                this.currentEvent = state.currentEvent || '';
                this.roster = state.roster || [];
                this.measurements = new Map(state.measurements || []);
                this.measurementUnits = state.measurementUnits || this.measurementUnits;
                this.adjustments = state.adjustments || this.adjustments;
                this.activityLog = state.activityLog || [];
            }
        } catch (error) {
            console.error('Error loading state:', error);
        }
    }

    restoreSession() {
        // If we have operator and event, we can show main screen
        if (this.currentOperator && this.currentEvent) {
            document.getElementById('event-title').textContent = 
                `${this.currentEvent} - ${this.currentOperator}`;
            document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
            document.getElementById('main-screen').classList.add('active');
            this.showRosterView();
        }
    }

    // Additional missing methods
    bindMeasurementValidation() {
        // Add measurement validation logic here if needed
        // This method is called in bindEvents but was missing
    }

    bindIndividualSaveButtons() {
        // Remove existing listeners first to avoid duplicates
        document.querySelectorAll('.measurement-save-btn').forEach(button => {
            button.removeEventListener('click', button._saveHandler);
        });
        
        // Bind individual measurement save buttons
        document.querySelectorAll('.measurement-save-btn').forEach(button => {
            const handler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const measurement = button.getAttribute('data-measurement');
                console.log('Save button clicked for:', measurement); // Debug
                this.saveSingleMeasurement(measurement);
            };
            button._saveHandler = handler;
            button.addEventListener('click', handler);
        });
        
        console.log('Bound', document.querySelectorAll('.measurement-save-btn').length, 'save buttons'); // Debug
    }

    saveSingleMeasurement(measurementType) {
        console.log('saveSingleMeasurement called for:', measurementType, 'currentPersonId:', this.currentPersonId); // Debug
        
        if (!this.currentPersonId) {
            this.showToast('Please select a person first', 'error');
            return;
        }

        const input1 = document.getElementById(`${measurementType}-1`);
        const input2 = document.getElementById(`${measurementType}-2`);
        const overrideInput = document.getElementById(`${measurementType}-override`);
        
        console.log('Input elements found:', input1 ? 'yes' : 'no', input2 ? 'yes' : 'no', overrideInput ? 'yes' : 'no'); // Debug
        
        if (!input1 || !input2) {
            this.showToast('Input fields not found', 'error');
            return;
        }

        const value1 = parseFloat(input1.value);
        const value2 = parseFloat(input2.value);
        const override = parseFloat(overrideInput ? overrideInput.value : 0) || 0;

        console.log('Values:', value1, value2, override); // Debug

        if (isNaN(value1) || isNaN(value2)) {
            this.showToast('Please enter valid measurements for both fields', 'error');
            return;
        }

        if (Math.abs(value1 - value2) > 1) {
            this.showToast('Measurements differ by more than 1 unit', 'warning');
        }

        const average = (value1 + value2) / 2;
        const unit = this.getMeasurementUnit(measurementType.replace('-', '_'));
        
        // Get or create measurement data
        let measurementData = this.measurements.get(this.currentPersonId) || {
            timestamp: new Date().toISOString(),
            operator: this.currentOperator,
            device: this.deviceId,
            comments: ''
        };

        // Save the measurement
        measurementData[measurementType.replace('-', '_')] = {
            value: average,
            unit: unit,
            value1: value1,
            value2: value2,
            override: override
        };

        this.measurements.set(this.currentPersonId, measurementData);
        this.saveState();

        this.logActivity('MEASUREMENT_SAVED', {
            personId: this.currentPersonId,
            measurement: measurementType,
            value: average
        });

        this.showToast(`${measurementType.replace('-', ' ')} saved successfully!`, 'success');
    }

    showSettings() {
        // Show settings modal - implement if modal exists
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideSettings() {
        // Hide settings modal
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    exportData() {
        // Export functionality - basic implementation
        this.showToast('Export functionality coming soon!', 'info');
    }

    filterRoster() {
        // Filter roster functionality - basic implementation
        const filter = document.getElementById('name-filter').value.toLowerCase();
        const rosterItems = document.querySelectorAll('.roster-item');
        
        rosterItems.forEach(item => {
            const name = item.querySelector('h4').textContent.toLowerCase();
            if (name.includes(filter)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    showAddPersonModal() {
        const modal = document.getElementById('add-person-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideAddPersonModal() {
        const modal = document.getElementById('add-person-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    addNewPerson() {
        // Add new person functionality - basic implementation
        this.showToast('Add person functionality coming soon!', 'info');
        this.hideAddPersonModal();
    }

    showCheckinSection() {
        document.getElementById('roster-section').classList.add('hidden');
        document.getElementById('checkin-section').classList.remove('hidden');
        
        // Render check-in grid
        this.renderCheckinGrid();
        
        this.logActivity('CHECKIN_SECTION_OPENED');
    }

    renderCheckinGrid() {
        const checkinGrid = document.getElementById('checkin-grid');
        if (!checkinGrid) {
            console.error('Checkin grid not found');
            return;
        }

        checkinGrid.innerHTML = '';

        if (this.roster.length === 0) {
            checkinGrid.innerHTML = '<p class="no-data">No roster uploaded. Please upload a CSV file to get started.</p>';
            return;
        }

        // Render each person in the checkin grid
        this.roster.forEach(person => {
            const personCard = document.createElement('div');
            personCard.className = 'checkin-item';
            const personId = person.id || person.name;
            personCard.setAttribute('data-person-id', personId);

            // Add status classes
            if (person.present) {
                personCard.classList.add('present');
            }

            // Create card content
            personCard.innerHTML = `
                <h4>${person.name || 'Unknown'}</h4>
                <p><strong>ID:</strong> ${person.id || 'N/A'}</p>
                <p><strong>Gender:</strong> ${person.gender || 'N/A'}</p>
                <div class="checkin-controls">
                    <button class="checkin-toggle-btn ${person.present ? 'present' : 'absent'}" 
                            data-person-id="${personId}">
                        ${person.present ? '✅ Present' : '❌ Absent'}
                    </button>
                </div>
            `;

            // Add click event to toggle check-in status
            const toggleBtn = personCard.querySelector('.checkin-toggle-btn');
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePersonPresence(person);
            });

            checkinGrid.appendChild(personCard);
        });
    }

    togglePersonPresence(person) {
        person.present = !person.present;
        this.saveState();
        this.renderCheckinGrid(); // Re-render to update UI
        
        this.logActivity('PERSON_PRESENCE_TOGGLED', { 
            personId: person.id || person.name, 
            present: person.present 
        });
        
        this.showToast(`${person.name} marked as ${person.present ? 'present' : 'absent'}`, 'success');
    }

    toggleCheckinEditMode() {
        this.checkinEditMode = !this.checkinEditMode;
        // Toggle edit mode functionality
    }

    saveMeasurements() {
        this.showToast('Measurements saved!', 'success');
    }

    showFileManagement() {
        const modal = document.getElementById('file-management-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideFileManagement() {
        const modal = document.getElementById('file-management-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    showResetModal() {
        const modal = document.getElementById('reset-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideResetModal() {
        const modal = document.getElementById('reset-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    confirmReset() {
        // Reset all data
        this.roster = [];
        this.measurements.clear();
        this.currentOperator = '';
        this.currentEvent = '';
        this.activityLog = [];
        
        localStorage.removeItem('manualEntryAppState');
        
        this.showToast('All data has been reset', 'success');
        this.hideResetModal();
        this.showStartupScreen();
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getMeasurementUnit(measurementType) {
        const unitMap = {
            'height': 'inches',
            'reach': 'inches',
            'wingspan': 'inches',
            'vertical': 'inches',
            'approach': 'inches',
            'broad': 'inches',
            'weight': 'lbs',
            'hand_length': 'inches',
            'hand_width': 'inches'
        };
        
        // Map measurement types to unit keys
        if (measurementType.includes('height')) return this.measurementUnits.height || 'inches';
        if (measurementType.includes('reach')) return this.measurementUnits.reach || 'inches';
        if (measurementType.includes('wingspan')) return this.measurementUnits.wingspan || 'inches';
        if (measurementType.includes('vertical')) return this.measurementUnits.vertical || 'inches';
        if (measurementType.includes('approach')) return this.measurementUnits.approach || 'inches';
        if (measurementType.includes('broad')) return this.measurementUnits.broad || 'inches';
        if (measurementType.includes('weight')) return 'lbs';
        if (measurementType.includes('hand')) return 'inches';
        
        return unitMap[measurementType] || 'inches';
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ManualEntryApp();
});