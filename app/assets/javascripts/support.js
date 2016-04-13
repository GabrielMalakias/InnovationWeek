//= require jquery
//= require jquery_ujs
//= require turbolinks
//= require scripts

var User = {
  attributes: {
    "login":"Renato",
    "password": "inicial1234",
    "type": "Doodle::User::Analyst"
  },

  authenticate: function() {
    var request = $.post("http://localhost:3000/doodle/authenticate", { "auth": this.attributes })

    // response returns a object containing login and session_token attributes.
    request.success(function(response) {
      console.log(response);
      Chat.sessionToken = response.session_token;
    });
  }
}

var Chat = {
  sessionToken: null,
  conversationId: null,
  currentUser: null,

  getSenderName: function(sender) {
    if (sender.name == null) {
      return sender.user_id;
    } else {
      return sender.name;
    }
  },

  openWindow: function() {
    $('.dc-launch').hide('slow');
    $('#chat-box').fadeIn('slow');

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
  },

  connect: function(){
    var ws = new WebSocket('wss://api.layer.com/websocket?session_token=' + Chat.sessionToken, 'layer-1.0');
    console.log('connection established.');

    ws.addEventListener('message', Conversation.messageHandler);
      
    $('.container-channel').fadeOut( "slow", function(){
      $('.dc-footer').fadeIn('slow');
    });

  },

  start: function() {
    console.log('Starting the chat..');

    authentication = User.authenticate();
    var queue_name = 'corporativo';
    $.get('http://localhost:3000/doodle/chat/' + queue_name + '/has_protocols', function (response){
      if (!response.has_protocols) {
        $('.lw-status-queue').fadeIn();
      } else {
        $.post('http://localhost:3000/doodle/chat/' + queue_name + '/next', {login: User.attributes['login']}, function(conversation) {
          console.log('O analista entrou na conversa: ' + conversation.conversation);
          Chat.conversationId = conversation.conversation;
          Chat.currentUser = User.attributes['login'];
      
          //render previous messages
          $.post('http://localhost:3000/doodle/conversations/messages', {conversation_id: Chat.conversationId}, function(messages) {
           
            $.each(messages, function(index, message) {
              parts = message.attributes.parts;
                var status_message = 'read';
                sender_name = Chat.getSenderName(message.attributes.sender);
                  
                  $.each(parts, function(index,message) {
                    var new_message = '<div class="dc-messages-container">' +
                          '<div class="dc-message message-client">' +
                            '<div class="dc-content-message">' +
                              '<span class="dc-name-user">' + sender_name + ':</span>' +
                                '<p class="dc-text-message">' + message.body +'</p>' +
                              '</div>' +
                            '</div>' +
                          '<span class="dc-type-indication dc-floating-right">' + status_message + '</span>' +
                        '</div>'

                    Chat.addMessage(new_message);
                  });
            });

          });
        });
      }

      Chat.connect();

    });

  },

  addMessage: function(message) {
    $('.dc-container-message').append(message)
  },
  
  create: function() {
    var queue = $('#options').val();
    console.log('creating a chat on selected queue: ' + queue);

    var params = {
      channel: queue,
      login: User.attributes['login']
    }

    Conversation.create(params);
  }
}

