(function(){
  const config=window.JEMSA_CMS_CONFIG||{};
  if(!config.enabled||!config.supabaseUrl||!config.anonKey)return;

  const endpoint=config.supabaseUrl.replace(/\/$/,"")+"/rest/v1/site_content";
  const headers={apikey:config.anonKey,Authorization:"Bearer "+config.anonKey};
  const page=(document.body.dataset.page||location.pathname.split("/").pop().replace(".html","")||"home").replace(/^index$/,"home");

  const text=(selector,value)=>{
    if(value===undefined||value===null)return;
    document.querySelectorAll(selector).forEach(el=>{el.textContent=value});
  };
  const html=(selector,value)=>{
    if(value===undefined||value===null)return;
    document.querySelectorAll(selector).forEach(el=>{el.innerHTML=String(value).replace(/\n/g,"<br>")});
  };
  const attr=(selector,name,value)=>{
    if(value===undefined||value===null)return;
    document.querySelectorAll(selector).forEach(el=>el.setAttribute(name,value));
  };
  const setLink=(selector,value,type)=>{
    if(!value)return;
    const href=type==="email"?"mailto:"+value:type==="phone"?"tel:"+String(value).replace(/\s/g,""):value;
    document.querySelectorAll(selector).forEach(el=>{el.href=href;el.textContent=value});
  };
  const image=(selector,src,alt)=>{
    if(!src)return;
    document.querySelectorAll(selector).forEach(img=>{img.src=src;if(alt!==undefined)img.alt=alt});
  };

  const rowsToMap=rows=>rows.reduce((acc,row)=>{acc[row.id]=row.content||{};return acc},{});

  function applySiteSettings(data){
    const settings=data.site_settings||{};
    text("[data-cms='footer.brandLine']",settings.footerBrandLine);
    text("[data-cms='footer.tagline']",settings.footerTagline);
    setLink("[data-cms='contact.email']",settings.email,"email");
    setLink("[data-cms='contact.phone']",settings.phone,"phone");
    text("[data-cms='contact.location']",settings.location);
    if(settings.whatsapp){
      document.querySelectorAll("[data-cms='contact.whatsapp']").forEach(el=>el.href=settings.whatsapp);
    }
  }

  function applyHome(data){
    const home=data.homepage||{};
    text("[data-cms='home.heroKicker']",home.heroKicker);
    html("[data-cms='home.heroTitle']",home.heroTitle);
    text("[data-cms='home.heroBody']",home.heroBody);
    text("[data-cms='home.introLabel']",home.introLabel);
    html("[data-cms='home.introTitle']",home.introTitle);
    text("[data-cms='home.introLead']",home.introLead);
    text("[data-cms='home.companiesLabel']",home.companiesLabel);
    html("[data-cms='home.companiesTitle']",home.companiesTitle);
    text("[data-cms='home.workLabel']",home.workLabel);
    text("[data-cms='home.workTitle']",home.workTitle);
    text("[data-cms='home.industriesLabel']",home.industriesLabel);
    text("[data-cms='home.industriesTitle']",home.industriesTitle);
    text("[data-cms='home.partnersLabel']",home.partnersLabel);
    text("[data-cms='home.ctaTitle']",home.ctaTitle);
    text("[data-cms='home.ctaBody']",home.ctaBody);
    renderProjects(".editorial-work",(data.campaigns||[]).filter(item=>item.featured).slice(0,4),true);
  }

  function applyAbout(data){
    const about=data.about||{};
    text("[data-cms='about.heroLabel']",about.heroLabel);
    html("[data-cms='about.heroTitle']",about.heroTitle);
    text("[data-cms='about.heroLead']",about.heroLead);
    text("[data-cms='about.storyLabel']",about.storyLabel);
    html("[data-cms='about.storyTitle']",about.storyTitle);
    text("[data-cms='about.storyLead']",about.storyLead);
    text("[data-cms='about.storyBody']",about.storyBody);
    image("[data-cms-image='about.storyImage']",about.storyImage,about.storyImageAlt);
  }

  function applyPageHero(data){
    const content=data[page]||{};
    text(`[data-cms='${page}.heroLabel']`,content.heroLabel);
    html(`[data-cms='${page}.heroTitle']`,content.heroTitle);
    text(`[data-cms='${page}.heroLead']`,content.heroLead);
  }

  function renderProjects(selector,items,homeLayout){
    const target=document.querySelector(selector);
    if(!target||!Array.isArray(items)||!items.length)return;
    target.innerHTML=items.map((item,index)=>{
      const wide=homeLayout&&(item.wide||index===0||index===3)?" wide":"";
      const meta=[item.client,item.category].filter(Boolean).join(" · ");
      return `<a class="project${wide}" href="case-study.html?id=${encodeURIComponent(item.id||item.slug||item.title)}"><div class="project-media"><img src="${item.image}" alt="${item.alt||item.title||"Campaign image"}" loading="lazy"></div><div class="project-meta"><h3>${item.title||"Untitled campaign"}</h3><span>${meta}</span></div></a>`;
    }).join("");
  }

  function applyWork(data){
    const campaigns=data.campaigns||[];
    renderProjects(".work-page-grid",campaigns,false);
  }

  fetch(endpoint+"?select=id,content&id=in.(site_settings,homepage,about,subsidiaries,work,contact,campaigns,partners,industries)",{cache:"no-store",headers})
    .then(async res=>{
      if(res.ok)return res.json();
      const message=await res.text();
      throw new Error(message||res.statusText);
    })
    .then(rows=>{
      const data=rowsToMap(rows);
      applySiteSettings(data);
      if(page==="home")applyHome(data);
      if(page==="about")applyAbout(data);
      if(page==="work")applyWork(data);
      applyPageHero(data);
      document.dispatchEvent(new CustomEvent("jemsa:cms-ready",{detail:data}));
    })
    .catch(error=>{
      console.warn("Jemsa CMS content could not load on the public site:",error.message);
      document.documentElement.classList.add("cms-offline");
    });
})();
