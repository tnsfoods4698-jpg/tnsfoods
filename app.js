const API = "https://script.google.com/macros/s/AKfycbzMrwkq-UDHKfu8lB9Kk6ZOuX6lSo8ESb8A_uITJK9AtAWeAvt1nDvP3uG4cSpzjUjY/exec";
function api(d) { return fetch(API, {method: "POST", body: JSON.stringify(d)}).then(r => r.json()); }
let WA = "919948804698";
// Picture and Telugu heading for the categories we know. New categories from the sheet still show, with the logo.
const CAT_INFO = {"Pickles": ["pickles", "పచ్చళ్ళు"], "Dry Fruits & Nuts": ["dryfruits", "డ్రై ఫ్రూట్స్"], "Sweets": ["sweets", "మిఠాయిలు"], "Hot Snacks": ["snacks", "కారపు పిండివంటలు"]};
// Built-in menu, used until the live menu arrives from the Google Sheet.
const BUILT_IN = {
  "Pickles": [["Mango Pickle", "మామిడి ఆవకాయ"], ["Lemon Pickle", "నిమ్మకాయ పచ్చడి"], ["Gongura Pickle", "గోంగూర పచ్చడి"], ["Tomato Pickle", "టమాటా పచ్చడి"], ["Chicken Pickle", "చికెన్ పచ్చడి", 1], ["Mutton Pickle", "మటన్ పచ్చడి", 1], ["Fish Pickle", "చేపల పచ్చడి", 1], ["Prawn Pickle", "రొయ్యల పచ్చడి", 1]],
  "Dry Fruits & Nuts": [["Almonds", "బాదం"], ["Cashews", "జీడిపప్పు"], ["Pistachios", "పిస్తా"], ["Raisins", "కిస్మిస్"], ["Dates", "ఖర్జూరం"], ["Mixed Dry Fruits", "మిక్స్‌డ్ డ్రై ఫ్రూట్స్"]],
  "Sweets": [["Besan Laddu", "శనగపిండి లడ్డు"], ["Rava Laddu", "రవ్వ లడ్డు"], ["Coconut Laddu", "కొబ్బరి లడ్డు"], ["Boondi Laddu", "బూందీ లడ్డు"], ["Mysore Pak", "మైసూర్ పాక్"], ["Kaju Sweets", "కాజు స్వీట్స్"]],
  "Hot Snacks": [["Murukku", "మురుకులు"], ["Chakli", "జంతికలు"], ["Mixture", "మిక్చర్"], ["Chekkalu", "చెక్కలు"], ["Ribbon Pakoda", "రిబ్బన్ పకోడీ"], ["Kara Boondi", "కారా బూందీ"], ["Masala Peanuts", "మసాలా పల్లీలు"], ["Spicy Cashews", "కారం జీడిపప్పు"]]
};
let DATA = {sizes: ["250 g", "500 g", "1 kg"], items: []};
Object.keys(BUILT_IN).forEach(c => BUILT_IN[c].forEach(([name, te, nv]) => DATA.items.push({cat: c, name, te, nv: !!nv, prices: {}})));

const $ = id => document.getElementById(id);
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
const rs = n => "₹" + Number(n).toLocaleString("en-IN");
let cart = {};
try { cart = JSON.parse(localStorage.getItem("tnsCart")) || {}; } catch (e) {}
try { const c = JSON.parse(localStorage.getItem("tnsMenu")); if (c && c.items && c.items.length) DATA = c; } catch (e) {}

function sizesFor(it) { const p = DATA.sizes.filter(s => it.prices[s]); return p.length ? p : DATA.sizes; }
function priceOf(name, size) { const it = DATA.items.find(i => i.name === name); return it && it.prices[size] ? it.prices[size] : 0; }
function catId(c) { return CAT_INFO[c] ? CAT_INFO[c][0] : c.toLowerCase().replace(/[^a-z0-9]+/g, "-"); }

function renderMenu() {
  if (!$("menu")) return;
  const cats = [];
  DATA.items.forEach(i => { if (cats.indexOf(i.cat) < 0) cats.push(i.cat); });
  $("chips").innerHTML = cats.map(c => `<a href="#${catId(c)}">${esc(c)}</a>`).join("");
  $("menu").innerHTML = cats.map(c => {
    const info = CAT_INFO[c];
    return `<section class="msec" id="${catId(c)}">
    <div class="msec-head"><img src="${info ? "c_" + info[0] + ".jpg" : "logo.jpg"}" alt=""><h2>${info ? `<span class="te">${info[1]}</span>` : ""}${esc(c)}</h2></div>
    <ul class="items">${DATA.items.map((it, i) => it.cat !== c ? "" : `<li><span class="dot${it.nv ? " nv" : ""}" title="${it.nv ? "Non-veg" : "Veg"}"></span>
      <span class="name">${esc(it.name)}<span class="te">${esc(it.te)}</span></span>
      <select id="sz-${i}" aria-label="Pack size for ${esc(it.name)}">${sizesFor(it).map((s, k, a) => `<option value="${esc(s)}"${k === Math.min(1, a.length - 1) ? " selected" : ""}>${esc(s)}${it.prices[s] ? " · " + rs(it.prices[s]) : ""}</option>`).join("")}</select>
      <button class="add" type="button" data-i="${i}">Add</button></li>`).join("")}</ul></section>`;
  }).join("");
}
if ($("menu")) {
  $("menu").addEventListener("click", e => {
    const b = e.target.closest(".add"); if (!b) return;
    const k = DATA.items[b.dataset.i].name + "|" + $("sz-" + b.dataset.i).value;
    cart[k] = (cart[k] || 0) + 1; render();
    b.textContent = "Added"; setTimeout(() => b.textContent = "Add", 900);
  });
  renderMenu();
  if (location.hash && $(location.hash.slice(1))) $(location.hash.slice(1)).scrollIntoView();
}
api({action: "menu"}).then(r => {
  if (!r.ok || !r.items || !r.items.length) return;
  DATA = {sizes: r.sizes, items: r.items, settings: r.settings || null};
  try { localStorage.setItem("tnsMenu", JSON.stringify(DATA)); } catch (e) {}
  renderMenu(); applySettings(); render();
}).catch(() => {});

