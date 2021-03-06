
//load json data from local file
function loadJSONdata() {
    $.getJSON('../conf/ui.conf', function (data) {
        var ipLoad = document.getElementById('ip-master');
        ipLoad.value = data.master.ip;
        var portLoad = document.getElementById('port-master');
        portLoad.value = data.master.port;
        loadTitleJSONdata();
        GetAllNodes();
    });
}
loadJSONdata();

function showConfig(oip, oname, oport, ouuid){
    document.getElementById('divconfigform').style.display = "block";
    document.getElementById('divconfigform').scrollIntoView();

    var name = document.getElementById('cfgnodename');
    var ip = document.getElementById('cfgnodeip');
    var port = document.getElementById('cfgnodeport');
    var uuid = document.getElementById('cfgnodeid');
    port.value = oport;
    name.value = oname;
    ip.value = oip;
    uuid.value = ouuid;
}

function PingNode(uuid) {
    console.log("-->"+uuid);
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://'+ ipmaster + ':' + portmaster + '/v1/node/ping/' + uuid;
    
    axios({
            method: 'get',
            url: nodeurl,
            timeout: 30000
    })
        .then(function (response) {
            console.log(response.data);
            if (response.data.ping=='pong') {
                document.getElementById(uuid+'-online').className = "badge bg-success align-text-bottom text-white";
                document.getElementById(uuid+'-online').innerHTML = "ON LINE";
                document.getElementById('node-row-'+uuid).setAttribute("status", "online");

                PingMonitor(uuid);
                var myVar = setInterval(function(){PingMonitor(uuid)}, 5000);
                sortTableName();
            } else {
                document.getElementById(uuid+'-online').className = "badge bg-danger align-text-bottom text-white";
                document.getElementById(uuid+'-online').innerHTML = "OFF LINE";
                document.getElementById('node-row-'+uuid).setAttribute("status", "offline");
                $('#node-monitor-'+uuid).prop("onclick", null).off("click");
                $('#node-services-'+uuid).prop("onclick", null).off("click");
                $('#node-modify-'+uuid).prop("onclick", null).off("click");
                $('#node-config-'+uuid).prop("onclick", null).off("click");
                $('#node-files-'+uuid).prop("onclick", null).off("click");
                $('#node-change-'+uuid).prop("onclick", null).off("click");
                $('#node-incident-'+uuid).prop("onclick", null).off("click");
            }      
        })
            .catch(function (error) {
                console.log(error);
        });   
}

function PingService(uuid){
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://'+ ipmaster + ':' + portmaster + '/v1/node/pingservice/' + uuid;
    axios({
        method: 'get',
        url: nodeurl,
        timeout: 30000
    })
        .then(function (response) {
            if (response.data.ack == "true"){
                document.getElementById(uuid+'-owlhservice').style.display = "none";
            }else {
                document.getElementById(uuid+'-owlhservice').style.display = "block";
            }
            return true;
        })
        .catch(function (error) {
            return false;
        }); 
}

function PingMonitor(uuid){
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://'+ ipmaster + ':' + portmaster + '/v1/node/pingmonitor/' + uuid;
    axios({
        method: 'get',
        url: nodeurl,
        timeout: 30000
    })
        .then(function (response) {
            var cpuData = "";
            for(x in response.data.cpus){
                cpuData = cpuData + '<div id="cpu-core-'+x+'"><b>CPU '+x+':</b> '+ parseFloat(response.data.cpus[x].percentage).toFixed(2)+' % </div>';
            }
            document.getElementById('mem-'+uuid).innerHTML = "<b>MEM: </b>" + parseFloat(response.data.mem.percentage).toFixed(2)+" %";
            document.getElementById('sto-'+uuid).innerHTML = "<b>STO: </b>" + parseFloat(response.data.disk.percentage).toFixed(2)+" %";
            document.getElementById('cpu-'+uuid).innerHTML = cpuData;
        })
        .catch(function (error) {
        }); 
}

function DeployService(uuid) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://'+ipmaster+':'+portmaster+'/v1/node/deployservice/'+uuid;
    axios({
        method: 'put',
        url: nodeurl,
        timeout: 30000
    })
        .then(function (response) {
            GetAllNodes();
            return true;
        })
        .catch(function (error) {
            return false;
        });   
}

