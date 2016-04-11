//= require jquery
//= require jquery_ujs
//= require turbolinks
//= require scripts

var Chat = {
  init: function() {
    $('.dc-launch').hide();
    $('#chat-box').show();

    Chat.displayQueueOptions();
  },

  displayQueueOptions: function() {
    var dropdown = $('#queue_options');

    dropdown.show();

    var queues = Chat.queues();

    $.each(queues, function() {
      $("#options").append($("<option />").val(this).text(this));
    });
  },

  queues: function() {
    var queues = [
      'host',
      'email',
      'corporativo'
    ];

    return queues;
  }
}

$(document).ready(function() {
  $("#chat-box").hide();

  $('#open-chat').click(handleOpenChat);

  function handleOpenChat() {
    Chat.init();
  };
});
