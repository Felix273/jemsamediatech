(function(){
  const config=window.JEMSA_CMS_CONFIG||{};
  const setupPanel=document.getElementById("setupPanel");
  const authPanel=document.getElementById("authPanel");
  const dashboard=document.getElementById("dashboard");
  const authStatus=document.getElementById("authStatus");
  const grid=document.getElementById("editorGrid");
  const nav=document.getElementById("sectionNav");
  const activeSectionId=document.getElementById("activeSectionId");
  const activeSectionTitle=document.getElementById("activeSectionTitle");
  const activeSectionHelp=document.getElementById("activeSectionHelp");
  const publishState=document.getElementById("publishState");
  const sections=[
    ["site_settings","Site settings","Global contact details, footer copy and shared business information."],
    ["homepage","Homepage","Hero copy, introduction, homepage labels, featured work headings and CTA messaging."],
    ["about","About page","About page hero, story section, long-form copy and story image."],
    ["subsidiaries","Subsidiaries page","Subsidiary page hero and page-level messaging."],
    ["work","Work page","Work page hero and gallery intro content."],
    ["contact","Contact page","Contact hero copy and lead-in messaging."],
    ["campaigns","Campaigns / case studies","Campaign cards, featured projects and work gallery data."],
    ["partners","Partner brands","Brand partner collection for logo/name data."],
    ["industries","Industries","Industry rows and icon/name collection."]
  ];
  const objectSchemas={
    site_settings:[
      ["email","Email address","email"],
      ["phone","Phone number","text"],
      ["whatsapp","WhatsApp link","url"],
      ["location","Location","text"],
      ["footerBrandLine","Footer brand line","textarea"],
      ["footerTagline","Footer tagline","text"]
    ],
    homepage:[
      ["heroKicker","Hero kicker","text"],
      ["heroTitle","Hero title","textarea"],
      ["heroBody","Hero body","textarea"],
      ["introLabel","Intro label","text"],
      ["introTitle","Intro title","textarea"],
      ["introLead","Intro lead","textarea"],
      ["companiesLabel","Companies label","text"],
      ["companiesTitle","Companies title","textarea"],
      ["workLabel","Work label","text"],
      ["workTitle","Work title","textarea"],
      ["industriesLabel","Industries label","text"],
      ["industriesTitle","Industries title","textarea"],
      ["partnersLabel","Partners label","text"],
      ["ctaTitle","CTA title","textarea"],
      ["ctaBody","CTA body","textarea"]
    ],
    about:[
      ["heroLabel","Hero label","text"],
      ["heroTitle","Hero title","textarea"],
      ["heroLead","Hero lead","textarea"],
      ["storyLabel","Story label","text"],
      ["storyTitle","Story title","textarea"],
      ["storyLead","Story lead","textarea"],
      ["storyBody","Story body","textarea"],
      ["storyImage","Story image path / URL","url"],
      ["storyImageAlt","Story image alt text","text"]
    ],
    subsidiaries:[
      ["heroLabel","Hero label","text"],
      ["heroTitle","Hero title","textarea"],
      ["heroLead","Hero lead","textarea"]
    ],
    work:[
      ["heroLabel","Hero label","text"],
      ["heroTitle","Hero title","textarea"],
      ["heroLead","Hero lead","textarea"]
    ],
    contact:[
      ["heroLabel","Hero label","text"],
      ["heroTitle","Hero title","textarea"],
      ["heroLead","Hero lead","textarea"]
    ]
  };
  const collectionSchemas={
    campaigns:{
      singular:"Campaign",
      empty:{id:"",title:"",client:"",category:"",image:"",alt:"",featured:false,wide:false},
      fields:[
        ["id","Campaign ID / URL slug","text"],
        ["title","Campaign title","text"],
        ["client","Client","text"],
        ["category","Category","text"],
        ["image","Image path / URL","url"],
        ["alt","Image alt text","text"],
        ["featured","Show on homepage","checkbox"],
        ["wide","Wide homepage layout","checkbox"]
      ]
    },
    partners:{
      singular:"Partner",
      empty:{name:"",logo:"",url:""},
      fields:[
        ["name","Brand name","text"],
        ["logo","Logo path / URL","url"],
        ["url","Website / link","url"]
      ]
    },
    industries:{
      singular:"Industry",
      empty:{name:"",icon:"",row:"1"},
      fields:[
        ["name","Industry name","text"],
        ["icon","Icon path / URL","url"],
        ["row","Row number","text"]
      ]
    }
  };
  const defaults=window.JEMSA_DEFAULT_CONTENT||{};
  const base=config.supabaseUrl?.replace(/\/$/,"");
  let session=JSON.parse(sessionStorage.getItem("jemsa_admin_session")||"null");
  let activeId=sections[0][0];

  if(!config.enabled||!base||!config.anonKey){
    setupPanel.hidden=false;
    return;
  }
  setupPanel.hidden=true;

  const authHeaders=()=>({
    apikey:config.anonKey,
    Authorization:"Bearer "+(session?.access_token||config.anonKey),
    "Content-Type":"application/json"
  });

  async function request(path,options={}){
    const res=await fetch(base+path,{...options,headers:{...authHeaders(),...(options.headers||{})}});
    const body=await res.text();
    if(!res.ok){
      throw new Error(body||res.statusText);
    }
    if(res.status===204||!body.trim())return null;
    try{
      return JSON.parse(body);
    }catch(error){
      return null;
    }
  }

  async function login(email,password){
    const res=await fetch(base+"/auth/v1/token?grant_type=password",{
      method:"POST",
      headers:{apikey:config.anonKey,"Content-Type":"application/json"},
      body:JSON.stringify({email,password})
    });
    const text=await res.text();
    const data=text?JSON.parse(text):{};
    if(!res.ok)throw new Error(data.error_description||data.msg||text||"Login failed");
    session=data;
    sessionStorage.setItem("jemsa_admin_session",JSON.stringify(session));
  }

  function showDashboard(){
    authPanel.hidden=true;
    dashboard.hidden=false;
    loadContent();
  }

  function showLogin(){
    authPanel.hidden=false;
    dashboard.hidden=true;
  }

  async function loadContent(){
    publishState.textContent="Loading content…";
    grid.innerHTML="";
    nav.innerHTML="";
    try{
      const rows=await request("/rest/v1/site_content?select=id,content&id=in.("+sections.map(s=>s[0]).join(",")+")");
      const map=(rows||[]).reduce((acc,row)=>{acc[row.id]=row.content||{};return acc},{});
      sections.forEach((section,index)=>{
        const [id,label,help]=section;
        renderTab(id,label,index);
        renderEditor(id,label,help,map[id]||defaults[id]||{});
      });
      activateSection(activeId);
      publishState.textContent="Connected to Supabase";
    }catch(error){
      publishState.textContent="Could not load content";
      grid.innerHTML=`<article class="editor-card active"><p class="status error">Could not load content: ${error.message}</p></article>`;
    }
  }

  function renderTab(id,label,index){
    const button=document.createElement("button");
    button.type="button";
    button.className="section-tab";
    button.dataset.section=id;
    button.innerHTML=`<span>${String(index+1).padStart(2,"0")}</span><b>${label}</b>`;
    button.addEventListener("click",()=>activateSection(id));
    nav.appendChild(button);
  }

  function activateSection(id){
    activeId=id;
    const section=sections.find(item=>item[0]===id)||sections[0];
    activeSectionId.textContent=id;
    activeSectionTitle.textContent=section[1];
    activeSectionHelp.textContent=section[2];
    document.querySelectorAll(".section-tab").forEach(tab=>tab.classList.toggle("active",tab.dataset.section===id));
    document.querySelectorAll(".editor-card").forEach(card=>card.classList.toggle("active",card.dataset.section===id));
  }

  function makeField(key,label,type,value){
    const wrapper=document.createElement("label");
    wrapper.className=type==="checkbox"?"form-check":"form-field";
    wrapper.dataset.key=key;
    const labelText=document.createElement("span");
    labelText.textContent=label;
    let input;
    if(type==="textarea"){
      input=document.createElement("textarea");
      input.rows=type==="textarea"?4:1;
      input.value=value??"";
    }else{
      input=document.createElement("input");
      input.type=type==="checkbox"?"checkbox":type;
      if(type==="checkbox")input.checked=Boolean(value);
      else input.value=value??"";
    }
    if(type==="checkbox"){
      wrapper.append(input,labelText);
    }else{
      wrapper.append(labelText,input);
    }
    return wrapper;
  }

  function renderObjectForm(container,schema,content){
    const form=document.createElement("div");
    form.className="field-grid";
    schema.forEach(([key,label,type])=>form.appendChild(makeField(key,label,type,content?.[key])));
    container.appendChild(form);
  }

  function renderCollectionItem(list,schema,item={},index=0){
    const card=document.createElement("section");
    card.className="collection-item";
    card.innerHTML=`<header><div><p class="eyebrow">${schema.singular} ${index+1}</p><h4>${item.title||item.name||item.id||"Untitled"}</h4></div><button type="button" data-remove>Remove</button></header>`;
    const fields=document.createElement("div");
    fields.className="field-grid";
    schema.fields.forEach(([key,label,type])=>fields.appendChild(makeField(key,label,type,item?.[key])));
    card.appendChild(fields);
    card.querySelector("[data-remove]").addEventListener("click",()=>card.remove());
    list.appendChild(card);
  }

  function renderCollectionForm(container,id,items){
    const schema=collectionSchemas[id];
    const toolbar=document.createElement("div");
    toolbar.className="collection-toolbar";
    toolbar.innerHTML=`<p>${schema.singular}s are repeatable. Add, remove, reorder by editing their order here, then save.</p><button type="button">Add ${schema.singular}</button>`;
    const list=document.createElement("div");
    list.className="collection-list";
    (Array.isArray(items)?items:[]).forEach((item,index)=>renderCollectionItem(list,schema,item,index));
    toolbar.querySelector("button").addEventListener("click",()=>renderCollectionItem(list,schema,{...schema.empty},list.children.length));
    container.append(toolbar,list);
  }

  function collectObject(card,schema){
    return schema.reduce((acc,[key,,type])=>{
      const input=card.querySelector(`[data-key="${key}"] input,[data-key="${key}"] textarea`);
      acc[key]=type==="checkbox"?Boolean(input?.checked):(input?.value||"");
      return acc;
    },{});
  }

  function collectCollection(card,id){
    const schema=collectionSchemas[id];
    return [...card.querySelectorAll(".collection-item")].map(item=>{
      return schema.fields.reduce((acc,[key,,type])=>{
        const input=item.querySelector(`[data-key="${key}"] input,[data-key="${key}"] textarea`);
        acc[key]=type==="checkbox"?Boolean(input?.checked):(input?.value||"");
        return acc;
      },{});
    });
  }

  function getContentFromForm(card,id){
    if(objectSchemas[id])return collectObject(card,objectSchemas[id]);
    if(collectionSchemas[id])return collectCollection(card,id);
    return {};
  }

  function hydrateForm(card,id,content){
    const formHost=card.querySelector("[data-form-host]");
    formHost.innerHTML="";
    if(objectSchemas[id])renderObjectForm(formHost,objectSchemas[id],content||{});
    else if(collectionSchemas[id])renderCollectionForm(formHost,id,Array.isArray(content)?content:[]);
  }

  function renderEditor(id,label,help,content){
    const card=document.createElement("article");
    card.className="editor-card";
    card.dataset.section=id;
    card.innerHTML=`<header><div class="editor-meta"><p class="eyebrow">${id}</p><h3>${label}</h3><p>${help}</p></div><div class="editor-actions"><button type="button" data-save>Save changes</button></div></header><div class="json-tools"><button type="button" data-reset>Reset to defaults</button></div><div data-form-host></div><p class="status" role="status"></p>`;
    const status=card.querySelector(".status");
    hydrateForm(card,id,content);
    card.querySelector("[data-reset]").addEventListener("click",()=>{
      hydrateForm(card,id,defaults[id]||collectionSchemas[id]?.empty||{});
      status.className="status";
      status.textContent="Default content loaded. Click Save to publish it.";
    });
    card.querySelector("[data-save]").addEventListener("click",async()=>{
      status.textContent="Saving…";
      status.className="status";
      try{
        const parsed=getContentFromForm(card,id);
        await request("/rest/v1/site_content",{
          method:"POST",
          headers:{Prefer:"resolution=merge-duplicates,return=representation"},
          body:JSON.stringify({id,content:parsed})
        });
        status.className="status ok";
        status.textContent="Saved.";
      }catch(error){
        status.className="status error";
        status.textContent="Could not save: "+error.message;
      }
    });
    grid.appendChild(card);
  }

  document.getElementById("loginForm")?.addEventListener("submit",async event=>{
    event.preventDefault();
    authStatus.textContent="Signing in…";
    try{
      await login(document.getElementById("adminEmail").value,document.getElementById("adminPassword").value);
      authStatus.textContent="";
      showDashboard();
    }catch(error){
      authStatus.textContent=error.message;
    }
  });

  document.getElementById("logoutBtn")?.addEventListener("click",()=>{
    session=null;
    sessionStorage.removeItem("jemsa_admin_session");
    showLogin();
  });
  document.getElementById("refreshBtn")?.addEventListener("click",loadContent);
  document.getElementById("mediaForm")?.addEventListener("submit",async event=>{
    event.preventDefault();
    const file=document.getElementById("mediaFile").files[0];
    const path=document.getElementById("mediaPath").value.replace(/^\/+/,"");
    const status=document.getElementById("mediaStatus");
    if(!file||!path)return;
    status.textContent="Uploading…";
    try{
      const bucket=config.mediaBucket||"site-media";
      const res=await fetch(`${base}/storage/v1/object/${bucket}/${encodeURIComponent(path).replace(/%2F/g,"/")}`,{
        method:"POST",
        headers:{apikey:config.anonKey,Authorization:"Bearer "+session.access_token,"Content-Type":file.type||"application/octet-stream","x-upsert":"true"},
        body:file
      });
      if(!res.ok)throw new Error(await res.text());
      const publicUrl=`${base}/storage/v1/object/public/${bucket}/${path}`;
      status.innerHTML=`Uploaded. Public URL: <code>${publicUrl}</code>`;
    }catch(error){
      status.textContent="Upload failed: "+error.message;
    }
  });

  if(session?.access_token)showDashboard();
  else showLogin();
})();