function GetAllNodes() {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var resultElement = document.getElementById('nodes-table');
    document.getElementById('add-nid-bottom').style.display = "none";
    document.getElementById('add-nid-top').style.display = "none";

    //    var instance = axios.create({
    //     baseURL: 'https://' + ipmaster + ':' + portmaster + '/v1/node',
    //     httpsAgent: new https.Agent({
    //         rejectUnauthorized: false   
    //     })
    // });

    axios.get('https://' + ipmaster + ':' + portmaster + '/v1/node', {
            params: { 
                // rejectUnauthorized: false 
            }
        })
        .then(function (response) {
            var nodes = response.data;
            document.getElementById('add-nid-bottom').style.display = "block";
            document.getElementById('add-nid-top').style.display = "block";

            if (response.data.ack == "false") {
                document.getElementById('add-nid-bottom').style.display = "none";
                document.getElementById('add-nid-top').style.display = "none";
                resultElement.innerHTML =  '<div style="text-align:center"><h3 style="color:red;">Error retrieving nodes</h3></div>';
            }else{
                var isEmpty = true;
                
                var html =  
                '<div>'+
                    '<span id="show-nodes-online" onclick="showNodes(\'online\')" class="badge bg-success align-text-bottom text-white float-right" style="cursor:pointer;" title="Show only online nodes">ON LINE</span>'+
                    '<span id="show-nodes-offline" onclick="showNodes(\'offline\')" class="badge bg-danger align-text-bottom text-white float-right mr-1" style="cursor:pointer;" title="Show only offline nodes">OFF LINE</span>'+
                    '<span id="show-nodes-all" onclick="showNodes(\'all\')" class="badge bg-primary align-text-bottom text-white float-right mr-1" style="cursor:pointer;" title="Show all nodes">ALL NODES</span>'+
                    '<span id="sort-nodes-ip" onclick="sortTableIP()" sort="asc" class="sort-table asc badge bg-secondary align-text-bottom text-white float-left mr-1" style="cursor:pointer;"   title="Sort table by IP">Sort by IP</span>'+
                    '<span id="sort-nodes-name" onclick="sortTableName()" sort="asc" class="sort-table badge bg-secondary align-text-bottom text-white float-left mr-1" style="cursor:pointer;" title="Sort table by Name">Sort by Name</span>'+
                '</div>'+
                '<br>'+
                '<table class="table table-hover" style="table-layout: fixed" id="node-table"> ' +
                    '<thead> ' +
                        '<tr>  ' +
                            '<th scope="col" width="5%"></th> ' +
                            '<th id="node-table-name-column" scope="col" width="30%" align="left">Name</th> ' +
                            '<th scope="col" width="25%" align="right">Status</th> ' +
                            '<th scope="col" width="10%"></th>' +
                            '<th scope="col" width="25%">Actions</th>  ' +
                        '</tr> ' +
                    '</thead> ' +
                    '<tbody id="node-table-tbody">';
                        for (node in nodes) {
                            isEmpty = false;
                            if (nodes[node]['port'] != undefined) {
                                port = nodes[node]['port'];
                            } else {
                                port = "10443";
                            }
                            var uuid = node;
                            PingNode(uuid);
                            getRulesetUID(uuid);
                    
                    
                            html = html + '<tr class="node-search" id="node-row-'+node+'" name="'+nodes[node]['name']+'" ip="'+nodes[node]['ip']+'" status="offline">'+
                                '<td></td>'+
                                '<td width="33%" style="word-wrap: break-word;" class="align-middle"> <strong>' + nodes[node]['name'] + '</strong>'           +
                                    '<p class="text-muted">' + nodes[node]['ip'] + '</p>'                        +
                                    '<i class="fas fa-code" title="Ruleset Management"></i> <span id="'+uuid+'-ruleset" class="text-muted small"></span>'+
                                    '<br><br>'+
                                    '<span id="'+uuid+'-owlhservice" style="display:none; font-size: 15px; cursor: default;" class="col-md-4 badge bg-warning align-text-bottom text-white" onclick="DeployService(\''+uuid+'\')">Install service</span>'+
                                '</td>' +
                                '<td width="33%" style="word-wrap: break-word;" class="align-middle">'+
                                    '<span id="'+uuid+'-online" class="badge bg-dark align-text-bottom text-white">N/A</span> <br>'+
                                    '<span>'+
                                        '<div><p></p></div>'+
                                        '<div id="node-values-'+uuid+'">'+
                                            '<div id="mem-'+uuid+'"><b>MEM:</b> </div>'+
                                            '<div id="sto-'+uuid+'"><b>STO:</b> </div>'+                        
                                            '<div id="cpu-'+uuid+'"></div>'+                        
                                        '</div>'+
                                    '</span>'+
                                '</td>'+    
                                '<td></td>'+        
                                '<td width="33%" style="word-wrap: break-word;" class="align-middle"> '+                                   
                                    '<span style="font-size: 15px; color: Dodgerblue;" id="node-actions-'+uuid+'">'+                                                                          
                                        '<i id="node-monitor-'+uuid+'" class="fas fa-desktop" style="cursor: pointer;" id="details-'+uuid+'" title="Node monitoring" onclick="ShowMonitoring(\''+uuid+'\', \''+nodes[node]['name']+'\');"></i> | Node monitoring' +
                                        '<br><i id="node-services-'+uuid+'" class="fas fa-box-open" style="cursor: pointer;" title="node services configuration" onclick="showServicesConfig(\''+uuid+'\', \''+nodes[node]['name']+'\');"></i> | Node services configuration' +
                                        '<br><i id="node-modify-'+uuid+'" class="fas fa-cogs" style="cursor: pointer;" title="Modify node details" onclick="showConfig('+"'"+nodes[node]['ip']+"','"+nodes[node]['name']+"','"+nodes[node]['port']+"','"+uuid+"'"+');"></i> | Modify node' +
                                        '<br><i id="node-config-'+uuid+'" class="fas fa-cog" style="cursor: pointer;" title="Edit node configuration" onclick="loadEditURL(\''+node+'\', \'main.conf\', \''+nodes[node]['name']+'\')"></i> | Edit node configuration' +
                                        '<br><i id="node-files-'+uuid+'" class="fas fa-arrow-alt-circle-down" style="cursor: pointer;" title="See node files" onclick="loadFilesURL(\''+uuid+'\', \''+nodes[node]['name']+'\')"></i> | See node files' +
                                        '<br><i id="node-change-'+uuid+'" class="fas fa-clipboard-list" style="cursor: pointer;" title="Change control data" onclick="loadChangeControl(\''+uuid+'\', \'node\')"></i> | Change control' +
                                        '<br><i id="node-incident-'+uuid+'" class="fas fa-archive" style="cursor: pointer;" title="Incident data" onclick="loadIncidentMaster(\''+uuid+'\', \'node\')"></i> | Incident data' +
                                        '<br><i class="fas fa-trash-alt" style="color: red; cursor: pointer;" title="Delete Node" data-toggle="modal" data-target="#modal-window" onclick="deleteNodeModal('+"'"+node+"'"+', '+"'"+nodes[node]['name']+"'"+');"></i> | Delete node';
                                    '</span>'+
                                '</td> ' +
                            '</tr>'; 
                        }
                html = html + '</tbody></table>';
            
                if (isEmpty){
                    resultElement.innerHTML = '<div style="text-align:center"><h3>No nodes created.</h3></div>';
                }else{
                    resultElement.innerHTML = html;
                    
                    //search bar
                    $('#node-search-value').click(function(){ loadNodeBySearch(document.getElementById('search-node-details').value)});
                
                    //listener for seach bar
                    document.getElementById('search-node-details').addEventListener('input', evt => {
                        if (document.getElementById('search-node-details').value.trim() == ""){ showAllHiddenNodes();} 
                    });
                }                    
            }

            $('#node-table').click(function(){sortTable(); });

        })
        .catch(function (error) {
            resultElement.innerHTML = '<h3 align="center">No connection</h3>'+
                '<a id="check-status-config" href="" class="btn btn-success float-right" target="_blank">Check Master API connection</a> ';
                checkStatus();
        });
}



function sortTable() {
    // var $table = $('node-table');
    // var $tableBody = $table.find('tbody');
    // var rows, sortedRows;

    // function sortRows(a, b){
    //     if ( $(a).find('tr:first-Child').text() > $(b).find('td:first-Child').text() ) {
    //         return 1;
    //     }

    //     if ( $(a).find('td:first-Child').text() < $(b).find('td:first-Child').text() ) {
    //         return -1;
    //     }

    //     return 0;
    // }


    // $($('#node-table > tbody  > tr')).val('');
    // // $('#node-table > tbody  > tr').each(function() {
    // //     console.log($(this).attr('name'));
    // // });
}

