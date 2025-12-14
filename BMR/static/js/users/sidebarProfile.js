import { AuthService } from '../shared/services/AuthService.js';

const defaultAvatar = '/static/assets/images/avtar/4.jpg';

const maskEmail = (email = '') => {
    if (!email.includes('@')) return email;
    const [user, domain] = email.split('@');
    const shown = user.slice(0, 3);
    return `${shown || '*'}***@${domain}`;
};

const pickName = (profile) => {
    return (
        profile?.first_name ||
        profile?.username ||
        profile?.email?.split('@')[0] ||
        'Member'
    );
};

const renderProfile = (profile, membership) => {
    const card = document.getElementById('sidebar-profile-card');
    if (!card) return;

    const avatarEl = card.querySelector('[data-sidebar-avatar]');
    const nameEl = card.querySelector('[data-sidebar-name]');
    const emailEl = card.querySelector('[data-sidebar-email]');
    const usernameEl = card.querySelector('[data-sidebar-username]');
    const badgeEl = card.querySelector('[data-sidebar-membership]');
    const refEl = card.querySelector('[data-sidebar-ref]');

    const fallbackAvatar = card.dataset.fallbackAvatar || defaultAvatar;
    const fallbackName = card.dataset.fallbackName || 'Member';
    const fallbackUsername = card.dataset.fallbackUsername || '';
    const fallbackEmail = card.dataset.fallbackEmail || '';
    const fallbackMembership = card.dataset.fallbackMembership || 'No Membership';

    const name = pickName(profile) || fallbackName;
    const email = profile?.email || fallbackEmail;
    const username = profile?.username || fallbackUsername;
    const avatar = profile?.profile_picture || fallbackAvatar;
    const membershipName =
        membership?.membership_type?.name ||
        membership?.membership_type_name ||
        fallbackMembership ||
        'No Membership';
    console.log('membership ref', membership);
    const membership_ref = membership?.reference_no || '';

    if (avatarEl) {
        avatarEl.src = avatar || defaultAvatar;
    }
    if (nameEl) nameEl.textContent = name;
    if (emailEl) emailEl.textContent = email ? maskEmail(email) : '';
    if (usernameEl) usernameEl.textContent = username ? `@${username}` : '';
    if (badgeEl) {
        badgeEl.textContent = membershipName;
        badgeEl.classList.toggle('bg-secondary', !membership || membershipName === 'No Membership');
        badgeEl.classList.toggle('bg-primary', !!membership && membershipName !== 'No Membership');
    }
    if (refEl) {
        const ref = membership?.reference_no || card.dataset.reference || '';
        refEl.textContent = ref;
    }

    // Update Membership link based on reference
    const membershipLink = document.getElementById('list-profile-list');
    if (membershipLink) {
        const ref = membership?.reference_no || card.dataset.reference_no || '';
        // const ref = membership?.reference_no || card.dataset.reference || '';
        const statusCode = membership?.workflow_status?.status_code || membership?.workflow_status || '';
        const isDraft = ['10', '11', '12'].includes(statusCode);
        if (ref && !isDraft) {
            membershipLink.href = `/memberships/details/?ref=${encodeURIComponent(ref)}`;
        } else {
            membershipLink.href = `/memberships/registration/step-1/`;
        }
    }
};

const fetchWithAuth = async (url, authService) => {
    const headers = { Accept: 'application/json' };
    const token = await authService.getValidToken().catch(() => null);
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const resp = await fetch(url, {
        headers,
        credentials: 'include',
    });
    if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
    }
    return resp.json();
};

const initSidebarProfile = async () => {
    const card = document.getElementById('sidebar-profile-card');
    if (!card || card.dataset.loaded === 'true') return;
    card.dataset.loaded = 'true';

    const authService = new AuthService();
    let profile = null;
    let membership = null;

    try {
        const profileJson = await fetchWithAuth('/api/auth/profile/', authService);
        profile = profileJson?.data || profileJson;
    } catch (err) {
        // fallback to template data
        profile = null;
    }

    try {
        const membershipJson = await fetchWithAuth('/api/membership/my-membership/', authService);
        membership = membershipJson?.data || membershipJson;
    } catch (err) {
        membership = null;
    }

    renderProfile(profile, membership);
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebarProfile);
} else {
    initSidebarProfile();
}
