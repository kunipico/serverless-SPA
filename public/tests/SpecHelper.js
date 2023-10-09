let fixture;

function loadFixture(path) {  
  let html;
  jQuery.ajax({
    // url: '/index.html',
    url: path,
    success: function(result) {
      html = result;
      // console.log('success', html);
    },
    async: false
  });          
  return $.parseHTML(html);
}

function resetFixture() {
  if (!fixture) {
    const index = $('<div>').append(loadFixture('/index.html'));
    const markup = index.find('div.markup');
    fixture = $('<div class="fixture" style="display: none">').append(markup);
    $('body').append(fixture.clone());
  } else {
    $('.fixture').replaceWith(fixture.clone());
  }
}

beforeEach(function () {
  resetFixture();
});
