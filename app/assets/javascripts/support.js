//= require jquery
//= require jquery_ujs
//= require turbolinks
//= require scripts

var api_url = "http://localhost:3000/"

var User = {
  attributes: {
    "login":"renato",
    "password": "inicial1234",
    "type": "Doodle::User::Analyst"
  },

  authenticate: function() {
    var request = $.post(api_url +"doodle/authenticate", { "auth": this.attributes })

    // response returns a object containing login and session_token attributes.
    request.success(function(response) {
      console.log(response);
      Chat.sessionToken = response.session_token;
    });
  }
}

var Keywords = {
  load: function(){
    var request = $.get(api_url +"doodle/keywords");
    console.log(response);
  }
}

var Resume = {
  customer_login: null,
  created_at: null,
  channel: null,

  build: function(message) {
    this.customer_login = Conversation.createdBy(Chat.currentUser, message.data.participants);
    this.created_at     = Conversation.formatDateTime(message.data.created_at);

    var text_message = 'Você está atendendo o usuário: ' + '<strong> ' + this.customer_login + '</strong>' + '. Ele aguarda há ' + '<strong>' + moment().startOf(this.created_at).fromNow() + '</strong>';
    var new_message =
    '<div class="dc-messages-container">' +
      '<div class="welcome-message-analyst">' +
        '<div class="dc-message message-welcome-analyst">' +
            '<div class="dc-content-message">' +
              '<p class="dc-text-message">' + text_message + '</p>' +
            '</div>' +
          '</div>' +
      '</div>'+
    '</div>'; 

    return new_message;
  }
}

var Chat = {
  sessionToken: null,
  conversationId: null,
  currentUser: null,
  connection: null,
  actionKeyword: null,
  textKeyword: null,

  getSenderName: function(sender) {
    if (sender.name == null) {
      return sender.user_id;
    } else {
      return sender.name;
    }
  },

  displayCustomerInfo: function(message) {
    console.log('conversation resume:');
    console.log(message);

    var resume = Resume.build(message);
    Chat.addMessage(resume);
  },

  openWindow: function() {
    $('.dc-launch').hide('slow');
    $('#chat-box').fadeIn('slow');
  },

  connect: function(){
    var ws = new WebSocket('wss://api.layer.com/websocket?session_token=' + Chat.sessionToken, 'layer-1.0');
    console.log('connection established.');

    Chat.connection = ws;

    ws.addEventListener('message', Conversation.messageHandler);
    $('.container-channel').fadeOut( "slow", function(){
      $('.dc-footer').fadeIn('slow');
    });

  },

  enableControls: function() {
    $('.dc-controler-rank').show();
  },


  start: function() {
    console.log('Starting the chat..');

    $.get(api_url +'doodle/chat/' + User.attributes["login"] + '/has_protocols', function (response){
      if (!response.has_protocols) {
        $('.lw-status-queue').fadeIn();
      } else {
        $.post(api_url + 'doodle/chat/' + User.attributes["login"] + '/next', function(response) {
          console.log('O analista entrou na conversa: ' + response.conversation);
          Chat.conversationId = response.conversation;
          Chat.currentUser = User.attributes['login'];

          //render previous messages
          $.post(api_url + 'doodle/conversations/messages', {conversation_id: Chat.conversationId}, function(messages) {

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

                    Chat.addMessage(new_message, function(){
                      $('.dc-messages-container').fadeIn('slow');
                    });
                  });
            });

          });
        });
      }

      Chat.connect();

      Chat.enableControls();
    });

  },

  addMessage: function(message) {
    $('.dc-container-message').append(message);
    $(".dc-container-main").scrollTop($(".dc-container-main")[0].scrollHeight);
  },

  create: function() {
    var queue = $('#options').val();
    console.log('creating a chat on selected queue: ' + queue);

    var params = {
      channel: queue,
      login: User.attributes['login']
    }

    Conversation.create(params);
  },

  close: function() {
    Conversation.close();

    this.logout();

    var message =
      '<div class="dc-messages-container">' +
      '<div class="dc-message message-system">' +
        '<div class="dc-content-message">' +
          '<p class="dc-text-message"><strong>Chamado finalizado com sucesso.</strong></p>' +
      '</div></div></div>';

    Chat.addMessage(message);

    setTimeout(function() {
      $('.dc-messages-container').remove();
      $('.dc-footer').hide();
      $('.dc-controler-rank').hide();
      $('.dc-card-action').hide();
      $('.welcome-message-analyst').hide();
      $('.container-channel').show();
    }, 5000);
  },

  logout: function() {
    this.connection.close();
    console.log('ws connection terminated by analyst.');
  },


}