// Contact details come from the Settings tab of the sheet; the page keeps its built-in ones if a field is empty.
function applySettings() {
  const s = DATA.settings; if (!s) return;
  const digits = v => String(v || "").replace(/\D/g, ""), each = (q, f) => document.querySelectorAll(q).forEach(f);
  const intl = v => { const d = digits(v); return d.length === 10 ? "91" + d : d; };
  const pretty = v => { const d = digits(v).slice(-10); return d.length === 10 ? d.slice(0, 5) + " " + d.slice(5) : String(v); };
  ["phone1", "phone2"].forEach(k => each('[data-tel="' + k + '"]', el => {
    if (digits(s[k]).length >= 10) { el.href = "tel:+" + intl(s[k]); el.textContent = pretty(s[k]); el.hidden = false; } else el.hidden = true; }));
  if (digits(s.whatsapp).length >= 10) { WA = intl(s.whatsapp); each("[data-wa]", el => el.href = "https://wa.me/" + WA); }
  each("[data-mail]", el => { if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.email || "")) { el.href = "mailto:" + s.email; el.textContent = s.email; el.hidden = false; } else el.hidden = true; });
  if (s.address) each('[data-set="address"]', el => el.textContent = s.address);
  if (/^https:\/\/(www\.)?instagram\.com\//.test(s.instagram || "")) each("[data-ig]", el => {
    el.href = s.instagram; if (el.hasAttribute("data-ig-name")) el.textContent = "@" + s.instagram.split("instagram.com/")[1].split(/[/?#]/)[0]; });
  if (/^https:\/\//.test(s.maps || "")) each("[data-map]", el => el.href = s.maps);
  each("[data-fssai]", el => { el.hidden = !s.fssai; if (s.fssai) el.querySelector("span").textContent = s.fssai; });
  each("[data-upi]", el => { el.hidden = !upiId(); if (upiId()) el.querySelector("strong").textContent = upiId(); });
  each("[data-siteqr]", el => { el.innerHTML = qrSvg(/^https:\/\//.test(s.qr || "") ? s.qr : SITE); });
}
const SITE = "https://tnsfoods4698-jpg.github.io/tnsfoods/";
function upiId() { const u = (DATA.settings && DATA.settings.upi || "").trim(); return /^[\w.\-]{2,}@[a-zA-Z0-9]{2,}$/.test(u) ? u : ""; }
function qrSvg(text) {
  if (typeof qrcode === "undefined") return "";
  const q = qrcode(0, "M"); q.addData(text); q.make();
  return q.createSvgTag({cellSize: 5, margin: 4, scalable: true});
}
document.querySelectorAll("[data-siteqr]").forEach(el => { if (!el.innerHTML) el.innerHTML = qrSvg(SITE); });
applySettings();
function payMethod() { return $("payCod").checked ? "Cash on delivery" : "UPI"; }
function showPay(id, sum, unpriced) {
  const u = payMethod() === "UPI" ? upiId() : ""; $("payBox").hidden = !u; if (!u) return;
  const amt = sum && !unpriced ? sum : 0;
  const link = "upi://pay?pa=" + encodeURIComponent(u) + "&pn=" + encodeURIComponent("TNS Homemade Foods") + (amt ? "&am=" + amt.toFixed(2) : "") + "&cu=INR" + (id ? "&tn=" + encodeURIComponent(id) : "");
  $("payAmt").textContent = amt ? rs(amt) : "";
  $("payQr").innerHTML = qrSvg(link);
  $("payId").textContent = u;
  $("payLink").href = link;
  $("payNote").textContent = amt ? "Scan with any UPI app, or tap the button on your phone. Add delivery charges only if we tell you on WhatsApp."
    : "Some items are priced on WhatsApp. Please pay after we send you the final amount.";
}

let loc = "";
function lines() {
  return Object.entries(cart).map(([k, q]) => { const [name, size] = k.split("|"), p = priceOf(name, size); return {k, name, size, q, p, amt: p * q}; });
}
function totalText() {
  const l = lines(), sum = l.reduce((a, x) => a + x.amt, 0), unpriced = l.some(x => !x.p);
  if (!sum) return "";
  return rs(sum) + (unpriced ? " plus items we will price on WhatsApp" : "");
}
function itemsText() { return lines().map(x => `- ${x.name} (${x.size}) x ${x.q}${x.p ? " = " + rs(x.amt) : ""}`).join("\n"); }
function waLink(id) {
  let t = "Hello TNS, I would like to order:\n" + itemsText();
  const n = $("custName").value.trim(), ph = $("custPhone").value.trim(), a = $("custAddr").value.trim(), tot = totalText();
  if (tot) t += "\nTotal: " + tot;
  t += "\nPayment: " + payMethod();
  if (id) t += "\n\nOrder number: " + id;
  if (n) t += "\nName: " + n;
  if (ph) t += "\nPhone: " + ph;
  if (a) t += "\nDelivery: " + a;
  if (loc) t += "\nLocation: " + loc;
  return "https://wa.me/" + WA + "?text=" + encodeURIComponent(t);
}
function render() {
  try { localStorage.setItem("tnsCart", JSON.stringify(cart)); } catch (e) {}
  const l = lines(), n = l.reduce((a, x) => a + x.q, 0), tot = totalText();
  $("tray").hidden = !n;
  $("trayText").textContent = n + (n == 1 ? " pack" : " packs") + " in your order" + (tot ? " · " + tot : "");
  $("cart").innerHTML = l.map(x => `<li><span class="name">${esc(x.name)}<small>${esc(x.size)}${x.p ? " · " + rs(x.p) + " each" : ""}</small></span><span class="qty"><button type="button" data-k="${esc(x.k)}" data-d="-1" aria-label="Less">−</button>${x.q}<button type="button" data-k="${esc(x.k)}" data-d="1" aria-label="More">+</button></span>${x.p ? `<span class="amt">${rs(x.amt)}</span>` : ""}</li>`).join("")
    + (tot ? `<li class="total"><span class="name">Total</span><span class="amt">${esc(tot)}</span></li>` : "");
  if (!n && $("orderDone").hidden) $("panel").hidden = true;
}
$("cart").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  cart[b.dataset.k] += +b.dataset.d; if (cart[b.dataset.k] <= 0) delete cart[b.dataset.k]; render();
});
$("locBtn").onclick = () => {
  if (!navigator.geolocation) { $("locMsg").textContent = "This phone cannot share location. Please type your address."; return; }
  $("locMsg").textContent = "Finding your location...";
  navigator.geolocation.getCurrentPosition(p => {
    loc = "https://www.google.com/maps?q=" + p.coords.latitude.toFixed(6) + "," + p.coords.longitude.toFixed(6);
    $("locMsg").textContent = "Location added to your order.";
    $("locBtn").textContent = "Update my location";
  }, () => { $("locMsg").textContent = "Could not get your location. Allow location for this site, or just type your address."; },
  {enableHighAccuracy: true, timeout: 15000});
};
$("place").onclick = () => {
  const ph = $("custPhone").value.replace(/\D/g, ""), err = $("orderErr");
  err.hidden = true;
  if (!Object.keys(cart).length) return;
  if (ph.length < 10) { err.textContent = "Please enter your 10 digit phone number so we can confirm the order."; err.hidden = false; $("custPhone").focus(); return; }
  $("place").disabled = true; $("place").textContent = "Placing your order...";
  const done = id => {
    const l = lines();
    showPay(id, l.reduce((a, x) => a + x.amt, 0), l.some(x => !x.p));
    $("send").href = waLink(id);
    $("doneLine").textContent = id ? "Order number " + id : "Almost done";
    $("doneMsg").textContent = id ? "We have your order. Send it on WhatsApp too and we will confirm the price and delivery. Keep the order number to track it."
      : "We could not save your order online. Please send it on WhatsApp so that we receive it.";
    $("doneMsg").textContent += payMethod() === "Cash on delivery" ? " You chose cash on delivery." : (upiId() ? "" : " We will send our UPI details on WhatsApp.");
    $("trackLink").hidden = !id;
    if (id) { $("trackLink").href = "track.html#" + id; try { localStorage.setItem("tnsLastOrder", id); } catch (e) {} }
    $("orderForm").hidden = true; $("orderDone").hidden = false;
    cart = {}; render();
    $("place").disabled = false; $("place").textContent = "Place order";
  };
  api({action: "order", name: $("custName").value, phone: $("custPhone").value, address: $("custAddr").value, location: loc, items: itemsText(), total: totalText(), method: payMethod()})
    .then(r => done(r.ok ? r.id : "")).catch(() => done(""));
};
$("openCart").onclick = () => { $("orderForm").hidden = false; $("orderDone").hidden = true; $("panel").hidden = false; };
$("closeCart").onclick = () => $("panel").hidden = true;
$("panel").addEventListener("click", e => { if (e.target === $("panel")) $("panel").hidden = true; });
render();