function showNodes(status){
    if (status == "all"){
        showAllHiddenNodes();
    }else{
        showAllHiddenNodes();
        $('#node-table tbody').each(function(){
            $(this).find('tr').each(function(){
                if ($(this).attr('status') == status){
                }else{
                    $(this).hide();
                }
            });
        });
    }
}

function showAllHiddenNodes(){
    $('#node-table tbody').each(function(){
        $(this).find('tr').each(function(){
            $(this).show();
        })
    })
}

function loadNodeBySearch(search){
    showAllHiddenNodes();
    if (search.length == 0){
        $('#search-node-details').css('border', '2px solid red');
        $('#search-node-details').attr("placeholder", "Insert a valid name for search...");
    }else{
        $('#search-node-details').css('border', '2px solid #ced4da');
        $('#search-node-details').attr("placeholder", "");
        $('#node-table tbody').each(function(){
            $(this).find('tr').each(function(){
                // console.log($(this).attr("name").toLowerCase().includes(search.toLowerCase()));
                if ($(this).attr("name").toLowerCase().includes(search.toLowerCase()) || $(this).attr("ip").toLowerCase().includes(search.toLowerCase())){
                }else {
                    $(this).hide();
                }
            })
        })
    }
}

function deleteNode(node) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://'+ipmaster+':'+portmaster+'/v1/node/'+node;
    axios({
        method: 'delete',
        url: nodeurl,
        timeout: 30000
    })
        .then(function (response) {
            GetAllNodes();
            return true;
        })
        .catch(function (error) {
            return false;
        });   
}

function formAddNids(){
    var addnidsbot = document.getElementById('add-nid-bottom');
    var addnidstop = document.getElementById('add-nid-top');
    var nform = document.getElementById('nidsform');

    if (nform.style.display == "none") {
        nform.style.display = "block";
        addnidsbot.innerHTML = "Close Add NID";
        addnidstop.innerHTML = "Close Add NID";
        nform.scrollIntoView();
    } else {
        nform.style.display = "none";
        addnidsbot.innerHTML = "Add NID";
        addnidstop.innerHTML = "Add NID";
    }
}
    
function PingDataflow(uuid){
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://'+ ipmaster + ':' + portmaster + '/v1/node/loadDataflowValues/'+uuid;
    axios({
        method: 'get',
        url: nodeurl,
        timeout: 30000
    })
    .then(function (response) {
        document.getElementById('collect-'+response.data["collect"]["value"]).checked = "true";
        document.getElementById('analysis-'+response.data["analysis"]["value"]).checked = "true";
        document.getElementById('transport-'+response.data["transport"]["value"]).checked = "true";
    })
    .catch(function (error) {
    });
}

function deployNode(value,uuid,nodeName){
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://'+ ipmaster + ':' + portmaster + '/v1/node/deployNode';
    var jsonDeploy = {}
    jsonDeploy["value"] = value;
    jsonDeploy["uuid"] = uuid;
    var dataJSON = JSON.stringify(jsonDeploy);

    axios({
        method: 'put',
        url: nodeurl,
        timeout: 30000,
        data: dataJSON
    })
    .then(function (response) {
        if (response.data.ack == "true") {
            $('html,body').scrollTop(0);
            var alert = document.getElementById('floating-alert');
            alert.innerHTML = '<div class="alert alert-success alert-dismissible fade show">'+
                '<strong>Success!</strong> '+value+' deployed successfully for node '+nodeName+'.'+
                '<button type="button" class="close" data-dismiss="alert" aria-label="Close">'+
                    '<span aria-hidden="true">&times;</span>'+
                '</button>'+
            '</div>';
            setTimeout(function() {$(".alert").alert('close')}, 5000);
        }else{
            $('html,body').scrollTop(0);
            var alert = document.getElementById('floating-alert');
            alert.innerHTML = '<div class="alert alert-danger alert-dismissible fade show">'+
                '<strong>Error!</strong> '+value+' has not been deployed for node '+nodeName+'.'+
                '<button type="button" class="close" data-dismiss="alert" aria-label="Close">'+
                    '<span aria-hidden="true">&times;</span>'+
                '</button>'+
            '</div>';
            setTimeout(function() {$(".alert").alert('close')}, 5000);
        }
    })
    .catch(function (error) {
    });
}

function loadIncidentMaster(uuid, type){
    var ipmaster = document.getElementById('ip-master').value;
    document.location.href = 'https://' + ipmaster + '/incident-data.html?type='+type+'&uuid='+uuid;
}

function ShowMonitoring(uuid, name){
    var ipmaster = document.getElementById('ip-master').value;
    document.location.href = 'https://' + ipmaster + '/node-monitor.html?uuid='+uuid+'&node='+name;
}

function showServicesConfig(uuid, name){
    var ipmaster = document.getElementById('ip-master').value;
    document.location.href = 'https://' + ipmaster + '/node-options.html?uuid='+uuid+'&node='+name;
}

function showMasterFile(file){
    var ipmaster = document.getElementById('ip-master').value;
    document.location.href = 'https://' + ipmaster + '/edit-master.html?file='+file;
}

function editAnalyzer(uuid, file, nodeName){
    var ipmaster = document.getElementById('ip-master').value;
    document.location.href = 'https://' + ipmaster + '/edit.html?uuid='+uuid+'&file='+file+'&node='+nodeName;
}

function loadChangeControl(uuid, type){
    var ipmaster = document.getElementById('ip-master').value;
    document.location.href = 'https://' + ipmaster + '/control-data.html?type='+type+'&uuid='+uuid;
}

function showActions(action,uuid){
    var addnids = document.getElementById(action+'-form-'+uuid);
    var icon = document.getElementById(action+'-form-icon-'+uuid);
    if (addnids.style.display == "none") {
        addnids.style.display = "block";
        icon.classList.add("fa-sort-up");
        icon.classList.remove("fa-sort-down");        
    } else {
        addnids.style.display = "none";
        icon.classList.add("fa-sort-down");
        icon.classList.remove("fa-sort-up");   
    }    
}

function loadStapURL(uuid, nodeName){
    var ipmaster = document.getElementById('ip-master').value;
    document.location.href = 'https://' + ipmaster + '/stap.html?uuid='+uuid+'&node='+nodeName;
}
function loadFilesURL(uuid, nodeName){
    var ipmaster = document.getElementById('ip-master').value;
    document.location.href = 'https://' + ipmaster + '/files.html?uuid='+uuid+'&node='+nodeName;
}
function loadEditURL(uuid, file, nodeName){
    var ipmaster = document.getElementById('ip-master').value;
    document.location.href = 'https://' + ipmaster + '/edit.html?uuid='+uuid+'&file='+file+'&node='+nodeName;
}


