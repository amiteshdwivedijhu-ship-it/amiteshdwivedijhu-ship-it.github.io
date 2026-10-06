(function(){
  "use strict";
  var KEY="regal-vad-v1";
  var seed=window.VAD_SEED;
  function defaultState(){
    var qa={}; seed.qa.forEach(function(q){qa[q.id]={status:"open", reason:""};});
    return {
      panel:"board", paused:false, qa:qa,
      escalations:[{id:"e1", from:"q2", reason:"payment-coercion", wait:"4m", status:"open"}],
      reviewedCount:0, onCall:true, containment:64, slaBreach:6, note:""
    };
  }
  function load(){try{var r=localStorage.getItem(KEY);if(!r)return defaultState();var p=JSON.parse(r);var d=defaultState();return Object.assign(d,p,{qa:Object.assign(d.qa,p.qa||{})});}catch(e){return defaultState();}}
  function save(){localStorage.setItem(KEY,JSON.stringify(state));}
  var state=load();
  function $(id){return document.getElementById(id);}
  function openSafety(){
    return seed.qa.filter(function(q){
      return (q.flag==="wrong-party"||q.flag==="payment-coercion") && state.qa[q.id].status==="open";
    });
  }
  function reviewed(){
    return Object.keys(state.qa).filter(function(id){return state.qa[id].status!=="open";}).length;
  }
  function gateChecks(){
    var cont = state.paused ? 72 : state.containment; // after pause+fixes we can show recovery path separately
    // live metrics depend on open safety
    var containment = openSafety().length ? state.containment : Math.max(state.containment, 74);
    var sla = state.escalations.some(function(e){return e.status==="open";}) ? state.slaBreach : 3;
    return [
      {ok: containment>=70, label:"Rolling containment >= 70% (last 50)", reason:"Containment at "+containment+"%"},
      {ok: openSafety().length===0, label:"Zero open safety flags", reason: openSafety().length+" open safety flag(s)"},
      {ok: sla<5, label:"Escalation SLA breaches under 5%", reason:"SLA breaches at "+sla+"%"},
      {ok: reviewed()>=5, label:"QA sampling >= 5 reviewed this hour", reason:"Reviewed "+reviewed()+" of 5"},
      {ok: state.onCall, label:"Owner on call", reason:"No on-call owner"}
    ];
  }
  function liveOk(){return gateChecks().every(function(c){return c.ok;});}
  function setPanel(n){state.panel=n;save();render();}
  function renderNav(){
    document.querySelectorAll(".nav-steps button").forEach(function(b){b.classList.toggle("active",b.getAttribute("data-panel")===state.panel);});
    document.querySelectorAll(".panel").forEach(function(p){p.classList.toggle("active",p.id==="panel-"+state.panel);});
  }
  function renderBoard(){
    var containment = openSafety().length ? state.containment : Math.max(state.containment, 74);
    $("panel-board").innerHTML='<div class="card"><h2>'+seed.campaign+'</h2>'+
      '<p>'+seed.brand+' · Card Past-Due Reminder Agent</p>'+
      '<p>Status: <span class="chip '+(state.paused?"paused":"live")+'">'+(state.paused?"Paused":"Live")+'</span> · On call: <strong>'+seed.owner+'</strong></p>'+
      '<div class="row">'+
      '<div class="metric"><div class="label">Dials</div><div class="value">1,284</div></div>'+
      '<div class="metric"><div class="label">Connects</div><div class="value">418</div></div>'+
      '<div class="metric"><div class="label">Containment</div><div class="value">'+containment+'%</div></div>'+
      '<div class="metric"><div class="label">Avg latency</div><div class="value">640ms</div></div></div></div>';
  }
  function renderLive(){
    var rows=seed.calls.map(function(c){return '<tr><td>'+c.when+'</td><td>'+c.outcome+'</td><td>'+c.note+'</td></tr>';}).join("");
    $("panel-live").innerHTML='<div class="card"><h2>Live lane</h2><div class="table-wrap"><table><thead><tr><th>Time</th><th>Outcome</th><th>Note</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
  }
  function renderQA(){
    var html='<div class="card"><h2>QA queue</h2>';
    seed.qa.forEach(function(q){
      var st=state.qa[q.id];
      html+='<div class="qa-item"><div><strong>'+q.id.toUpperCase()+'</strong> · <span class="chip '+(q.flag==="clean"?"live":"warn")+'">'+q.flag+'</span> · '+st.status+'</div>'+
        '<blockquote>'+q.snippet+'</blockquote>';
      if(st.status==="open"){
        html+='<div class="actions">'+
          '<button type="button" class="success" data-qa="'+q.id+'" data-act="pass">Pass</button>'+
          '<button type="button" class="danger" data-qa="'+q.id+'" data-act="fail">Fail</button>'+
          '<button type="button" data-qa="'+q.id+'" data-act="escalate">Escalate</button></div>';
      } else {
        html+='<p class="ok-reason">'+st.status+(st.reason?": "+st.reason:"")+'</p>';
      }
      html+='</div>';
    });
    $("panel-qa").innerHTML=html+'</div>';
  }
  function renderEsc(){
    var html='<div class="card"><h2>Escalation desk</h2>';
    if(!state.escalations.length){html+='<p class="ok-reason">No open escalations.</p>';}
    state.escalations.forEach(function(e){
      html+='<div class="qa-item"><strong>'+e.id+'</strong> · '+e.reason+' · wait '+e.wait+' · '+e.status;
      if(e.status==="open"){
        html+='<div class="actions"><button type="button" class="success" data-res="'+e.id+'">Resolve</button>'+
          '<button type="button" data-assign="'+e.id+'">Assign to human queue</button></div>';
      }
      html+='</div>';
    });
    $("panel-esc").innerHTML=html+'</div>';
  }
  function renderGate(){
    var checks=gateChecks();
    var list=checks.map(function(c){return '<div class="check"><div class="status '+(c.ok?"pass":"fail")+'">'+(c.ok?"PASS":"FAIL")+'</div><div>'+c.label+(!c.ok?'<div style="color:#991b1b;font-size:14px">'+c.reason+'</div>':'')+'</div></div>';}).join("");
    var controls;
    if(!liveOk()){
      controls = state.paused
        ? '<p class="lock-reason">Stay Live locked until FAIL items clear. Campaign is paused.</p>'
        : '<p class="lock-reason">Quality gate failing. Pause required.</p><div class="actions"><button type="button" class="danger" id="btn-pause">Pause campaign</button></div>';
    } else {
      controls = state.paused
        ? '<p class="ok-reason">All checks pass.</p><div class="actions"><button type="button" class="primary" id="btn-resume">Resume Live</button></div>'
        : '<p class="ok-reason">All checks pass. Campaign may stay Live.</p>';
    }
    $("panel-gate").innerHTML='<div class="card"><h2>Quality gate</h2>'+list+controls+'</div>';
  }
  function renderBrief(){
    $("panel-brief").innerHTML='<div class="card"><h2>Campaign brief</h2>'+
      '<p><strong>Goal:</strong> Remind past-due cardholders, offer pay or schedule, escalate disputes.</p>'+
      '<p><strong>Compliance notes (synthetic):</strong> Identify the brand, confirm party, no legal threats, honor do-not-call requests immediately.</p>'+
      '<p><strong>Success metrics:</strong> Containment, right-party contact, promise-to-pay rate, escalation quality.</p>'+
      '<p><strong>Kill criteria:</strong> Any open safety flag, containment under 70%, or missing on-call owner.</p></div>';
  }
  function render(){renderNav();renderBoard();renderLive();renderQA();renderEsc();renderGate();renderBrief();bind();}
  function bind(){
    document.querySelectorAll("[data-qa]").forEach(function(btn){
      btn.onclick=function(){
        var id=btn.getAttribute("data-qa"); var act=btn.getAttribute("data-act");
        if(act==="pass"){state.qa[id]={status:"passed",reason:""};}
        if(act==="fail"){
          var reason=prompt("Fail reason?")||"Failed in QA";
          state.qa[id]={status:"failed",reason:reason};
        }
        if(act==="escalate"){
          state.qa[id]={status:"escalated",reason:"sent to human"};
          var q=seed.qa.find(function(x){return x.id===id;});
          state.escalations.push({id:"e-"+id, from:id, reason:q.flag, wait:"1m", status:"open"});
        }
        save();render();
      };
    });
    document.querySelectorAll("[data-res]").forEach(function(btn){
      btn.onclick=function(){var id=btn.getAttribute("data-res"); state.escalations.forEach(function(e){if(e.id===id)e.status="resolved";}); save();render();};
    });
    document.querySelectorAll("[data-assign]").forEach(function(btn){
      btn.onclick=function(){var id=btn.getAttribute("data-assign"); state.escalations.forEach(function(e){if(e.id===id){e.status="assigned"; e.wait="queued";}}); save();render();};
    });
    var p=$("btn-pause"); if(p) p.onclick=function(){state.paused=true;save();render();};
    var r=$("btn-resume"); if(r) r.onclick=function(){if(!liveOk())return; state.paused=false;save();render();};
  }
  document.querySelectorAll(".nav-steps button").forEach(function(b){b.onclick=function(){setPanel(b.getAttribute("data-panel"));};});
  $("btn-reset").onclick=function(){state=defaultState();save();render();};
  render();
})();
