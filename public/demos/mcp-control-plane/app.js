(function(){
  "use strict";
  var KEY="workato-mcp-cp-v1";
  var seed=window.MCP_SEED;
  function defaultPerms(){
    var p={};
    seed.tools.forEach(function(t){
      p[t.id]={"End User":"Deny","Agent Operator":"Allow","Admin":"Allow"};
    });
    // seeded mistake
    p["refund.create"]["End User"]="Allow"; // wildcard-style mistake: unexpected allow
    p["refund.create"]["Agent Operator"]="Allow"; // should be Approve
    p["user.reset_password"]["Agent Operator"]="Approve";
    p["user.reset_password"]["End User"]="Deny";
    return p;
  }
  function defaultState(){
    return {
      panel:"catalog", selected:"itsd", perms:defaultPerms(), verifiedUser:false,
      simRole:"End User", simTool:"refund.create", lastSim:null,
      denyResolved:false, denyAction:null, certified:false, signer:"",
      audit:[{when:"08:51", user:"jamie@enduser.example", tool:"kb.search", decision:"allow"},
             {when:"08:54", user:"agent-bot@harborline.example", tool:"refund.create", decision:"unexpected-allow"}]
    };
  }
  function load(){try{var r=localStorage.getItem(KEY);if(!r)return defaultState();var p=JSON.parse(r);var d=defaultState();return Object.assign(d,p,{perms:Object.assign(defaultPerms(),p.perms||{})});}catch(e){return defaultState();}}
  function save(){localStorage.setItem(KEY,JSON.stringify(state));}
  var state=load();
  function $(id){return document.getElementById(id);}
  function server(){return seed.servers.find(function(s){return s.id===state.selected;});}
  function hasWildcard(){return false;} // we model unexpected allow instead
  function highRiskNeedsApprove(){
    var high=seed.tools.filter(function(t){return t.risk==="high";});
    return high.some(function(t){
      return seed.roles.some(function(r){return state.perms[t.id][r]==="Approve";});
    });
  }
  function unexpectedHighRiskAllows(){
    // End User should not Allow any high-risk tool
    return seed.tools.filter(function(t){return t.risk==="high" && state.perms[t.id]["End User"]==="Allow";});
  }
  function simDecision(role, tool){
    var d=state.perms[tool][role];
    if(d==="Allow") return {decision:"allow", reason:role+" is allowed to call "+tool};
    if(d==="Deny") return {decision:"deny", reason:role+" is denied for "+tool};
    return {decision:"approve", reason:role+" may call "+tool+" only with step-up approval"};
  }
  function certChecks(){
    var unexpected=unexpectedHighRiskAllows();
    var simOk = state.lastSim && !(state.lastSim.role==="End User" && seed.tools.find(function(t){return t.id===state.lastSim.tool && t.risk==="high";}) && state.lastSim.decision==="allow");
    // Also require that refund.create End User is not Allow
    if(unexpected.length) simOk=false;
    return [
      {ok: unexpected.length===0, label:"Every tool has an explicit role allow list (no End User allow on high-risk)", reason: unexpected.length? ("Unexpected allow: "+unexpected.map(function(t){return t.id;}).join(", ")) : ""},
      {ok: highRiskNeedsApprove(), label:"At least one high-risk tool requires step-up approval", reason:"Set Approve on a high-risk tool for Agent Operator"},
      {ok: state.verifiedUser, label:"Verified User mode is on", reason:"Shared service account still enabled"},
      {ok: !!state.lastSim && unexpected.length===0 && state.perms["refund.create"]["End User"]==="Deny", label:"Last permission simulation has zero unexpected high-risk allows", reason:"Re-run simulation after tightening End User on refund.create"},
      {ok: !!(state.signer && state.signer.trim()), label:"Owner signed certification", reason:"Signature required"}
    ];
  }
  function canCertify(){return certChecks().every(function(c){return c.ok;}) && !state.certified;}

  function setPanel(n){state.panel=n;save();render();}
  function renderNav(){
    document.querySelectorAll(".nav-steps button").forEach(function(b){b.classList.toggle("active", b.getAttribute("data-panel")===state.panel);});
    document.querySelectorAll(".panel").forEach(function(p){p.classList.toggle("active", p.id==="panel-"+state.panel);});
  }
  function renderCatalog(){
    var html='<div class="card"><h2>MCP server catalog · '+seed.tenant+'</h2>';
    seed.servers.forEach(function(s){
      var tier=s.id==="itsd"?(state.certified?"Certified":"Draft"):s.tier;
      var chip=tier==="Certified"?"ok":tier==="Draft"?"draft":"warn";
      html+='<button type="button" class="list-btn'+(state.selected===s.id?" selected":"")+'" data-select="'+s.id+'"><span><strong>'+s.name+'</strong><br><span style="color:#5c5870;font-size:14px">'+s.owner+' · v'+s.version+'</span></span><span class="chip '+chip+'">'+tier+'</span></button>';
    });
    $("panel-catalog").innerHTML=html+"</div>";
  }
  function renderDetail(){
    var s=server();
    $("panel-detail").innerHTML='<div class="card"><h2>Server detail</h2>'+
      '<p><strong>Name:</strong> '+s.name+'</p>'+
      '<p><strong>Version:</strong> '+s.version+'</p>'+
      '<p><strong>Owner:</strong> '+s.owner+'</p>'+
      '<p><strong>Connectors:</strong> '+seed.connectors.join(", ")+'</p>'+
      '<label class="field"><input type="checkbox" id="toggle-vua" '+(state.verifiedUser?"checked":"")+'> Verified User mode (no shared service account)</label>'+
      (state.verifiedUser?'<p class="ok-reason">Per-user identity will be attached to every tool call.</p>':'<p class="lock-reason">Agents still act as a shared service account.</p>')+
      '</div>';
  }
  function renderPerms(){
    var html='<div class="card"><h2>Tool permissions</h2>';
    seed.tools.forEach(function(t){
      html+='<div class="tool-card"><h3>'+t.id+' <span class="chip '+(t.risk==="high"?"bad":t.risk==="medium"?"warn":"ok")+'">'+t.risk+' risk</span></h3>';
      seed.roles.forEach(function(r){
        var val=state.perms[t.id][r];
        html+='<div class="role-row"><label>'+r+'</label><select data-tool="'+t.id+'" data-role="'+r+'">'+
          ["Allow","Deny","Approve"].map(function(o){return '<option value="'+o+'"'+(val===o?" selected":"")+'>'+o+'</option>';}).join("")+
          '</select></div>';
      });
      html+='</div>';
    });
    if(unexpectedHighRiskAllows().length){
      html+='<p class="lock-reason">Seeded issue: End User can Allow refund.create. Tighten before certify.</p>';
    } else {
      html+='<p class="ok-reason">No End User allows on high-risk tools.</p>';
    }
    $("panel-perms").innerHTML=html+'</div>';
  }
  function renderSim(){
    var res=state.lastSim;
    $("panel-sim").innerHTML='<div class="card"><h2>Permission simulation</h2>'+
      '<label class="field">Role</label><select id="sim-role">'+seed.roles.map(function(r){return '<option'+(state.simRole===r?' selected':'')+'>'+r+'</option>';}).join("")+'</select>'+
      '<label class="field">Tool</label><select id="sim-tool">'+seed.tools.map(function(t){return '<option value="'+t.id+'"'+(state.simTool===t.id?' selected':'')+'>'+t.id+'</option>';}).join("")+'</select>'+
      '<div class="actions"><button type="button" class="primary" id="run-sim">Run simulation</button></div>'+
      (res?('<p class="'+(res.decision==="allow" && unexpectedHighRiskAllows().some(function(t){return t.id===res.tool;})?"lock":"ok")+'-reason"><strong>'+res.decision.toUpperCase()+'</strong> · '+res.reason+'</p>'):'<p style="color:#5c5870">Run a simulation to record the last result for certification.</p>')+
      '</div>';
  }
  function renderDeny(){
    $("panel-deny").innerHTML='<div class="card"><h2>Live deny feed</h2>'+
      '<p><strong>08:54</strong> · agent acting for jamie@enduser.example tried <code>refund.create</code> for $500.</p>'+
      '<p>Policy currently says End User: <strong>'+state.perms["refund.create"]["End User"]+'</strong></p>'+
      (state.denyResolved?('<p class="ok-reason">Resolved: '+state.denyAction+'</p>'):
        '<div class="actions"><button type="button" class="danger" id="deny-tighten">Deny and tighten</button><button type="button" id="deny-esc">Escalate to Admin</button></div>')+
      '</div>';
  }
  function renderCert(){
    var checks=certChecks();
    var list=checks.map(function(c){return '<div class="check"><div class="status '+(c.ok?"pass":"fail")+'">'+(c.ok?"PASS":"FAIL")+'</div><div>'+c.label+(!c.ok?'<div style="color:#991b1b;font-size:14px">'+c.reason+'</div>':'')+'</div></div>';}).join("");
    $("panel-cert").innerHTML='<div class="card"><h2>Certification gate</h2>'+list+
      '<label class="field" for="signer">Owner signature</label><input type="text" id="signer" value="'+(state.signer||"")+'" placeholder="Your name">'+
      (state.certified?'<p class="ok-reason">Server certified for production.</p>':
        (canCertify()?'<div class="actions"><button type="button" class="primary" id="btn-cert">Certify for production</button></div>':
          '<p class="lock-reason">Certify locked. Fix FAIL items above.</p>'))+
      '</div>';
  }
  function renderAudit(){
    var rows=state.audit.map(function(a){return '<tr><td>'+a.when+'</td><td>'+a.user+'</td><td>'+a.tool+'</td><td>'+a.decision+'</td></tr>';}).join("");
    $("panel-audit").innerHTML='<div class="card"><h2>Audit strip</h2><div class="table-wrap"><table><thead><tr><th>Time</th><th>User identity</th><th>Tool</th><th>Decision</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
  }
  function render(){
    renderNav();renderCatalog();renderDetail();renderPerms();renderSim();renderDeny();renderCert();renderAudit();bind();
  }
  function bind(){
    document.querySelectorAll("[data-select]").forEach(function(b){b.onclick=function(){state.selected=b.getAttribute("data-select");save();render();};});
    var vua=$("toggle-vua"); if(vua) vua.onchange=function(){state.verifiedUser=vua.checked;save();render();};
    document.querySelectorAll("select[data-tool]").forEach(function(sel){
      sel.onchange=function(){state.perms[sel.getAttribute("data-tool")][sel.getAttribute("data-role")]=sel.value;save();render();};
    });
    var sr=$("sim-role"); if(sr) sr.onchange=function(){state.simRole=sr.value;};
    var st=$("sim-tool"); if(st) st.onchange=function(){state.simTool=st.value;};
    var run=$("run-sim"); if(run) run.onclick=function(){
      state.simRole=($("sim-role")||{}).value||state.simRole;
      state.simTool=($("sim-tool")||{}).value||state.simTool;
      var d=simDecision(state.simRole,state.simTool);
      state.lastSim={role:state.simRole,tool:state.simTool,decision:d.decision,reason:d.reason};
      state.audit.unshift({when:"now",user:"sim:"+state.simRole,tool:state.simTool,decision:d.decision});
      save();render();
    };
    var dt=$("deny-tighten"); if(dt) dt.onclick=function(){
      state.perms["refund.create"]["End User"]="Deny";
      state.perms["refund.create"]["Agent Operator"]="Approve";
      state.denyResolved=true; state.denyAction="Denied and tightened End User to Deny; Agent Operator to Approve";
      state.audit.unshift({when:"now",user:"jamie@enduser.example",tool:"refund.create",decision:"deny"});
      save();render();
    };
    var de=$("deny-esc"); if(de) de.onclick=function(){state.denyResolved=true;state.denyAction="Escalated to Admin review queue";save();render();};
    var sig=$("signer"); if(sig){sig.onchange=sig.onblur=function(){state.signer=sig.value;save();render();};}
    var cert=$("btn-cert"); if(cert) cert.onclick=function(){state.signer=($("signer")||{}).value||state.signer; if(!canCertify()){save();render();return;} state.certified=true;save();setPanel("audit");};
  }
  document.querySelectorAll(".nav-steps button").forEach(function(b){b.onclick=function(){setPanel(b.getAttribute("data-panel"));};});
  $("btn-reset").onclick=function(){state=defaultState();save();render();};
  render();
})();