var Conversation = {

  close: function(){
     $.post(api_url +'doodle/chat/finalize', { conversation_id: Chat.conversationId, login: Chat.currentUser }, function(response) {
       console.log('chamado finalizado pelo analista');
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
    console.log('preparing a customer resume to analyst..');
    Chat.displayCustomerInfo(message);
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
      if (participants[i] === Chat.currentUser) {
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
    preSendMessage(e);
  }
  return true;
});

function preSendMessage(e){
  var readMessage = $('#message').val();
  if (readMessage) {
    isActionKeyword(readMessage, e);
  }
}

function sendMessageChat(e){

    e.preventDefault();
    var message = $('#message').val();
    message = translateTextKeyword(message)
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
      $.post(api_url +'doodle/messages', attributes, function(message) {
        console.log('message create');
        $('#message').val('');
        $('#message')[0].focus();

        console.log('message create passou');
      });
}

function isActionKeyword (message, e){
    var result = message.match('\^\/');
    if (result) {
      var sanitizeMessage = message.replace('/', '').trim();
      if ( isKeywordInList(sanitizeMessage, Chat.actionKeyword)) {
        console.log('é uma keyword action');
        renderCardForClient(sanitizeMessage);
      }
    } else {
      sendMessageChat(e);
    }

}

function translateTextKeyword (message){
    var result = message.match('^[#]\\w+');
    if (result) {
      var sanitizeMessage = message.replace('#', '').trim();
      if ( isKeywordInList(sanitizeMessage, Chat.textKeyword)) {
        console.log('é uma keyword text');
        return $.grep(Chat.textKeyword, function(e) { return e.name == sanitizeMessage; })[0].value;
      }
    } else {
      console.log('não é uma keyword text');
    }
    return message;
}

function cardComponent(object) {
  var card = '<div class="dc-card dc-card-action dc-card-color-white">' +
              '<div class="dc-card-header action">' +
                '<i class="material-icons icon-mail">email</i>' +
                '<h2>' + object.name + '</h2>' +
              '</div>' +

              '<div class="dc-action-content">' +
                '<ul class="dc-card-list dc-test-email">' +
                  '<li>IMAP</li>' +
                  '<li>POP</li>' +
                  '<li class="dc-error-danger">SMTP</li>' +
                '</ul>' +

                '<ul class="dc-card-list dc-other-test">' +
                  '<li>Caixa postal: <strong>68% utilizado</strong> </li>' +
                  '<li>Domínio: <strong>Locaweb</strong> (MX Interno)</li>' +
                  '<li>Anti-Spam: <strong>ativo</strong></li>' +
                '</ul>' +
              '</div>' +

              '<a href="#" class="dc-opencall-container disabled">' +
                '<div class="dc-action-call">' +
                  '<span class="dc-icon open-call">' +
                    '<i class="material-icons">comment</i>' +
                  '</span>' +
                  '<span class="dc-open-call">Abrir chamado</span>' +
                '</div>' +
              '</a>' +
            '</div>';
  return card;
}


function renderCardForClient(message){
  $.get(api_url + 'doodle/keywords/action?name=' + message, function(response){
    Chat.addMessage(cardComponent(response));
  });

}


function keywordMessage(message){

 var message = '<div class="dc-messages-container">' +
                  '<div class="dc-message message-client">' +
                      '<div class="dc-content-message">' +
                        '<span class="dc-name-user">' + sender_name + ':</span>' +
                        '<p class="dc-text-message">' + message.body +'</p>' +
                      '</div>' +
                    '</div>' +
                    '<span class="dc-type-indication dc-floating-right">' + status_message + '</span>' +
                '</div>'

   Chat.addMessage(message);
}


function isKeywordInList (message, list) {
  var result = false;
  list.forEach(function(keyword){
    if (keyword.name == message) {
      result = true;
    }
  });
  return result;
}

$('#chat').submit(function(e) {
  preSendMessage(e);
});

$(document).ready(function() {
  $("#chat-box").hide();

  authentication = User.authenticate();

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
    keywords();
  }

  function keywords () {
    var name = 'testelocamail';
    // get keywords
    $.get( api_url + 'doodle/keywords/all_actions', function( response ) {
      Chat.actionKeyword = response;
    });
    $.get( api_url + 'doodle/keywords', function( response ) {
      Chat.textKeyword = response;
    });
  }

  $('.dc-close').click(function(){
    closeScreen();

    Chat.close();
  });

  $('#close').click(function() {
    Chat.close();
  });

  var getSenderName = function(sender) {
    if (sender.name == null) {
      return sender.user_id;
    } else {
      return sender.name;
    }
  }
});
