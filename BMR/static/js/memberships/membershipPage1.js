import { MembershipFormHandler } from './handlers/MembershipFormHandler.js';
import { AuthService } from '../shared/services/AuthService.js';
import { NotificationService } from '../shared/services/NotificationService.js';

export const initMembershipPage1 = () => {
    try {
        const form = document.getElementById('membership-page1');
        if (!form) {
            console.error('Membership form not found');
            return;
        }

        window.membershipApp = new MembershipFormHandler(form, {
            authService: new AuthService(),
            notificationService: new NotificationService()
        });

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

// Auto-init
if (typeof document !== 'undefined' && !window.__MEMBERSHIP_NO_AUTO_INIT__) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMembershipPage1);
    } else {
        initMembershipPage1();
    }
}

    document.addEventListener('DOMContentLoaded', function() {
        document.getElementById('residential_status').addEventListener('change', autoSelectMembershipType);
        document.getElementById('date_of_birth').addEventListener('change', autoSelectMembershipType);
        document.getElementById('membership_type').addEventListener('change', updateMembershipInfo);

        // Trigger on page load if values exist
        autoSelectMembershipType();
    });

    function autoSelectMembershipType() {
        const residentialStatus = document.getElementById('residential_status').value;
        const dob = document.getElementById('date_of_birth').value;
        const membershipTypeSelect = document.getElementById('membership_type');

        if (!residentialStatus) {
            return; // Don't auto-select if residential status not chosen
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
                targetMembershipName = 'ordinary member (student)';
            } else if (isSenior) {
                targetMembershipName = 'ordinary member (senior)';
            } else {
                targetMembershipName = 'ordinary member';
            }
        } else {
            // Associate member
            if (isStudentPass) {
                targetMembershipName = 'associate member (student)';
            } else if (isSenior) {
                targetMembershipName = 'associate member (senior)';
            } else {
                targetMembershipName = 'associate member';
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
        const selectedOption = membershipTypeSelect.options[membershipTypeSelect.selectedIndex];

        if (!selectedOption || selectedOption.value === '') {
            feeInfo.style.display = 'none';
            return;
        }

        const residentialStatus = document.getElementById('residential_status').value;
        const dob = document.getElementById('date_of_birth').value;

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
