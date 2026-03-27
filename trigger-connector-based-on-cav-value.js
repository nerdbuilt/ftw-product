console.log('#### HELLO ####');

let freedomMetadataURL = "https://app.five9.com/appsvcs/rs/svc/auth/metadata";
let contextPaths = {
    "agent_rest": "/appsvcs/rs/svc",
    "agent_str": "/strsvcs/rs/svc",
    "sup_rest": "/supsvcs/rs/svc"
};
let base_api_url;
let base_agents_api_url;
let base_supervisor_api_url;
let f9OrgId;
let f9UserId;

$(document).ready(function () {
    $.ajaxSetup({
        crossDomain: true,
        xhrFields: {
            withCredentials: true
        }
    });

    var checkInterval = setInterval(function () {
        window.parent.$('#CallControlsItem-transfer-button').hide();
    }, 5000);

    function getCurrentCalls() {
        let endpointURL = `${base_agents_api_url}/agents/${f9UserId}/interactions/calls`;
        console.log(endpointURL);

        return $.get(endpointURL).then(function (currentCalls) {
            console.log("Returned calls:");
            console.log(currentCalls);
            return currentCalls;
        });
    }

    function getDomainCallVariables() {
        let endpointURL = `${base_agents_api_url}/orgs/${f9OrgId}/call_variables`;
        console.log(endpointURL);

        return $.get(endpointURL).then(function (res) {
            console.log("Domain CAVs:");
            console.log(res);
            let cavs = {};
            res.forEach((cav) => {
                cavs[cav.group] = cavs[cav.group] || {};
                cavs[cav.group][cav.name] = cavs[cav.group][cav.name] || {};
                cavs[cav.group][cav.name]["id"] = cav.id;
                cavs[cav.group][cav.name]["type"] = cav.type;
                cavs[cav.group][cav.name]["restrictions"] = cav.restrictions;
            });
            console.log("Domain CAVs after transformation:");
            console.log(cavs);
            return cavs;
        });
    }

    function updateCallVariableValues(f9CurrentCallId, cavsToUpdate) {
        let endpointURL = `${base_agents_api_url}/agents/${f9UserId}/interactions/calls/${f9CurrentCallId}/variables_2`;
        console.log(endpointURL);

        return $.ajax({
            url: endpointURL,
            type: 'PUT',
            data: JSON.stringify(cavsToUpdate),
            contentType: "application/json"
        }).then(function (updatedCavs) {
            console.log("CAVs Updated Response");
            console.log(updatedCavs);
            return updatedCavs;
        });
    }

    function initialize() {
        return $.get(freedomMetadataURL).then(function (data) {
            f9OrgId = data.orgId;
            f9UserId = data.userId;

            base_api_url = "https://" + data.metadata.dataCenters[0].apiUrls[0].host + ":" + data.metadata.dataCenters[0].apiUrls[0].port;
            base_agents_api_url = base_api_url + contextPaths.agent_rest;
            base_supervisor_api_url = base_api_url + contextPaths.sup_rest;

            console.log(("user ID: " + data.userId));
            console.log("Base Supervisor API URL: " + base_supervisor_api_url);
            console.log("Base Agent API URL: " + base_agents_api_url);
            console.log(JSON.stringify(data));

            $(".metadata").html(JSON.stringify(data, undefined, 2));

            return data;
        }).fail(function () {
            console.log("You must be logged into Five9 in another browser tab for this to work");
        });
    }

    $('#transferButton').click(function () {
        initialize().then(function () {
            return getCurrentCalls();
        }).then(function (calls) {
            let f9CurrentCallId = calls[0].id;
            return getDomainCallVariables().then(function (domainCavs) {
                console.log("Domain CAVs:");
                console.log(domainCavs);
                let cavsToUpdate = {}
                cavsToUpdate[domainCavs.Survey.PlaySurvey.id] = false;

                console.log("CAVs to Update:");
                console.log(cavsToUpdate);
                return updateCallVariableValues(f9CurrentCallId, cavsToUpdate);
            });
        }).then(function (updateCavsResponse) {
            console.log("CAVs Updated Response");
            console.log(updateCavsResponse);
        }).then(function (res){
            window.parent.$('#CallControlsItem-transfer-button').click();
        }).catch(function (error) {
            console.error(error);
        });
    });
});