function ChangeStatus(uuid){
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://'+ ipmaster + ':' + portmaster + '/v1/node/status';
    
    if(document.getElementById('ports-status-'+uuid).innerHTML == "ON"){
        var status ="Disabled";
    }else{
        var status ="Enabled";
    }

    var jsonPorts = {}
    jsonPorts["uuid"] = uuid;
    jsonPorts["status"] = status;
    var dataJSON = JSON.stringify(jsonPorts);

    axios({
        method: 'put',
        url: nodeurl,
        timeout: 30000,
        data: dataJSON
    })
    .then(function (response) {
        GetAllNodes()
    })
    .catch(function (error) {
    });
}

function ChangeAnalyzerStatus(uuid){
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://'+ ipmaster + ':' + portmaster + '/v1/node/analyzer';
    
    if(document.getElementById('analyzer-status-'+uuid).innerHTML == "ON"){
        var status ="Disabled";
    }else if(document.getElementById('analyzer-status-'+uuid).innerHTML == "OFF"){
        var status ="Enabled";
    }

    var jsonAnalyzer = {}
    jsonAnalyzer["uuid"] = uuid;
    jsonAnalyzer["status"] = status;
    var dataJSON = JSON.stringify(jsonAnalyzer);

    axios({
        method: 'put',
        url: nodeurl,
        timeout: 30000,
        data: dataJSON
    })
    .then(function (response) {
        GetAllNodes()
    })
    .catch(function (error) {
    });
}

function ChangeMode(uuid){
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://'+ ipmaster + ':' + portmaster + '/v1/node/mode';
    
    if(document.getElementById('ports-mode-'+uuid).innerHTML == "Learning"){
        var mode ="Production";
    }else{
        var mode ="Learning";
    }

    var jsonRuleUID = {}
    jsonRuleUID["uuid"] = uuid;
    jsonRuleUID["mode"] = mode;
    var dataJSON = JSON.stringify(jsonRuleUID);

    axios({
        method: 'put',
        url: nodeurl,
        timeout: 30000,
        data: dataJSON
    })
    .then(function (response) {
        GetAllNodes()
    })
    .catch(function (error) {
    });
}



function deployZeekModal(uuid){
    var modalWindow = document.getElementById('modal-window');
    modalWindow.innerHTML = 
    '<div class="modal-dialog">'+
      '<div class="modal-content">'+
      
        '<div class="modal-header">'+
          '<h4 class="modal-title" id="delete-node-header">Node</h4>'+
          '<button type="button" class="close" data-dismiss="modal">&times;</button>'+
        '</div>'+
  
        '<div class="modal-body" id="delete-node-footer-table">'+ 
          '<p>Do you want to Deploy Zeek policy?</p>'+
        '</div>'+
  
        '<div class="modal-footer" id="delete-node-footer-btn">'+
          '<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>'+
          '<button type="submit" class="btn btn-primary" data-dismiss="modal" id="btn-delete-node" onclick="deployZeek(\''+uuid+'\')">Deploy</button>'+
        '</div>'+
  
      '</div>'+
    '</div>';
}

function deployZeek(uuid){
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://'+ ipmaster + ':' + portmaster + '/v1/node/deploy/' + uuid;
    axios({
        method: 'get',
        url: nodeurl,
        timeout: 30000
    })
    .then(function (response) {
        return true;
    })
    .catch(function (error) {
        return false;
    });
}

function playCollector(uuid){
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://'+ ipmaster + ':' + portmaster + '/v1/collector/play/' + uuid;
    axios({
        method: 'get',
        url: nodeurl,
        timeout: 30000
    })
    .then(function (response) {
        document.getElementById('stap-collector-' + uuid).className = "badge bg-success align-text-bottom text-white";
        document.getElementById('stap-collector-' + uuid).innerHTML = "ON";
        return true;
    })
    .catch(function (error) {
        return false;
    });
}

function stopCollector(uuid){
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://'+ ipmaster + ':' + portmaster + '/v1/collector/stop/' + uuid;
    axios({
        method: 'get',
        url: nodeurl,
        timeout: 30000
    })
    .then(function (response) {
        document.getElementById('stap-collector-' + uuid).className = "badge bg-danger align-text-bottom text-white";
        document.getElementById('stap-collector-' + uuid).innerHTML = "OFF";
        return true;
    })
    .catch(function (error) {
        return false;
    });
}

function PingCollector(uuid){
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var collectorStatus = document.getElementById('collector-status-'+uuid);
    var nodeurl = 'https://'+ ipmaster + ':' + portmaster + '/v1/collector/show/' + uuid;
    axios({
        method: 'get',
        url: nodeurl,
        timeout: 30000
    })
    .then(function (response) {
        if (response.data != ""){
            document.getElementById('stap-collector-' + uuid).className = "badge bg-success align-text-bottom text-white";
            document.getElementById('stap-collector-' + uuid).innerHTML = "ON";            
        }else{
            document.getElementById('stap-collector-' + uuid).className = "badge bg-danger align-text-bottom text-white";
            document.getElementById('stap-collector-' + uuid).innerHTML = "OFF";            
        }
    })
    .catch(function (error) {
        return false;
    });
}

function showCollector(uuid){
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://'+ ipmaster + ':' + portmaster + '/v1/collector/show/' + uuid;
    axios({
        method: 'get',
        url: nodeurl,
        timeout: 30000
    })
    .then(function (response) {
        showModalCollector(response);
    })
    .catch(function (error) {
        return false;
    });
}

