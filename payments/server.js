/**
 * ATPL Ready — Stripe checkout PREPARATION ONLY.
 * Independent Node service; NOT deployed by the public Render static site.
 * Never expose paid PDFs from /public. Checkout is disabled by default.
 * HTTPS reverse proxy required in production.
 */
'use strict';
const http = require('node:http');
const Stripe = require('stripe');
const PORT = Number(process.env.PORT || 3000);
const ORIGIN = (process.env.SITE_ORIGIN || 'https://atpl-ready.onrender.com').replace(/\/$/,'');
const CHECKOUT_ENABLED = process.env.CHECKOUT_ENABLED === 'true';
const TEST_ONLY = process.env.STRIPE_TEST_ONLY !== 'false';
const secret = process.env.STRIPE_SECRET_KEY || '';
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
const stripe = secret ? Stripe(secret) : null;
const SUBJECTS = new Set(['010','021','022','031','032','033','040','050','061','062','070','081','090']);
const PRICES = {one:900,five:3900,all:9900};
const COUNT = {one:1,five:5,all:13};

function send(res,status,obj) {
  const data=JSON.stringify(obj);
  res.writeHead(status,{'content-type':'application/json; charset=utf-8','content-length':Buffer.byteLength(data),'cache-control':'no-store'});
  res.end(data);
}
function validate(order) {
  const pack=order?.pack;
  const subjects=order?.subjects;
  if(!Object.hasOwn(PRICES,pack)) throw Error('Invalid pack');
  if(!Array.isArray(subjects)||subjects.length!==COUNT[pack]||new Set(subjects).size!==subjects.length||subjects.some(s=>typeof s!=='string'||!SUBJECTS.has(s)))
    throw Error('Invalid subject selection');
  if(pack==='all' && SUBJECTS.size!==new Set(subjects).size) throw Error('Complete pack must contain all subjects');
  const language=order?.language;
  if(language!=='fr'&&language!=='en') throw Error('Invalid language');
  return {pack,subjects,language,amount:PRICES[pack]};
}
async function readBody(req,limit=32768) {
  return await new Promise((resolve,reject)=>{
    const chunks=[];let n=0;
    req.on('data',c=>{n+=c.length;if(n>limit){reject(Error('Payload too large'));req.destroy();return;}chunks.push(c)});
    req.on('end',()=>resolve(Buffer.concat(chunks)));
    req.on('error',reject);
  });
}
async function handler(req,res) {
  const path=new URL(req.url,'http://localhost').pathname;
  if(req.method==='GET'&&path==='/health') return send(res,200,{ok:true,checkoutEnabled:CHECKOUT_ENABLED && Boolean(stripe),testOnly:TEST_ONLY});
  if(req.method==='POST'&&path==='/api/checkout') {
    if(!CHECKOUT_ENABLED || !stripe) return send(res,503,{error:'Checkout is not open yet'});
    if(TEST_ONLY && !secret.startsWith('sk_test_')) return send(res,503,{error:'Only Stripe test keys are permitted'});
    let order;
    try {order=validate(JSON.parse((await readBody(req)).toString('utf8')));}
    catch(e) {return send(res,400,{error:e.message});}
    try {
      const session=await stripe.checkout.sessions.create({
        mode:'payment',
        payment_method_types:['card'],
        line_items:[{price_data:{
          currency:'eur',
          unit_amount:order.amount,
          product_data:{name:'ATPL Ready — '+(order.pack==='one'?'1 subject':order.pack==='five'?'5 subjects':'13 subjects'),description:'Concise introductory ATPL(A) study sheets — not complete courses'}
        },quantity:1}],
        customer_creation:'always',
        metadata:{pack:order.pack,subjects:order.subjects.join(','),language:order.language},
        success_url:ORIGIN+'/?checkout=success&session_id={CHECKOUT_SESSION_ID}',
        cancel_url:ORIGIN+'/?checkout=cancelled',
      });
      return send(res,200,{url:session.url});
    } catch(e) { console.error('Stripe session error',e.type||e.name);return send(res,502,{error:'Unable to create checkout session'}); }
  }
  if(req.method==='POST'&&path==='/api/stripe-webhook') {
    if(!stripe||!webhookSecret) return send(res,503,{error:'Webhook not configured'});
    let event;
    try{
      const raw=await readBody(req,1024*1024);
      event=stripe.webhooks.constructEvent(raw,req.headers['stripe-signature'],webhookSecret);
    }catch(e){return send(res,400,{error:'Invalid webhook signature'});}
    // IMPORTANT: DO NOT fulfill purchases from this example.
    // Production fulfillment requires persistent order storage, event idempotency,
    // paid-session confirmation, entitlement validation and private signed PDF URLs.
    if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)){
      console.info('Verified Stripe event received — fulfillment not configured',event.id);
    }
    return send(res,200,{received:true});
  }
  send(res,404,{error:'Not found'});
}
if(require.main===module) http.createServer((req,res)=>{handler(req,res).catch(e=>{console.error('Unexpected error',e.name);if(!res.headersSent)send(res,500,{error:'Internal error'});else res.end()})}).listen(PORT,()=>console.log('ATPL Ready payments staging API listening on '+PORT));
module.exports={validate,PRICES,COUNT,SUBJECTS};
