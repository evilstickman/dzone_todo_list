function dataService(itemData) {
  this.itemData
}

var dataService = {
  dataService: function(itemData) {
    this.itemData = itemData;
  },
  init: function() {
    backand.init(
      {
        appName: 'webinar032917',
        signUpToken: '42876dd7-fd48-4dec-8210-bf23fc6a8b27',
        anonymousToken: '42876dd7-fd48-4dec-8210-bf23fc6a8b27',
        runSocket: false
      }
    );
    this.itemData = null;
  },
  getData: function() {
    backand.object.getList("items").then(this.getDataSuccess);
  },
  getDataSuccess: function(response) {
    this.itemData = response;
    // Emit an alert to the app, triggering the data refresh
    $(document).trigger("dataServiceUpdated", this.itemData);
  },
  create: function(data) {
    // Create the entry, then return the promise
    return backand.object.create("items", data);
  },
  delete: function(id) {
    // Delete the entry, and return the promise
    return backand.object.remove("items", id);
  },
  update: function(id, data) {
    return backand.object.update("items", id, data);
  },
  signin: function(username, password) {
    return backand.signin(username, password);
  }
};

var formatItemListHTML = function(itemList) {
  const ITEM_TAG =  "<a href='#' class='list-group-item list-group-item-action todo-item' id='item-ITEM_ID'>"
                    + "<div class='d-flex w-100 justify-content-between'>"
                    + "<i class='fa fa-times delete-item' aria-hidden='true' id='delete-ITEM_ID'></i>"
                    + "<div>"
                    + "<h5 class='mb-1 col5'>ITEM_NAME</h5>"
                    + "<br /><p class='item-description' hidden>ITEM_DESCRIPTION</p>"
                    + "</div>"
                    + "<button type='button' class='btn btn-primary btn-success complete-button' id='complete-ITEM_ID' style='IS_COMPLETED'>Complete</button>"
                    + "<button type='button' class='btn btn-primary btn-warning uncomplete-button' id='uncomplete-ITEM_ID' style='IS_NOT_COMPLETED'>Reopen</button>"
                    + "</div></a>";
  var length = itemList.length;
  var finalHtml = [];
  for( var i = 0; i < length; i++ ) {
    itemId = itemList[i].id;
    itemName = itemList[i].name;
    itemDescription = itemList[i].description;
    isCompleted = !!itemList[i].completed;
    style = "display: none;"
    item_string = ITEM_TAG.replace(/ITEM_NAME/g, itemName);
    item_string = item_string.replace(/ITEM_ID/g, itemId);
    item_string = item_string.replace(/ITEM_DESCRIPTION/g, itemDescription);
    item_string = item_string.replace(/IS_COMPLETED/g, (isCompleted) ? style : '');
    item_string = item_string.replace(/IS_NOT_COMPLETED/g, (!isCompleted) ? style : '');
    finalHtml.push(item_string);
  }
  return finalHtml.join("");
};

var dataServiceUpdatedHandler = function(event, itemData) {
  // Populate HTML content
  itemHTML = formatItemListHTML(itemData.data);

  $("#itemList").html(itemHTML);
};

var updateLoginFormDisplay = function() {
  backand.user.getUserDetails().then(function(data){
    username = data.data.username;
    user_id = data.data.userId;
    if(user_id)
    {
      template_content = $("#logged-in-message");
      template_content.html( "You are currently logged in as " + username);
      $("#logged-in-alert").removeAttr("hidden");
      $("#create-form").removeAttr("hidden");
      $("#login-form").attr("hidden", true);
    }
    else {
      $("#logged-in-alert").attr("hidden", true);
      $("#create-form").attr("hidden", true);
      $("#login-form").removeAttr("hidden");
    }
  });
};

var uploadFile = function(e) {

};

$(document).on("dataServiceUpdated", dataServiceUpdatedHandler);
var myDataService = Object.create(dataService);
$(document).ready( function() {
  // init data service
  myDataService.init();
  // populate the data service from the server
  myDataService.getData();

  // Init the login form
  updateLoginFormDisplay();

  // Define the click handler
  $("#createItem").click(function(){
    // get data from the form
    objectData = {}
    nameField = $("#nameInput");
    descriptionField = $("#descriptionInput");
    objectData.name = nameField.val();
    objectData.description = descriptionField.val();
    // reset the form
    nameField.val('');
    descriptionField.val('');
    backand.user.getUserDetails().then(function(userData){
      objectData.owner = userData.data.userId;
      if(objectData.owner)
      {
        // create the item, then reload the view
        myDataService.create(objectData).then(function(){myDataService.getData();});
      }
      else {
        alert("You must be logged in to create an item.");
      }
    });

    // return false to stop propogation
    return false;
  });

  $("body").on("click",".delete-item",function(event) {
    deletion_icon_id = event.target.id;
    entry_id = deletion_icon_id.split('-')[1];
    myDataService.delete(entry_id).then(function(){myDataService.getData();});
    // Return false to stop propogation
    return false;
  });
  $("body").on("click",".complete-button",function(event) {
    complete_icon_id = event.target.id;
    entry_id = complete_icon_id.split('-')[1];
    newData = {};
    newData.completed = true;
    myDataService.update(entry_id, newData).then(function(){myDataService.getData();});
    // Return false to stop propogation
    return false;
  });
  $("body").on("click",".uncomplete-button",function(event) {
    uncomplete_icon_id = event.target.id;
    entry_id = uncomplete_icon_id.split('-')[1];

    newData = {};
    newData.completed = false;
    myDataService.update(entry_id, newData).then(function(){myDataService.getData();});
    // Return false to stop propogation
    return false;
  });

  $("body").on("click", ".todo-item", function(event){
    target = event.target;
    wasActive = $(target).closest('.list-group-item').hasClass('active');
    // clear active designations
    $('.list-group-item').removeClass('active');
    $('.item-description').attr("hidden", "true")
    // If the user hasn't clicked on the same object
    if(!wasActive)
    {
      // Show the description, and highlight the item
      $(target).closest('.list-group-item').addClass('active');
      $(target).find('.item-description').removeAttr("hidden");
    }
  });

  $("body").on("click","#loginButton", function(event) {
    username = $("#usernameInput").val();
    password = $("#password").val();
    myDataService.signin(username, password).then(function(){updateLoginFormDisplay();});
    return false;
  });
  $("body").on('click','#openFile', function(event){

      $('#file-input').trigger('click');
  });

  $("body").on("change","#file-input", function(event) {
    $('#file-input').trigger('click');
    var fileData = document.getElementById('file-input');
    file = fileData.files[0];
    fr = new FileReader();
    fr.onload = function(e){
      backand.file.upload('items','files',file.name, e.target.result);
    };
    fr.readAsDataURL(file);
  });
});
