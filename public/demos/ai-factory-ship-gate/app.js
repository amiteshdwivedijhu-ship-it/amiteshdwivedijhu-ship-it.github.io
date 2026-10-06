(function(){
  "use strict";
  var KEY="domino-afs-v1";
  var seed=window.AFS_SEED;
  function defaultState(){
    return {
      panel:"queue", selected:"tsrs",
      reproduced:false, licenseFixed:false, driftFixed:false,
      findingStatus:"open", findingNote:"",
      mlSign:"", riskSign:"", shipped:false
    };
  }
  function load(){try{var r=localStorage.getItem(KEY);if(!r)return defaultState();return Object.assign(defaultState(),JSON.parse(r));}catch(e){return defaultState();}}
  function save(){localStorage.setItem(KEY,JSON.stringify(state));}
  var state=load();
  function $(id){return document.getElementById(id);}
  function accuracy(){return 0.87;}
  function ece(){return state.driftFixed ? 0.05 : 0.11;}
  function gateChecks(){
    return [
      {ok: state.reproduced, label:"Environment and code commit reproducible from recorded run", reason:"Reproduce last run not confirmed"},
      {ok: state.licenseFixed, label:"Train and inference snapshots pinned with license tags", reason:"Inference snapshot missing license tag"},
      {ok: accuracy()>=0.84 && ece()<0.08, label:"Quality bar: accuracy >= 0.84 and ECE under 0.08", reason:"ECE at "+ece()+" (drift flag)"},
      {ok: state.findingStatus==="mitigated", label:"Zero open Sev-1 or Sev-2 model risk findings", reason:"Sev-2 feature leakage review still open"},
      {ok: !!(state.mlSign&&state.mlSign.trim()) && !!(state.riskSign&&state.riskSign.trim()), label:"ML owner and Model Risk both signed", reason:"Dual signoff incomplete"}
    ];
  }
  function canShip(){return gateChecks().every(function(c){return c.ok;}) && !state.shipped;}
  function setPanel(n){state.panel=n;save();render();}
  function renderNav(){
    document.querySelectorAll(".nav-steps button").forEach(function(b){b.classList.toggle("active",b.getAttribute("data-panel")===state.panel);});
    document.querySelectorAll(".panel").forEach(function(p){p.classList.toggle("active",p.id==="panel-"+state.panel);});
  }
  function statusFor(app){
    if(app.id!=="tsrs") return app.status;
    if(state.shipped) return "Shipped";
    if(canShip()||gateChecks().filter(function(c){return!c.ok;}).length<=1) return "Ready";
    return "Blocked";
  }
  function renderQueue(){
    var html='<div class="card"><h2>Factory queue · '+seed.org+'</h2>';
    seed.apps.forEach(function(a){
      var st=statusFor(a);
      var chip=st==="Shipped"?"ok":st==="Ready"?"warn":"bad";
      html+='<button type="button" class="list-btn'+(state.selected===a.id?" selected":"")+'" data-select="'+a.id+'"><span><strong>'+a.name+'</strong><br><span style="color:#475569;font-size:14px">ML: '+a.owner+'</span></span><span class="chip '+chip+'">'+st+'</span></button>';
    });
    $("panel-queue").innerHTML=html+"</div>";
  }
  function renderRepro(){
    $("panel-repro").innerHTML='<div class="card"><h2>Reproducibility</h2>'+
      '<p><strong>Commit:</strong> '+seed.commit+'</p>'+
      '<p><strong>Environment image:</strong> '+seed.image+'</p>'+
      '<p><strong>Run id:</strong> '+seed.runId+'</p>'+
      (state.reproduced?'<p class="ok-reason">Last run reproduced successfully (mock).</p>':
        '<div class="actions"><button type="button" class="primary" id="btn-repro">Reproduce last run</button></div>')+
      '</div>';
  }
  function renderData(){
    $("panel-data").innerHTML='<div class="card"><h2>Data pins</h2>'+
      '<p><strong>Train snapshot:</strong> ds-train-2026-08-01 · license: internal-research</p>'+
      '<p><strong>Inference snapshot:</strong> ds-infer-2026-09-15 · license: '+(state.licenseFixed?'internal-research <span class="chip ok">tagged</span>':'<span class="chip bad">MISSING</span>')+'</p>'+
      (state.licenseFixed?'<p class="ok-reason">License tag applied.</p>':
        '<div class="actions"><button type="button" class="primary" id="btn-license">Add license tag</button></div>')+
      '</div>';
  }
  function renderQuality(){
    $("panel-quality").innerHTML='<div class="card"><h2>Quality check</h2>'+
      '<div class="row"><div class="metric"><div class="label">Holdout accuracy</div><div class="value">0.87</div></div>'+
      '<div class="metric"><div class="label">ECE</div><div class="value">'+ece()+'</div></div>'+
      '<div class="metric"><div class="label">Drift flag</div><div class="value" style="font-size:1rem">'+(state.driftFixed?"clear":"site-mix shift")+'</div></div></div>'+
      (state.driftFixed?'<p class="ok-reason">Drift mitigated with refreshed calibration slice.</p>':
        '<div class="actions"><button type="button" class="primary" id="btn-drift">Fix drift / recalibrate</button></div>')+
      '<p style="color:#475569;font-size:15px;margin-top:.75rem">Compact metrics only. Not a rubric grid.</p></div>';
  }
  function renderRisk(){
    $("panel-risk").innerHTML='<div class="card"><h2>Model risk findings</h2>'+
      '<p><span class="chip bad">Sev-2</span> Feature leakage review incomplete on site enrollment features.</p>'+
      (state.findingStatus==="mitigated"?'<p class="ok-reason">Mitigated: '+(state.findingNote||"noted")+'</p>':
        state.findingStatus==="sent"?'<p class="lock-reason">Sent back to ML. Ship remains blocked.</p>':
        '<label for="finding-note">Mitigation note</label><textarea id="finding-note" rows="3" placeholder="How was leakage ruled out?"></textarea>'+
        '<div class="actions"><button type="button" class="success" id="btn-mitigate">Mark mitigated</button>'+
        '<button type="button" class="danger" id="btn-sendback">Send back to ML</button></div>')+
      '</div>';
  }
  function renderGate(){
    var checks=gateChecks();
    var list=checks.map(function(c){return '<div class="check"><div class="status '+(c.ok?"pass":"fail")+'">'+(c.ok?"PASS":"FAIL")+'</div><div>'+c.label+(!c.ok?'<div style="color:#991b1b;font-size:14px">'+c.reason+'</div>':'')+'</div></div>';}).join("");
    $("panel-gate").innerHTML='<div class="card"><h2>Ship gate</h2>'+list+
      '<label for="ml-sign">ML owner signoff</label><input type="text" id="ml-sign" value="'+(state.mlSign||"")+'" placeholder="Maya Chen">'+
      '<label for="risk-sign">Model Risk signoff</label><input type="text" id="risk-sign" value="'+(state.riskSign||"")+'" placeholder="Owen Park">'+
      (state.shipped?'<p class="ok-reason">Shipped to production.</p>':
        (canShip()?'<div class="actions"><button type="button" class="primary" id="btn-ship">Ship to production</button></div>':
          '<p class="lock-reason">Ship locked. Clear FAIL items and dual signoff.</p>'))+
      '</div>';
  }
  function renderProd(){
    if(!state.shipped){
      $("panel-prod").innerHTML='<div class="card"><h2>Production record</h2><p>Nothing shipped yet.</p></div>';
      return;
    }
    $("panel-prod").innerHTML='<div class="card"><h2>Production record</h2>'+
      '<p><strong>Version:</strong> Trial Site Risk Score v3</p>'+
      '<p><strong>Shipped by:</strong> '+state.mlSign+' (ML) · '+state.riskSign+' (Model Risk)</p>'+
      '<p><strong>Checks snapshot:</strong> repro ok · data pinned · acc 0.87 · ECE '+ece()+' · Sev-2 mitigated</p>'+
      '<p><strong>Rollback pointer:</strong> v2 @ commit 88b1d0c</p>'+
      '<p class="ok-reason">Record sealed for audit.</p></div>';
  }
  function render(){renderNav();renderQueue();renderRepro();renderData();renderQuality();renderRisk();renderGate();renderProd();bind();}
  function bind(){
    document.querySelectorAll("[data-select]").forEach(function(b){b.onclick=function(){state.selected=b.getAttribute("data-select");save();render();};});
    var r=$("btn-repro"); if(r) r.onclick=function(){state.reproduced=true;save();render();};
    var l=$("btn-license"); if(l) l.onclick=function(){state.licenseFixed=true;save();render();};
    var d=$("btn-drift"); if(d) d.onclick=function(){state.driftFixed=true;save();render();};
    var m=$("btn-mitigate"); if(m) m.onclick=function(){
      var note=($("finding-note")||{}).value||"";
      if(!note.trim()){alert("Mitigation note required.");return;}
      state.findingStatus="mitigated"; state.findingNote=note; save();render();
    };
    var s=$("btn-sendback"); if(s) s.onclick=function(){state.findingStatus="sent";save();render();};
    var ml=$("ml-sign"); if(ml){ml.onchange=ml.onblur=function(){state.mlSign=ml.value;save();render();};}
    var rs=$("risk-sign"); if(rs){rs.onchange=rs.onblur=function(){state.riskSign=rs.value;save();render();};}
    var ship=$("btn-ship"); if(ship) ship.onclick=function(){
      state.mlSign=($("ml-sign")||{}).value||state.mlSign;
      state.riskSign=($("risk-sign")||{}).value||state.riskSign;
      if(!canShip()){save();render();return;}
      state.shipped=true;save();setPanel("prod");
    };
  }
  document.querySelectorAll(".nav-steps button").forEach(function(b){b.onclick=function(){setPanel(b.getAttribute("data-panel"));};});
  $("btn-reset").onclick=function(){state=defaultState();save();render();};
  render();
})();
