// ═══════════════════════════════════════════
// 🎯 CONFIG
// ═══════════════════════════════════════════
const API_BASE = '/api';

// ═══════════════════════════════════════════
// 🎯 TOAST
// ═══════════════════════════════════════════
export function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = type === 'error' ? 'show error' : 'show';
    
    setTimeout(() => {
        toast.className = '';
    }, 3000);
}

// ═══════════════════════════════════════════
// 🎯 LOAD COMMANDS
// ═══════════════════════════════════════════
async function loadCommands() {
    const botNumber = document.getElementById('botNumber').value.trim();
    
    if (!botNumber) {
        showToast('Bot number required', 'error');
        return;
    }

    // 🎯 Save for later
    localStorage.setItem('botNumber', botNumber);

    try {
        const res = await fetch(`${API_BASE}/list?botNumber=${botNumber}`);
        const data = await res.json();

        if (data.success) {
            renderCommands(data.commands);
            showToast(`✅ Loaded ${data.total} commands`);
        } else {
            showToast('❌ ' + data.error, 'error');
        }
    } catch (err) {
        showToast('❌ Network error: ' + err.message, 'error');
    }
}

// ═══════════════════════════════════════════
// 🎯 RENDER COMMANDS
// ═══════════════════════════════════════════
function renderCommands(commands) {
    const container = document.getElementById('commandsList');
    
    if (!commands || commands.length === 0) {
        container.innerHTML = '<p style="color:#9ca3af;">No commands yet. Create your first one!</p>';
        return;
    }

    container.innerHTML = commands.map(cmd => `
        <div class="command-card">
            <div class="cmd-header">
                <span class="cmd-pattern">.${cmd.pattern}</span>
                <span class="cmd-type">${cmd.actionType}</span>
            </div>
            <div class="cmd-body">
                <p>${cmd.description || 'No description'}</p>
                <small>Used ${cmd.usageCount} times</small>
            </div>
            <div class="cmd-actions">
                <button onclick="deleteCommand('${cmd._id}')">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
}

// ═══════════════════════════════════════════
// 🎯 DELETE COMMAND
// ═══════════════════════════════════════════
async function deleteCommand(id) {
    const botNumber = localStorage.getItem('botNumber');
    
    if (!confirm('Delete this command?')) return;

    try {
        const res = await fetch(`${API_BASE}/delete?id=${id}&botNumber=${botNumber}`, {
            method: 'DELETE'
        });
        const data = await res.json();

        if (data.success) {
            showToast('✅ Command deleted');
            loadCommands();
        } else {
            showToast('❌ ' + data.error, 'error');
        }
    } catch (err) {
        showToast('❌ ' + err.message, 'error');
    }
}

// ═══════════════════════════════════════════
// 🎯 INIT
// ═══════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
    const savedBot = localStorage.getItem('botNumber');
    if (savedBot) {
        document.getElementById('botNumber').value = savedBot;
        loadCommands();
    }
});

// 🎯 Expose to window
window.loadCommands = loadCommands;
window.deleteCommand = deleteCommand;
window.showToast = showToast;
