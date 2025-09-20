(function () {
    const vscode = acquireVsCodeApi();
    const commandSelect = document.getElementById('command-select');
    const optionsContainer = document.getElementById('options-container');
    const executeBtn = document.getElementById('execute-btn');

    const commandOptions = {
        runserver: `<div class="option-item"><label for="port">Address & Port (optional):</label><input type="text" id="arg1" placeholder="e.g., 8080 or 0.0.0.0:8000"></div>`,
        startapp: `<div class="option-item"><label for="app_name">App Name:</label><input type="text" id="arg1" placeholder="Enter app name (required)"></div>`,
        startproject: `<div class="option-item"><label for="project_name">Project Name:</label><input type="text" id="arg1" placeholder="Enter project name (required)"></div>`,
        makemigrations: `<div class="option-item"><label for="app_label">App Label (optional):</label><input type="text" id="arg1" placeholder="e.g., myapp"></div>`,
        migrate: `<div class="option-item"><label for="app_label_migrate">App Label (optional):</label><input type="text" id="arg1" placeholder="e.g., myapp 0001"></div>`,
        collectstatic: `<div class="option-item"><input type="checkbox" id="arg1_bool" name="no-input"><label for="no-input"> --no-input</label></div>`,
        custom: `<div class="option-item"><label for="custom_command">Custom Command:</label><input type="text" id="arg1" placeholder="e.g., my_custom_command --option"></div>`
    };

    commandSelect.addEventListener('change', (event) => {
        const selectedCommand = event.target.value;
        // Clear previous options
        optionsContainer.innerHTML = '';
        // Add new options if they exist
        if (commandOptions[selectedCommand]) {
            optionsContainer.innerHTML = commandOptions[selectedCommand];
        }
    });

    executeBtn.addEventListener('click', () => {
        const selectedCommand = commandSelect.value;
        if (!selectedCommand) {
            // In a real extension, you might show a VS Code message
            alert("Please select a command.");
            return;
        }

        let finalCommand = selectedCommand;
        
        const arg1 = document.getElementById('arg1');
        const arg1_bool = document.getElementById('arg1_bool');
        
        if (arg1 && arg1.value) {
            finalCommand += ` ${arg1.value}`;
        } else if (arg1_bool && arg1_bool.checked) {
             finalCommand += ` --no-input`;
        }

        // Send a message back to the extension
        vscode.postMessage({
            command: finalCommand
        });
    });
}());