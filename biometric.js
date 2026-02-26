async function biometricLogin(){
  try{
    await navigator.credentials.get({
      publicKey:{
        challenge: new Uint8Array(32),
        timeout:60000,
        userVerification:"required"
      }
    });
    alert("Owner Verified");
  }catch(e){
    alert("Verification failed");
  }
}
