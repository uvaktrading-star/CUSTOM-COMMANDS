// ═══════════════════════════════════════════
// 🎯 CONFIG
// ═══════════════════════════════════════════
const API_BASE = '/api';

// ═══════════════════════════════════════════
// 🎯 AUTH CHECK (Only for builder.html)
// ═══════════════════════════════════════════
function requireAuth() {
    const botNumber = localStorage.getItem('bot_id');
    if (!botNumber && window.location.pathname.includes('builder')) {
        window.location.href = 'index.html';
        return null;
    }
    return botNumber;
}

// ═══════════════════════════════════════════
// 🎯 TOAST
// ═══════════════════════════════════════════
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = type === 'error' ? 'show error' : 'show';
    
    setTimeout(() => { toast.className = ''; }, 3000);
}

// ═══════════════════════════════════════════
// 🎯 LOGOUT
// ═══════════════════════════════════════════
function handleLogout() {
    if (!confirm('Logout from Command Builder?')) return;
    localStorage.removeItem('bot_id');
    localStorage.removeItem('bot_pass');
    localStorage.removeItem('bot_settings');
    window.location.href = 'index.html';
}

// ═══════════════════════════════════════════
// 🎯 TOGGLE ACTION FIELDS
// ═══════════════════════════════════════════
function toggleActionFields() {
    const action = document.getElementById('actionType')?.value;
    if (!action) return;

    // Hide all
    document.querySelectorAll('.conditional-fields').forEach(el => el.classList.remove('active'));

    // Show relevant
    if (action === 'text' || action === 'template') {
        document.getElementById('textFields')?.classList.add('active');
        if (action === 'template') {
            document.getElementById('templateFields')?.classList.add('active');
            document.getElementById('textFields')?.classList.remove('active');
        }
    } else if (['image', 'video', 'audio'].includes(action)) {
        document.getElementById('mediaFields')?.classList.add('active');
    } else if (action === 'api') {
        document.getElementById('apiFields')?.classList.add('active');
    }
}

// ═══════════════════════════════════════════
// 🎯 TOGGLE POST BODY FIELD
// ═══════════════════════════════════════════
function toggleBodyField() {
    const method = document.getElementById('cmdApiMethod')?.value;
    const bodyField = document.getElementById('bodyField');
    if (bodyField) {
        bodyField.style.display = method === 'POST' ? 'block' : 'none';
    }
}

// ═══════════════════════════════════════════
// 🎯 SAVE COMMAND
// ═══════════════════════════════════════════
async function saveCommand() {
    const botNumber = localStorage.getItem('bot_id');
    if (!botNumber) {
        showToast('❌ Please login first', 'error');
        return;
    }

    const pattern = document.getElementById('cmdPattern').value.trim().toLowerCase();
    const alias = document.getElementById('cmdAlias').value
        .split(',').map(a => a.trim().toLowerCase()).filter(a => a);
    const actionType = document.getElementById('actionType').value;
    const description = document.getElementById('cmdDescription').value.trim();

    if (!pattern) {
        showToast('❌ Pattern required', 'error');
        return;
    }

    // 🎯 Build payload
    const payload = {
        botNumber,
        pattern,
        alias,
        actionType,
        description,
        ownerOnly: document.getElementById('ownerOnly').checked,
        groupOnly: document.getElementById('groupOnly').checked,
        privateOnly: document.getElementById('privateOnly').checked,
        react: document.getElementById('cmdReact').value || '⚡'
    };

    // 🎯 Action-specific fields
    if (actionType === 'text' || actionType === 'template') {
        payload.response = document.getElementById('cmdResponse').value || 
                           document.getElementById('cmdTemplate').value;
    } else if (['image', 'video', 'audio'].includes(actionType)) {
        payload.mediaUrl = document.getElementById('cmdMediaUrl').value;
        payload.response = document.getElementById('cmdMediaCaption').value;
    } else if (actionType === 'api') {
        payload.apiUrl = document.getElementById('cmdApiUrl').value;
        payload.apiMethod = document.getElementById('cmdApiMethod').value;
        payload.apiResponsePath = document.getElementById('cmdApiResponsePath').value;
        try {
            payload.apiHeaders = JSON.parse(document.getElementById('cmdApiHeaders').value || '{}');
            payload.apiBody = JSON.parse(document.getElementById('cmdApiBody').value || '{}');
        } catch (e) {
            showToast('❌ Invalid JSON in headers/body', 'error');
            return;
        }
        payload.response = document.getElementById('cmdResponse').value || '{{result}}';
    }

    const saveBtn = document.getElementById('saveBtn');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<div class="spinner"></div><span>Saving...</span>';
    saveBtn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success) {
            showToast('✅ Command saved!');
            loadCommands();
            resetForm();
        } else {
            showToast('❌ ' + (data.error || 'Save failed'), 'error');
        }
    } catch (err) {
        showToast('❌ ' + err.message, 'error');
    } finally {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
}

