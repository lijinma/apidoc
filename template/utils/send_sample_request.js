define([
  'jquery'
], function($) {

  var initDynamic = function() {
      // Button send
      $(".sample-request-send").off("click");
      $(".sample-request-send").on("click", function(e) {
          e.preventDefault();
          var $root = $(this).parents("article");
          var group = $root.data("group");
          var name = $root.data("name");
          var version = $root.data("version");
          sendSampleRequest(group, name, version, $(this).data("sample-request-type"));
      });

      // Button clear
      $(".sample-request-clear").off("click");
      $(".sample-request-clear").on("click", function(e) {
          e.preventDefault();
          var $root = $(this).parents("article");
          var group = $root.data("group");
          var name = $root.data("name");
          var version = $root.data("version");
          clearSampleRequest(group, name, version);
      });
      
      $(".show-block").click(function(){
        if ($(this).val() == '显示') {
          $(this).parent().next().show();
          $(this).val('隐藏');
          $(this).removeClass('btn-primary');
          $(this).addClass('btn-danger');
        } else {
          $(this).parent().next().hide();
          $(this).val('显示');
          $(this).removeClass('btn-danger');
          $(this).addClass('btn-primary');
        }
        return;
      });
      
  }; // initDynamic

  function sendSampleRequest(group, name, version, type)
  {
      var $root = $('article[data-group="' + group + '"][data-name="' + name + '"][data-version="' + version + '"]');

      // Optional header
      var header = {};
      $root.find(".sample-request-header:checked").each(function(i, element) {
          var group = $(element).data("sample-request-header-group-id");
          $root.find("[data-sample-request-header-group=\"" + group + "\"]").each(function(i, element) {
            var key = $(element).data("sample-request-header-name");
            var value = element.value;
            header[key] = $.type(value) === "string" ? escapeHtml(value) : value;
          });
      });

      // create JSON dictionary of parameters
      var param = {};
      $root.find(".sample-request-param:checked").each(function(i, element) {
          var group = $(element).data("sample-request-param-group-id");
          $root.find("[data-sample-request-param-group=\"" + group + "\"]").each(function(i, element) {
            var key = $(element).data("sample-request-param-name");
            var value = element.value;
            if (value) {
              if ($(element).next().text().trim() == 'Object[]' || $(element).next().text().trim() == 'Object') {
                param[key] = JSON.parse(value);
              } else if ($(element).next().text().trim() == 'Number') { //数字类型的要单独处理，否则会被转化成字符串
                param[key] = Number(value);
              } else if ($(element).next().text().trim() == 'RawString') { //数字类型的要单独处理，否则会被转化成字符串
                param[key] = value;
              } else {
                param[key] = $.type(value) === "string" ? escapeHtml(value) : value;
              }
            }
          });
      });

      // grab user-inputted URL
      var url = $root.find(".sample-request-url").val();
      
      // update params in url
      url = url.replace(/:ids|{ids}|:id|{id}|:userIds|:userId/g, 1);
      $root.find(".sample-request-url").val(url);

      // Insert url parameter
      var pattern = pathToRegexp(url, null);
      var matches = pattern.exec(url);
      for (var i = 1; i < matches.length; i++) {
          var key = matches[i].substr(1);
          if (param[key] !== undefined) {
              url = url.replace(matches[i], encodeURIComponent(param[key]));

              // remove URL parameters from list
              delete param[key];
          }
      } // for

      // send AJAX request, catch success or error callback
      if (type == 'get') {
        $.ajax({
            url: url + '?' + $.param(param),
            dataType: "json",
            contentType: "application/json",
            headers: header,
            type: type.toUpperCase(),
            success: displaySuccess,
            error: displayError
        });
      } else {
        $.ajax({
            url: url,
            dataType: "json",
            contentType: "application/json",
            data: JSON.stringify(param),
            headers: header,
            type: type.toUpperCase(),
            success: displaySuccess,
            error: displayError
        });
      }


      function displaySuccess(data) {
          var jsonResponse;
          try {
              jsonResponse = JSON.stringify(data, null, 4);
          } catch (e) {
              jsonResponse = data;
          }
          $root.find(".sample-request-response").fadeTo(250, 1);
          $root.find(".sample-request-response-json").html(jsonResponse);
          refreshScrollSpy();
      };

      function displayError(jqXHR, textStatus, error) {
          var message = "Error " + jqXHR.status + ": " + error;
          var jsonResponse;
          try {
              jsonResponse = JSON.parse(jqXHR.responseText);
              jsonResponse = JSON.stringify(jsonResponse, null, 4);
          } catch (e) {
              jsonResponse = jqXHR.responseText;
          }

          if (jsonResponse)
              message += "<br>" + jsonResponse;

          // flicker on previous error to make clear that there is a new response
          if($root.find(".sample-request-response").is(":visible"))
              $root.find(".sample-request-response").fadeTo(1, 0.1);

          $root.find(".sample-request-response").fadeTo(250, 1);
          $root.find(".sample-request-response-json").html(message);
          refreshScrollSpy();
      };
  }

  function clearSampleRequest(group, name, version)
  {
      var $root = $('article[data-group="' + group + '"][data-name="' + name + '"][data-version="' + version + '"]');

      // hide sample response
      $root.find(".sample-request-response-json").html("");
      $root.find(".sample-request-response").hide();

      // reset value of parameters
      $root.find(".sample-request-param").each(function(i, element) {
          element.value = "";
      });

      // restore default URL
      var $urlElement = $root.find(".sample-request-url");
      $urlElement.val($urlElement.prop("defaultValue"));

      refreshScrollSpy();
  }

  function refreshScrollSpy()
  {
      $('[data-spy="scroll"]').each(function () {
          $(this).scrollspy("refresh");
      });
  }

  function escapeHtml(str) {
      var div = document.createElement("div");
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
  }

  /**
   * Exports.
   */
  return {
      initDynamic: initDynamic
  };

});
