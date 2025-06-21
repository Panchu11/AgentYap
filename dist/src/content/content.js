var w=Object.defineProperty;var m=(s,e,t)=>e in s?w(s,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):s[e]=t;var d=(s,e,t)=>m(s,typeof e!="symbol"?e+"":e,t);async function b(s){var e;try{if(!((e=chrome==null?void 0:chrome.storage)!=null&&e.sync))throw new Error("Extension context invalidated. Please reload the page.");const a=(await Promise.race([chrome.storage.sync.get(["fireworksApiKey"]),new Promise((o,c)=>setTimeout(()=>c(new Error("Storage access timeout")),5e3))])).fireworksApiKey;if(!a||a.trim()==="")throw new Error("API key not configured. Please set it in extension settings.");if(!a.startsWith("fw_"))throw new Error("Invalid API key format. Please check your Fireworks API key.");const r=await fetch("https://api.fireworks.ai/inference/v1/chat/completions",{method:"POST",headers:{Authorization:`Bearer ${a}`,"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({model:"accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new",messages:[{role:"system",content:"You are a crypto Twitter expert who writes authentic, engaging replies. Analyze the tweet content and identify specific crypto projects, people, or topics mentioned. Generate natural responses that include relevant handles (@), tickers ($), and hashtags (#) based on what you detect in the tweet. Write like a real person tweeting - casual, direct, and conversational. Keep responses under 280 characters and make them sound like genuine crypto Twitter interactions."},{role:"user",content:s}],max_tokens:150,temperature:.9,top_p:.95})});if(!r.ok)throw r.status===401?new Error("Invalid API key. Please check your Fireworks API key in settings."):r.status===429?new Error("Rate limit exceeded. Please try again in a moment."):r.status>=500?new Error("Fireworks service temporarily unavailable. Please try again."):new Error(`API request failed: ${r.status} ${r.statusText}`);const n=await r.json();if(!n.choices||!n.choices[0]||!n.choices[0].message)throw new Error("Invalid API response format");let i=n.choices[0].message.content.trim();return i=i.replace(/^(Reply:|Response:)\s*/i,"").replace(/^["']|["']$/g,"").replace(/^@\w+\s+/,"").trim(),i}catch(t){throw console.error("Fireworks API error:",t),t instanceof Error?t.message.includes("Extension context invalidated")?new Error("Extension was reloaded. Please refresh the page and try again."):t.message.includes("Storage access timeout")?new Error("Extension storage access failed. Please refresh the page."):t:new Error("Unknown error occurred while generating reply")}}async function y(s,e){try{const t=A(s,e);try{return await b(t)}catch(a){return console.warn("API call failed, using fallback:",a),k(s,e)}}catch(t){return console.error("Error in generateReply:",t),k(s,e)}}function A(s,e){const t={Smart:"Write an analytical and insightful reply that shows deep understanding",Funny:"Write a witty and entertaining reply with humor that fits crypto Twitter culture",Serious:"Write a professional and direct reply that adds value to the conversation",Degen:"Write a bold and energetic reply with appropriate crypto slang and energy"};return`Tweet: "${s}"

Instructions:
- ${t[e]}
- Max 280 characters, natural, conversational tone
- Write like a real person tweeting, not a bot
- Be engaging and add value to the conversation
- CRITICAL: Analyze the tweet content and identify:
  * Specific crypto projects mentioned (Bitcoin, Ethereum, Solana, etc.)
  * People or influencers mentioned (@handles)
  * Relevant ticker symbols ($BTC, $ETH, $SOL, etc.)
  * Appropriate hashtags for the topic (#Bitcoin, #DeFi, #NFT, etc.)
- Include relevant mentions, tickers, and hashtags based on what's actually discussed
- If the tweet mentions a specific crypto project, include their official handle and ticker
- If it's about DeFi, include relevant DeFi hashtags and mentions
- If it's about NFTs, include NFT-related hashtags and mentions
- If it's about a specific blockchain, mention that blockchain's official accounts
- ${e==="Degen"?'Use appropriate crypto slang like "LFG", "WAGMI", "diamond hands" but keep it authentic':""}
- ${e==="Funny"?"Add humor that fits crypto Twitter culture and memes":""}
- NO quotes around the reply, write it as a direct tweet
- Sound like genuine crypto Twitter engagement, not corporate speak
- Make sure to include specific project mentions and tickers when relevant

Reply:`}function k(s,e){const t={bitcoin:{handle:"@bitcoin",ticker:"$BTC",hashtags:"#Bitcoin #BTC"},ethereum:{handle:"@ethereum",ticker:"$ETH",hashtags:"#Ethereum #ETH"},solana:{handle:"@solana",ticker:"$SOL",hashtags:"#Solana #SOL"},defi:{handle:"@DeFi",ticker:"$DeFi",hashtags:"#DeFi #DecentralizedFinance"},nft:{handle:"@NFT",ticker:"$NFT",hashtags:"#NFT #NFTs"}},a=s.toLowerCase();let r=null;for(const[o,c]of Object.entries(t))if(a.includes(o)){r=c;break}const n={Smart:[`Interesting perspective! ${r?`${r.handle} ${r.ticker} ${r.hashtags}`:"This raises important points worth considering."}`,`Great analysis! ${r?`${r.handle} ${r.ticker} ${r.hashtags}`:"The data here is quite compelling."}`,`This aligns with recent trends. ${r?`${r.handle} ${r.ticker} ${r.hashtags}`:"Good insights!"}`],Funny:[`This is the alpha I didn't know I needed! 😂 ${r?`${r.handle} ${r.ticker} ${r.hashtags}`:""}`,`Plot twist: this is actually genius! ${r?`${r.handle} ${r.ticker} ${r.hashtags}`:""}`,`My brain after reading this: 🤯 ${r?`${r.handle} ${r.ticker} ${r.hashtags}`:"But seriously, great point!"}`],Serious:[`This is an important development. ${r?`${r.handle} ${r.ticker} ${r.hashtags}`:"Deserves careful consideration."}`,`The implications are significant. ${r?`${r.handle} ${r.ticker} ${r.hashtags}`:"Worth monitoring closely."}`,`Critical insights here. ${r?`${r.handle} ${r.ticker} ${r.hashtags}`:"This changes the landscape."}`],Degen:[`LFG! This is the alpha we've been waiting for! 🚀 ${r?`${r.handle} ${r.ticker} ${r.hashtags}`:"#WAGMI"}`,`Ape mode activated! Time to send it! 🦍💎 ${r?`${r.handle} ${r.ticker} ${r.hashtags}`:"#DiamondHands"}`,`This is it chief! All in! 🚀💎🙌 ${r?`${r.handle} ${r.ticker} ${r.hashtags}`:"#ToTheMoon"}`]},i=n[e]||n.Smart;return i[Math.floor(Math.random()*i.length)]}async function p(s){try{const e=`Original reply: "${s}"

Instructions:
- Rephrase this reply differently while keeping the same meaning
- Keep all hashtags, handles (@), and ticker symbols ($) exactly the same
- Maintain the same tone and style
- Max 280 characters
- Make it sound fresh and natural

Rewritten reply:`;return await b(e)}catch(e){console.error("Error rewriting reply:",e);const t=["Absolutely! ","This! ","Exactly! ","So true! ","Facts! "];return t[Math.floor(Math.random()*t.length)]+s.replace(/^(Great|Amazing|Awesome|Nice|Cool)/,"").trim()}}class C{constructor(){d(this,"observer",null);d(this,"injectedContainers",new Set);d(this,"isContextValid",!0);this.init()}init(){var e;if(!((e=chrome==null?void 0:chrome.runtime)!=null&&e.id)){console.warn("Extension context invalid, stopping initialization");return}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>this.startObserving()):this.startObserving(),chrome.runtime.onMessage.addListener((t,a,r)=>(this.handleMessage(t,r),!0)),chrome.runtime.onConnect.addListener(()=>{this.isContextValid=!0})}async handleMessage(e,t){var a,r,n;if(!this.isContextValid||!((a=chrome==null?void 0:chrome.runtime)!=null&&a.id)){t({success:!1,error:"Extension context invalidated. Please refresh the page."});return}try{switch(e.type){case"GENERATE_REPLY":try{const i=await y(e.tweetText,e.tone);try{(r=chrome==null?void 0:chrome.runtime)!=null&&r.id&&chrome.runtime.sendMessage({type:"REPLY_GENERATED",reply:i})}catch(o){console.warn("Could not send message to popup:",o)}t({success:!0,reply:i})}catch(i){console.error("Error generating reply:",i);const o=i instanceof Error?i.message:"Unknown error occurred";t({success:!1,error:o})}break;case"REWRITE_REPLY":try{const i=await p(e.originalReply);try{(n=chrome==null?void 0:chrome.runtime)!=null&&n.id&&chrome.runtime.sendMessage({type:"REPLY_GENERATED",reply:i})}catch(o){console.warn("Could not send message to popup:",o)}t({success:!0,reply:i})}catch(i){console.error("Error rewriting reply:",i);const o=i instanceof Error?i.message:"Unknown error occurred";t({success:!1,error:o})}break}}catch(i){console.error("Error in handleMessage:",i),t({success:!1,error:"Message handling failed"})}}startObserving(){this.isContextValid&&(this.observer=new MutationObserver(e=>{if(!this.isContextValid)return;e.forEach(t=>{t.type==="childList"&&t.addedNodes.length>0&&setTimeout(()=>this.checkForReplyBoxes(),500)})}),this.observer.observe(document.body,{childList:!0,subtree:!0}),this.checkForReplyBoxes())}checkForReplyBoxes(){this.removeDuplicateContainers();const e=["[data-testid=\"tweetTextarea_0\"]","[data-testid=\"tweetTextarea_1\"]","[role=\"textbox\"][data-testid*=\"tweet\"]",".public-DraftEditor-content","[contenteditable=\"true\"][data-testid*=\"tweet\"]","[contenteditable=\"true\"][aria-label*=\"reply\"]","[contenteditable=\"true\"][aria-label*=\"Reply\"]"];for(const t of e){const a=document.querySelectorAll(t);a.forEach(r=>{this.maybeInjectAIControls(r)})}}removeDuplicateContainers(){const e=document.querySelectorAll(".agentyap-container"),t=new Map;e.forEach(a=>{const r=a.getBoundingClientRect(),n=`${Math.round(r.top/20)}-${Math.round(r.left/20)}`;t.has(n)?a.remove():t.set(n,a)})}maybeInjectAIControls(e){const t=this.getReplyBoxId(e);if(C.globalInjectedContainers.has(t)||this.hasNearbyYapMateContainer(e)||!this.isReplyBox(e))return;const a=this.findTweetTextForReply(e);a&&(console.log("Injecting AI controls for reply box:",t),console.log("Tweet text:",a),this.injectAIControls(e,a,t),this.injectedContainers.add(t),C.globalInjectedContainers.add(t))}getReplyBoxId(e){const t=e.getBoundingClientRect(),a=e.getAttribute("data-testid")||"",r=e.getAttribute("aria-label")||"",n=(e.parentElement?.getAttribute("data-testid")||"");return`reply-${a}-${r.slice(0,5)}-${n.slice(0,5)}-${Math.round(t.top/100)}-${Math.round(t.left/100)}-${Date.now()}`}hasNearbyYapMateContainer(e){const t=document.querySelectorAll(".agentyap-container"),a=e.getBoundingClientRect();for(const r of t){const n=r.getBoundingClientRect();if(Math.abs(n.top-a.top)+Math.abs(n.left-a.left)<100)return!0}return!1}isReplyBox(e){const t=["[data-testid*=\"reply\"]","[aria-label*=\"reply\"]","[aria-label*=\"Reply\"]","[data-testid=\"toolBar\"]"];let a=e.parentElement,r=0;for(;a&&r<15;){for(const l of t)if(a.querySelector(l)||a.matches(l))return!0;a=a.parentElement,r++}if(a=e.closest("[role=\"dialog\"]")||e.closest("[data-testid=\"modal\"]"),a)return!0;const n=this.findTweetTextForReply(e);if(n)return!0;if(window.location.href.includes("/status/"))return!0;const i=e.closest("[data-testid=\"toolBar\"]")?.querySelector("[data-testid=\"toolBar\"]");return!i&&e.getAttribute("data-testid")?.includes("tweet")?!0:!1}injectAIControls(e,t,a){const r=document.createElement("div");r.className="agentyap-container",r.dataset.boxId=a,r.style.cssText=`
      margin: 8px 0;
      padding: 10px;
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      position: relative;
      z-index: 1000;
      max-width: 100%;
      max-height: 200px;
      overflow: hidden;
      flex-shrink: 0;
    `;const n=document.createElement("div");n.innerHTML="🤖 <strong>YapMate AI</strong>",n.style.cssText=`
      font-size: 12px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 4px;
    `;const i=this.createToneSelector(),o=this.createGenerateButton(e,t),c=this.createRewriteButton(e);c.style.display="none",r.appendChild(n),r.appendChild(i),r.appendChild(o),r.appendChild(c);const l=this.findInsertionPoint(e);if(l)if(l===e.parentElement)l.insertBefore(r,e.nextSibling);else{const g=document.createElement("div");g.style.cssText=`
          position: relative;
          z-index: 1000;
          margin: 8px 0;
        `,g.appendChild(r),l.appendChild(g)}}findInsertionPoint(e){const t=e.parentElement;if(t)return t;const a=e.closest("form");if(a)return a;const r=e.closest("[role=\"dialog\"]");if(r){const n=r.querySelector("[data-testid=\"modal\"]")||r;return n}return document.body}createToneSelector(){const e=document.createElement("div");e.style.cssText=`
      margin-bottom: 8px;
    `;const t=document.createElement("div");t.textContent="🎯 Tone:",t.style.cssText=`
      font-size: 11px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 4px;
    `;const a=document.createElement("div");a.style.cssText=`
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    `;const r=[{value:"Smart",emoji:"🧠",label:"Smart"},{value:"Funny",emoji:"😂",label:"Funny"},{value:"Serious",emoji:"💼",label:"Serious"},{value:"Degen",emoji:"🚀",label:"Degen"}];return r.forEach((n,i)=>{const o=document.createElement("button");o.className=`agentyap-tone-btn ${i===0?"selected":""}`,o.dataset.tone=n.value,o.innerHTML=`${n.emoji} ${n.label}`,o.style.cssText=`
        padding: 4px 8px;
        border: 1px solid ${i===0?"#1da1f2":"#d1d5db"};
        border-radius: 12px;
        background: ${i===0?"#1da1f2":"white"};
        color: ${i===0?"white":"#374151"};
        font-size: 10px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      `,o.addEventListener("click",()=>{a.querySelectorAll(".agentyap-tone-btn").forEach(c=>{c.classList.remove("selected"),c.style.background="white",c.style.color="#374151",c.style.borderColor="#d1d5db"}),o.classList.add("selected"),o.style.background="#1da1f2",o.style.color="white",o.style.borderColor="#1da1f2"}),o.addEventListener("mouseenter",()=>{o.classList.contains("selected")||(o.style.background="#f3f4f6",o.style.borderColor="#9ca3af")}),o.addEventListener("mouseleave",()=>{o.classList.contains("selected")||(o.style.background="white",o.style.borderColor="#d1d5db")}),a.appendChild(o)}),e.appendChild(t),e.appendChild(a),e}createGenerateButton(e,t){const a=document.createElement("button");return a.className="agentyap-generate-btn",a.innerHTML="✨ Generate AI Reply",a.style.cssText=`
      width: 100%;
      padding: 8px 12px;
      background: linear-gradient(135deg, #1da1f2, #0d8bd9);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-bottom: 6px;
    `,a.addEventListener("mouseenter",()=>{a.style.transform="translateY(-1px)",a.style.boxShadow="0 4px 12px rgba(29, 161, 242, 0.3)"}),a.addEventListener("mouseleave",()=>{a.style.transform="translateY(0)",a.style.boxShadow="none"}),a.addEventListener("click",async()=>{var r,n;if(!this.isContextValid||!((r=chrome==null?void 0:chrome.runtime)!=null&&r.id)){a.style.background="#ef4444",a.innerHTML="❌ Extension Error",setTimeout(()=>{a.style.background="linear-gradient(135deg, #1da1f2, #0d8bd9)",a.innerHTML="✨ Generate AI Reply"},3e3);return}const i=a.closest(".agentyap-container"),o=((n=i==null?void 0:i.querySelector(".agentyap-tone-btn.selected"))==null?void 0:n.dataset.tone)||"Smart";a.style.background="#0d8bd9",a.innerHTML="⏳ Generating...",a.disabled=!0;try{const c=await y(t,o);await this.fillReplyBoxEnhanced(e,c),a.style.background="#10b981",a.innerHTML="✅ Reply Generated!",a.disabled=!1;const l=i==null?void 0:i.querySelector(".agentyap-rewrite-btn");l&&(l.style.display="block",l.dataset.currentReply=c)}catch(c){console.error("Error generating reply:",c),a.style.background="#ef4444",c instanceof Error?c.message.includes("Extension context invalidated")||c.message.includes("Extension was reloaded")?a.innerHTML="🔄 Refresh Page":c.message.includes("API key")?a.innerHTML="🔑 Check API Key":a.innerHTML="❌ Error":a.innerHTML="❌ Error",a.disabled=!1,setTimeout(()=>{a.style.background="linear-gradient(135deg, #1da1f2, #0d8bd9)",a.innerHTML="✨ Generate AI Reply"},5e3)}}),a}createRewriteButton(e){const t=document.createElement("button");return t.className="agentyap-rewrite-btn",t.innerHTML="🔄 Rewrite Reply",t.style.cssText=`
      width: 100%;
      padding: 6px 12px;
      background: #6b7280;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    `,t.addEventListener("mouseenter",()=>{t.style.background="#4b5563"}),t.addEventListener("mouseleave",()=>{t.style.background="#6b7280"}),t.addEventListener("click",async()=>{var a;if(!this.isContextValid||!((a=chrome==null?void 0:chrome.runtime)!=null&&a.id)){t.innerHTML="🔄 Refresh Page";return}const r=t.dataset.currentReply;if(!r)return;t.innerHTML="⏳ Rewriting...",t.disabled=!0;try{const n=await p(r);await this.fillReplyBoxEnhanced(e,n),t.innerHTML="✅ Rewritten!",t.dataset.currentReply=n,setTimeout(()=>{t.innerHTML="🔄 Rewrite Reply",t.disabled=!1},2e3)}catch(n){console.error("Error rewriting reply:",n),t.innerHTML="❌ Error",setTimeout(()=>{t.innerHTML="🔄 Rewrite Reply",t.disabled=!1},3e3)}}),t}findTweetTextForReply(e){let t=e.closest("article");if(t){const i=t.querySelector("[data-testid=\"tweetText\"]");if(i!=null&&i.textContent)return i.textContent.trim()}const a=e.closest("[role=\"dialog\"]");if(a){const i=a.querySelector("[data-testid=\"tweetText\"]");if(i!=null&&i.textContent)return i.textContent.trim()}for(t=e.closest("[data-testid*=\"tweet\"]");t&&!t.matches("article");)t=t.parentElement?.closest("[data-testid*=\"tweet\"]")||null;if(t){const i=t.querySelector("[data-testid=\"tweetText\"]");if(i!=null&&i.textContent)return i.textContent.trim()}const r=document.querySelectorAll("[data-testid=\"tweetText\"]");if(r.length>0){let i=null,o=1/0;const c=e.getBoundingClientRect();Array.from(r).forEach(l=>{if(l instanceof HTMLElement){const g=l.getBoundingClientRect(),S=Math.abs(g.bottom-c.top);S<o&&g.top<c.top&&(o=S,i=l)}}),i!=null&&i.textContent&&i.textContent.trim()}const n=document.querySelectorAll("[lang]");for(const i of n)if(i.textContent&&i.textContent.trim().length>20){const o=i.getBoundingClientRect(),c=e.getBoundingClientRect();if(o.bottom<c.top)return i.textContent.trim()}return null}async fillReplyBoxEnhanced(e,t){console.log("Filling reply box with enhanced method:",t),e.focus(),await new Promise(a=>setTimeout(a,100)),e.tagName==="TEXTAREA"||e.tagName==="INPUT"?e.value="":e.textContent="",e.innerHTML="",e.tagName==="TEXTAREA"||e.tagName==="INPUT"?e.value=t:(e.textContent=t,e.innerHTML=t);const r=[new Event("focus",{bubbles:!0}),new InputEvent("input",{bubbles:!0,inputType:"insertText",data:t}),new Event("change",{bubbles:!0}),new KeyboardEvent("keydown",{bubbles:!0,key:" ",code:"Space"}),new KeyboardEvent("keyup",{bubbles:!0,key:" ",code:"Space"})];for(const n of r)try{e.dispatchEvent(n),await new Promise(i=>setTimeout(i,50))}catch(i){console.warn("Could not dispatch event:",i)}e.focus(),console.log("Reply box filled successfully")}destroy(){this.isContextValid=!1,this.observer&&this.observer.disconnect(),document.querySelectorAll(".agentyap-container").forEach(e=>e.remove()),this.injectedContainers.clear(),C.globalInjectedContainers.clear()}}d(C,"globalInjectedContainers",new Set);var g;if((g=chrome==null?void 0:chrome.runtime)!=null&&g.id){const s=new C;window.addEventListener("beforeunload",()=>{s.destroy()}),chrome.runtime.onConnect.addListener(()=>{console.log("Extension context restored")})}else console.warn("Extension context not available, skipping initialization");