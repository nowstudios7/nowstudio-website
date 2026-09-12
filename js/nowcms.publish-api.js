/* NOW·STUDIO — CMS publish client.
   Không lưu mật khẩu/token ở trình duyệt: mật khẩu chỉ gửi một lần qua
   HTTPS tới /api/session để đổi lấy cookie phiên (HttpOnly, Secure). */
(function () {
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (html != null) e.innerHTML = html;
    return e;
  }

  function ensureOverlay() {
    var ov = document.getElementById('nowcms-auth-overlay');
    if (ov) return ov;
    document.head.appendChild(el('style', {}, '#nowcms-auth-overlay{position:fixed;inset:0;background:rgba(26,23,20,.55);display:flex;align-items:center;justify-content:center;z-index:9999;font-family:"DM Sans",Helvetica,sans-serif}' +
      '#nowcms-auth-overlay .card{background:#faf8f5;border:1px solid rgba(201,168,118,.4);border-radius:4px;padding:32px 28px;width:min(340px,88vw);box-shadow:0 20px 60px rgba(0,0,0,.25)}' +
      '#nowcms-auth-overlay h3{font-family:"Cormorant Garamond",Georgia,serif;font-weight:500;font-size:22px;color:#1a1714;margin-bottom:6px}' +
      '#nowcms-auth-overlay p{font-size:12.5px;color:#8a7e76;margin-bottom:16px}' +
      '#nowcms-auth-overlay input{width:100%;border:1px solid rgba(201,168,118,.4);border-radius:2px;padding:10px 12px;font-size:14px;margin-bottom:10px;background:#fff;box-sizing:border-box}' +
      '#nowcms-auth-overlay button{width:100%;background:#1a1714;color:#fff;border:0;border-radius:2px;padding:11px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;cursor:pointer}' +
      '#nowcms-auth-overlay button:hover{background:#a8864f}' +
      '#nowcms-auth-overlay .err{color:#b4552f;font-size:12px;margin-bottom:8px;display:none}'));
    ov = el('div', { id: 'nowcms-auth-overlay' },
      '<div class="card"><h3>Đăng nhập CMS</h3><p>Nhập mật khẩu để lưu thay đổi lên website.</p>' +
      '<div class="err" id="nowcms-auth-err">Sai mật khẩu, thử lại nhé.</div>' +
      '<input type="password" id="nowcms-auth-pass" placeholder="Mật khẩu" autocomplete="current-password">' +
      '<button type="button" id="nowcms-auth-submit">Đăng nhập</button></div>');
    ov.style.display = 'none';
    document.body.appendChild(ov);
    return ov;
  }

  function showLogin() {
    return new Promise(function (resolve) {
      var ov = ensureOverlay();
      ov.style.display = 'flex';
      var input = document.getElementById('nowcms-auth-pass');
      var btn = document.getElementById('nowcms-auth-submit');
      var err = document.getElementById('nowcms-auth-err');
      err.style.display = 'none';
      input.value = '';
      setTimeout(function () { input.focus(); }, 50);
      function submit() {
        var pw = input.value;
        if (!pw) return;
        btn.disabled = true;
        fetch('/api/session', {
          method: 'POST', credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pw })
        }).then(function (r) { return r.json().then(function (j) { return { r: r, j: j }; }); })
          .then(function (res) {
            btn.disabled = false;
            if (res.r.ok) { ov.style.display = 'none'; resolve(true); }
            else { err.style.display = 'block'; }
          }).catch(function () { btn.disabled = false; err.style.display = 'block'; });
      }
      btn.onclick = submit;
      input.onkeydown = function (e) { if (e.key === 'Enter') submit(); };
    });
  }

  function checkAuth() {
    return fetch('/api/session', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : { authenticated: false }; })
      .then(function (j) { return !!j.authenticated; })
      .catch(function () { return false; });
  }

  function publishFile(path, jsonObj, message) {
    function call() {
      return fetch('/api/publish', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: path, content: jsonObj, message: message })
      }).then(function (r) { return r.json().then(function (j) { return { status: r.status, j: j }; }); });
    }
    return call().then(function (res) {
      if (res.status === 401) {
        return showLogin().then(function () { return call(); }).then(function (res2) { return res2.j; });
      }
      return res.j;
    }).catch(function (e) {
      return { ok: false, error: String((e && e.message) || e) };
    });
  }

  window.NOWCMSPublish = { checkAuth: checkAuth, showLogin: showLogin, publishFile: publishFile };
})();