function showModalCollector(response){
    var res = response.data.split("\n");
    var html = '<div class="modal-dialog modal-lg">'+
                    '<div class="modal-content">'+
                
                        '<div class="modal-header">'+
                            '<h4 class="modal-title" id="modal-collector-header">STAP Collector status</h4>'+
                            '<button type="button" class="close" data-dismiss="modal" aria-label="Close">'+
                                '<span aria-hidden="true">&times;</span>'+
                            '</button>'+
                        '</div>'+
                
                        '<div class="modal-body">'
                                if (response.data == ""){
                                    html = html + '<p>There are no ports</p>';
                                }else{
                                    html = html + '<table class="table table-hover" style="table-layout: fixed" style="width:1px">' +
                                    '<thead>                                                      ' +
                                        '<tr>                                                         ' +
                                            '<th>Proto</th>                                             ' +
                                            '<th>RECV</th>                                             ' +
                                            '<th>SEND</th>                                             ' +
                                            '<th style="width: 25%">LOCAL IP</th>                                             ' +
                                            '<th style="width: 25%">REMOTE IP</th>                                             ' +
                                            '<th style="width: 15%">STATUS</th>                                             ' +
                                            '<th></th>                                             ' +
                                        '</tr>                                                        ' +
                                    '</thead>                                                     ' +
                                    '<tbody>                                                     ' 
                                    for(line in res) {
                                        if (res[line] != ""){
                                            var vregex = /([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+(.*)/;
                                            var lineSplited = vregex.exec(res[line]);
                                            html = html + '<tr><td>' +
                                            lineSplited[1]+
                                            '</td><td>     ' +
                                            lineSplited[2]+
                                            '</td><td>     ' +
                                            lineSplited[3]+
                                            '</td><td>     ' +
                                            lineSplited[4]+
                                            '</td><td>     ' +
                                            lineSplited[5]+
                                            '</td><td>     ' +
                                            lineSplited[6]+
                                            '</td><td>     ' +
                                            lineSplited[7]+
                                            '</td></tr>'
                                        }
                                    }
                                }
                        html = html +
                        '</div>'+
                
                    '</div>'+
                '</div>';
    document.getElementById('modal-window').innerHTML = html;
}


function showPorts(uuid){
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://'+ ipmaster + ':' + portmaster + '/v1/node/ports/' + uuid;
    axios({
        method: 'get',
        url: nodeurl,
        timeout: 30000
    })
    .then(function (response) {
        showModalPorts(response, uuid);                
    })
    .catch(function (error) {
        return false;
    });
}

function showModalPorts(response, uuid){
    var html = '<div class="modal-dialog modal-lg">'+
        '<div class="modal-content">'+
    
            '<div class="modal-header">'+
                '<h4 class="modal-title">PORTS</h4>'+
                '<button type="button" class="close" data-dismiss="modal" aria-label="Close">'+
                    '<span aria-hidden="true">&times;</span>'+
                '</button>'+
            '</div>';

            if (response.data.ack=="false"){
                html = html + '<div class="modal-body">  '+
                    '<h5 class="modal-title" style="color:red;">Error retrieving ports...</h5>'+
                '</div>';
            }else{
                html = html + '<div class="modal-body">  '+
                    '<table class="table table-hover" style="table-layout: fixed" style="width:1px">' +
                        '<thead>                                                      ' +
                            '<tr>                                                         ' +
                                '<th width="30%">Portproto</th>                                    ' +
                                '<th>First</th>                                         ' +
                                '<th>Last</th>                                 ' +
                                '<th width="10%">Select</th>                                 ' +
                            '</tr>                                                        ' +
                        '</thead>                                                     ' +
                        '<tbody>                                                     ' 
                            for(line in response.data){
                                var first = new Date(response.data[line]["first"]*1000);
                                var last = new Date(response.data[line]["last"]*1000);
                                
                                html = html + '<tr><td id="">                            ' +
                                response.data[line]["portprot"]+'<br>'                    +
                                '</td><td>'+
                                first+
                                '</td><td>'+
                                last+
                                '</td><td align="center">'+
                                '<input class="form-check-input" type="checkbox" id="'+line+'"></input>'+
                                '</td></tr>'
                            }
                    html = html +'</tbody>'+
                    '</table>'+
                '</div>'+

                '<div class="modal-footer" id="ruleset-note-footer-btn">'+
                    '<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>'+
                    '<button type="button" class="btn btn-dark" data-dismiss="modal" onclick="deleteAllPorts(\''+uuid+'\')">Delete all</button>' +
                    '<button type="button" class="btn btn-primary" data-dismiss="modal" onclick="deletePorts(\''+uuid+'\')">Delete</button>' +
                '</div>';
            }

        html = html + '</div>'+
    '</div>';
    document.getElementById('modal-window').innerHTML = html;
}

// function showModalPorts(response, uuid){
//     var html = '<div class="modal-dialog modal-lg">'+
//         '<div class="modal-content">'+
    
//             '<div class="modal-header">'+
//                 '<h4 class="modal-title">Ports</h4>'+
//                 '<button type="button" class="close" data-dismiss="modal" aria-label="Close">'+
//                     '<span aria-hidden="true">&times;</span>'+
//                 '</button>'+
//             '</div>'+

//             '<div class="modal-body">';

//                 if(response.data.ack=="false"){
//                     console.log(response.data.ack);
//                     htlm = html + '<h4 class="modal-title" style="color:red;">Error retrieving ports...</h4>';
//                 }else{
//                     console.log(response);
//                     htlm = html + '<table class="table table-hover" style="table-layout: fixed" style="width:1px">' +
//                             '<thead>                                                      ' +
//                                 '<tr>                                                         ' +
//                                     '<th width="30%">Portproto</th>                                    ' +
//                                     '<th>First</th>                                         ' +
//                                     '<th>Last</th>                                 ' +
//                                     '<th width="10%">Select</th>                                 ' +
//                                 '</tr>                                                        ' +
//                             '</thead>                                                     ' +
//                             '<tbody>                                                     ' ;
//                                 for(line in response.data){
//                                     var first = new Date(response.data[line]["first"]*1000);
//                                     var last = new Date(response.data[line]["last"]*1000);
                                    
//                                     html = html + '<tr><td>                            ' +
//                                     response.data[line]["portprot"]+
//                                     '</td><td>'+
//                                     first+
//                                     '</td><td>'+
//                                     last+
//                                     '</td><td align="center">'+
//                                         '<input class="form-check-input" type="checkbox" id="'+line+'"></input>'+
//                                     '</td></tr>';
//                                 }
//                             html = html +'</tbody>'+
//                         '</table>';
//                 }
//             html = html +'</div>'+

//             '<div class="modal-footer" id="ruleset-note-footer-btn">'+
//                 '<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>'+
//                 '<button type="button" class="btn btn-dark" data-dismiss="modal" onclick="deleteAllPorts(\''+uuid+'\')">Delete all</button>' +
//                 '<button type="button" class="btn btn-primary" data-dismiss="modal" onclick="deletePorts(\''+uuid+'\')">Delete</button>' +
//             '</div>'+


//         '</div>'+
//     '</div>';
    
//     document.getElementById('modal-window').innerHTML = html;
// }

function deletePorts(uuid){
    var arrayLinesSelected = new Object();
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://'+ipmaster+':'+portmaster+'/v1/node/ports/delete/'+uuid;
    $('input:checkbox:checked').each(function() {
        var CHuuid = $(this).prop("id");
        arrayLinesSelected[CHuuid] = CHuuid;
    });
    var nodeJSON = JSON.stringify(arrayLinesSelected);
    axios({
        method: 'put',
        url: nodeurl,
        timeout: 30000,
        data: nodeJSON
        }).then(function (response) {
        
        }).catch(function (error) {

        }); 

}

function deleteAllPorts(uuid){
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://'+ipmaster+':'+portmaster+'/v1/node/ports/deleteAll/'+uuid;
    axios({
        method: 'put',
        url: nodeurl,
        timeout: 30000
    }).then(function (response) {

    }).catch(function (error) {

    }); 

}

function sendRulesetToNode(uuid){
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://'+ ipmaster + ':' + portmaster + '/v1/node/ruleset/set';

    var jsonRuleUID = {}
    jsonRuleUID["uuid"] = uuid;
    jsonRuleUID["type"] = "node";
    var dataJSON = JSON.stringify(jsonRuleUID);
    axios({
        method: 'put',
        url: nodeurl,
        timeout: 30000,
        data: dataJSON
    })
    .then(function (response) {
        if (response.data.ack == "true") {
            $('html,body').scrollTop(0);
            var alert = document.getElementById('floating-alert');
            alert.innerHTML = '<div class="alert alert-success alert-dismissible fade show">'+
                '<strong>Success!</strong> Suricata ruleset deployment complete.'+
                '<button type="button" class="close" data-dismiss="alert" aria-label="Close">'+
                    '<span aria-hidden="true">&times;</span>'+
                '</button>'+
            '</div>';
            setTimeout(function() {$(".alert").alert('close')}, 5000);
        }else{
            $('html,body').scrollTop(0);
            var alert = document.getElementById('floating-alert');
            alert.innerHTML = '<div class="alert alert-danger alert-dismissible fade show">'+
                '<strong>Suricata deployment Error! </strong>'+response.data.error+''+
                '<button type="button" class="close" data-dismiss="alert" aria-label="Close">'+
                    '<span aria-hidden="true">&times;</span>'+
                '</button>'+
            '</div>';
            setTimeout(function() {$(".alert").alert('close')}, 5000);
        }
    })
    .catch(function (error) {
        $('html,body').scrollTop(0);
        var alert = document.getElementById('floating-alert');
            alert.innerHTML = '<div class="alert alert-danger alert-dismissible fade show">'+
                '<strong>Error!</strong>'+response.data.error+''+
                '<button type="button" class="close" data-dismiss="alert" aria-label="Close">'+
                    '<span aria-hidden="true">&times;</span>'+
                '</button>'+
            '</div>';
            setTimeout(function() {$(".alert").alert('close')}, 5000);
    });
}

//Run suricata system
function RunSuricata(uuid) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/node/RunSuricata/' + uuid;
    axios({
        method: 'put',
        url: nodeurl,
        //httpsAgent: agent,
        timeout: 30000
    })
        .then(function (response) {
            // GetAllNodes();
        })
        .catch(function error() {
        });

    setTimeout(function (){
        GetAllNodes();
    }, 1000);
}

//Stop suricata system
function StopSuricata(uuid) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/node/StopSuricata/' + uuid;
    axios({
        method: 'put',
        url: nodeurl,
        timeout: 30000,
    })
        .then(function (response) {
            // GetAllNodes();
        })
        .catch(function error() {
        });

    setTimeout(function (){
        GetAllNodes();
    }, 1000);
}

