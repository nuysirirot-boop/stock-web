// ================== ตัวอย่างข้อมูล ==================
const data = {
    "ร้าน 1": {
        "บริษัท X": {
            "แก้ว": { "1 ออน": ["แบรนด์ A", "แบรนด์ B"], "2 ออน": ["แบรนด์ C"] },
            "ฝา": { "S": ["แบรนด์ X"], "M": ["แบรนด์ Y"] }
        }
    },
    "ร้าน 2": {
        "บริษัท Y": {
            "แก้ว": { "3 ออน": ["แบรนด์ D"], "4 ออน": ["แบรนด์ E"] },
            "ฝา": { "L": ["แบรนด์ Z"] }
        }
    }
};

let stockData = JSON.parse(localStorage.getItem("stockData")) || {};
let dailyLog = JSON.parse(localStorage.getItem("dailyLog")) || {};
let state = { store:null, company:null, category:null };

function getToday(){
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
}

function saveStock(){
    localStorage.setItem("stockData", JSON.stringify(stockData));
    localStorage.setItem("dailyLog", JSON.stringify(dailyLog));
}

function initDailyLog(){
    const today = getToday();
    if(!dailyLog[today]){
        dailyLog[today] = {};
        for(let key in stockData){
            dailyLog[today][key] = stockData[key];
        }
        saveStock();
    }
}

function createBackButton(text, cb){
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.className = "back";
    btn.onclick = cb;
    return btn;
}

// ================== แสดงหน้าร้าน ==================
function showStores(){
    state = { store:null, company:null, category:null };
    const app = document.getElementById("app");
    app.innerHTML = "";
    const grid = document.createElement("div");
    grid.className = "button-grid";
    for(let store in data){
        const btn = document.createElement("button");
        btn.textContent = store;
        btn.onclick = ()=>showCompanies(store);
        grid.appendChild(btn);
    }
    app.appendChild(grid);
}

// ================== แสดงบริษัท ==================
function showCompanies(store){
    state.store=store; state.company=null; state.category=null;
    const app = document.getElementById("app");
    app.innerHTML = `<h2>${store} - เลือกบริษัท</h2>`;
    app.appendChild(createBackButton("กลับไปหน้าร้าน", showStores));
    const grid = document.createElement("div"); grid.className="button-grid";
    for(let company in data[store]){
        const btn=document.createElement("button");
        btn.textContent = company;
        btn.onclick=()=>showCategories(store, company);
        grid.appendChild(btn);
    }
    app.appendChild(grid);
}

// ================== แสดงหมวดสินค้า ==================
function showCategories(store, company){
    state.company=company; state.category=null;
    const app=document.getElementById("app");
    app.innerHTML=`<h2>${store} - ${company} - เลือกหมวดสินค้า</h2>`;
    app.appendChild(createBackButton("กลับไปบริษัท", ()=>showCompanies(store)));
    const grid=document.createElement("div"); grid.className="button-grid";
    for(let cat in data[store][company]){
        const btn=document.createElement("button");
        btn.textContent=cat;
        btn.onclick=()=>showSizes(store, company, cat);
        grid.appendChild(btn);
    }
    app.appendChild(grid);
}

