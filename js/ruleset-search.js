function loadJSONdata(){
	$.getJSON('../conf/ui.conf', function(data) {
	var ipLoad = document.getElementById('ip-master'); 
	ipLoad.value = data.master.ip;
	var portLoad = document.getElementById('port-master');
	portLoad.value = data.master.port;
	loadTitleJSONdata();
	getRulesetsBySearch();
	});
}
loadJSONdata();

function getRulesetsBySearch(){

    var progressBar = document.getElementById('progressBar-options');
    var progressBarDiv = document.getElementById('progressBar-options-div');
    progressBar.style.display = "block";
    progressBarDiv.style.display = "block";

    var urlWeb = new URL(window.location.href);
    var rulesetName = urlWeb.searchParams.get("rulesetName");
    var search = urlWeb.searchParams.get("search");

    document.getElementById('ruleset-search-title').innerHTML = "Search result for ruleset: "+rulesetName;

    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/search/getRulesetsBySearch';

    var jsondata = {}
    jsondata["search"] = search;
    if(rulesetName != null){jsondata["rulesetName"] = rulesetName;}
    var searchJSON = JSON.stringify(jsondata);
    axios({
        method: 'put',
        url: nodeurl,
        timeout: 30000,
        data: searchJSON
    })
    .then(function (response) {
        if (response.data.ack == "false") {
            progressBar.style.display = "none";
            progressBarDiv.style.display = "none";
            html = html + '<div style="text-align:center"><h3 style="color:red;">Error retrieving search results...</h3></div>';
        }else{
            var html = "";
            for (rule in response.data){    
                html = html + '<table class="table table-hover" style="table-layout: fixed">' +
                '<thead>' +
                    '<tr>' +
                        '<th style="width: 20%">Sid</th>' +
                        '<th colspan="3">Description</th>' +                     
                    '</tr>' +
                '</thead>' +
                '<tbody>';
                    html = html + '<tr>'+
                        '<td>'+response.data[rule]["sid"]+'</td>'+
                        '<td colspan="3">'+response.data[rule]["msg"]+'</td>'+
                    '</tr>'+
                    '<tr>'+
                        '<thead>' +
                            '<th width="10%">Status</th>' +
                            '<th width="55%">File</th>' +            
                            '<th width="25%">Ruleset</th>' +
                            '<th width="10%">Actions</th>' +
                        '</thead>' +
                    '</tr>';
                    var rulesets = response.data[rule]["Rulesets"];
                    for(element in rulesets){          
                        html = html + '<tr>' +
                            '<td width="10%">';
                                if(rulesets[element]["status"] == "Enabled"){
                                    html = html + '<i class="fas fa-check-circle" style="color:green;"></i>';
                                }else{
                                    html = html + '<i class="fas fa-times-circle" style="color:red;"></i>';
                                }
                            html = html + '</td>'+
                            '<td width="55%">'+rulesets[element]["file"]+'</td>'+
                            '<td width="25%">'+rulesets[element]["name"]+'</td>'+
                            '<td width="10%"><i class="fas fa-eye low-blue" onclick="loadRulesetDetails(\''+response.data[rule]["sid"]+'\', \''+rulesets[element]["uuid"]+'\')"></i></td>';
                        '</tr>';
                    }
                html = html + '</tbody>'+
                '</table><br><br>';
            }
        }
        console.log("OUTSIDE!!!");
        document.getElementById('list-ruleset-search').innerHTML = html;
        progressBar.style.display = "none";
        progressBarDiv.style.display = "none";
        console.log(response.data);
    })
    .catch(function error() {
    });
}

function loadRulesetDetails(sid, fileuuid){
    var ipmaster = document.getElementById('ip-master').value;
    document.location.href = 'https://' + ipmaster + '/show-rule-details.html?sid='+sid+'&fileuuid='+fileuuid;
}