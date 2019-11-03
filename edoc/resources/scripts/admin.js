var rest = $("meta[name='rest']").attr("content");
var files;

$("document").ready(function() {
  if (params['id'] !== undefined)
  {
    let delim = (rest.substr(rest.length - 1)) == '/' ? "" : "/";
    let url = rest + delim + "collection/" + params["id"] + "/collections.json";
    $.ajax({
      method: "get",
      url: url,
      success: function (data) {
        let json = JSON.parse(data);
        getPaths(json);
      }
    });
    $('#selectTarget').show();
  }
});
function getPaths (data) {
  if (data.hasOwnProperty("@path"))
    $('#selectTarget select').append("<option>" + data["@path"] + "</option>");
  if (data.hasOwnProperty("collection"))
    if (data.collection instanceof Array) data["collection"].forEach(function(coll) { getPaths(coll); });
    else $('#selectTarget select').append("<option>" + data.collection["@path"] + "</option>");
}

function show ( ed, file ) {
  url = 'projects.html?ed=' + ed + '&file=' + file;
  rightSide ( url );
}

function job ( job, file ) {
  url = 'projects.html?job=' + job + '&file=' + file;
  rightSide ( url );
}

function rightSide ( url ) {  
  html = $.ajax({ 
      url: url, 
      cache: false, 
      success: function ( data ) {  
          var result = $('<div/>').append( data ).find( '#data' ).html(); 
          $( '#rightSide' ).html( result ); 
        } 
    }); 
}

$('#picker').on("submit", dirupload);
$(document).on("change", "#picker", function() {
  $('#results').children().remove();
  let dir = $(this).attr('webkitdirectory');
  files = this.files;
  
  for (let i = 0; i < files.length; i++) {
    let path = $('#selectTask input:checked').attr("id") == "fi" ? files[i].name : files[i].webkitRelativePath;
    $('#results').append("<li>" + path + "…</li>");
  }
});

async function dirupload (event) {
  event.preventDefault();
  $('p img').show();
  
  let cred = Cookies.get("wdbplus");
  let headers = (typeof cred !== "undefined" && cred.length != 0)
    ? {"Authorization": "Basic " + cred}
    : "";
  
  for (let i = 0; i < files.length; i++) {
    let file = files[i],
        task = $('#selectTask input:checked').attr("id"),
        type = (task == "fi") ? file.name.substr(file.name.length - 3) : file.webkitRelativePath.substring(file.webkitRelativePath.length - 3),
        content = (type == 'xml' || type == 'xsl') ? "application/xml" : "application/octet-stream",
        item = $('#results').children()[i],
        text = (task == "fi") ? file.name : item.innerText.substr(0, item.innerText.length - 1),
        collection = $('#selectTarget select').val() !== undefined ? $('#selectTarget select').val() : params['collection'],
        delim = (rest.substr(rest.length - 1)) == '/' ? "" : "/",
        pathToEd = $('#selectTarget').find('option')[0].innerHTML,
        edRoot = pathToEd.substr(pathToEd.lastIndexOf('/') + 1),
        relpath = collection.substr(collection.indexOf('/' + edRoot) + edRoot.length + 1) + '/' + text,
        mode = task == "do" ? "" : "?meta=1",
        data = new FormData($('form')[0]);
    
    data.append("file", file);
    data.append("filename", relpath);
    
    try {
      await $.ajax({
        method: "post",
        url: rest + delim + "collection/ingest/" + params['id'],
        headers: headers,
        data: data,
        contentType: false,
        processData: false,
        success: function (response, textStatus, xhr) {
          console.log(response);
          item.innerText = text.substring(0, text.length) + "✓";
        },
        error: function (response) {
          console.log(response);
          item.innerText = text.substring(0, text.length) + "✕";
        }
      });
    } catch (e) {
      console.log(e);
    }
  }
  
  $('p img').hide();
}

function ingestAction(event) {
  if(event.target.id == "fi") { $('#picker').attr('webkitdirectory', null); }
  else { $('#picker').attr('webkitdirectory', 'true'); }
}

