const WA = "919948804698", SIZES = ["250 g", "500 g", "1 kg"];
const MENU = [
  {id: "pickles", title: "Pickles", te: "పచ్చళ్ళు", items: [
    ["Mango Pickle", "మామిడి ఆవకాయ"], ["Lemon Pickle", "నిమ్మకాయ పచ్చడి"], ["Gongura Pickle", "గోంగూర పచ్చడి"], ["Tomato Pickle", "టమాటా పచ్చడి"],
    ["Chicken Pickle", "చికెన్ పచ్చడి", 1], ["Mutton Pickle", "మటన్ పచ్చడి", 1], ["Fish Pickle", "చేపల పచ్చడి", 1], ["Prawn Pickle", "రొయ్యల పచ్చడి", 1]]},
  {id: "dryfruits", title: "Dry Fruits & Nuts", te: "డ్రై ఫ్రూట్స్", items: [
    ["Almonds", "బాదం"], ["Cashews", "జీడిపప్పు"], ["Pistachios", "పిస్తా"], ["Raisins", "కిస్మిస్"], ["Dates", "ఖర్జూరం"], ["Mixed Dry Fruits", "మిక్స్‌డ్ డ్రై ఫ్రూట్స్"]]},
  {id: "sweets", title: "Sweets", te: "మిఠాయిలు", items: [
    ["Besan Laddu", "శనగపిండి లడ్డు"], ["Rava Laddu", "రవ్వ లడ్డు"], ["Coconut Laddu", "కొబ్బరి లడ్డు"], ["Boondi Laddu", "బూందీ లడ్డు"], ["Mysore Pak", "మైసూర్ పాక్"], ["Kaju Sweets", "కాజు స్వీట్స్"]]},
  {id: "snacks", title: "Hot Snacks", te: "కారపు పిండివంటలు", items: [
    ["Murukku", "మురుకులు"], ["Chakli", "జంతికలు"], ["Mixture", "మిక్చర్"], ["Chekkalu", "చెక్కలు"], ["Ribbon Pakoda", "రిబ్బన్ పకోడీ"], ["Kara Boondi", "కారా బూందీ"], ["Masala Peanuts", "మసాలా పల్లీలు"], ["Spicy Cashews", "కారం జీడిపప్పు"]]}
];
const $ = id => document.getElementById(id);
let cart = {};
try { cart = JSON.parse(localStorage.getItem("tnsCart")) || {}; } catch (e) {}

if ($("menu")) {
  $("chips").innerHTML = MENU.map(c => `<a href="#${c.id}">${c.title}</a>`).join("");
  $("menu").innerHTML = MENU.map(c => `<section class="msec" id="${c.id}">
    <div class="msec-head"><img src="c_${c.id}.jpg" alt=""><h2><span class="te">${c.te}</span>${c.title}</h2></div>
    <ul class="items">${c.items.map(([n, te, nv], i) => `<li><span class="dot${nv ? " nv" : ""}" title="${nv ? "Non-veg" : "Veg"}"></span>
      <span class="name">${n}<span class="te">${te}</span></span>
      <select id="sz-${c.id}-${i}" aria-label="Pack size for ${n}">${SIZES.map((s, k) => `<option${k == 1 ? " selected" : ""}>${s}</option>`).join("")}</select>
      <button class="add" type="button" data-n="${n}" data-s="sz-${c.id}-${i}">Add</button></li>`).join("")}</ul></section>`).join("");
  $("menu").addEventListener("click", e => {
    const b = e.target.closest(".add"); if (!b) return;
    const k = b.dataset.n + "|" + $(b.dataset.s).value;
    cart[k] = (cart[k] || 0) + 1; render();
    b.textContent = "Added"; setTimeout(() => b.textContent = "Add", 900);
  });
  if (location.hash && $(location.hash.slice(1))) $(location.hash.slice(1)).scrollIntoView();
}

function orderText() {
  let t = "Hello TNS, I would like to order:\n" + Object.entries(cart).map(([k, q]) => `- ${k.replace("|", " (")}) x ${q}`).join("\n");
  const n = $("custName").value.trim(), a = $("custAddr").value.trim();
  if (n) t += "\n\nName: " + n;
  if (a) t += "\nDelivery: " + a;
  return t;
}
function render() {
  try { localStorage.setItem("tnsCart", JSON.stringify(cart)); } catch (e) {}
  const keys = Object.keys(cart), n = keys.reduce((a, k) => a + cart[k], 0);
  $("tray").hidden = !n;
  $("trayText").textContent = n + (n == 1 ? " pack" : " packs") + " in your order";
  $("cart").innerHTML = keys.map(k => { const [a, s] = k.split("|");
    return `<li><span class="name">${a}<small>${s}</small></span><span class="qty"><button type="button" data-k="${k}" data-d="-1" aria-label="Less">−</button>${cart[k]}<button type="button" data-k="${k}" data-d="1" aria-label="More">+</button></span></li>`; }).join("");
  $("send").href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(orderText());
  if (!n) $("panel").hidden = true;
}
$("cart").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  cart[b.dataset.k] += +b.dataset.d; if (cart[b.dataset.k] <= 0) delete cart[b.dataset.k]; render();
});
$("openCart").onclick = () => $("panel").hidden = false;
$("closeCart").onclick = () => $("panel").hidden = true;
$("panel").addEventListener("click", e => { if (e.target === $("panel")) $("panel").hidden = true; });
["custName", "custAddr"].forEach(i => $(i).addEventListener("input", render));
render();
