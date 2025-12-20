import { MembershipRepository } from './repositories/MembershipRepository.js';

const setText = (selector, value) => {
    const el = document.querySelector(selector);
    if (el) {
        el.textContent = value || '-';
    }
};

const populateFields = (membership) => {
    if (!membership) return;
    const p = membership.profile_info || {};
    const c = membership.contact_info || {};
    const e = membership.education_info || {};
    const w = membership.work_info || {};
    setText('[data-mship="profile-name"]', p.full_name);
    setText('[data-mship="profile-gender"]', p.gender_display || p.gender);
    setText('[data-mship="profile-dob"]', p.date_of_birth);
    setText('[data-mship="profile-citizenship"]', p.citizenship_display || p.citizenship);

    setText('[data-mship="contact-nric"]', c.nric_fin_masked || c.nric_fin);
    setText('[data-mship="contact-primary"]', c.primary_contact);
    setText('[data-mship="contact-secondary"]', c.secondary_contact);
    setText('[data-mship="contact-address"]', c.address);

    setText('[data-mship="edu-level"]', e.education_name || e.education);
    setText('[data-mship="edu-inst"]', e.institution_name || e.institution);
    setText('[data-mship="edu-soc"]', e.other_societies);

    setText('[data-mship="work-occ"]', w.occupation);
    setText('[data-mship="work-company"]', w.company_name);
    setText('[data-mship="work-contact"]', w.company_contact);
    setText('[data-mship="work-address"]', w.company_address);
};

const initDashboardMembership = async () => {
    const wrapper = document.getElementById('membership-details-wrapper');
    if (!wrapper || wrapper.dataset.loaded === 'true') return;
    wrapper.dataset.loaded = 'true';

    const repo = new MembershipRepository();

    try {
        const membership = await repo.getMyMembership();
        populateFields(membership);
    } catch (err) {
        console.warn('Failed to load membership via API, falling back to server-rendered values.', err);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboardMembership);
} else {
    initDashboardMembership();
}
