const vscode = require('vscode');
const path = require('path');
const process = require('process');
const { DJANGO_COMMANDS } = require('./js/commands.js');

let commandState = {}; 
let activeTerminals = {}; 
const SINGLE_EXEC_KEY = '__SINGLE_EXECUTION__';

function toBold(text) {
    const boldMap = {
        'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨', 'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭',
        'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇'
    };
    return text.split('').map(char => boldMap[char] || char).join('');
}

const groupedCommands = {};
const groupColors = {
    'Project': '#5BC0DE',      // Light Blue
    'Database': '#F0AD4E',     // Orange
    'Users': '#5CB85C',        // Green
    'Static Files': '#D9534F', // Red
    'Testing': '#7E57C2',      // Purple
    'Other': '#B0BEC5'         // Gray
};

for (const key in DJANGO_COMMANDS) {
    const command = DJANGO_COMMANDS[key];
    const group = command.group || 'Other';
    if (!groupedCommands[group]) {
        groupedCommands[group] = [];
    }
    groupedCommands[group].push({ key, ...command });
}

class ColorizedGroupItem extends vscode.TreeItem {
    constructor(label, color) {
        super(label, vscode.TreeItemCollapsibleState.Collapsed);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="${color}" width="16" height="16"><path d="M.5 2.5l.44-.9A1.5 1.5 0 012.28.5h2.16a1.5 1.5 0 011.34 1.1l.44.9H14.5a1 1 0 011 1v9a1 1 0 01-1 1H1.5a1 1 0 01-1-1v-9a1 1 0 011-1H.5z"/></svg>`;
        this.iconPath = vscode.Uri.parse(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
    }
}

function activate(context) {
    const djangoCommandsProvider = new DjangoCommandsProvider();
    vscode.window.registerTreeDataProvider('django-commands-view', djangoCommandsProvider);
    
    // ... (All command registrations remain unchanged) ...
    context.subscriptions.push(vscode.window.onDidCloseTerminal((closedTerminal) => {
        for (const key in activeTerminals) { if (activeTerminals[key] && activeTerminals[key].processId === closedTerminal.processId) { delete activeTerminals[key]; break; } }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('django-gui.refresh', () => djangoCommandsProvider.refresh()));
    context.subscriptions.push(vscode.commands.registerCommand('django-gui.resetOptions', (commandKey) => {
        if (commandState[commandKey]) { commandState[commandKey] = {}; djangoCommandsProvider.refresh(); }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('django-gui.setOption', async (option, commandKey) => {
        if (!commandState[commandKey]) commandState[commandKey] = {};
        let value;
        if (option.type === 'dropdown' && Array.isArray(option.choices)) {
            value = await vscode.window.showQuickPick(option.choices, { placeHolder: `Select a value for ${option.label}` });
        } else {
            value = await vscode.window.showInputBox({ prompt: `Enter value for ${option.label}`, value: commandState[commandKey][option.name] || '', placeHolder: option.placeholder || '' });
        }
        if (value !== undefined) { commandState[commandKey][option.name] = value; djangoCommandsProvider.refresh(); }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('django-gui.toggleOption', (option, commandKey) => {
        if (!commandState[commandKey]) commandState[commandKey] = {};
        commandState[commandKey][option.name] = !commandState[commandKey][option.name];
        djangoCommandsProvider.refresh();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('django-gui.execute', async (commandKey) => {
        if (!commandKey) return;
        const commandData = DJANGO_COMMANDS[commandKey];
        let finalCommand = commandKey;
        const optionsForCommand = commandState[commandKey] || {};
        (commandData.options || []).forEach(opt => {
            const value = optionsForCommand[opt.name];
            if (value) {
                if (opt.type === 'checkbox') { finalCommand += ` ${opt.name}`; } 
                else if (opt.name.startsWith('--')) { finalCommand += ` ${opt.name} ${value}`; }
                else { finalCommand += ` ${value}`; }
            }
        });
        const managePyFiles = await vscode.workspace.findFiles('**/manage.py', '**/venv/**', 1);
        if (managePyFiles.length === 0) { vscode.window.showErrorMessage('Could not find manage.py in your workspace.'); return; }
        const projectRoot = path.dirname(managePyFiles[0].fsPath);
        const pythonPath = await getPythonInterpreterPath();
        if (!pythonPath) return;
        let terminalCommand = `"${pythonPath}" manage.py ${finalCommand}`;
        if (process.platform === 'win32') { terminalCommand = `& ${terminalCommand}`; }
        let targetTerminal;
        const isContinuous = commandData.isContinuous || false;
        if (isContinuous) {
            if (activeTerminals[commandKey]) { activeTerminals[commandKey].dispose(); }
            targetTerminal = vscode.window.createTerminal(`Django: ${commandData.label}`);
            activeTerminals[commandKey] = targetTerminal;
        } else {
            if (activeTerminals[SINGLE_EXEC_KEY] && activeTerminals[SINGLE_EXEC_KEY].exitStatus === undefined) {
                targetTerminal = activeTerminals[SINGLE_EXEC_KEY];
            } else {
                targetTerminal = vscode.window.createTerminal("Django Commands");
                activeTerminals[SINGLE_EXEC_KEY] = targetTerminal;
            }
        }
        targetTerminal.sendText(`cd "${projectRoot}"`);
        targetTerminal.sendText(terminalCommand);
        targetTerminal.show();
    }));
}

class DjangoCommandsProvider {
    constructor() { this._onDidChangeTreeData = new vscode.EventEmitter(); this.onDidChangeTreeData = this._onDidChangeTreeData.event; }
    refresh() { this._onDidChangeTreeData.fire(); }
    getTreeItem(element) { return element; }

    getChildren(element) {
        if (!element) {
            return Object.keys(groupedCommands).map(groupName => {
                const color = groupColors[groupName] || groupColors['Other'];
                const groupItem = new ColorizedGroupItem(toBold(groupName.toUpperCase()), color);
                groupItem.contextValue = 'group';
                groupItem.groupName = groupName;
                return groupItem;
            });
        }

        // --- MODIFICATION: Add colored dot icons to the command items ---
        if (element.contextValue === 'group') {
            return groupedCommands[element.groupName].map(command => {
                const collapsibleState = (command.options && command.options.length > 0) ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None;
                const treeItem = new vscode.TreeItem(toBold(command.label), collapsibleState);
                
                const color = groupColors[command.group] || groupColors['Other'];
                const svgDot = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="${color}" width="16" height="16"><circle cx="8" cy="8" r="4"/></svg>`;
                treeItem.iconPath = vscode.Uri.parse(`data:image/svg+xml;utf8,${encodeURIComponent(svgDot)}`);

                treeItem.tooltip = command.description;
                treeItem.contextValue = 'command';
                treeItem.commandKey = command.key;

                if (!command.options || command.options.length === 0) {
                    treeItem.command = { command: 'django-gui.execute', title: 'Execute Command', arguments: [command.key] };
                }
                return treeItem;
            });
        }

        const commandKey = element.commandKey;
        if (element.contextValue === 'command' && commandKey) {
            const commandData = DJANGO_COMMANDS[commandKey];
            const optionsForCommand = commandState[commandKey] || {};
            const optionItems = (commandData.options || []).map(opt => {
                const currentValue = optionsForCommand[opt.name];
                let optionItem;
                if (opt.type === 'checkbox') {
                    optionItem = new vscode.TreeItem(opt.label);
                    optionItem.iconPath = new vscode.ThemeIcon(!!currentValue ? 'check' : 'circle-slash');
                    optionItem.command = { command: 'django-gui.toggleOption', title: 'Toggle Option', arguments: [opt, commandKey] };
                } else {
                    let label = `${opt.label}: ${currentValue || `(${opt.placeholder || 'Set value'})`}`;
                    optionItem = new vscode.TreeItem(label);
                    optionItem.iconPath = new vscode.ThemeIcon('edit');
                    optionItem.command = { command: 'django-gui.setOption', title: 'Set Option', arguments: [opt, commandKey] };
                }
                return optionItem;
            });
            const resetButton = new vscode.TreeItem('↩️ Reset Options');
            resetButton.iconPath = new vscode.ThemeIcon('refresh');
            resetButton.command = { command: 'django-gui.resetOptions', title: 'Reset Options', arguments: [commandKey] };
            const executeButton = new vscode.TreeItem('🚀 Execute Command');
            executeButton.iconPath = new vscode.ThemeIcon('play');
            executeButton.command = { command: 'django-gui.execute', title: 'Execute Command', arguments: [commandKey] };
            return Promise.resolve([...optionItems, resetButton, executeButton]);
        }
        return Promise.resolve([]);
    }
}

async function getPythonInterpreterPath() {
    const pythonExtension = vscode.extensions.getExtension('ms-python.python');
    if (!pythonExtension) { return undefined; }
    if (!pythonExtension.isActive) { await pythonExtension.activate(); }
    const api = pythonExtension.exports;
    const environment = await api.environments.getActiveEnvironmentPath();
    return environment ? environment.path : undefined;
}

function deactivate() {}
module.exports = { activate, deactivate };