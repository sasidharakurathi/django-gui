const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

function activate(context) {
    let disposable = vscode.commands.registerCommand('django-gui.start', async function () {
        // Find the manage.py file in the workspace
        const managePyFiles = await vscode.workspace.findFiles('**/manage.py', '**/venv/**', 1);

        if (managePyFiles.length === 0) {
            vscode.window.showErrorMessage('Could not find manage.py in your workspace. Is this a Django project?');
            return;
        }

        const managePyPath = managePyFiles[0].fsPath;
        const projectRoot = path.dirname(managePyPath);

        // Create and show a new webview panel
        const panel = vscode.window.createWebviewPanel(
            'djangoGui', // Identifies the type of the webview. Used internally
            'Django GUI', // Title of the panel displayed to the user
            vscode.ViewColumn.One, // Editor column to show the new webview panel in
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'css')), vscode.Uri.file(path.join(context.extensionPath, 'js'))]
            }
        );

        // Set the webview's initial HTML content
        panel.webview.html = getWebviewContent(context, panel.webview);

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            async message => {
                const pythonPath = await getPythonInterpreterPath();
                if (!pythonPath) {
                    vscode.window.showErrorMessage('Python interpreter not selected. Please select an interpreter using the Python extension.');
                    return;
                }

                // Construct and execute the command in a new terminal
                // const command = `${pythonPath} manage.py ${message.command}`;
				let command = `"${pythonPath}" manage.py ${message.command}`;
				// On Windows, PowerShell needs the call operator '&' for paths with spaces.
				// This is safe for CMD as well.
				if (process.platform === 'win32') {
					command = `& ${command}`;
				}
                const terminal = vscode.window.createTerminal(`Django Command`);
                terminal.sendText(`cd "${projectRoot}"`); // Navigate to project root
                terminal.sendText(command);
                terminal.show();
            },
            undefined,
            context.subscriptions
        );
    });

    context.subscriptions.push(disposable);
}

// Function to get the selected Python interpreter path from the Python extension
async function getPythonInterpreterPath() {
    const pythonExtension = vscode.extensions.getExtension('ms-python.python');
    if (!pythonExtension) {
        return undefined;
    }
    if (!pythonExtension.isActive) {
        await pythonExtension.activate();
    }
    const api = pythonExtension.exports;
    const environment = await api.environments.getActiveEnvironmentPath();
    return environment ? environment.path : undefined;
}


function getWebviewContent(context, webview) {
    // Get paths to local resources
    const stylesPath = vscode.Uri.file(path.join(context.extensionPath, 'css', 'styles.css'));
    const scriptPath = vscode.Uri.file(path.join(context.extensionPath, 'js', 'webview.js'));

    const stylesUri = webview.asWebviewUri(stylesPath);
    const scriptUri = webview.asWebviewUri(scriptPath);

    // Using a nonce for security
    const nonce = getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
        <link href="${stylesUri}" rel="stylesheet" />
        <title>Django GUI</title>
    </head>
    <body>
        <h1>Django Command Executor</h1>
        <p>Select a command and provide any necessary arguments.</p>

        <div class="command-section">
            <label for="command-select">Select Command:</label>
            <select id="command-select">
                <option value="">-- Choose a command --</option>
                <option value="runserver">runserver</option>
                <option value="startapp">startapp</option>
                <option value="startproject">startproject</option>
                <option value="makemigrations">makemigrations</option>
                <option value="migrate">migrate</option>
                <option value="createsuperuser">createsuperuser</option>
                <option value="collectstatic">collectstatic</option>
                <option value="shell">shell</option>
                <option value="custom">Custom Command</option>
            </select>
        </div>

        <div id="options-container"></div>

        <button id="execute-btn">🚀 Execute Command</button>

        <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>`;
}

// Function to generate a random nonce for Content Security Policy
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}


function deactivate() {}

module.exports = {
    activate,
    deactivate
};