// This object defines all the commands and their options.
// Our webview.js will use this to build the UI dynamically.

exports.DJANGO_COMMANDS = {
    "runserver": {
        "label": "RUN SERVER",
        "isContinuous": true,
        "group": "Project",
        "description": "Starts a lightweight development web server on the local machine.",
        "options": [
            { "name": "address_port", "label": "Address & Port", "type": "text", "placeholder": "e.g., 8080 or 0.0.0.0:8000" },
            { "name": "--noreload", "label": "Disable auto-reload", "type": "checkbox" },
            { "name": "--nostatic", "label": "Disable static files handling", "type": "checkbox" },
            { "name": "--insecure", "label": "Allow serving static files even if DEBUG is False", "type": "checkbox" },
            { "name": "--verbosity", "label": "Verbosity", "type": "dropdown", "choices": ["0", "1", "2", "3"], "placeholder": "Default: 1" }
        ]
    },
    "startapp": {
        "label": "START APP",
        "group": "Project",
        "description": "Creates a new Django app directory structure.",
        "options": [
            { "name": "name", "label": "App Name", "type": "text", "placeholder": "e.g., blog" },
            { "name": "directory", "label": "Target Directory", "type": "text", "placeholder": "Optional: e.g., apps/" }
        ]
    },
    "startproject": {
        "label": "START PROJECT",
        "group": "Project",
        "description": "Creates a new Django project directory structure.",
        "options": [
            { "name": "name", "label": "Project Name", "type": "text", "placeholder": "e.g., mysite" },
            { "name": "directory", "label": "Target Directory", "type": "text", "placeholder": "Optional: e.g., projects/" }
        ]
    },
    "makemigrations": {
        "label": "MAKE MIGRATIONS",
        "group": "Database",
        "description": "Creates new migration files based on changes detected to your models.",
        "options": [
            { "name": "app_label", "label": "App Label(s)", "type": "text", "placeholder": "e.g., myapp polls" },
            { "name": "--empty", "label": "Create an empty migration", "type": "checkbox" },
            { "name": "--name", "label": "Migration Name", "type": "text", "placeholder": "Optional: e.g., custom_migration" },
            { "name": "--verbosity", "label": "Verbosity", "type": "dropdown", "choices": ["0", "1", "2", "3"], "placeholder": "Default: 1" }
        ]
    },
    "migrate": {
        "label": "MIGRATE",
        "group": "Database",
        "description": "Synchronizes the database state with your current set of models and migrations.",
        "options": [
            { "name": "app_label", "label": "App Label", "type": "text", "placeholder": "Optional: e.g., myapp" },
            { "name": "migration_name", "label": "Migration Name", "type": "text", "placeholder": "Optional: e.g., 0001_initial" },
            { "name": "--database", "label": "Database Alias", "type": "text", "placeholder": "e.g., default or users_db" },
            { "name": "--fake", "label": "Mark migrations as run without actually running them", "type": "checkbox" },
            { "name": "--plan", "label": "Show the migration plan without running", "type": "checkbox" },
            { "name": "--verbosity", "label": "Verbosity", "type": "dropdown", "choices": ["0", "1", "2", "3"], "placeholder": "Default: 1" }
        ]
    },
    "createsuperuser": {
        "label": "CREATE SUPERUSER",
        "group": "Users",
        "description": "Creates a superuser account with all permissions.",
        "options": [
            { "name": "--username", "label": "Username", "type": "text", "placeholder": "Required" },
            { "name": "--email", "label": "Email", "type": "text", "placeholder": "Required" },
            { "name": "--noinput", "label": "Create without prompts", "type": "checkbox" }
        ]
    },
    "changepassword": {
        "label": "CHANGE PASSWORD",
        "group": "Users",
        "description": "Change a user's password interactively.",
        "options": [
            { "name": "username", "label": "Username", "type": "text", "placeholder": "Required" }
        ]
    },
    "collectstatic": {
        "label": "COLLECT STATIC",
        "group": "Static Files",
        "description": "Collects static files in a single location for deployment.",
        "options": [
            { "name": "--noinput", "label": "Do not prompt for input", "type": "checkbox" },
            { "name": "--clear", "label": "Clear existing files before trying to copy", "type": "checkbox" },
            { "name": "--dry-run", "label": "Do everything except modify the filesystem", "type": "checkbox" }
        ]
    },
    "flush": {
        "label": "FLUSH DATABASE",
        "group": "Database",
        "description": "Removes all data from the database and re-executes post-synchronization handlers.",
        "options": [
            { "name": "--noinput", "label": "Do not prompt for input", "type": "checkbox" }
        ]
    },
    "loaddata": {
        "label": "LOAD DATA",
        "group": "Database",
        "description": "Installs the named fixture(s) in the database.",
        "options": [
            { "name": "fixture_labels", "label": "Fixture Labels", "type": "text", "placeholder": "e.g., initial_data" },
            { "name": "--database", "label": "Database Alias", "type": "text", "placeholder": "e.g., default" },
            { "name": "--app", "label": "App Label", "type": "text", "placeholder": "Optional" }
        ]
    },
    "dumpdata": {
        "label": "DUMP DATA",
        "group": "Database",
        "description": "Outputs the contents of the database as a fixture of the given format.",
        "options": [
            { "name": "app_label", "label": "App Label", "type": "text", "placeholder": "Optional" },
            { "name": "--output", "label": "Output File", "type": "text", "placeholder": "Optional: e.g., data.json" },
            { "name": "--format", "label": "Format", "type": "dropdown", "choices": ["json", "xml", "yaml"], "placeholder": "Default: json" }
        ]
    },
    "test": {
        "label": "RUN TESTS",
        "group": "Testing",
        "description": "Discovers and runs tests in the specified modules or the current directory.",
        "options": [
            { "name": "test_labels", "label": "Test Labels", "type": "text", "placeholder": "e.g., myapp.tests" },
            { "name": "--pattern", "label": "Test File Pattern", "type": "text", "placeholder": "Optional: e.g., test_*.py" },
            { "name": "--verbosity", "label": "Verbosity", "type": "dropdown", "choices": ["0", "1", "2", "3"], "placeholder": "Default: 1" }
        ]
    },
    "shell": {
        "label": "OPEN SHELL",
        "isContinuous": true,
        "group": "Project",
        "description": "Runs a Python interactive interpreter.",
        "options": [
            { "name": "--interface", "label": "Shell Interface", "type": "dropdown", "choices": ["python", "ipython", "bpython"], "placeholder": "Default: python" }
        ]
    }
    // ... you can easily add more commands here!
};