var Conversation = {

  messageHandler: function(event) {
    var message = JSON.parse(event.data);
    var body = message.body;
    switch(message.type) {
      case "change":
        Conversation.handleChange(body);
      break;
    }
  },

  /*
     This function handles the
     changes on a message.
     Message types:
     - "Message"
     - "Conversation"
  */
  handleChange: function(message) {
    try {
      switch(message.operation) {
        case "create":
        console.log("WEBSOCKET CREATE: " + message.object.id);
        console.log("WEBSOCKET RECEIVED: " + JSON.stringify(message, false, 4));
        switch(message.object.type) {
          case "Message":
            Conversation.handleCreateMessage(message);
          break;
          case "Conversation":
            Conversation.handleCreateConversation(message);
        }
        break;
        case "delete":
          console.log("WEBSOCKET DELETE: " + message.object.id);
          console.log("WEBSOCKET RECEIVED: " + JSON.stringify(message, false, 4));
        break;
        case "patch":
          console.log("WEBSOCKET PATCH: " + message.object.id);
          console.log("WEBSOCKET RECEIVED: " + JSON.stringify(message, false, 4));
        switch(message.object.type) {
          case "Message":
            handleUpdateMessage(message);
            break;
          case "Conversation":
            Conversation.handleUpdateConversation(message);
        }
        break;
      }
    } catch(e) {
      console.error("layer-patch Error: " + e);
    }
  },

  /*
     This function handles
     the message create process.
  */
  handleCreateMessage: function(message) {
    console.log('PASSOU');
    var sent_at = Conversation.formatDateTime(message.data.sent_at);
    var parts = message.data.parts;
    var sender = message.data.sender;
    var status_message = 'read';
    sender_name = Chat.getSenderName(sender);
    $.each(parts, function(index,message) {
      var new_message = '<div class="dc-messages-container">' +
                          '<div class="dc-message message-analyst">' +
                            '<div class="dc-content-message">' +
                              '<span class="dc-name-user">' + sender_name + ':</span>' +
                                '<p class="dc-text-message">' + message.body +'</p>' +
                              '</div>' +
                            '</div>' +
                          '<span class="dc-type-indication dc-floating-left">' + status_message + '</span>' +
                        '</div>'

      Chat.addMessage(new_message);
    });
  },

  /*
  This function handles
  the conversation create process
  */
  handleCreateConversation: function(message) {
    var participants = message.data.participants;
    var created_at = Conversation.formatDateTime(message.data.created_at);
    var created_by = Conversation.createdBy(chat.currentUser, participants);
    var new_message =
    '<div class="dc-card card-welcome dc-card-color-white">' +
      '<div class="dc-avatar-container">' +
        '<div class="dc-avatar">' +
          '<img src="dist/assets/images/avatar-castor.gif" alt="Avatar">' +
        '</div>' +
    '</div>' +
  
  '<div class="dc-welcome">' +
    '<h1>Bem vindo à Locaweb!!</h1>' +
    '<p>Bom dia, meu nome é <strong>Renato</strong>, sou analista da Locaweb. Como posso ajudá-lo(a)?</p>' +
  '</div>'
    Chat.conversationId = message.data.id;
    Chat.addMessage(new_message);
  },

  /*
      This function verifies if the currentUser is present on the participants list, if it is not present,
      it indicates that the counter-part has closed the conversation and we need to expire the sessionToken for
      the currentUser
  */
  handleUpdateConversation: function(message) {
    console.log('conversation updated.');
    // returns an array of data's. It may returns a operation kind "remove", "add", probably some others.
    console.log("MESSAGE RECEIVED: " + JSON.stringify(message, false, 4));
    console.log("MESSAGE DATA: " + message['data'])
    $.each(message['data'], function(index, message_data) {
      switch(message_data['operation']) {
        case "add":
          // handle add operation
          // it may be adding a new participant or maybe some other property.
          console.log('adicionou um participante..');
        break;
        case "remove":
          switch(message_data['property']) {
          case "participants":
            Conversation.handleRemoveParticipants(message_data);
        }
        break;
      }
    });
  },

  /*
        This function handles the
        remove of the participant from a conversation,
        message format:
        {
        "operation": "remove",
        "property": "participants",
        "value": "shima"
        }
  */
  handleRemoveParticipants: function(message) {
    console.log('here we removes the customer logged');
    var participants = message.value;
    console.log(message.value);
    if (participants.indexOf(chat.currentUser) == -1) {
      console.log('it seems the chat was closed by the analyst.');
      Chat.logout();
    }
  },

  /*
      This function handles to
      obtain the author of the message
  */
  createdBy: function(current_user, participants) {
    for (var i=participants.length-1; i>=0; i--) {
      if (participants[i] === chat.currentUser) {
        participants.splice(1, 1);
        return participants[0];
      }
    }
  },

  /*
    This function handles
    the date time format of the message
  */
  formatDateTime: function(datetime) {
    var date = new Date(datetime);
    var dateString = date.toLocaleDateString();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    return dateString + ' ' + hours + ':' + minutes +  ':' + seconds;
  }

}

$('#message').keyup(function(e){
  e = e || event;
  if (e.keyCode === 13 && !e.ctrlKey) {
    sendMessage(e);
  }
  return true;
});

function sendMessage(e){
    e.preventDefault();
    var message = $('#message').val();
    var new_message = '<p class="dc-text-message">' + message + '</p>';

    $('#message').val('');
      // creating a message
      attributes = {
        conversation: {
          id: Chat.conversationId,
          sender: {
            user_id: Chat.currentUser
          },
          parts: [
            {
              body: message,
              mime_type: 'text/plain'
            }
          ]
        }
      }
      console.log(attributes);

      //Post Message
      $.post('http://localhost:3000/doodle/messages', attributes, function(message) {
        console.log('message create');
        $('#message').val('');
        $('#message')[0].focus();

        console.log('message create passou');
      });
}

$('#chat').submit(function(e) {
  sendMessage(e);
});

$(document).ready(function() {
  $("#chat-box").hide();

  $('#open-chat-window').click(handleOpenWindow);
  $('#chat-start').click(handleStartChat);

  $('.dc-minimize').click(function(){
    $("#chat-box").fadeOut('slow', function(){
      $("#open-chat-window").fadeIn('fast');
    });
  });

  function closeScreen(){
    $("#chat-box").fadeOut('slow', function(){
      $("#open-chat-window").fadeIn('fast');
    });
  }

  function handleOpenWindow() {
    Chat.openWindow();
  };

  function handleStartChat() {
    Chat.start();
  }

  $('.dc-close').click(function(){
    closeScreen();
    Chat.logout();
    Conversation.close();
  });

  var getSenderName = function(sender) {
    if (sender.name == null) {
      return sender.user_id;
    } else {
      return sender.name;
    }
  }

});