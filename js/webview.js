(function () {
    const vscode = acquireVsCodeApi();
    const commandSelect = document.getElementById('command-select');
    const descriptionContainer = document.getElementById('description-container');
    const optionsContainer = document.getElementById('options-container');
    const executeBtn = document.getElementById('execute-btn');

    // --- 1. Populate the command dropdown from our data structure ---
    function populateCommands() {
        const groups = {};
        for (const commandKey in DJANGO_COMMANDS) {
            const command = DJANGO_COMMANDS[commandKey];
            if (!groups[command.group]) {
                groups[command.group] = [];
            }
            groups[command.group].push({ key: commandKey, label: command.label });
        }

        for (const groupName in groups) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = groupName;
            groups[groupName].forEach(command => {
                const option = document.createElement('option');
                option.value = command.key;
                option.textContent = command.label;
                optgroup.appendChild(option);
            });
            commandSelect.appendChild(optgroup);
        }
    }

    // --- 2. Render options for the selected command ---
    function renderOptions(commandKey) {
        const command = DJANGO_COMMANDS[commandKey];
        
        // Update description
        descriptionContainer.innerHTML = `<p>${command.description}</p>`;
        
        // Clear and build options
        optionsContainer.innerHTML = '';
        if (!command.options || command.options.length === 0) {
            optionsContainer.innerHTML = '<p><i>No options available for this command.</i></p>';
            return;
        }

        command.options.forEach((option, index) => {
            const optionId = `option-${index}`;
            let inputHtml = '';
            
            // Create different input types based on the command data
            switch (option.type) {
                case 'checkbox':
                    inputHtml = `<div class="option-item"><input type="checkbox" id="${optionId}" data-name="${option.name}"><label for="${optionId}">${option.label}</label></div>`;
                    break;
                case 'text':
                default:
                    inputHtml = `<div class="option-item"><label for="${optionId}">${option.label}:</label><input type="text" id="${optionId}" data-name="${option.name}" placeholder="${option.placeholder || ''}"></div>`;
                    break;
            }
            optionsContainer.innerHTML += inputHtml;
        });
    }

    // --- 3. Build the final command string and send it back to VS Code ---
    function executeCommand() {
        const commandKey = commandSelect.value;
        if (!commandKey) {
            vscode.postMessage({ command: 'error', text: 'Please select a command.' });
            return;
        }

        let finalCommand = commandKey;
        const command = DJANGO_COMMANDS[commandKey];

        command.options.forEach((option, index) => {
            const inputElement = document.getElementById(`option-${index}`);
            
            if (option.type === 'checkbox' && inputElement.checked) {
                finalCommand += ` ${option.name}`;
            } else if (option.type === 'text' && inputElement.value) {
                // If an option starts with '--', it's a named argument. Otherwise, it's positional.
                if (option.name.startsWith('--')) {
                    finalCommand += ` ${option.name} ${inputElement.value}`;
                } else {
                    finalCommand += ` ${inputElement.value}`;
                }
            }
        });

        vscode.postMessage({ command: finalCommand });
    }

    // --- Event Listeners ---
    commandSelect.addEventListener('change', (event) => {
        const selectedCommand = event.target.value;
        if (selectedCommand) {
            renderOptions(selectedCommand);
        } else {
            descriptionContainer.innerHTML = '<p><i>Select a command to see its description.</i></p>';
            optionsContainer.innerHTML = '<p><i>Select a command to see its available options.</i></p>';
        }
    });

    executeBtn.addEventListener('click', executeCommand);

    // --- Initial Load ---
    populateCommands();
}());