import { AuthService } from '../shared/services/AuthService.js';
import { NotificationService } from '../shared/services/NotificationService.js';
import { MembershipManager } from './managers/MembershipManager.js';

const normalizeQrUrl = (value = '') => {
    const trimmed = (value || '').trim();
    if (!trimmed) {
        return '';
    }
    const lowered = trimmed.toLowerCase();

    // If already a data URI or a base64 string (likely QR image)
    if (lowered.startsWith('data:image')) {
        return trimmed;
    }

    // If looks like raw base64 (no protocol and not a path)
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
        return `data:image/png;base64,${trimmed}`;
    }

    return trimmed;
};

const parsePaymentContext = () => {
    const element = document.getElementById('payment-context-data');
    if (!element) {
        return { qr_code_url: '', payment_amount: '', payment_currency: '', payment_uuid: '', payment_external_id: '' };
    }
    try {
        return JSON.parse(element.textContent);
    } catch (error) {
        console.error('Unable to parse payment context data.', error);
        return { qr_code_url: '', payment_amount: '', payment_currency: '', payment_uuid: '', payment_external_id: '' };
    }
};

const extractPayloadMessage = (payload) => {
    const fallback = 'Failed to upload slip. Please try again.';
    if (!payload) {
        return fallback;
    }
    if (typeof payload === 'string') {
        return payload;
    }
    if (payload.message) {
        return payload.message;
    }
    if (payload.detail) {
        return payload.detail;
    }
    if (payload.error) {
        if (typeof payload.error === 'string') {
            return payload.error;
        }
        if (typeof payload.error === 'object') {
            const key = Object.keys(payload.error)[0];
            if (key) {
                const value = payload.error[key];
                if (Array.isArray(value) && value.length) {
                    return value[0];
                }
                if (typeof value === 'string') {
                    return value;
                }
            }
        }
    }
    const firstKey = Object.keys(payload).find(
        (k) => Array.isArray(payload[k]) || typeof payload[k] === 'string'
    );
    if (firstKey) {
        const value = payload[firstKey];
        if (Array.isArray(value) && value.length) {
            return value[0];
        }
        if (typeof value === 'string') {
            return value;
        }
    }
    return fallback;
};

const extractErrorMessage = (error) => {
    if (error?.response?.data) {
        return extractPayloadMessage(error.response.data);
    }
    if (error?.message) {
        return error.message;
    }
    return 'Failed to upload slip. Please try again.';
};