// ================== แสดงขนาดสินค้า + ระบบคิดเลข ==================
function showSizes(store, company, category){
    state.category=category;
    const app=document.getElementById("app");
    app.innerHTML=`<h2>${store} - ${company} - ${category}</h2>`;
    app.appendChild(createBackButton("กลับไปหมวดสินค้า", ()=>showCategories(store, company)));
    app.appendChild(createBackButton("สรุปวันนี้", showSummary));

    initDailyLog();

    const searchInput=document.createElement("input");
    searchInput.placeholder="ค้นหาสินค้า...";
    searchInput.className="search-box";
    app.appendChild(searchInput);

    const sizes = data[store][company][category];

    function createItemBox(size, item){
        const key = `${store}|${company}|${category}|${size}|${item}`;
        if(!(key in stockData)) stockData[key]=0;
        if(!(key in dailyLog[getToday()])) dailyLog[getToday()][key]=stockData[key];

        const box=document.createElement("div"); box.className="item-box";

        const nameSpan=document.createElement("span"); nameSpan.className="item-name"; nameSpan.textContent=item;
        const countSpan=document.createElement("span"); countSpan.className="item-count"; countSpan.textContent=stockData[key];

        const qtyInput=document.createElement("input");
        qtyInput.type="number"; qtyInput.value=1; qtyInput.min=1; qtyInput.className="qty-input";

        const addBtn=document.createElement("button"); addBtn.textContent="+"; addBtn.onclick=()=>{
            const val=parseInt(qtyInput.value)||0;
            stockData[key]+=val; countSpan.textContent=stockData[key]; saveStock();
        };
        const subBtn=document.createElement("button"); subBtn.textContent="–"; subBtn.onclick=()=>{
            const val=parseInt(qtyInput.value)||0;
            stockData[key]-=val; if(stockData[key]<0) stockData[key]=0;
            countSpan.textContent=stockData[key]; saveStock();
        };
        const resetBtn=document.createElement("button"); resetBtn.textContent="Reset"; resetBtn.onclick=()=>{
            stockData[key]=dailyLog[getToday()][key]||0;
            countSpan.textContent=stockData[key]; saveStock();
        };

        const btnContainer=document.createElement("div"); btnContainer.className="item-actions";
        btnContainer.append(addBtn, subBtn, resetBtn);
        box.append(nameSpan, countSpan, qtyInput, btnContainer);
        return box;
    }

    for(let size in sizes){
        const h3=document.createElement("h3"); h3.textContent=size; app.appendChild(h3);
        sizes[size].forEach(item=>app.appendChild(createItemBox(size,item)));
    }

    searchInput.addEventListener("input", e=>{
        const val=e.target.value.toLowerCase();
        document.querySelectorAll(".item-box").forEach(box=>{
            box.style.display=box.querySelector(".item-name").textContent.toLowerCase().includes(val)?"flex":"none";
        });
    });
}

// ================== Summary ==================
let summaryTableElement=null;
function renderSummaryTable(){
    if(!summaryTableElement) return;
    const today=getToday(); initDailyLog();
    summaryTableElement.innerHTML="";

    const header=summaryTableElement.insertRow();
    ["Store","Company","Category","Size","Item","เริ่มต้นวันนี้","เปลี่ยนแปลง","คงเหลือ"].forEach(txt=>{
        const th=document.createElement("th"); th.textContent=txt; header.appendChild(th);
    });

    let items=Object.keys(dailyLog[today]).map(key=>({
        key,
        start: dailyLog[today][key],
        current: stockData[key],
        diff: stockData[key]-dailyLog[today][key]
    }));

    items.forEach(item=>{
        if(item.diff===0) return;
        const row=summaryTableElement.insertRow();
        const parts=item.key.split("|");
        row.insertCell().textContent=parts[0];
        row.insertCell().textContent=parts[1];
        row.insertCell().textContent=parts[2];
        row.insertCell().textContent=parts[3];
        row.insertCell().textContent=parts[4];
        row.insertCell().textContent=item.start;
        const changeCell=row.insertCell(); changeCell.textContent=(item.diff>0?"+":"")+item.diff;
        changeCell.className=item.diff>0?"change-positive":"change-negative";
        row.insertCell().textContent=item.current;
    });
}

function showSummary(){
    const app=document.getElementById("app");
    const today=getToday(); initDailyLog();
    app.innerHTML=`<h2>สรุปการเปลี่ยนแปลง (${today})</h2>`;

    summaryTableElement=document.createElement("table");
    app.appendChild(summaryTableElement);

    app.appendChild(createBackButton("กลับไปหน้าร้าน", showStores));
    renderSummaryTable();
}
