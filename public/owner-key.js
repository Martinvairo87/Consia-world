// CONSIA OWNER SECURITY

const CONSIA_OWNER_KEY = "martin-owner-consia-001";

function checkOwner(){

let key = localStorage.getItem("CONSIA_OWNER_KEY");

if(key !== CONSIA_OWNER_KEY){

document.body.innerHTML = `
<div style="
display:flex;
height:100vh;
align-items:center;
justify-content:center;
background:#020617;
color:white;
font-family:system-ui;
text-align:center;
flex-direction:column;
">

<h1>CONSIA</h1>
<p>Owner authentication required</p>

<input id="ownerInput"
placeholder="Owner Key"
style="
padding:14px;
border-radius:10px;
border:none;
margin-top:20px;
background:#111827;
color:white;
width:260px;
">

<button onclick="unlock()"
style="
margin-top:14px;
padding:12px 24px;
border:none;
border-radius:10px;
background:#4f6cff;
color:white;
cursor:pointer;
">

Unlock
</button>

</div>
`;

}

}

function unlock(){

let v = document.getElementById("ownerInput").value;

if(v === CONSIA_OWNER_KEY){

localStorage.setItem("CONSIA_OWNER_KEY",CONSIA_OWNER_KEY);

location.reload();

}else{

alert("Invalid owner key");

}

}

checkOwner();
