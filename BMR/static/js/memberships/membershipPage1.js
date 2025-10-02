import { MembershipFormHandler } from './handlers/MembershipFormHandler.js';
import { AuthService } from '../shared/services/AuthService.js';
import { NotificationService } from '../shared/services/NotificationService.js';
import { MembershipManager } from './managers/MembershipManager.js';
import { setFieldValue, setMaskedFieldValue } from '../shared/utils/setFieldValue.js';

export const initMembershipPage1 = async () => {
    try {
        const form = document.getElementById('membership-page1');
        if (!form) {
            console.error('Membership form not found');
            return;
        }

        const authService = new AuthService();
        const notificationService = new NotificationService();

        // Initialize the form handler
        window.membershipApp = new MembershipFormHandler(form, {
            authService,
            notificationService
        });

        // Try to load existing membership data
        await loadExistingMembershipData(authService, notificationService);

        // Setup auto-selection and update handlers
        setupMembershipTypeHandlers();

    } catch (e) {
        console.error('Init failed:', e);
        const container = document.getElementById('notifications-container') || document.body;
        container.insertAdjacentHTML('afterbegin', `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <strong>Error:</strong> Failed to initialize form. Please check the console.
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `);
    }
};

async function loadExistingMembershipData(authService, notificationService) {
    try {
        const manager = new MembershipManager({ authService, notificationService });
        const membershipData = await manager.getMyMembership();

        if (membershipData && membershipData.profile_info) {
            console.log('Found existing membership data, auto-filling form...');
            populateFormWithData(membershipData);
        } else {
            console.log('No existing membership data found');
        }
    } catch (error) {
        // If error is 404 or membership not found, that's okay - user is new
        if (error?.response?.status === 404 || error?.message?.includes('not found')) {
            console.log('No existing membership found - new user');
        } else {
            console.error('Error loading membership data:', error);
        }
    }
}

function populateFormWithData(data) {
    // Profile Info
    if (data.profile_info) {
        setFieldValue('name', data.profile_info.full_name);
        setFieldValue('date_of_birth', data.profile_info.date_of_birth);
        setFieldValue('gender', data.profile_info.gender);
        setFieldValue('country_of_birth', data.profile_info.country_of_birth);
        setFieldValue('city_of_birth', data.profile_info.city_of_birth);
        setFieldValue('citizenship', data.profile_info.citizenship);

        // Handle profile picture preview
        if (data.profile_picture) {
            const preview = document.getElementById('profile_picture_preview');
            if (preview) {
                preview.src = data.profile_picture;
                preview.style.display = 'block';
            }
            // Make profile picture optional if already exists
            const fileInput = document.getElementById('profile_picture');
            if (fileInput) {
                fileInput.removeAttribute('required');
            }
        }
    }

    // Contact Info - Handle encrypted fields with masked values
    if (data.contact_info) {
        // Use masked values for display, store full values in data attributes
        setMaskedFieldValue('mobile',
            data.contact_info.primary_contact_masked,
            data.contact_info.primary_contact_full);

        setMaskedFieldValue('secondary_contact',
            data.contact_info.secondary_contact_masked,
            data.contact_info.secondary_contact_full);

        setMaskedFieldValue('nric_fin',
            data.contact_info.nric_fin_masked,
            data.contact_info.nric_fin_full);

        setFieldValue('residential_status', data.contact_info.residential_status);
        setFieldValue('postal_code', data.contact_info.postal_code);
        setFieldValue('address', data.contact_info.address);
    }

    // Membership Type
    if (data.membership_type) {
        setFieldValue('membership_type', data.membership_type);
    }

    // Initialize masked field toggles
    initializeMaskedFields();

    // Trigger auto-select after fields are populated
    setTimeout(() => {
        autoSelectMembershipType();
    }, 100);
}


function initializeMaskedFields() {
    // Add eye icons to masked fields
    const maskedFieldIds = ['nric_fin', 'mobile', 'secondary_contact'];

    maskedFieldIds.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field || !field.hasAttribute('data-full-value')) return;

        // Check if toggle button already exists
        if (field.parentElement.querySelector('.toggle-visibility')) return;

        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'btn btn-outline-primary toggle-visibility';
        toggleBtn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
        toggleBtn.style.cssText = 'position: absolute; right: 10px; top: 50%; transform: translateY(-50%); z-index: 10; padding: 0.25rem 0.5rem;';

        // Make parent position relative
        const parent = field.parentElement;
        if (parent.style.position !== 'relative') {
            parent.style.position = 'relative';
        }

        // Add padding to input to prevent text overlap with button
        field.style.paddingRight = '45px';

        // Append button
        parent.appendChild(toggleBtn);

        // Add click handler
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleFieldVisibility(fieldId);
        });
    });
}

