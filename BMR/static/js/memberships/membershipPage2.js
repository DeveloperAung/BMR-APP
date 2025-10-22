import { AuthService } from '../shared/services/AuthService.js';
import { NotificationService } from '../shared/services/NotificationService.js';
import { MembershipManager } from './managers/MembershipManager.js';
import { setFieldValue, setMaskedFieldValue } from '../shared/utils/setFieldValue.js';

export const initMembershipPage2 = async () => {
    try {
        const form = document.getElementById('membership-page2');
        if (!form) {
            console.error('Membership page2 form not found');
            return;
        }

        const authService = new AuthService();
        const notificationService = new NotificationService();
        const manager = new MembershipManager({ authService, notificationService });

        // Try to load existing membership
        const membershipData = await manager.getMyMembership();
        if (membershipData) {
            populatePage2Form(membershipData);
        }

        // Hook up submit handler
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const formData = new FormData(form);

                const payload = {
                    education_info: {
                        education: formData.get('education'),
                        institution: formData.get('institution'),
                        other_societies: formData.get('other_societies')
                    },
                    work_info: {
                        occupation: formData.get('occupation'),
                        company_name: formData.get('company_name'),
                        company_address: formData.get('company_address'),
                        company_postal_code: formData.get('company_postal_code'),
                        company_contact: formData.get('company_contact')
                    }
                };

                const response = await manager.submitPage2(payload);
                console.log("Return response", response)
                const qrUrl = response?.qr_code_url;
                console.log("QRUrl", qrUrl)
                const amount = response?.payment_amount;
                const currency = response?.payment_currency;

                if (qrUrl) {
                    sessionStorage.setItem('membership_qr_code', qrUrl);
                    sessionStorage.setItem('membership_qr_amount', amount);
                    sessionStorage.setItem('membership_qr_currency', currency);

                    // Redirect to Page3
                    window.location.href = '/memberships/registration/step-3/';
                }
                else
                {
                    notificationService.showError('Payment QR Code error. Please try again!');
                    window.location.href = '/memberships/registration/step-3/';
                }
            } catch (err) {
                console.error('Submit page 2 failed:', err);
                notificationService.showError('Failed to submit page 2. Please try again.');
            }
        });

    } catch (e) {
        console.error('Init Page2 failed:', e);
    }
};

function populatePage2Form(data) {
    // Education Info
    if (data.education_info) {
        setFieldValue('education', data.education_info.education);
        setFieldValue('institution', data.education_info.institution);
        setFieldValue('other_societies', data.education_info.other_societies);
    }

    // Work Info
    if (data.work_info) {
        setFieldValue('occupation', data.work_info.occupation);
        setFieldValue('company_name', data.work_info.company_name);
        setFieldValue('company_address', data.work_info.company_address);
        setFieldValue('company_postal_code', data.work_info.company_postal_code);

        // Work contact is encrypted/masked like contact_info
        if (data.work_info.company_contact_masked) {
            setMaskedFieldValue(
                'company_contact',
                data.work_info.company_contact_masked,
                data.work_info.company_contact_full
            );
        }
    }
}

// Auto-init
if (typeof document !== 'undefined' && !window.__MEMBERSHIP_NO_AUTO_INIT__) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMembershipPage2);
    } else {
        initMembershipPage2();
    }
}
