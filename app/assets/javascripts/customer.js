//= require jquery
//= require jquery_ujs
//= require turbolinks
//= require scripts

var api_url = "http://localhost:3000/"

var User = {
  attributes: {
    "login":"p1m3nt3l",
    "password": "inicial1234",
    "type": "Doodle::User::Customer"
  },

  create: function() {
    var request = $.post(api_url + "doodle/users", { "user": this.attributes })

    request.success(function(user) {
      console.log('user created with success.');
      console.log(user);
      return user;
    });
  },

  authenticate: function() {

    var request = $.post(api_url + "doodle/authenticate", { "auth": this.attributes })

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
  connection: null,

  openWindow: function() {
    $('.dc-launch').hide('slow');
    $('#chat-box').fadeIn('slow');

    Chat.displayQueueOptions();
  },

  logout: function() {
    this.connection.close();
  },

  close: function() {
    this.logout();
    this.displayThanksMessage();

    setTimeout(function() {
      $('.dc-messages').hide();
      $('.dc-messages-container').hide();
      $('.dc-card').hide();
      $('.dc-footer').hide();
      $('.container-channel').show();
    }, 5000);

  },

  displayQueueOptions: function() {
    $('#queue_options').show();
    Chat.channels();
  },

  displayWelcomeMessage: function(message) {
    console.log('display welcome message..');
    console.log(message);
    console.log('conversation_id: ' + message.object.id);
    var analyst_name = message.data[0].value;
    var new_message =
    '<div class="dc-card card-welcome dc-card-color-white">' +
      '<div class="dc-avatar-container">' +
        '<div class="dc-avatar">' +
          '<img src="dist/assets/images/avatar-castor.gif" alt="Avatar">' +
        '</div>' +
    '</div>' +

    '<div class="dc-welcome">' +
      '<h1>Bem vindo à Locaweb!!</h1>' +
      '<p>Bom dia, meu nome é <strong>' + analyst_name + '</strong>, sou analista da Locaweb. Como posso ajudá-lo(a)?</p>' +
    '</div>'

    this.conversationId = message.object.id;
    this.addMessage(new_message);
  },

  displayThanksMessage: function() {
    var message =
      '<div class="dc-card card-finish dc-card-color-white">' +
        '<div class="dc-avatar-container">' +
          '<div class="dc-avatar">' +
            '<img src="dist/assets/images/avatar-castor.gif" alt="Avatar">' +
          '</div>' +
        '</div>' +
        '<div class="dc-welcome">' +
          '<h1>A Locaweb agradece seu contato!</h1>' +
          '<p>Muito obrigado pelo seu contato! É sempre um prazer ajudar um Locaweber!</p>' +
        '</div>' +
      '</div>'

    Chat.addMessage(message);
  },

  channels: function() {
    var options = $("#options");

    var request = $.get(api_url + "doodle/channels")

    request.success(function(response){
      console.log(response);
      options.remove(".channel");

      $.each(response, function() {
        $("#options").append($("<option class='channel' />").val(this.id).text(this.name));
      });
    });
  },

  start: function() {
    console.log('Starting the chat..');
    User.create();

    authentication = User.authenticate();

    // create a conversation on the selected queue
    this.create();
  },

  addMessage: function(message) {
    $('.dc-container-message').append(message);
  },

  create: function() {
    var channel = $('#options').val();
    console.log('creating a chat on selected channel: ' + channel);

    var params = {
      channel_id: channel,
      login: User.attributes['login']
    }

    Conversation.create(params);
  }
}

var Conversation = {
  create: function(params) {
    console.log('Creating a conversation with params: ' + params);
    request = $.post(api_url +"doodle/conversations", params);

    request.success(function(response) {
      Chat.conversationId = response.conversation_id;

      console.log( response );
      Chat.currentUser = User.attributes['login'];

      console.log('conversation created with success.');
      // {
      // "protocol_id":2,
      // "prococol_status":"waiting",
      // "channel":"corporativo",
      // "conversation_id":"layer:///conversations/ff6652e5-ac0c-4aa6-b494-9c1856f5f013"
      // }
      console.log(JSON.stringify(response));
      console.log("Opening a WS with layer");

      var ws = new WebSocket('wss://api.layer.com/websocket?session_token=' + Chat.sessionToken, 'layer-1.0');
      Chat.connection = ws;
      console.log('connection established.');
      ws.addEventListener('message', Conversation.messageHandler);
      $('.container-channel').fadeOut( "slow", function(){
        $('.dc-footer').fadeIn('slow');
        $('.message-welcome').fadeIn('slow');
      });
    });
  },
  close: function(){
     $.post(api_url +'doodle/chat/finalize', { conversation_id: Chat.conversationId, login: Chat.currentUser }, function(response) {
      console.log('chamado finalizado pelo cliente');
      console.log('response:' + response );
     });
  },

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
      console.log(message.operation)
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
            // handleUpdateMessage(message);
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
    var getSenderName = function(sender) {
      if (sender.name == null) {
        return sender.user_id;
      } else {
        return sender.name;
      }
    }
    var sent_at = Conversation.formatDateTime(message.data.sent_at);
    var parts = message.data.parts;
    var sender = message.data.sender;
    var status_message = 'read';
    sender_name = getSenderName(sender);

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
  },

  /*
  This function handles
  the conversation create process
  */
  handleCreateConversation: function(message) {
    // var participants = message.data.participants;
    // var created_at = formatDateTime(message.data.created_at);
    // var created_by = createdBy(chat.currentUser, participants);
    // var new_message =   '<div class="lw-message-content">' +
    //   '<h2 class="lw-user">' +
    //   '<strong>' + created_by + '</strong>' + ' disse: ' +
    //   '</h2>' +
    //   '<p class="messages">' + 'Oi, eu sou Goku! Em que posso ajudar?' + '</p>' +
    //   '<div class="lw-status">' + '<p>' + status_message + '</p>' + '</div>' +
    //   '</div>'
    // Chat.conversationId = message.data.id;
    // Chat.addMessage(new_message);
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
          switch(message_data['property']) {
          case "participants":
            console.log('adicionou um participante..');
            Chat.displayWelcomeMessage(message);
          }
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
      Chat.close();
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
  $("#chat-box").fadeOut('slow');

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
    Chat.logout();
    Conversation.close();
    closeScreen();
  });

});
