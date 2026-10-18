// Zugang nur mit Passwort: der App-Code liegt verschlüsselt in app.enc (AES-GCM, Schlüssel aus dem
// Passwort per PBKDF2). Nach richtiger Eingabe merkt sich das Gerät den Schlüssel, auch offline.
(function () {
  var KEY = "tonleitern-key";
  var lang = (localStorage.getItem("tonleitern-lang") || navigator.language || "de").slice(0, 2);
  var T = {
    de: ["Passwort", "Öffnen", "Falsches Passwort", "Bitte einmal mit Internet öffnen."],
    en: ["Password", "Open", "Wrong password", "Please open once with internet."],
    fr: ["Mot de passe", "Ouvrir", "Mot de passe incorrect", "Ouvrez une fois avec internet."],
    ro: ["Parolă", "Deschide", "Parolă greșită", "Deschide o dată cu internet."],
  }[lang] || ["Passwort", "Öffnen", "Falsches Passwort", "Bitte einmal mit Internet öffnen."];
  var enc = null;
  var subtle = crypto.subtle;

  function b64(buf) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(buf)));
  }
  function unb64(s) {
    return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); });
  }
  function load() {
    if (enc) return Promise.resolve(enc);
    return fetch("app.enc").then(function (r) {
      if (!r.ok) throw new Error("net");
      return r.arrayBuffer();
    }).then(function (b) { return (enc = new Uint8Array(b)); });
  }
  function run(rawKey) {
    return load().then(function (d) {
      return subtle.importKey("raw", rawKey, "AES-GCM", true, ["decrypt"]).then(function (k) {
        return subtle.decrypt({ name: "AES-GCM", iv: d.slice(16, 28) }, k, d.slice(28));
      });
    }).then(function (plain) {
      var s = document.createElement("script");
      s.textContent = new TextDecoder().decode(plain);
      var g = document.getElementById("gate");
      if (g) g.remove();
      document.body.appendChild(s);
    });
  }
  function fromPassword(pw) {
    return load().then(function (d) {
      return subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveBits"]).then(function (base) {
        return subtle.deriveBits({ name: "PBKDF2", salt: d.slice(0, 16), iterations: 150000, hash: "SHA-256" }, base, 256);
      });
    });
  }
  function showForm(msg) {
    var g = document.getElementById("gate");
    if (!g) {
      g = document.createElement("div");
      g.id = "gate";
      g.innerHTML =
        '<form><h1><small>Petru IUGA</small>TuneMetroScales</h1><label for="gate-pw"></label>' +
        '<input id="gate-pw" type="password" autocomplete="current-password">' +
        '<button type="submit"></button><p class="gate-err"></p></form>';
      document.body.appendChild(g);
      g.querySelector("label").textContent = T[0];
      g.querySelector("button").textContent = T[1];
      g.querySelector("form").addEventListener("submit", function (e) {
        e.preventDefault();
        var pw = g.querySelector("input").value;
        if (!pw) return;
        g.querySelector("button").disabled = true;
        fromPassword(pw).then(function (raw) {
          return run(raw).then(function () {
            try { localStorage.setItem(KEY, b64(raw)); } catch (err) { /* privates Fenster */ }
          });
        }).catch(function (err) {
          g.querySelector("button").disabled = false;
          showForm(err && err.message === "net" ? T[3] : T[2]);
        });
      });
    }
    g.querySelector(".gate-err").textContent = msg || "";
    g.querySelector("input").focus();
  }

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (err) { /* kein Speicher */ }
  if (saved) {
    run(unb64(saved)).catch(function () {
      // Passwort wurde geändert: neu fragen
      try { localStorage.removeItem(KEY); } catch (err) { /* egal */ }
      showForm("");
    });
  } else {
    showForm("");
  }
})();
