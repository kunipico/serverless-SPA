'use strict';

// 名前空間
// アプリケーションの関数と変数をこのオブジェクトに追加する
// const learnjs = {
let learnjs = {
  poolId: 'ap-northeast-1:ba272943-bf88-414d-b5c4-420028ddbb14'
};



// HTMLよりページが準備できたら呼び出される
learnjs.appOnReady = function(){
  // ↓ハッシュ変更イベント検知メソッド
  window.onhashchange = function(){
    learnjs.showView(window.location.hash);
  };
  learnjs.showView(window.location.hash);
  learnjs.identity.done(learnjs.addProfileLink);
}



// ルータ関数
// ハッシュ変更イベントを検知して、HTML内のView-containerを置き換える
learnjs.showView = function(hash){
  const routes = {
    '#problem': learnjs.problemView,
    '#profile': learnjs.profileView,
    '#': learnjs.landingView,
    '': learnjs.landingView
  };
  const hashParts = hash.split('-');
  const viewFn = routes[hashParts[0]];
  if (viewFn){
    learnjs.triggerEvent('removingView', []);
    $('.view-container').empty().append(viewFn(hashParts[1]));
  };
  // learnjs.triggerEvent('removingView', []);
  // $('.view-container').empty().append(viewFn(hashParts[1]));
}



// ビュー関数
learnjs.problemView = function(data){
  const problemNumber = parseInt(data,10);
  const view = $('.templates .problem-view').clone();
  const problemData = learnjs.problems[problemNumber-1];
  const resultFlash = view.find('.result');

  function checkAnswer(){
    const answer = view.find('.answer').val();
    const test = problemData.code.replace('__',answer) + '; problem();';
    return eval(test);
  };

  function checkAnswerClick(){
    if (checkAnswer()){
      // const correctFlash = learnjs.template('correct-flash');
      const correctFlash = learnjs.buildCorrectFlash(problemNumber);
      // correctFlash.find('a').attr('href','#problem-' + (problemNumber + 1));
      learnjs.flashElement(resultFlash, correctFlash);
    }else{
      learnjs.flashElement(resultFlash, 'Incorrect!');
    }
    // テストがリロードの無限ループを防ぐための一文
    return false;
  };

  if (problemNumber < learnjs.problems.length){
    const buttonItem = learnjs.template('skip-btn');
    buttonItem.find('a').attr('href','#problem-' + (problemNumber + 1));
    $('.nav-list').append(buttonItem);
    view.bind('removingView',function(){
      buttonItem.remove();
    });
  }

  view.find('.check-btn').click(checkAnswerClick);
  view.find('.title').text('Problem #' + problemNumber);
  learnjs.applyObject(problemData, view);
  return view;
}



learnjs.problems = [
  {
    description:"What is truth?",
    code:"function problem() { return __;}"
  },
  {
    description:"Simple Math",
    code:"function problem() { return 42 === 6 * __;}"
  }
];



learnjs.applyObject = function(obj,elem){
  for(let key in obj){
    elem.find('[data-name="' + key + '"]').text(obj[key]);
  }
}



learnjs.landingView = function() {
  return learnjs.template('landing-view');
}



learnjs.buildCorrectFlash = function (problemNum) {
  const correctFlash = learnjs.template('correct-flash');
  const link = correctFlash.find('a');
  if(problemNum < learnjs.problems.length) {
    link.attr('href', '#problem-' + (problemNum + 1));
  }else{
    link.attr('href', '');
    link.text("You are Finished!");
  };
  return correctFlash;
}



learnjs.flashElement = function(elem, content) {
  elem.fadeOut('fast', function(){
    elem.html(content);
    elem.fadeIn();
  });
}



learnjs.template = function(name){
  return $('.templates .' + name).clone();
}



learnjs.triggerEvent = function(name, args){
  $('.view-container>*').trigger(name, args);
}



// 自作関数　２０２３.12.19
const decodeJwt = (token) => {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(decodeURIComponent(myescape(window.atob(base64))));
};
const myescape = (str) => {
  return str.replace(/[^a-zA-Z0-9@*_+\-./]/g, m => {
      const code = m.charCodeAt(0);
      if (code <= 0xff) {
          return '%' + ('00' + code.toString(16)).slice(-2).toUpperCase();
      } else {
          return '%u' + ('0000' + code.toString(16)).slice(-4).toUpperCase();
      }
  });
}


// 試し 2023.12.18
function handleCredentialResponse(googleUser) {
  // console.log("Encoded JWT ID token: " + googleUser.credential);
  // const id_token = googleUser.getAuthResponse().id_token;
  const id_token = googleUser.credential;
  AWS.config.update({
    region: 'ap-northeast-1',
    credentials: new AWS.CognitoIdentityCredentials({
      IdentityPoolId: learnjs.poolId,
      Logins: {
        'accounts.google.com': id_token
      }
    })
  });
  console.log('id_token = ',id_token);

  function refresh() {
    return gapi.auth.getAuthInstance().signIn({
      prompt: 'login'
    }).then(function(userUpdate) {
      const creds = AWS.config.credentials;
      // const newToken = userUpdate.getAuthResponse().id_token;
      const newToken = userUpdate.credential;
      creds.params.Logins['accounts.google.com'] = newToken;
      return learnjs.awsRefresh();
    });
  }

  learnjs.awsRefresh().then(function(id) {
    const responsePayload = decodeJwt(googleUser.credential);
    console.log('id = ',id);
    console.log('responsePayload = ',responsePayload);
    console.log('email = ',responsePayload.email);
    learnjs.identity.resolve({
      id: id,
      // email: googleUser.getBasicProfile().getEmail(),
      email: responsePayload.email,
      refresh: refresh
    });
  });
}



window.onload = function () {
  google.accounts.id.initialize({
    client_id: "863966693515-5272otk66s0vbsnip2jguo1taein7avd.apps.googleusercontent.com",
    callback: handleCredentialResponse
  });
  google.accounts.id.renderButton(
    document.getElementById("buttonDiv"),
    { theme: "outline", size: "middle", shape:"pill" }  // customization attributes
  );
  // google.accounts.id.prompt(); // also display the One Tap dialog
}



learnjs.awsRefresh = function() {
  const deferred = new $.Deferred();
  AWS.config.credentials.refresh(function(err) {
    if (err) {
      deferred.reject(err);
    }else{
      deferred.resolve(AWS.config.credentials.identityId);
    }
  });
  return deferred.promise();
}



learnjs.identity = new $.Deferred();



learnjs.profileView = function() {
  const view = learnjs.template('profile-view');
  learnjs.identity.done(function(identity) {
    view.find('.email').text(identity.email);
    console.log('identity.email = ',identity.email);
  });
  
  return view;
}



learnjs.addProfileLink = function(profile) {
  console.log('profile.email = ',profile.email);
  let link = learnjs.template('profile-link');
  link.find('a').text(profile.email);
  $('.signin-bar').prepend(link);
}