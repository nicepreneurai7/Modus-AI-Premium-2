const PADDLE_ENV = "production";
const PADDLE_CLIENT_TOKEN = "live_d4041fa94376cd77b63e7e1d97a";
const PADDLE_PRICE_ID_MONTHLY = "pri_01kwh9qy26akbrdsxx47bexrkm";
function initPaddle() {
  if (!window.Paddle) return;
  if (PADDLE_ENV === "sandbox") Paddle.Environment.set("sandbox");
  Paddle.Initialize({ token: PADDLE_CLIENT_TOKEN, eventCallback: function (event) { if (event.name === "checkout.completed") { handleCheckoutCompleted(event.data); } } });
}
function openUpgradeCheckout(userEmail, userId) {
  if (!window.Paddle) { showToast("Checkout is still loading — try again in a moment."); return; }
  Paddle.Checkout.open({ items: [{ priceId: PADDLE_PRICE_ID_MONTHLY, quantity: 1 }], customer: { email: userEmail }, customData: { supabase_user_id: userId }, settings: { displayMode: "overlay", theme: document.documentElement.classList.contains("dark") ? "dark" : "light" } });
}
async function handleCheckoutCompleted(data) {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;
    await supabaseClient.from("profiles").update({ subscription_status: "paid", paddle_subscription_id: data?.transaction_id || null }).eq("id", session.user.id);
    showToast("You're upgraded! Unlimited generations unlocked.");
    setTimeout(() => window.location.reload(), 1200);
  } catch (err) { console.error(err); }
}
document.addEventListener("DOMContentLoaded", () => { setTimeout(initPaddle, 300); });
