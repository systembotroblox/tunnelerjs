/**
 * Implements commands functionality.
 */
const fs = require('fs');
module.exports = (Debug, Auth, Strings, Client) => {
    const module = {};

    // Init
    const commandsSrc = {};
    const filepath = './commands/';
    let commandsJSON = {};
    try {
        // Load the commands.
        const files = fs.readdirSync(filepath);
        files.forEach((file) => {
            const parts = file.split('.');
            if (
                parts &&
                parts.length === 4 &&
                parts[0] === 'cmd' &&
                parts[1] === 'inc' &&
                parts[3] === 'js'
            ) {
                // Pair a key and a command module.
                commandsSrc[parts[2]] = require(`.${filepath}${file}`)(Debug, Strings, Client);
            }
        });
        // Make sure the call keys exist.
        if (Object.keys(commandsSrc).length > 0 && !fs.existsSync('./config/commands.json')) {
            Debug.print('config/commands.json is missing. The process will now exit.', 'COMMANDS ERROR');
            process.exit(1);
        }
        // Inform the user if there are no commands available for some reason.
        if (Object.keys(commandsSrc).length < 1) {
            Debug.print(`There are no commands available in ${filepath}`, 'COMMANDS');
        }
        commandsJSON = require('../config/commands.json');
    } catch (e) {
        Debug.print('Reading command files failed. The process will now exit.', 'COMMANDS ERROR');
        console.log(e);
        process.exit(1);
    }

    /**
     * Returns all keys that match a command.
     */
    module.getKeys = () => {
        try {
            return Object.keys(commandsSrc) || [];
        } catch (e) {
            Debug.print('Returning commands failed.', 'COMMANDS ERROR');
            return [];
        }
    }

    /**
     * Returns a specific command based on a key.
     */
    module.get = (key = '') => {
        try {
            if (typeof key === 'string') {
                return commandsSrc[key] || (() => {});
            }
            return (() => {});
        } catch (e) {
            Debug.print(`Returning a command (${key}) failed.`, 'COMMANDS ERROR');
            return (() => {});
        }
    }

    /**
     * Returns true if the given id has access to a command.
     */
    module.hasAccess = (key = '', id = '0') => {
        try {
            if (typeof key === 'string' && typeof id === 'string') {
                if (commandsSrc[key] === undefined) {
                    // No such command.
                    Debug.print(`Trying to get an access to an unknown command (${key}).`, 'COMMANDS ERROR');
                    return false;
                }
                if (id === Auth.owner) {
                    // A full access granted for the owner.
                    // No matter whether the access exists.
                    return true;
                }
                const thisAccess = commandsJSON.commands_access[key];
                if (thisAccess === undefined) {
                    // The access is missing.
                    Debug.log(`Access (${key}) does not exist.`, 'COMMANDS ERROR');
                    return false;
                }
                if (thisAccess.indexOf('all') > -1) {
                    // Everyone can access.
                    return true;
                }
                return thisAccess.indexOf(id) > -1;
            }
            return false;
        } catch (e) {
            Debug.print(`Returning access to (${key}) failed.`, 'COMMANDS ERROR');
            return false;
        }
    }

    /**
     * Executes a command.
     */
    module.execute = (key, payload) => {
        try {
            if (
                key === undefined ||
                commandsSrc[key] === undefined
            ) {
                Debug.log(`Missing command ${key}.`, 'COMMANDS ERROR');
                return false;
            }
            Debug.print(`Executing ${key}`, 'COMMANDS');
            return commandsSrc[key].execute(payload);
        } catch (e) {
            Debug.print('Executing a command failed.', 'COMMANDS ERROR');
            return false;
        }
    }

    return module;
};