// function to get params from URL
function GetURLParameter(sParam) {
  var sPageURL = window.location.search.substring(1);
  var sURLVariables = sPageURL.split('&');

  for(var i = 0; i < sURLVariables.length; i++){
    var sParameterName = sURLVariables[i].split('=');
    if(sParameterName[0] == sParam){
      return sParameterName[1];
    }
  }
};


$(document).ready(function () {
  var show_error, stripeResponseHandler, submitHandler;

  // Function to handle the submit of the form and 
  // intercept the default event
  submitHandler = function(event){
    // Reference what has triggered the function
    var $form = $(event.target);
    // Disable the submit button to avoid multiple submissions
    $form.find("input[type=submit]").prop("disabled", true);

    // If Stripe is initialized correctly, it will create a token
    // using the credit card info 
    if(Stripe){
      Stripe.card.createToken($form, stripeResponseHandler);
    } else {
      show_error("Failed to load credit card processing. Reload page");
    }
    // Prevent the default action from happening when the submit happens
    return false;
  };

  // Initiate submit handler listener for any forms with class cc_form
  $(".cc_form").on('submit', submitHandler);


  // Function to handle of plan drop down changing
  var handlePlanChange = function(plan_type, form){
    var $form = $(form);

    if(plan_type == undefined){
      plan_type = $('#tenant_plan :selected').val();
    }

    if(plan_type === 'premium'){
      $('[data-stripe]').prop('required', true);
      // Remove the event handlers attached to the data fields
      $form.off('submit');
      $form.on('submit', submitHandler);
      $('[data-stripe]').show();
    } else {
      $('[data-stripe]').hide();
      $form.off('submit');
      $('[data-stripe]').removeProp('required');
    }
  };

  // Set up plan change event listener for #tenant_plan id in the forms for 
  // class cc_form
  $("#tenant_plan").on('change', function(event){
    handlePlanChange($('#tenant_plan :selected').val(), ".cc_form");
  });

  // Call plan change handler so that the plan is set correctly
  // in the drop down when the page loads
  handlePlanChange(GetURLParameter('plan'), ".cc_form");


  // Function to handle the token received from Stripe and
  // remove credit card fields
  stripeResponseHandler = function(status, response){
    var token, $form;
    $form = $('.cc_form');

    // Handle the response
    if (response.error) {
      console.log(response.error.message);
      show_error(response.error.message);
      // Enable the submit button
      $form.find("input[type=submit]").prop("disabled", false);
    } else {
      token = response.id;
      // Append information to the form
      $form.append($("<input type=\"hidden\" name=\"payment[token]\" />").val(token));
      // Remove the information of the credit card so that it doesn't hit the local DB
      $("[data-stripe=number]").remove();
      $("[data-stripe=cvv]").remove();
      $("[data-stripe=exp-year]").remove();
      $("[data-stripe=exp-month]").remove();
      $("[data-stripe=label]").remove();
      // Submit the form
      $form.get(0).submit();
    }
    return false;
  };

  // Function to show errors when Striper api returns an error
  show_error = function (message) {
    if($("#flash-messages").size() < 1){
      $('div.container.main div:first').prepend("<div id='flash-messages'></div>")
    }

    $("#flash-messages").html('<div class="alert alert-warning">' +
      '<a class="close" data-dismiss="alert">x</a>' +
      '<div id="flash_alert">' + message + '</div></div>');

    $('.alert').delay(5000).fadeOut(3000);
    return false;
  };
});
