const API_BASE = '/api/auth';

function getCsrfToken() {
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : '';
}

function getAuthHeaders() {
    const headers = {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
    };
    const token = localStorage.getItem('access_token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

function showAlert(message, type = 'success') {
    const result = document.getElementById('result');
    if (!result) return;
    result.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

async function loadRoles(selectEl, selectedId) {
    if (!selectEl) return;
    try {
        const resp = await fetch(`${API_BASE}/groups/`, {
            headers: getAuthHeaders()
        });
        const data = await resp.json();
        const roles = data?.results || data?.data || data || [];

        // Clear existing options except placeholder
        const placeholder = selectEl.querySelector('option[value=""]');
        selectEl.innerHTML = '';
        if (placeholder) {
            selectEl.appendChild(placeholder);
        } else {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = 'Select role';
            selectEl.appendChild(opt);
        }

        roles.forEach(role => {
            const opt = document.createElement('option');
            opt.value = role.id;
            opt.textContent = role.name || role.title || `Role ${role.id}`;
            if (selectedId && String(selectedId) === String(role.id)) {
                opt.selected = true;
            }
            selectEl.appendChild(opt);
        });
    } catch (err) {
        console.error('Failed to load roles', err);
        showAlert('Could not load roles. Please reload.', 'danger');
    }
}

async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    const userId = form.dataset.userId;
    const payload = {
        username: form.username.value.trim(),
        email: form.email.value.trim(),
        is_active: form.is_active.checked,
        is_locked: form.is_locked.checked,
        is_staff: form.is_staff.checked,
        group: form.role.value ? parseInt(form.role.value, 10) : null
    };

    const url = userId
        ? `${API_BASE}/users/${userId}/update/`
        : `${API_BASE}/users/create/`;
    const method = userId ? 'PATCH' : 'POST';

    try {
        const resp = await fetch(url, {
            method,
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        const data = await resp.json();
        if (resp.ok && data.success) {
            showAlert(data.message || 'Saved successfully', 'success');
            setTimeout(() => {
                window.location.href = '/i/users/list';
            }, 900);
        } else {
            const errMsg = data.error ? JSON.stringify(data.error) : 'Failed to save user';
            showAlert(errMsg, 'danger');
        }
    } catch (err) {
        console.error('Save user failed', err);
        showAlert('Network error while saving user', 'danger');
    }
}

export function initUserForm() {
    const form = document.getElementById('userForm');
    if (!form) return;

    const roleSelect = document.getElementById('roleSelect');
    const selectedRole = form.dataset.selectedRole || '';
    loadRoles(roleSelect, selectedRole);

    form.addEventListener('submit', handleSubmit);
}
