export const initMembershipPage3 = () => {
    const qrContainer = document.getElementById('qr-code-container');
    const qrImg = document.getElementById('qr-code-img');
    const qrAmount = document.getElementById('qr-amount');
    const qrCurrency = document.getElementById('qr-currency');

    const qrUrl = sessionStorage.getItem('membership_qr_code');
    const amount = sessionStorage.getItem('membership_qr_amount');
    const currency = sessionStorage.getItem('membership_qr_currency');

    if (qrUrl) {
        qrImg.src = qrUrl;
        qrAmount.textContent = amount;
        qrCurrency.textContent = currency;
        qrContainer.style.display = 'block';
    } else {
        qrContainer.innerHTML = `<div class="alert alert-warning">No QR code found. Please complete Page 2.</div>`;
        qrContainer.style.display = 'block';
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMembershipPage3);
} else {
    initMembershipPage3();
}