export const initMembershipPage3 = () => {
    const form = document.getElementById('membership-page3');
    if (!form) {
        return;
    }

    const authService = new AuthService();
    const notificationService = new NotificationService();
    const manager = new MembershipManager({ authService, notificationService });

    const paynowRadio = document.getElementById('paynow');
    const cashRadio = document.getElementById('cash');
    const bankRadio = document.getElementById('bank_transfer');
    const paynowSection = document.getElementById('paynow-section');
    const uploadSection = document.getElementById('upload-section');
    const slipInput = document.getElementById('payment_screenshot');
    const previewWrapper = document.getElementById('payment-preview-wrapper');
    const previewImage = document.getElementById('payment-preview-image');
    const continueBtn = document.getElementById('step2-next');
    const feedback = document.getElementById('payment-feedback');
    const successBlock = document.getElementById('registration-success');
    const wizardStep = document.getElementById('step-2');
    const referenceField = document.getElementById('success-reference-no');

    const serverPayment = parsePaymentContext();
    const storedQrUrl = sessionStorage.getItem('membership_qr_code');
    const storedAmount = sessionStorage.getItem('membership_qr_amount');
    const storedCurrency = sessionStorage.getItem('membership_qr_currency');
    const storedPaymentUuid = sessionStorage.getItem('membership_payment_uuid');
    const storedPaymentExternalId = sessionStorage.getItem('membership_payment_external_id');

    const resolvedQrUrl = storedQrUrl || serverPayment.qr_code_url || '';
    const resolvedAmount = storedAmount || serverPayment.payment_amount || '';
    const resolvedCurrency = storedCurrency || serverPayment.payment_currency || '';
    const paymentUuid = storedPaymentUuid || serverPayment.payment_uuid || '';
    const paymentExternalId = storedPaymentExternalId || serverPayment.payment_external_id || '';

    const qrImg = document.getElementById('dynamic-qr');
    const qrInfo = document.getElementById('qr-info');
    const finalQrUrl = normalizeQrUrl(resolvedQrUrl);

    if (finalQrUrl && qrImg) {
        qrImg.src = finalQrUrl;
        qrImg.alt = 'PayNow QR Code';
        if (qrInfo) {
            if (resolvedAmount && resolvedCurrency) {
                qrInfo.innerHTML = `Scan to pay <strong>${resolvedAmount} ${resolvedCurrency}</strong> via PayNow.`;
            } else {
                qrInfo.innerHTML = 'Scan this QR code to make your payment via PayNow.';
            }
        }
        sessionStorage.setItem('membership_qr_code', finalQrUrl);
        if (resolvedAmount) {
            sessionStorage.setItem('membership_qr_amount', resolvedAmount);
        }
        if (resolvedCurrency) {
            sessionStorage.setItem('membership_qr_currency', resolvedCurrency);
        }
    } else if (qrImg) {
        qrImg.src = '/static/assets/images/forms/qr-code.png';
        if (qrInfo) {
            qrInfo.innerHTML = '<span class="text-danger">Payment QR not found. Please go back to Step 2 to regenerate.</span>';
        }
    }

    const showFeedback = (message, type = 'danger') => {
        if (!feedback) {
            return;
        }
        feedback.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
    };

    const resetSlipPreview = () => {
        if (previewWrapper) {
            previewWrapper.classList.add('d-none');
        }
        if (previewImage) {
            previewImage.src = '';
        }
    };

    const handleSlipPreview = () => {
        if (!slipInput) {
            return;
        }
        if (!slipInput.files.length) {
            resetSlipPreview();
            return;
        }
        const file = slipInput.files[0];
        if (!file) {
            resetSlipPreview();
            return;
        }
        if (file.type && !file.type.startsWith('image/')) {
            resetSlipPreview();
            showFeedback('Please select a valid image file (JPG, PNG, etc.).', 'danger');
            slipInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            if (!previewWrapper || !previewImage) {
                return;
            }
            const result = reader.result;
            if (typeof result !== 'string') {
                resetSlipPreview();
                return;
            }
            previewImage.src = result;
            previewWrapper.classList.remove('d-none');
        };
        reader.onerror = () => {
            resetSlipPreview();
            showFeedback('Unable to preview the selected image. Please try again.', 'danger');
        };
        reader.readAsDataURL(file);
    };

    if (slipInput) {
        slipInput.addEventListener('change', handleSlipPreview);
    }

    const toggleSections = () => {
        if (paynowRadio?.checked) {
            paynowSection?.classList.remove('d-none');
            uploadSection?.classList.add('d-none');
            resetSlipPreview();
            if (slipInput) {
                slipInput.value = '';
            }
        } else {
            paynowSection?.classList.add('d-none');
            uploadSection?.classList.remove('d-none');
        }
    };

    [paynowRadio, cashRadio, bankRadio]
        .filter(Boolean)
        .forEach((radio) => radio.addEventListener('change', toggleSections));
    toggleSections();

    const checkPaymentStatus = async () => {
        try {
            let url = '';
            if (paymentExternalId) {
                url = `/api/membership/payments/${encodeURIComponent(paymentExternalId)}/status/`;
            } else if (paymentUuid) {
                url = `/api/memberships/payment-status/?payment_uuid=${encodeURIComponent(paymentUuid)}`;
            } else {
                showFeedback('No payment identifier found. Please go back to Step 2 and regenerate payment.', 'danger');
                return false;
            }

            const headers = { 'Content-Type': 'application/json' };
            const token = localStorage.getItem('access_token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const resp = await fetch(url, {
                method: 'GET',
                headers
            });
            const data = await resp.json();
            if (resp.ok && data.success && data.data) {
                const status = (data.data.status || data.data.new_status || '').toLowerCase();
                if (status === 'paid') {
                    showFeedback('Complete Payment. Redirecting to your dashboard...', 'success');
                    setTimeout(() => { window.location.href = '/e/dashboard/'; }, 800);
                    return true;
                }
                showFeedback(`Payment status: ${status || 'unknown'}. If you already paid, please wait a few seconds and click Continue again.`, 'info');
                return false;
            }
            showFeedback('Could not check payment status. Please try again.', 'danger');
            return false;
        } catch (error) {
            console.error('Payment status check failed', error);
            showFeedback('Could not check payment status. Please try again.', 'danger');
            return false;
        }
    };

    // Auto-poll payment status every 6 seconds (up to 20 attempts) when PayNow selected
    let pollAttempts = 0;
    let pollTimer = null;
    const startPaymentPolling = () => {
        if (pollTimer || !paynowRadio?.checked) return;
        pollTimer = setInterval(async () => {
            pollAttempts += 1;
            const paid = await checkPaymentStatus();
            if (paid || pollAttempts >= 20) {
                clearInterval(pollTimer);
                pollTimer = null;
            }
        }, 6000);
    };
    startPaymentPolling();

    const uploadPaymentSlip = async () => {
        if (!slipInput || !slipInput.files.length) {
            showFeedback('Please upload your payment slip before continuing.', 'danger');
            return;
        }

        const method = cashRadio?.checked ? 'cash' : 'bank_transfer';
        const formData = new FormData();
        formData.append('method', method);
        formData.append('receipt_image', slipInput.files[0]);
        if (resolvedAmount) {
            formData.append('amount', resolvedAmount);
        }
        if (resolvedCurrency) {
            formData.append('currency', resolvedCurrency || 'SGD');
        }

        if (continueBtn) {
            continueBtn.disabled = true;
        }
        showFeedback('Uploading payment slip...', 'info');

        try {
            const payment = await manager.createOfflinePayment(formData);

            showFeedback('Payment slip uploaded successfully. We will review and confirm shortly.', 'success');
            if (wizardStep && successBlock) {
                wizardStep.classList.add('d-none');
                successBlock.classList.remove('d-none');
            }
            if (referenceField && payment) {
                referenceField.textContent = payment.reference_no || payment.uuid || '';
            }
        } catch (error) {
            console.error('Upload slip error', error);
            showFeedback(extractErrorMessage(error), 'danger');
        } finally {
            if (continueBtn) {
                continueBtn.disabled = false;
            }
        }
    };

    if (continueBtn) {
        continueBtn.addEventListener('click', (event) => {
            event.preventDefault();
            if (paynowRadio?.checked) {
                checkPaymentStatus();
                return;
            }
            uploadPaymentSlip();
        });
    }
};

if (typeof document !== 'undefined' && !window.__MEMBERSHIP_NO_AUTO_INIT__) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMembershipPage3);
    } else {
        initMembershipPage3();
    }
}