function PingSuricata(uuid) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/node/suricata/' + uuid;
    axios({
        method: 'get',
        url: nodeurl,
        timeout: 30000
    })
        .then(function (response) {
            if (!response.data.path && !response.data.bin) {
                document.getElementById(uuid + '-suricata').className = "badge bg-dark align-text-bottom text-white";
                document.getElementById(uuid + '-suricata').innerHTML = "N/A";
                document.getElementById(uuid + '-suricata-icon').className = "fas fa-play-circle";
                document.getElementById(uuid + '-suricata-icon').onclick = function () { RunSuricata(uuid); };
                document.getElementById(uuid + '-suricata-icon').title = "Run Suricata";
                // document.getElementById('suricata-deploy-button').onclick = function () { };                
                // document.getElementById('suricata-deploy-button').style.color = "grey";                
            } else if (response.data.path || response.data.bin) {
                if (response.data.running) {
                    document.getElementById(uuid + '-suricata').className = "badge bg-success align-text-bottom text-white";
                    document.getElementById(uuid + '-suricata').innerHTML = "ON";
                    document.getElementById(uuid + '-suricata-icon').className = "fas fa-stop-circle";
                    document.getElementById(uuid + '-suricata-icon').onclick = function () { StopSuricata(uuid); };
                    document.getElementById(uuid + '-suricata-icon').title = "Stop Suricata";
                } else {
                    document.getElementById(uuid + '-suricata').className = "badge bg-danger align-text-bottom text-white";
                    document.getElementById(uuid + '-suricata').innerHTML = "OFF";
                    document.getElementById(uuid + '-suricata-icon').className = "fas fa-play-circle";
                    document.getElementById(uuid + '-suricata-icon').onclick = function () { RunSuricata(uuid); };
                    document.getElementById(uuid + '-suricata-icon').title = "Run Suricata";
                }
            }
            return true;
        })
        .catch(function (error) {
            document.getElementById(uuid + '-suricata').className = "badge bg-dark align-text-bottom text-white";
            document.getElementById(uuid + '-suricata').innerHTML = "N/A";
            return false;
        });
    return false;
}

function PingCheckDeploy(uuid){
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/node/checkDeploy/'+uuid;
    axios({
        method: 'get',
        url: nodeurl,
        timeout: 30000
    })
    .then(function (response) {
        for(deploy in response.data){
            if(response.data[deploy] == "false"){
                document.getElementById('deploy-node-'+deploy).style.display = "none";
            }else{
                document.getElementById('deploy-node-'+deploy).style.display = "block";
            }
        }        
    })
    .catch(function (error) {

    });
}

//Run Zeek system
function RunZeek(uuid) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/node/RunZeek/' + uuid;
    axios({
        method: 'put',
        url: nodeurl,
        timeout: 30000
    })
        .then(function (response) {
        })
        .catch(function error() {
        });

    GetAllNodes();
}

