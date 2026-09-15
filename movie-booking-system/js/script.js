const movies = [
  {id:1,title:"Pushpa 2: The Rule",genre:"Action • Crime • Drama",rating:"7.8",duration:"3h 20m",poster:"assets/pushpa2.webp",price:200,desc:"Pushpa continues his rise in the world of red sandalwood smuggling."},
  {id:2,title:"Salaar: Part 1 – Ceasefire",genre:"Action • Thriller",rating:"8.0",duration:"2h 55m",poster:"assets/salaar.png",price:200,desc:"A powerful friendship is tested by violence, loyalty and a brutal kingdom."},
  {id:3,title:"RRR",genre:"Action • Drama",rating:"8.0",duration:"3h 07m",poster:"assets/rrr.jpg",price:180,desc:"Two revolutionaries form an extraordinary friendship and fight for freedom."},
  {id:4,title:"They Call Him OG",genre:"Action • Crime",rating:"7.4",duration:"2h 30m",poster:"assets/og.jpg",price:220,desc:"A powerful gangster returns to settle old scores and protect what matters."}
];

const seatPrices = { Regular: 180, Premium: 220, Recliner: 300 };
const getMovie = id => movies.find(m => m.id === Number(id));
const save = (key,val) => localStorage.setItem(key, JSON.stringify(val));
const load = key => JSON.parse(localStorage.getItem(key) || "null");

function renderMovies(list=movies){
  const grid=document.getElementById("movieGrid"); if(!grid)return;
  grid.innerHTML=list.length ? list.map(m=>`
    <article class="movie-card">
      <div class="poster"><img src="${m.poster}" alt="${m.title} poster"><span>${m.title}</span></div>
      <div class="movie-body">
        <div class="movie-title">${m.title}</div>
        <div class="meta"><span>${m.genre}</span><span class="rating">★ ${m.rating}</span></div>
        <button class="book-btn" onclick="startBooking(${m.id})">Book Now • From ₹${m.price}</button>
      </div>
    </article>`).join("") : "<p class='muted'>No movies found.</p>";
}
function startBooking(id){ save("selectedMovie",getMovie(id)); localStorage.removeItem("show"); localStorage.removeItem("booking"); location.href="booking.html"; }

const search=document.getElementById("movieSearch");
if(search) search.addEventListener("input",e=>{
  const q=e.target.value.toLowerCase();
  renderMovies(movies.filter(m=>m.title.toLowerCase().includes(q)||m.genre.toLowerCase().includes(q)));
});
renderMovies();

