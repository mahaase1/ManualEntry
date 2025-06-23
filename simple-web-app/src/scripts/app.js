// This file contains the JavaScript code for the web app. It handles user interactions, local storage operations, and any dynamic content updates.

document.addEventListener('DOMContentLoaded', () => {
    const saveButton = document.getElementById('saveButton');
    const inputField = document.getElementById('inputField');
    const displayArea = document.getElementById('displayArea');

    // Load saved data from local storage
    const loadData = () => {
        const savedData = localStorage.getItem('savedData');
        if (savedData) {
            displayArea.textContent = savedData;
        }
    };

    // Save data to local storage
    const saveData = () => {
        const dataToSave = inputField.value;
        localStorage.setItem('savedData', dataToSave);
        displayArea.textContent = dataToSave;
        inputField.value = '';
    };

    // Event listener for the save button
    saveButton.addEventListener('click', saveData);

    // Load data when the page is loaded
    loadData();
});