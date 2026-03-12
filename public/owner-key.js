// CONSIA OWNER SECURITY PRO

const CONSIA_OWNER_CONFIG = {
  ownerKey: "martin-owner-consia-001",
  storageKey: "CONSIA_OWNER_SESSION",
  biometricEnabled: true
};

function consiaSessionValid() {
  const raw = localStorage.getItem(CONSIA_OWNER_CONFIG.storageKey);
  if (!raw) return false;

  try {
    const data = JSON.parse(raw);
    return data && data.ok === true && data.key === CONSIA_OWNER_CONFIG.ownerKey;
  } catch {
    return false;
  }
}

function consiaSaveSession() {
  localStorage.setItem(
    CONSIA_OWNER_CONFIG.storageKey,
    JSON.stringify({
      ok: true,
      key: CONSIA_OWNER_CONFIG.ownerKey,
      ts: Date.now()
    })
  );
}

function consiaLogout() {
  localStorage.removeItem(CONSIA_OWNER_CONFIG.storageKey);
  location.reload();
}

async function consiaBiometricCheck() {
  try {
    if (!window.PublicKeyCredential) return false;

    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: "required",
        allowCredentials: []
      },
      mediation: "optional"
    });

    return true;
  } catch {
    return false;
  }
}

async function consiaUnlock() {
  const input = document.getElementById("ownerInput");
  const status = document.getElementById("ownerStatus");
  const value = (input?.value || "").trim();

  status.textContent = "Verificando...";

  if (value === CONSIA_OWNER_CONFIG.ownerKey) {
    consiaSaveSession();
    location.reload();
    return;
  }

  status.textContent = "Clave inválida.";
}

async function consiaTryBiometric() {
  const status = document.getElementById("ownerStatus");
  status.textContent = "Intentando biometría...";

  const ok = await consiaBiometricCheck();

  if (ok) {
    consiaSaveSession();
    location.reload();
    return;
  }

  status.textContent = "Biometría no disponible o no validada. Usá Owner Key.";
}

function consiaRenderLock() {
  document.body.innerHTML = `
  <div style="
    min-height:100vh;
    display:flex;
    align-items:center;
    justify-content:center;
    background:#020617;
    color:#fff;
    font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Roboto,sans-serif;
    padding:24px;
  ">
    <div style="
      width:100%;
      max-width:420px;
      background:#0b1220;
      border:1px solid #182238;
      border-radius:22px;
      padding:28px;
      text-align:center;
      box-sizing:border-box;
    ">
      <div style="
        width:64px;
        height:64px;
        margin:0 auto 18px;
        border-radius:18px;
        background:linear-gradient(135deg,#5b7cff,#7fa1ff);
        display:flex;
        align-items:center;
        justify-content:center;
        font-weight:700;
        font-size:26px;
      ">C</div>

      <div style="font-size:34px;font-weight:700;margin-bottom:10px;">CONSIA</div>
      <div style="font-size:20px;opacity:.82;margin-bottom:22px;">Owner authentication required</div>

      <input
        id="ownerInput"
        placeholder="Owner Key"
        style="
          width:100%;
          box-sizing:border-box;
          padding:16px;
          border:none;
          border-radius:14px;
          background:#111827;
          color:#fff;
          outline:none;
          font-size:16px;
          margin-bottom:14px;
        "
      />

      <button
        onclick="consiaUnlock()"
        style="
          width:100%;
          padding:14px 18px;
          border:none;
          border-radius:14px;
          background:#4f6cff;
          color:#fff;
          cursor:pointer;
          font-size:16px;
          margin-bottom:12px;
        "
      >
        Unlock
      </button>

      <button
        onclick="consiaTryBiometric()"
        style="
          width:100%;
          padding:14px 18px;
          border:1px solid #24314f;
          border-radius:14px;
          background:#111b30;
          color:#fff;
          cursor:pointer;
          font-size:16px;
        "
      >
        Biometría / Passkey
      </button>

      <div id="ownerStatus" style="margin-top:14px;opacity:.75;font-size:14px;">
        Acceso solo Owner.
      </div>
    </div>
  </div>
  `;

  const input = document.getElementById("ownerInput");
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") consiaUnlock();
  });
}

(function consiaOwnerGuard() {
  if (consiaSessionValid()) {
    window.CONSIA_OWNER = {
      authenticated: true,
      logout: consiaLogout
    };
    return;
  }

  document.addEventListener("DOMContentLoaded", () => {
    consiaRenderLock();
  });
})();