function renderBooking(){
  const movie=load("selectedMovie"); if(!movie)return;
  const box=document.getElementById("bookingMovie");
  if(box) box.innerHTML=`<div class="mini-poster"><img src="${movie.poster}" alt="${movie.title}"></div><div><h2>${movie.title}</h2><p>${movie.genre} • ${movie.duration} • ★ ${movie.rating}</p></div>`;
  const dates=["Today","Tomorrow","Fri 18","Sat 19","Sun 20"];
  const dateBox=document.getElementById("dateList");
  if(!dateBox)return;
  dateBox.innerHTML=dates.map((d,i)=>`<button class="date-btn ${i===0?"selected":""}" data-date="${d}"><strong>${d}</strong><small>Sep 2026</small></button>`).join("");
  let selectedDate="Today", selectedTime="";
  document.querySelectorAll(".date-btn").forEach(b=>b.onclick=()=>{document.querySelectorAll(".date-btn").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");selectedDate=b.dataset.date;});
  const times=["10:00 AM","1:30 PM","4:30 PM","7:30 PM","10:15 PM"];
  document.getElementById("timeList").innerHTML=times.map(t=>`<button class="time-btn" data-time="${t}">${t}</button>`).join("");
  document.querySelectorAll(".time-btn").forEach(b=>b.onclick=()=>{document.querySelectorAll(".time-btn").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");selectedTime=b.dataset.time;});
  const cont=document.getElementById("continueBtn");
  document.querySelectorAll(".time-btn").forEach(b=>b.addEventListener("click",()=>cont.disabled=false));
  cont.onclick=()=>{if(!selectedTime)return;save("show",{date:selectedDate,time:selectedTime});location.href="seats.html";};
}
renderBooking();

function renderSeats(){
  const movie=load("selectedMovie") || movies[0];
  const show=load("show") || {date:"Today",time:"7:30 PM"};
  save("selectedMovie",movie); save("show",show);
  const selectedShow=document.getElementById("selectedShow");
  if(!selectedShow)return;
  selectedShow.textContent=`${movie.title} • ${show.date} • ${show.time}`;
  const rows=["A","B","C","D","E","F","G","H"];
  const occupied=new Set(["A3","A4","A8","B7","B8","C4","C9","D5","D6","E1","E9","F8","G2","G7","H6"]);
  const map=document.getElementById("seatMap");
  let html="";
  const tierHeadings = {
    0: {name:"Regular", price:seatPrices.Regular, note:"Standard seating"},
    3: {name:"Premium", price:seatPrices.Premium, note:"Extra comfort"},
    6: {name:"Recliner", price:seatPrices.Recliner, note:"Luxury seating"}
  };
  rows.forEach((r,rowIndex)=>{
    const type=rowIndex<3?"Regular":rowIndex<6?"Premium":"Recliner";
    if(tierHeadings[rowIndex]){
      const tier=tierHeadings[rowIndex];
      html += `<div class="tier-heading"><span>₹${tier.price}</span> ${tier.name.toUpperCase()} ROWS <small>${tier.note}</small></div>`;
    }
    let rowHtml=`<div class="seat-row"><span class="row-label">${r}</span>`;
    for(let n=1;n<=10;n++){
      const id=r+n;
      if(n===6) rowHtml += `<span class="seat-gap"></span>`;
      rowHtml += `<button class="seat ${occupied.has(id)?"occupied":"available"}" data-seat="${id}" data-type="${type}" ${occupied.has(id)?"disabled":""} aria-label="${id} ${type}">${n}</button>`;
    }
    rowHtml += `<span class="row-type">${type}</span></div>`;
    html += rowHtml;
  });
  map.innerHTML=html;
  const selected=new Map();
  document.querySelectorAll(".seat.available").forEach(s=>s.onclick=()=>{
    const id=s.dataset.seat, type=s.dataset.type;
    if(selected.has(id)){selected.delete(id);s.classList.remove("selected");}
    else{selected.set(id,{type,price:seatPrices[type]});s.classList.add("selected");}
    updateSeatSummary(selected,movie);
  });
  updateSeatSummary(selected,movie);
}

function updateSeatSummary(selected,movie){
  const arr=[...selected.keys()].sort();
  const groups={Regular:0,Premium:0,Recliner:0};
  selected.forEach(v=>groups[v.type]++);
  const summary=document.getElementById("seatSummary");
  if(!summary)return;
  summary.innerHTML=arr.length ? `
    <p class="summary-label">Selected seats</p><p class="seat-names">${arr.join(" • ")}</p>
    <div class="price-breakdown">
      ${groups.Regular?`<div><span>Regular × ${groups.Regular}</span><strong>₹${groups.Regular*seatPrices.Regular}</strong></div>`:""}
      ${groups.Premium?`<div><span>Premium × ${groups.Premium}</span><strong>₹${groups.Premium*seatPrices.Premium}</strong></div>`:""}
      ${groups.Recliner?`<div><span>Recliner × ${groups.Recliner}</span><strong>₹${groups.Recliner*seatPrices.Recliner}</strong></div>`:""}
    </div>` : `<p class="empty-seats">No seats selected</p>`;
  const total=[...selected.values()].reduce((sum,s)=>sum+s.price,0);
  document.getElementById("ticketCount").textContent=arr.length;
  document.getElementById("totalPrice").textContent=`₹${total}`;
  const btn=document.getElementById("confirmBtn");
  btn.disabled=!arr.length;
  btn.onclick=()=>{save("booking",{seats:arr,total,details:[...selected.entries()].map(([seat,v])=>({seat,...v}))});location.href="confirmation.html";};
}
renderSeats();

function renderConfirmation(){
  const movie=load("selectedMovie") || movies[0],show=load("show") || {date:"Today",time:"7:30 PM"},booking=load("booking");
  const ticket=document.getElementById("ticket"); if(!ticket)return;
  if(!booking){ticket.innerHTML="<p class='muted'>No booking found. Please select a movie and seats first.</p>";return;}
  const id="CB"+Math.floor(100000+Math.random()*900000);
  const detailText=booking.details?.map(x=>`${x.seat} (${x.type})`).join(", ") || booking.seats.join(", ");
  ticket.innerHTML=`
    <div class="ticket-header"><div><strong>${movie.title}</strong><p class="ticket-subtitle">${movie.genre}</p></div><span class="ticket-id">BOOKING ID<br><b>${id}</b></span></div>
    <div class="ticket-poster-large"><img src="${movie.poster}" alt="${movie.title}"></div>
    <div class="ticket-details">
      <div><label>DATE</label><strong>${show.date}</strong></div><div><label>TIME</label><strong>${show.time}</strong></div>
      <div><label>SEATS</label><strong>${detailText}</strong></div><div><label>TOTAL</label><strong>₹${booking.total}</strong></div>
    </div>
    <div class="ticket-location">📍 CineBook Cinema, Bengaluru</div>`;
}
renderConfirmation();
