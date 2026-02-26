export async function onRequest(context) {
  return new Response(JSON.stringify({
    checkout_url: "https://buy.stripe.com/test_xxxxxxxxx"
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
