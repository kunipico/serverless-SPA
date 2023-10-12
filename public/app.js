'use strict';

const learnjs = {};

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

learnjs.applyObject=function(obj,elem){
  for(let key in obj){
    elem.find('[data-name="' + key + '"]').text(obj[key]);
  }
};

learnjs.landingView = function() {
  return learnjs.template('landing-view');
}

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
    return false;
  };
  view.find('.check-btn').click(checkAnswerClick);
  view.find('.title').text('Problem #' + problemNumber);
  learnjs.applyObject(problemData, view);
  return view;
};

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
};

learnjs.flashElement = function(elem, content) {
  elem.fadeOut('fast', function(){
    elem.html(content);
    elem.fadeIn();
  });
};

learnjs.showView = function(hash){
  const routes = {
    '#problem': learnjs.problemView,
    '': learnjs.landingView
  };
  const hashParts = hash.split('-');
  const viewFn = routes[hashParts[0]];
  if (viewFn){
    $('.view-container').empty().append(viewFn(hashParts[1]));
  };
};

learnjs.template = function(name){
  return $('.templates .' + name).clone();
};

learnjs.appOnReady = function(){
  window.onhashchange = function(){
    learnjs.showView(window.location.hash);
  };
  learnjs.showView(window.location.hash);
};