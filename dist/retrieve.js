var p=class extends Error{name="ResponseError";data;response;constructor(s,r,t){super(r||`${s.response.status} ${s.response.statusText}`.trim(),t),this.data=s.data,this.response=s.response}toJSON(){return{name:this.name,message:this.message}}};var u="content-type",E="multipart/form-data",R="application/json",y="application/problem+json",c="application/octet-stream",m="plain/text",T={arrayBuffer:c,blob:c,formData:E,json:R,text:m};async function v(e){let s=H(e),r=P(e),t=[s,r];for(let n of e.beforeRequestHandlers??[])t=await n(...t);let o;try{o=await fetch(...t)}catch(n){let i=w(n,e.requestErrorMessage);for(let h of e.requestErrorHandlers??[]){let d=await h(i,...t);if(d.status==="corrected"){o=d.value;break}else i=d.value}if(!o)throw i}let a=await f(o);if(a.response.ok){for(let n of e.responseSuccessHandlers??[])a=await n(a);return a}let l=new p(a,e.responseErrorMessage);for(let n of e.responseErrorHandlers??[]){let i=await n(l,a,...t);if(i.status==="corrected"){a=await f(i.value);break}else l=i.value}if(a.response.ok)return a;throw l}function H(e){let s=e.baseUrl??(typeof window<"u"?window.location.origin:void 0),r=new URL(e.url,s);if(e.params){let t=e.params instanceof URLSearchParams?e.params:new URLSearchParams(e.params);for(let[o,a]of t)r.searchParams.set(o,a)}return r}function P(e){let s=e.init??{},r={...s};r.method=(s.method??"GET").toUpperCase(),r.headers=new Headers(s.headers),r.headers.has("x-request-with")||r.headers.set("x-requested-with","XMLHttpRequest");let t;if("data"in e){let o=r.headers.get(u);e.data instanceof ArrayBuffer?t="arrayBuffer":e.data instanceof Blob?t="blob":e.data instanceof FormData?t="formData":o?.startsWith(R)||o===null&&!["GET","HEAD"].includes(r.method)?t="json":typeof e.data=="string"&&(t="text")}return t==="formData"?r.headers.delete(u):t&&!r.headers.has(u)&&r.headers.set(u,T[t]),"data"in e?r.body=t==="json"?JSON.stringify(e.data):e.data:"body"in s&&(r.body=s.body),e.timeout&&!("signal"in r)&&(r.signal=AbortSignal.timeout(e.timeout)),r}function w(e,s){let r=e instanceof Error?e:new Error;return r.message&&(r.cause=r.message),s?r.message=s:typeof e=="string"&&e!==""?r.message=e:r.message||(r.message="Unknown request error"),r}async function f(e){let s=e.headers.get(u)??"",r;s.startsWith(R)||s.startsWith(y)?r="json":s.startsWith(E)?r="formData":s.startsWith(m)&&(r="text");try{let t=r?await e[r]():null;return{response:e,data:t}}catch(t){let o=t,a={};throw"cause"in o&&(a.cause=o.cause),new p({response:e,data:null},o.message,a)}}export{p as ResponseError,v as retrieve};