//Stop Zeek system
function StopZeek(uuid) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/node/StopZeek/' + uuid;
    axios({
        method: 'put',
        url: nodeurl,
        timeout: 30000,
    })
        .then(function (response) {
        })
        .catch(function error() {
        });

    GetAllNodes();
}

function PingZeek(uuid) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/node/zeek/' + uuid;
    axios({
        method: 'get',
        url: nodeurl,
        timeout: 30000
    })
        .then(function (response) {
            if (!response.data.path && !response.data.bin) {
                document.getElementById(uuid + '-zeek').className = "badge bg-dark align-text-bottom text-white";
                document.getElementById(uuid + '-zeek').innerHTML = "N/A";
                document.getElementById(uuid + '-zeek-icon').className = "fas fa-play-circle";
                document.getElementById(uuid + '-zeek-icon').onclick = function () { RunZeek(uuid); };
                document.getElementById(uuid + '-zeek-icon').title = "Run zeek";
            } else if (response.data.path || response.data.bin) {
                if (response.data.running) {
                    document.getElementById(uuid + '-zeek').className = "badge bg-success align-text-bottom text-white";
                    document.getElementById(uuid + '-zeek').innerHTML = "ON";
                    document.getElementById(uuid + '-zeek-icon').className = "fas fa-stop-circle";
                    document.getElementById(uuid + '-zeek-icon').onclick = function () { StopZeek(uuid); };
                    document.getElementById(uuid + '-zeek-icon').title = "Stop Zeek";
                } else {
                    document.getElementById(uuid + '-zeek').className = "badge bg-danger align-text-bottom text-white";
                    document.getElementById(uuid + '-zeek').innerHTML = "OFF";
                    document.getElementById(uuid + '-zeek-icon').className = "fas fa-play-circle";
                    document.getElementById(uuid + '-zeek-icon').onclick = function () { RunZeek(uuid); };
                    document.getElementById(uuid + '-zeek-icon').title = "Run Zeek";
                }
            }
            return true;
        })
        .catch(function (error) {
            document.getElementById(uuid + '-zeek').className = "badge bg-dark align-text-bottom text-white";
            document.getElementById(uuid + '-zeek').innerHTML = "N/A";

            return false;
        });
    return false;
}

//Run Zeek system
function RunWazuh(uuid) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/node/RunWazuh/' + uuid;
    axios({
        method: 'put',
        url: nodeurl,
        timeout: 30000
    })
        .then(function (response) {
        })
        .catch(function error() {
        });

    GetAllNodes();
}

//Stop Wazuh system
function StopWazuh(uuid) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/node/StopWazuh/' + uuid;
    axios({
        method: 'put',
        url: nodeurl,
        timeout: 30000,
    })
        .then(function (response) {
        })
        .catch(function error() {
        });

    GetAllNodes();
}

function PingWazuh(uuid) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/node/wazuh/' + uuid;
    axios({
        method: 'get',
        url: nodeurl,
        timeout: 30000
    })
        .then(function (response) {
            if (!response.data.path && !response.data.bin) {
                document.getElementById(uuid + '-wazuh').className = "badge bg-dark align-text-bottom text-white";
                document.getElementById(uuid + '-wazuh').innerHTML = "N/A";
                document.getElementById(uuid + '-wazuh-icon').className = "fas fa-play-circle";
                document.getElementById(uuid + '-wazuh-icon').onclick = function () { RunWazuh(uuid); };
                document.getElementById(uuid + '-wazuh-icon').title = "Run Wazuh";
            } else if (response.data.path || response.data.bin) {
                if (response.data.running) {
                    document.getElementById(uuid + '-wazuh').className = "badge bg-success align-text-bottom text-white";
                    document.getElementById(uuid + '-wazuh').innerHTML = "ON";
                    document.getElementById(uuid + '-wazuh-icon').className = "fas fa-stop-circle";
                    document.getElementById(uuid + '-wazuh-icon').onclick = function () { StopWazuh(uuid); };
                    document.getElementById(uuid + '-wazuh-icon').title = "Stop Wazuh";
                } else {
                    document.getElementById(uuid + '-wazuh').className = "badge bg-danger align-text-bottom text-white";
                    document.getElementById(uuid + '-wazuh').innerHTML = "OFF";
                    document.getElementById(uuid + '-wazuh-icon').className = "fas fa-play-circle";
                    document.getElementById(uuid + '-wazuh-icon').onclick = function () { RunWazuh(uuid); };
                    document.getElementById(uuid + '-wazuh-icon').title = "Run Wazuh";
                }
            }
            return true;
        })
        .catch(function (error) {
            document.getElementById(uuid + '-wazuh').className = "badge bg-dark align-text-bottom text-white";
            document.getElementById(uuid + '-wazuh').innerHTML = "N/A";
            return false;
        });
    return false;
}

//Run stap system
function RunStap(uuid) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/stap/RunStap/' + uuid;
    axios({
        method: 'put',
        url: nodeurl,
        timeout: 30000
    })
        .then(function (response) {
        })
        .catch(function error() {
        });
    GetAllNodes();
}

//Stop stap system
function StopStap(uuid) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/stap/StopStap/' + uuid;
    axios({
        method: 'put',
        url: nodeurl,
        timeout: 30000,
    })
        .then(function (response) {
        })
        .catch(function error() {
        });
    GetAllNodes();
}

function PingStap(uuid) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/stap/stap/' + uuid;
    axios({
        method: 'get',
        url: nodeurl,
        timeout: 30000
    })
        .then(function (response) {
            if (!response.data.stapStatus) {
                document.getElementById(uuid + '-stap').className = "badge bg-danger align-text-bottom text-white";
                document.getElementById(uuid + '-stap').innerHTML = "OFF";
                document.getElementById(uuid + '-stap-icon').className = "fas fa-play-circle";
                document.getElementById(uuid + '-stap-icon').onclick = function () { RunStap(uuid); };
                document.getElementById(uuid + '-stap-icon').title = "Run stap";
            } else {
                document.getElementById(uuid + '-stap').className = "badge bg-success align-text-bottom text-white";
                document.getElementById(uuid + '-stap').innerHTML = "ON";
                document.getElementById(uuid + '-stap-icon').className = "fas fa-stop-circle";
                document.getElementById(uuid + '-stap-icon').onclick = function () { StopStap(uuid); };
                document.getElementById(uuid + '-stap-icon').title = "Stop stap";
            }
        })
        .catch(function (error) {
            document.getElementById(uuid + '-stap').className = "badge bg-dark align-text-bottom text-white";
            document.getElementById(uuid + '-stap').innerHTML = "N/A";
            return false;
        });
    return false;
}

