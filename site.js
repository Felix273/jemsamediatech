const header=document.querySelector(".site-header");
const menu=document.querySelector(".menu-panel");
const openBtn=document.querySelector(".menu-button");
const closeBtn=document.querySelector(".menu-close");
menu?.setAttribute("role","dialog");
menu?.setAttribute("aria-modal","true");
menu?.setAttribute("aria-label","Site navigation");
menu?.setAttribute("inert","");
let lastFocused;
const menuFocusable=()=>[...menu?.querySelectorAll('a,button,[tabindex]:not([tabindex="-1"])')||[]];
function openMenu(){
  if(!menu)return;
  lastFocused=document.activeElement;
  menu.classList.add("open");
  menu.removeAttribute("inert");
  menu.setAttribute("aria-hidden","false");
  openBtn?.setAttribute("aria-expanded","true");
  document.body.classList.add("menu-open");
  document.querySelector("main")?.setAttribute("inert","");
  document.querySelector("footer")?.setAttribute("inert","");
  closeBtn?.focus();
}
function closeMenu(){
  if(!menu)return;
  menu.classList.remove("open");
  menu.setAttribute("inert","");
  menu.setAttribute("aria-hidden","true");
  openBtn?.setAttribute("aria-expanded","false");
  document.body.classList.remove("menu-open");
  document.querySelector("main")?.removeAttribute("inert");
  document.querySelector("footer")?.removeAttribute("inert");
  lastFocused?.focus();
}
openBtn?.addEventListener("click",openMenu);closeBtn?.addEventListener("click",closeMenu);
menu?.querySelectorAll("a").forEach(a=>a.addEventListener("click",closeMenu));
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&menu?.classList.contains("open"))closeMenu();
  if(e.key==="Tab"&&menu?.classList.contains("open")){
    const items=menuFocusable(),first=items[0],last=items.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  }
});
window.addEventListener("scroll",()=>header?.classList.toggle("scrolled",scrollY>24),{passive:true});
const reveal=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("revealed");reveal.unobserve(entry.target)}}),{threshold:.12});
document.querySelectorAll("[data-reveal]").forEach(el=>reveal.observe(el));

document.querySelectorAll("[data-counter]").forEach(el=>{
  const target=Number(el.dataset.counter);
  const suffix=el.dataset.suffix||"";
  const prefix=el.dataset.prefix||"";
  const counterObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(!entry.isIntersecting)return;
    const start=performance.now();
    function tick(now){const p=Math.min((now-start)/1200,1);el.textContent=prefix+Math.round(target*(1-Math.pow(1-p,3)))+suffix;if(p<1)requestAnimationFrame(tick)}
    requestAnimationFrame(tick);counterObserver.disconnect();
  }),{threshold:.5});counterObserver.observe(el);
});

const journeyTrack=document.querySelector(".journey-track");
if(journeyTrack){
  const slides=[...journeyTrack.children],dots=[...document.querySelectorAll(".journey-dot")];
  let index=0,timer,paused=false;
  const status=document.querySelector("[data-journey-status]");
  const show=i=>{
    index=(i+slides.length)%slides.length;
    journeyTrack.style.transform=`translateX(-${index*100}%)`;
    dots.forEach((d,n)=>{d.classList.toggle("active",n===index);d.setAttribute("aria-current",n===index?"true":"false")});
    if(status)status.textContent=`Slide ${index+1} of ${slides.length}`;
  };
  const start=()=>{clearInterval(timer);if(!paused&&!matchMedia("(prefers-reduced-motion: reduce)").matches)timer=setInterval(()=>show(index+1),5200)};
  document.querySelector("[data-prev]")?.addEventListener("click",()=>{show(index-1);start()});
  document.querySelector("[data-next]")?.addEventListener("click",()=>{show(index+1);start()});
  dots.forEach((d,i)=>d.addEventListener("click",()=>{show(i);start()}));start();
  document.querySelector("[data-journey-pause]")?.addEventListener("click",e=>{
    paused=!paused;
    e.currentTarget.textContent=paused?"Play":"Pause";
    e.currentTarget.setAttribute("aria-pressed",String(paused));
    start();
  });
}

document.querySelectorAll("[data-motion-control]").forEach(button=>{
  const target=document.querySelector(button.dataset.motionControl);
  if(!target)return;
  button.addEventListener("click",()=>{
    const paused=target.classList.toggle("motion-paused");
    button.textContent=paused?"Play motion":"Pause motion";
    button.setAttribute("aria-pressed",String(paused));
  });
});

const enquiryForm=document.getElementById("enquiryForm");
enquiryForm?.addEventListener("submit",event=>{
  event.preventDefault();
  if(!enquiryForm.reportValidity())return;
  const data=new FormData(enquiryForm);
  const subject=`New project enquiry — ${data.get("company")||data.get("name")}`;
  const body=[
    `Name: ${data.get("name")}`,
    `Company: ${data.get("company")}`,
    `Email: ${data.get("email")}`,
    `Phone: ${data.get("phone")||"Not supplied"}`,
    `Service: ${data.get("service")}`,
    `Budget: ${data.get("budget")}`,
    `Timeline: ${data.get("timeline")}`,
    "",
    "Project brief:",
    data.get("brief")
  ].join("\n");
  const status=document.getElementById("formStatus");
  if(status)status.textContent="Your email app is opening with the project details prepared.";
  window.location.href=`mailto:info@jemsamediatech.africa?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

if(!document.querySelector(".floating-contact")){
  const contact=document.createElement("div");
  contact.className="floating-contact";
  contact.innerHTML='<a class="whatsapp-float" href="https://wa.me/254740953042?text=Hello%20Jemsa%20Media%20Group%2C%20I%27d%20like%20to%20discuss%20a%20project." target="_blank" rel="noopener" aria-label="Chat with Jemsa Media Group on WhatsApp">WhatsApp</a><a class="mobile-project-cta" href="contact.html#enquiry">Start a project <span aria-hidden="true">↗</span></a>';
  document.body.appendChild(contact);
}

document.querySelectorAll(".footer-col").forEach(column=>{
  if(column.querySelector("h3")?.textContent.trim()==="Company"&&!column.querySelector('a[href="privacy.html"]')){
    column.insertAdjacentHTML("beforeend",'<a href="privacy.html">Privacy</a><a href="terms.html">Terms</a>');
  }
});

if(location.hash){
  requestAnimationFrame(()=>{
    document.querySelector(location.hash)?.scrollIntoView();
  });
}