// ═══════════════════════════════════════════
// 🎯 TEST COMMAND (API only)
// ═══════════════════════════════════════════
async function testCommand() {
    const actionType = document.getElementById('actionType').value;
    
    if (actionType !== 'api') {
        showToast('⚠️ Test is only available for API commands', 'error');
        return;
    }

    const testResult = document.getElementById('testResult');
    const testOutput = document.getElementById('testOutput');
    
    testResult.className = 'show';
    testOutput.textContent = '⏳ Testing...';

    try {
        const res = await fetch(`${API_BASE}/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                apiUrl: document.getElementById('cmdApiUrl').value,
                apiMethod: document.getElementById('cmdApiMethod').value,
                apiHeaders: JSON.parse(document.getElementById('cmdApiHeaders').value || '{}'),
                apiBody: JSON.parse(document.getElementById('cmdApiBody').value || '{}'),
                apiResponsePath: document.getElementById('cmdApiResponsePath').value,
                template: document.getElementById('cmdResponse').value || '{{result}}',
                testQuery: 'test'
            })
        });
        const result = await res.json();

        if (result.success) {
            testResult.className = 'show success';
            testOutput.textContent = `✅ Success!\n\n${result.output}`;
        } else {
            testResult.className = 'show error';
            testOutput.textContent = `❌ Failed: ${result.error}`;
        }
    } catch (err) {
        testResult.className = 'show error';
        testOutput.textContent = `❌ Error: ${err.message}`;
    }
}

// ═══════════════════════════════════════════
// 🎯 RESET FORM
// ═══════════════════════════════════════════
function resetForm() {
    document.getElementById('cmdPattern').value = '';
    document.getElementById('cmdAlias').value = '';
    document.getElementById('cmdDescription').value = '';
    document.getElementById('cmdResponse').value = '';
    document.getElementById('cmdMediaUrl').value = '';
    document.getElementById('cmdMediaCaption').value = '';
    document.getElementById('cmdApiUrl').value = '';
    document.getElementById('cmdApiResponsePath').value = '';
    document.getElementById('cmdApiHeaders').value = '';
    document.getElementById('cmdApiBody').value = '';
    document.getElementById('cmdTemplate').value = '';
    document.getElementById('ownerOnly').checked = false;
    document.getElementById('groupOnly').checked = false;
    document.getElementById('privateOnly').checked = false;
    document.getElementById('cmdReact').value = '⚡';
    document.getElementById('testResult').className = '';
}

// ═══════════════════════════════════════════
// 🎯 LOAD COMMANDS
// ═══════════════════════════════════════════
async function loadCommands() {
    const botNumber = localStorage.getItem('bot_id');
    if (!botNumber) return;

    // Update badge
    const badge = document.getElementById('botBadge');
    if (badge) badge.textContent = `🤖 ${botNumber}`;

    const container = document.getElementById('commandsList');
    if (!container) return;

    container.innerHTML = `
        <div class="empty-state">
            <div class="spinner"></div>
            <p style="margin-top:12px;">Loading...</p>
        </div>
    `;

    try {
        const res = await fetch(`${API_BASE}/list?botNumber=${botNumber}`);
        const data = await res.json();

        if (data.success) {
            renderCommands(data.commands);
        } else {
            renderEmpty();
        }
    } catch (err) {
        renderEmpty();
    }
}

// ═══════════════════════════════════════════
// 🎯 RENDER COMMANDS
// ═══════════════════════════════════════════
function renderCommands(commands) {
    const container = document.getElementById('commandsList');

    if (!commands || commands.length === 0) {
        renderEmpty();
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
                <small>Used ${cmd.usageCount || 0} times</small>
            </div>
            <div class="cmd-actions">
                <button class="btn-delete" onclick="deleteCommand('${cmd._id}')">
                    🗑️ Delete
                </button>
            </div>
        </div>
    `).join('');
}

function renderEmpty() {
    const container = document.getElementById('commandsList');
    if (!container) return;
    container.innerHTML = `
        <div class="empty-state">
            <div class="icon">📭</div>
            <h3>No Commands Yet</h3>
            <p>Create your first command above!</p>
        </div>
    `;
}

// ═══════════════════════════════════════════
// 🎯 DELETE COMMAND
// ═══════════════════════════════════════════
async function deleteCommand(id) {
    const botNumber = localStorage.getItem('bot_id');
    if (!confirm('Delete this command?')) return;

    try {
        const res = await fetch(`${API_BASE}/delete?id=${id}&botNumber=${botNumber}`, {
            method: 'DELETE'
        });
        const data = await res.json();

        if (data.success) {
            showToast('✅ Deleted');
            loadCommands();
        } else {
            showToast('❌ ' + data.error, 'error');
        }
    } catch (err) {
        showToast('❌ ' + err.message, 'error');
    }
}

// ═══════════════════════════════════════════
// 🎯 INIT (Only for builder.html)
// ═══════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
    // Only run on builder.html
    if (window.location.pathname.includes('builder')) {
        const botNumber = requireAuth();
        if (botNumber) {
            loadCommands();
        }
    }
});

// ═══════════════════════════════════════════
// 🎯 EXPOSE GLOBALLY
// ═══════════════════════════════════════════
window.showToast = showToast;
window.handleLogout = handleLogout;
window.toggleActionFields = toggleActionFields;
window.toggleBodyField = toggleBodyField;
window.saveCommand = saveCommand;
window.testCommand = testCommand;
window.resetForm = resetForm;
window.loadCommands = loadCommands;
window.deleteCommand = deleteCommand;