function PingPorts(uuid) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/node/PingPorts/' + uuid;
    axios({
        method: 'get',
        url: nodeurl,
        timeout: 30000
    })
        .then(function (response) {
            for(line in response.data){
                if (response.data[line]["status"] == "Enabled"){
                    document.getElementById('ports-status-'+uuid).innerHTML = "ON";
                }else if (response.data[line]["status"] == "Disabled"){
                    document.getElementById('ports-status-'+uuid).innerHTML = "OFF";
                }
                document.getElementById('ports-mode-'+uuid).innerHTML = response.data[line]["mode"];
                
                if (response.data[line]["status"] == "Enabled"){
                    document.getElementById('ports-status-btn-'+uuid).className = "fas fa-stop-circle";
                    document.getElementById('ports-status-'+uuid).className = "badge bg-success align-text-bottom text-white";
                }else{
                    document.getElementById('ports-status-btn-'+uuid).className = "fas fa-play-circle";
                    document.getElementById('ports-status-'+uuid).className = "badge bg-danger align-text-bottom text-white";
                }                
            }
            return true;
        })
        .catch(function (error) {
            
            return false;            
        });
    return false;
}

function PingAnalyzer(uuid) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/node/PingAnalyzer/' + uuid;
    axios({
        method: 'get',
        url: nodeurl,
        timeout: 30000
    })
        .then(function (response) {
            if (response.data["status"] == "Enabled"){
                document.getElementById('analyzer-status-'+uuid).innerHTML = "ON";
                document.getElementById('analyzer-status-btn-'+uuid).className = "fas fa-stop-circle";
                document.getElementById('analyzer-status-'+uuid).className = "badge bg-success align-text-bottom text-white";
            }else{
                document.getElementById('analyzer-status-'+uuid).innerHTML = "OFF";
                document.getElementById('analyzer-status-btn-'+uuid).className = "fas fa-play-circle";
                document.getElementById('analyzer-status-'+uuid).className = "badge bg-danger align-text-bottom text-white";
            }                
            return true;
        })
        .catch(function (error) {
            
            return false;            
        });
    return false;
}


function getRulesetUID(uuid) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/ruleset/get/' + uuid;
    axios({
        method: 'get',
        url: nodeurl,
        timeout: 30000
    })
    .then(function (response) {
        getRuleName(response.data, uuid);
        return true;
    })
    .catch(function (error) {
        return false;
    });
}

function getRuleName(uuidRuleset, uuid) {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/ruleset/get/name/' + uuidRuleset;
    axios({
        method: 'get',
        url: nodeurl,
        timeout: 30000
    })
        .then(function (response) {
            if (typeof response.data.error != "undefined") {
                document.getElementById(uuid + '-ruleset').innerHTML = "No ruleset selected...";
                document.getElementById(uuid + '-ruleset').className = "text-danger";
            } else {
                document.getElementById(uuid + '-ruleset').innerHTML = response.data;
                document.getElementById(uuid + '-ruleset').className = "text-muted-small";
            }
            return response.data;
        })
        .catch(function (error) {
            return false;
        });
}

function checkStatus() {
    var ipmaster = document.getElementById('ip-master').value;
    var portmaster = document.getElementById('port-master').value;
    var nodeurl = 'https://' + ipmaster + ':' + portmaster + '/v1/home';
    document.getElementById('check-status-config').href = nodeurl;
}

function sortTableName() {
    var type = document.getElementById('sort-nodes-name').getAttribute("sort");
    var table, rows, switching, i, x, y, shouldSwitch;
    table = document.getElementById("node-table");
    switching = true;
    while (switching) {
		switching = false;
		rows = table.rows;
		for (i = 1; i < (rows.length - 1); i++) {
			shouldSwitch = false;
			x = rows[i].getAttribute("name");
            y = rows[i + 1].getAttribute("name");
            if (type == "asc"){
                if (x.toLowerCase() > y.toLowerCase()) {
                    shouldSwitch = true;
                    break;
                }
            }else{
                if (x.toLowerCase() < y.toLowerCase()) {
                    shouldSwitch = true;
                    break;
                }
            }
		}
		if (shouldSwitch) {
			rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
			switching = true;
		}
    }

    //change attr
    if (type == "asc"){
        document.getElementById('sort-nodes-name').setAttribute("sort", "desc");
    }else{
        document.getElementById('sort-nodes-name').setAttribute("sort", "asc");
    }
}

function sortTableIP() {
    var type = document.getElementById('sort-nodes-ip').getAttribute("sort");
    var table, rows, switching, i, x, y, shouldSwitch;
    table = document.getElementById("node-table");
    switching = true;
    while (switching) {
		switching = false;
		rows = table.rows;
		for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false;
			x = rows[i].getAttribute("ip").split('.');
            y = rows[i + 1].getAttribute("ip").split('.');
            if (type == "asc"){
                if (parseInt(x[0]) > parseInt(y[0])) {
                    shouldSwitch = true;
                    break;
                }else if ((parseInt(x[0]) == parseInt(y[0])) && (parseInt(x[1]) > parseInt(y[1]))){
                    shouldSwitch = true;
                    break;
                }else if ((parseInt(x[0]) == parseInt(y[0])) && (parseInt(x[1]) == parseInt(y[1])) && (parseInt(x[2]) > parseInt(y[2]))){
                    shouldSwitch = true;
                    break;
                }else if ((parseInt(x[0]) == parseInt(y[0])) && (parseInt(x[1]) == parseInt(y[1])) && (parseInt(x[2]) == parseInt(y[2])) && (parseInt(x[3]) > parseInt(y[3]))){
                    shouldSwitch = true;
                    break;
                }
            }else{
                if (x[0] < y[0]) {
                    shouldSwitch = true;
                    break;
                }else if ((x[0] == y[0]) && (x[1] < y[1])){
                    shouldSwitch = true;
                    break;
                }else if ((x[0] == y[0]) && (x[1] == y[1]) && (x[2] < y[2])){
                    shouldSwitch = true;
                    break;
                }else if ((x[0] == y[0]) && (x[1] == y[1]) && (x[2] == y[2]) && (x[3] < y[3])){
                    shouldSwitch = true;
                    break;
                }
            }
		}
		if (shouldSwitch) {
			rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
			switching = true;
		}
    }

    //change attr
    if (type == "asc"){
        document.getElementById('sort-nodes-ip').setAttribute("sort", "desc");
    }else{
        document.getElementById('sort-nodes-ip').setAttribute("sort", "asc");
    }
}