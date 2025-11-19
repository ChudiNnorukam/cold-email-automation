const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command) {
    try {
        return execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    } catch (e) {
        return '';
    }
}

function getProcessInfo(pid) {
    try {
        // Get command and arguments
        const command = runCommand(`ps -p ${pid} -o command=`);

        // Get CWD (Current Working Directory)
        // lsof -p PID | grep cwd
        // Output format: command PID user FD TYPE DEVICE SIZE/OFF NODE NAME
        const lsofOutput = runCommand(`lsof -p ${pid} | grep cwd`);
        const cwdMatch = lsofOutput.match(/cwd\s+DIR\s+.*?\s+.*?\s+.*?\s+(.*)/);
        const cwd = cwdMatch ? cwdMatch[1] : 'Unknown';

        return { pid, command, cwd };
    } catch (e) {
        return null;
    }
}

function findRogueProcesses() {
    console.log('🔍 Scanning for rogue servers...');
    const processes = new Map(); // Map<PID, Info>

    // 1. Scan Ports
    const ports = '3000-3010,8000-8010,8080,5173';
    console.log(`   Scanning ports: ${ports}`);
    const lsofOutput = runCommand(`lsof -i :${ports} -P -n | grep LISTEN`);

    lsofOutput.split('\n').forEach(line => {
        if (!line) return;
        const parts = line.split(/\s+/);
        const pid = parts[1];
        if (pid && !processes.has(pid)) {
            const info = getProcessInfo(pid);
            if (info) processes.set(pid, { ...info, source: 'Port Listener' });
        }
    });

    // 2. Scan Node/Next/Python processes
    console.log('   Scanning process list for node/python...');
    const psOutput = runCommand('ps aux | grep -E "node|next|vite|react-scripts|python|flask|django" | grep -v grep');

    psOutput.split('\n').forEach(line => {
        if (!line) return;
        const parts = line.split(/\s+/);
        const pid = parts[1];
        if (pid && !processes.has(pid)) {
            const info = getProcessInfo(pid);
            // Filter out this script itself and system processes
            if (info && !info.command.includes('cleanup_servers.js') && !info.command.includes('Antigravity')) {
                processes.set(pid, { ...info, source: 'Process List' });
            }
        }
    });

    return Array.from(processes.values());
}

function main() {
    const rogueProcesses = findRogueProcesses();

    if (rogueProcesses.length === 0) {
        console.log('✅ No rogue servers found.');
        return;
    }

    console.log(`\n⚠️  Found ${rogueProcesses.length} potential rogue processes:\n`);

    rogueProcesses.forEach(p => {
        console.log(`   [PID: ${p.pid}] ${p.source}`);
        console.log(`   DIR: ${p.cwd}`);
        console.log(`   CMD: ${p.command.substring(0, 100)}...`);
        console.log('   ---------------------------------------------------');
    });

    console.log('\n🔪 Terminating processes...');

    rogueProcesses.forEach(p => {
        try {
            process.kill(p.pid, 'SIGKILL'); // Force kill
            console.log(`   ✅ Killed PID ${p.pid}`);
        } catch (e) {
            console.log(`   ❌ Failed to kill PID ${p.pid}: ${e.message}`);
        }
    });

    console.log('\n✨ Cleanup complete.');
}

main();
