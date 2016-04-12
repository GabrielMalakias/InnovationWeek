//= require jquery
//= require jquery_ujs
//= require turbolinks
//= require scripts

var User = {
  attributes: {
    "login":"p1m3nt3l",
    "password": "inicial1234",
    "type": "Doodle::User::Customer"
  },

  create: function() {
    var request = $.post("http://localhost:3000/doodle/users", { "user": this.attributes })

    request.success(function(user) {
      console.log('user created with success.');
      console.log(user);
      return user;
    });
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

  openWindow: function() {
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
  },

  start: function() {
    console.log('Starting the chat..');
    User.create();

    authentication = User.authenticate();

    // create a conversation on the selected queue
    this.create();
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
  create: function(params) {
    console.log('Creating a conversation with params: ' + params);
    request = $.post("http://localhost:3000/doodle/conversations", params);

    request.success(function(response) {
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
      ws.addEventListener('message', this.messageHandler);
      console.log('WS opened with success');
    });
  },

  messageHandler: function(event) {
    var message = JSON.parse(event.data);
    var body = message.body;
    switch(message.type) {
      case "change":
        this.handleChange(body);
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
            handleCreateMessage(message);
          break;
          case "Conversation":
            handleCreateConversation(message);
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
            handleUpdateConversation(message);
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
    var sent_at = formatDateTime(message.data.sent_at);
    var parts = message.data.parts;
    var sender = message.data.sender;
    var status_message = 'DELIVERING';
    sender_name = getSenderName(sender);

    $.each(parts, function(index,message) {
      var new_message = '<div class="lw-message-content lw-client">' +
        '<h2 class="lw-user">' +
        '<strong>' + sender_name + '</strong>' + ' disse: ' +
        '</h2>' +
        '<p class="messages">' + message.body + '</p>' +
        '<div class="lw-status">' + '<p>' + status_message + '</p>' + '</div>' +
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
    var created_at = formatDateTime(message.data.created_at);
    var created_by = createdBy(chat.currentUser, participants);
    var new_message =   '<div class="lw-message-content">' +
      '<h2 class="lw-user">' +
      '<strong>' + created_by + '</strong>' + ' disse: ' +
      '</h2>' +
      '<p class="messages">' + 'Oi, eu sou Goku! Em que posso ajudar?' + '</p>' +
      '<div class="lw-status">' + '<p>' + status_message + '</p>' + '</div>' +
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
            handleRemoveParticipants(message_data);
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
      chat.logout();
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

$(document).ready(function() {
  $("#chat-box").hide();

  $('#open-chat-window').click(handleOpenWindow);
  $('#chat-start').click(handleStartChat);

  function handleOpenWindow() {
    Chat.openWindow();
  };

  function handleStartChat() {
    Chat.start();
  }
});
