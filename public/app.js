'use strict';

// 名前空間
// アプリケーションの関数と変数をこのオブジェクトに追加する
// const learnjs = {
const learnjs = {
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
  let hashParts = hash.split('-');
  let viewFn = routes[hashParts[0]];
  if (viewFn){
    learnjs.triggerEvent('removingView', []);
    $('.view-container').empty().append(viewFn(hashParts[1]));
  };
  // learnjs.triggerEvent('removingView', []);
  // $('.view-container').empty().append(viewFn(hashParts[1]));
}



// ビュー関数
learnjs.problemView = function(data){
  let problemNumber = parseInt(data,10);
  let view = $('.templates .problem-view').clone();
  let problemData = learnjs.problems[problemNumber-1];
  let resultFlash = view.find('.result');
  let answer = view.find('.answer');

  function checkAnswerClick(){
    if (checkAnswer()){
      let correctFlash = learnjs.buildCorrectFlash(problemNumber);
      learnjs.flashElement(resultFlash, correctFlash);
      console.log('answer : ',answer);
      learnjs.saveAnswer(problemNumber,answer); 
    }else{
      learnjs.flashElement(resultFlash, 'Incorrect!');
    }
    // テストがリロードの無限ループを防ぐための一文
    return false;
  };
  
  function checkAnswer(){
    answer = view.find('.answer').val();
    let test = problemData.code.replace('__',answer) + '; problem();';
    return eval(test);
  };

  learnjs.fetchAnswer(problemNumber).then(function(data){
    if(data.Item){
      console.log('data.Item : ',data.Item);
      answer.val(data.Item.answer);
    }
  });

  if (problemNumber < learnjs.problems.length){
    let buttonItem = learnjs.template('skip-btn');
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
  let correctFlash = learnjs.template('correct-flash');
  let link = correctFlash.find('a');
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
  let base64Url = token.split('.')[1];
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(decodeURIComponent(myescape(window.atob(base64))));
};

const myescape = (str) => {
  return str.replace(/[^a-zA-Z0-9@*_+\-./]/g, m => {
      let code = m.charCodeAt(0);
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
  let id_token = googleUser.credential;
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
      let creds = AWS.config.credentials;
      // const newToken = userUpdate.getAuthResponse().id_token;
      let newToken = userUpdate.credential;
      creds.params.Logins['accounts.google.com'] = newToken;
      return learnjs.awsRefresh();
    });
  }

  learnjs.awsRefresh().then(function(id) {
    let responsePayload = decodeJwt(googleUser.credential);
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
  let deferred = new $.Deferred();
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
  let view = learnjs.template('profile-view');
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



learnjs.sendDbRequest = function(req, retry) {
  let promise = new $.Deferred();
  req.on('error', function(error){
    if (error.code === "CredentialsError"){
      learnjs.identity.then(function(identity){
        return identity.refresh().then(function(){
          return retry();
        },function(){
          promise.reject(resp);
        });
      });
    } else {
      promise.reject(error);
    }
  });
  req.on('success',function(resp){
    promise.resolve(resp.data);
  });
  req.send();
  return promise;
}



learnjs.saveAnswer = function(problemId, answer){
  return learnjs.identity.then(function(identity){
    let db = new AWS.DynamoDB.DocumentClient();
    let item = {
      TableName: 'learnjs',
      Item:{
        userId: identity.id,
        problemId: problemId,
        answer: answer
      }
    };
    return learnjs.sendDbRequest(db.put(item),function(){
      return learnjs.saveAnswer(problemId,answer);
    })
  });
}



learnjs.fetchAnswer = function(problemId){
  return learnjs.identity.then(function(identity){
    let db = new AWS.DynamoDB.DocumentClient();
    let item = {
      TableName: 'learnjs',
      Key: {
        userId: identity.id,
        problemId: problemId
      }
    };
    return learnjs.sendDbRequest(db.get(item), function(){
      return learnjs.fetchAnswer(problemId);
    })
  });
}








