var u=class extends Error{name="ResponseError";response;constructor(s,r,t){super(r||`${s.status} ${s.statusText}`.trim(),t),this.response=s}toJSON(){return{name:this.name,message:this.message}}};var l="content-type",f="multipart/form-data",R="application/json",y="application/problem+json",c="application/octet-stream",m="plain/text",T={arrayBuffer:c,blob:c,formData:f,json:R,text:m};async function v(e){let s=H(e),r=P(e),t=[s,r];for(let n of e.beforeRequestHandlers??[])t=await n(...t);let a;try{a=await fetch(...t)}catch(n){let i=q(n,e.requestErrorMessage);for(let h of e.requestErrorHandlers??[]){let d=await h(i,...t);if(d.status==="corrected"){a=d.value;break}else i=d.value}if(!a)throw i}let o=await E(a);for(let n of e.responseSuccessHandlers??[])return o.response.ok&&(o=await n(o)),o;let p=new u(a,e.responseErrorMessage);for(let n of e.responseErrorHandlers??[]){let i=await n(p,o,...t);i.status==="corrected"?o=await E(i.value):p=i.value}if(o.response.ok)return o;throw p}function H(e){let s=new URL(e.url,e.baseUrl??window.location.origin);if(e.params){let r=e.params instanceof URLSearchParams?e.params:new URLSearchParams(e.params);for(let[t,a]of r)s.searchParams.set(t,a)}return s}function P(e){let s=e.init??{},r={...s};r.method=(s.method??"GET").toUpperCase(),r.headers=new Headers(s.headers),r.headers.has("x-request-with")||r.headers.set("x-requested-with","XMLHttpRequest");let t;if("data"in e){let a=r.headers.get(l);e.data instanceof ArrayBuffer?t="arrayBuffer":e.data instanceof Blob?t="blob":e.data instanceof FormData?t="formData":a?.startsWith(R)||a===null&&!["GET","HEAD"].includes(r.method)?t="json":typeof e.data=="string"&&(t="text")}return t==="formData"?r.headers.delete(l):t&&!r.headers.has(l)&&r.headers.set(l,T[t]),"data"in e?r.body=t==="json"?JSON.stringify(e.data):e.data:"body"in s&&(r.body=s.body),e.timeout&&!("signal"in r)&&(r.signal=AbortSignal.timeout(e.timeout)),r}function q(e,s){let r=e instanceof Error?e:new Error;return r.message&&(r.cause=r.message),s?r.message=s:typeof e=="string"&&e!==""?r.message=e:r.message||(r.message="Unknown request error"),r}async function E(e){let s=e.headers.get(l)??"",r;s.startsWith(R)||s.startsWith(y)?r="json":s.startsWith(f)?r="formData":s.startsWith(m)&&(r="text");try{let t=r?await e[r]():null;return{response:e,data:t}}catch(t){let a=t,o={};throw"cause"in a&&(o.cause=a.cause),new u(e,a.message,o)}}export{u as ResponseError,v as retrieve};
