function money(v){return '₹'+Number(v||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});}
function getDashboardBills(){try{return JSON.parse(firebaseStore.getItem('sriTabemashouBills')||'[]')||[]}catch{return[]}}
function getDashboardInventory(){try{const x=JSON.parse(firebaseStore.getItem('inventory')||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}catch{return{}}}
function stockValue(r){for(const k of ['stock','quantity','qty','currentStock','availableStock','units']){if(r&&r[k]!==undefined){const n=Number(r[k]);if(Number.isFinite(n))return n}}return 0}
function renderDashboard(){const today=new Date();const key=today.toISOString().slice(0,10);const allBills=getDashboardBills();const bills=allBills.filter(b=>{if(b.status==='voided')return false;const d=new Date(b.date||b.createdAt||b.timestamp);return !isNaN(d)&&d.toISOString().slice(0,10)===key});
let sales=0,cash=0,upi=0,card=0;bills.forEach(b=>{const t=Number(b.grandTotal??b.total??0)||0;sales+=t;const p=String(b.paymentMethod||'Cash').toLowerCase();if(p.includes('upi')||p.includes('online'))upi+=t;else if(p.includes('card'))card+=t;else cash+=t});
document.getElementById('dashSales').textContent=money(sales);document.getElementById('dashBills').textContent=bills.length;document.getElementById('dashCash').textContent=money(cash);document.getElementById('dashUPI').textContent=money(upi);document.getElementById('dashCard').textContent=money(card);
const inv=getDashboardInventory();const low=Object.entries(inv).filter(([,r])=>Number(r.reorderLevel??r.minStock??r.lowStock??0)>0&&stockValue(r)<=Number(r.reorderLevel??r.minStock??r.lowStock));document.getElementById('dashLowStock').textContent=low.length;
const recent=allBills.filter(b=>b.status!=='voided').sort((a,b)=>new Date(b.date||0)-new Date(a.date||0)).slice(0,6);document.getElementById('recentBills').innerHTML=recent.length?recent.map(b=>`<div class="recent-row"><div><strong>${escapeHTML(String(b.billNumber||'Bill'))}</strong><small>${escapeHTML(String(b.customerName||'Walk-in'))} • ${escapeHTML(String(b.orderType||b.tableNumber||'Normal'))}</small></div><strong>${money(b.grandTotal??b.total)}</strong></div>`).join(''):'<div class="empty">No bills yet.</div>';
document.getElementById('lowStockList').innerHTML=low.length?low.slice(0,8).map(([k,r])=>`<div class="recent-row"><div><strong>${escapeHTML(k)}</strong><small>${escapeHTML(String(r.unit||''))}</small></div><strong>${stockValue(r)}</strong></div>`).join(''):'<div class="empty">No low-stock items.</div>';
renderDashboardTables();}
function renderDashboardTables(){
    const host = document.getElementById('dashboardTables');
    if(!host) return;

    let drafts = {};
    try {
        drafts = JSON.parse(firebaseStore.getItem('sriTabemashouTableOrders') || '{}') || {};
    } catch(e) {}

    const keys = Array.from({length:8}, (_,i)=>`TABLE_${i+1}`);

    host.innerHTML = keys.map((key,i)=>{
        const d = drafts[key];
        const cart = Array.isArray(d?.cart) ? d.cart : [];

        // Support both the current "quantity" field and older "qty" data.
        const count = cart.reduce((n,x)=>{
            return n + (Number(x.quantity ?? x.qty) || 0);
        },0);

        const total = cart.reduce((n,x)=>{
            return n +
                (Number(x.quantity ?? x.qty) || 0) *
                (Number(x.price) || 0);
        },0);

        const pending = count > 0;

        return `<button class="dashboard-table ${pending?'pending':''}"
            onclick="navigateTo('billing');setTimeout(()=>window.switchBillingTable&&switchBillingTable('${key}'),350)">
            <span class="table-icon">${pending?'🍽️':'○'}</span>
            <span>
                <strong>Table ${i+1}</strong>
                <small>${pending ? `${count} item${count===1?'':'s'} • ${money(total)}` : 'Available'}</small>
            </span>
            <b>${pending?'PENDING':'FREE'}</b>
        </button>`;
    }).join('');
}

// Billing can complete a table without causing a browser "storage" event
// because POS storage is intentionally memory + Firebase only.
window.addEventListener('sriTabemashouTableOrdersChanged', renderDashboardTables);
window.addEventListener('sriTabemashouSyncReady', renderDashboardTables);
window.addEventListener('sriTabemashouFirebaseReady', renderDashboardTables);

document.addEventListener('DOMContentLoaded',renderDashboard);window.addEventListener('storage',renderDashboard);
