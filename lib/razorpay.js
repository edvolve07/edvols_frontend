const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

let loadPromise = null;

export function loadRazorpayScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (window.Razorpay) return Promise.resolve(window.Razorpay);

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="' + RAZORPAY_SCRIPT_URL + '"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.Razorpay));
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay")));
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error("Failed to load Razorpay script"));
    document.body.appendChild(script);
  });

  return loadPromise;
}

export async function openRazorpayCheckout(options) {
  const Razorpay = await loadRazorpayScript();

  return new Promise((resolve, reject) => {
    const rzp = new Razorpay({
      ...options,
      modal: {
        ondismiss: () => resolve({ cancelled: true }),
        ...options.modal,
      },
      handler: (response) => resolve(response),
    });

    rzp.on("payment.failed", (response) => {
      reject(new Error(response.error?.description || "Payment failed"));
    });

    rzp.open();
  });
}

export function createUpgradePlanKey(targetLevel) {
  return `level_upgrade_${targetLevel}`;
}