function toggleFieldVisibility(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    const isMasked = field.getAttribute('data-is-masked') === 'true';
    const toggleBtn = field.parentElement.querySelector('.toggle-visibility');

    if (isMasked) {
        // Show full value
        const fullValue = field.getAttribute('data-full-value');
        if (fullValue) {
            field.value = fullValue;
            field.setAttribute('data-is-masked', 'false');
            if (toggleBtn) {
                toggleBtn.innerHTML = '<i class="fa-regular fa-eye"></i>';
            }
        }
    } else {
        // Show masked value
        const maskedValue = field.getAttribute('data-masked-value');
        if (maskedValue) {
            field.value = maskedValue;
            field.setAttribute('data-is-masked', 'true');
            if (toggleBtn) {
                toggleBtn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
            }
        }
    }
}

function setupMembershipTypeHandlers() {
    document.getElementById('residential_status')?.addEventListener('change', autoSelectMembershipType);
    document.getElementById('date_of_birth')?.addEventListener('change', autoSelectMembershipType);
    document.getElementById('membership_type')?.addEventListener('change', updateMembershipInfo);

    // Trigger on page load if values exist
    autoSelectMembershipType();
}

function autoSelectMembershipType() {
    const residentialStatus = document.getElementById('residential_status')?.value;
    const dob = document.getElementById('date_of_birth')?.value;
    const membershipTypeSelect = document.getElementById('membership_type');

    if (!residentialStatus || !membershipTypeSelect) {
        return;
    }

    // Determine if user is Ordinary or Associate member
    const isOrdinary = ['singaporean', 'permanent_resident'].includes(residentialStatus);
    const isStudentPass = residentialStatus === 'student_pass';

    // Check if senior (60+)
    const isSenior = (() => {
        if (!dob) return false;
        const birthDate = new Date(dob);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const hasHadBirthday = today.getMonth() > birthDate.getMonth() || (
            today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate()
        );
        return (hasHadBirthday ? age : age - 1) >= 60;
    })();

    // Auto-select appropriate membership type
    let targetMembershipName = '';

    if (isOrdinary) {
        if (isStudentPass) {
            targetMembershipName = 'Ordinary';
        } else if (isSenior) {
            targetMembershipName = 'Ordinary';
        } else {
            targetMembershipName = 'Ordinary';
        }
    } else {
        // Associate member
        if (isStudentPass) {
            targetMembershipName = 'Associate';
        } else if (isSenior) {
            targetMembershipName = 'Associate';
        } else {
            targetMembershipName = 'Associate';
        }
    }

    // Find and select the matching option (case-insensitive)
    for (let i = 0; i < membershipTypeSelect.options.length; i++) {
        const optionText = membershipTypeSelect.options[i].textContent.toLowerCase();
        if (optionText.includes(targetMembershipName.toLowerCase())) {
            membershipTypeSelect.selectedIndex = i;
            break;
        }
    }

    // Update the display info
    updateMembershipInfo();
}

function updateMembershipInfo() {
    const feeInfo = document.getElementById('membership-type-info');
    const memberTypeLabel = document.getElementById('member-type-label');
    const feeAmountSpan = document.getElementById('member-fee-amount');

    const membershipTypeSelect = document.getElementById('membership_type');

    if (!membershipTypeSelect || !feeInfo || !memberTypeLabel || !feeAmountSpan) {
        return;
    }

    const selectedOption = membershipTypeSelect.options[membershipTypeSelect.selectedIndex];

    if (!selectedOption || selectedOption.value === '') {
        feeInfo.style.display = 'none';
        return;
    }

    const residentialStatus = document.getElementById('residential_status')?.value;
    const dob = document.getElementById('date_of_birth')?.value;

    const amountText = selectedOption.textContent;
    const amountMatch = amountText.match(/\$([0-9.]+)/);

    let fee = 0;
    if (amountMatch) {
        fee = parseFloat(amountMatch[1]);
    }

    const isOrdinary = ['singaporean', 'permanent_resident'].includes(residentialStatus);
    const isStudentPass = residentialStatus === 'student_pass';
    const isSenior = (() => {
        if (!dob) return false;
        const birthDate = new Date(dob);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const hasHadBirthday = today.getMonth() > birthDate.getMonth() || (
            today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate()
        );
        return (hasHadBirthday ? age : age - 1) >= 60;
    })();

    let finalFee = (isStudentPass || isSenior) ? (fee / 2) : fee;

    // Build member type label
    let memberType = isOrdinary ? 'Ordinary' : 'Associate';
    if (isStudentPass) {
        memberType += ' (Student - 50% discount)';
    } else if (isSenior) {
        memberType += ' (Senior 60+ - 50% discount)';
    }

    memberTypeLabel.textContent = memberType;
    feeAmountSpan.textContent = finalFee.toFixed(2);
    feeInfo.style.display = 'block';
}

// Auto-init
if (typeof document !== 'undefined' && !window.__MEMBERSHIP_NO_AUTO_INIT__) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMembershipPage1);
    } else {
        initMembershipPage1();
    }
}