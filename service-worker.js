if(!self.define){const e=e=>{"require"!==e&&(e+=".js");let r=Promise.resolve();return s[e]||(r=new Promise((async r=>{if("document"in self){const s=document.createElement("script");s.src=e,document.head.appendChild(s),s.onload=r}else importScripts(e),r()}))),r.then((()=>{if(!s[e])throw new Error(`Module ${e} didn’t register its module`);return s[e]}))},r=(r,s)=>{Promise.all(r.map(e)).then((e=>s(1===e.length?e[0]:e)))},s={require:Promise.resolve(r)};self.define=(r,i,n)=>{s[r]||(s[r]=Promise.resolve().then((()=>{let s={};const c={uri:location.origin+r.slice(1)};return Promise.all(i.map((r=>{switch(r){case"exports":return s;case"module":return c;default:return e(r)}}))).then((e=>{const r=n(...e);return s.default||(s.default=r),s}))})))}}define("./service-worker.js",["./workbox-fa316fc2"],(function(e){"use strict";self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"CNAME",revision:"598b2cc709f84d7a2383014a33c00f61"},{url:"browserCheck.js",revision:"011c7b9b0e8cc0de06ca4b8c26888e3a"},{url:"favicon.png",revision:"2350d190bbb1a0c64970cb95d0a5f1c4"},{url:"index.html",revision:"932d3812952b16289bcdcf94a4f8e2d9"},{url:"main.js",revision:"dc93b78b361f1643de7e39fcfb59097c"},{url:"main.js.LICENSE.txt",revision:"28679b9d74ae82b8deef889bea05d04a"},{url:"manifest.json",revision:"e1599705d0383931a9326d5da2f4f5f6"}],{})}));
