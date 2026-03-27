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

document.addEventListener('DOMContentLoaded', function () {

    const checkInterval = setInterval(function () {
        const transferButton = window.parent.document.querySelector('#CallControlsItem-transfer-button');
        if (transferButton) {
            transferButton.style.display = 'none';
        }
    }, 5000);

    async function getCurrentCalls() {
        const endpointURL = `${base_agents_api_url}/agents/${f9UserId}/interactions/calls`;
        console.log(endpointURL);
        const response = await fetch(endpointURL, { credentials: 'include' });
        const currentCalls = await response.json();
        console.log("Returned calls:");
        console.log(currentCalls);
        return currentCalls;
    }

    async function getDomainCallVariables() {
        const endpointURL = `${base_agents_api_url}/orgs/${f9OrgId}/call_variables`;
        console.log(endpointURL);
        const response = await fetch(endpointURL, { credentials: 'include' });
        const res = await response.json();
        console.log("Domain CAVs:");
        console.log(res);
        const cavs = {};
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
    }

    async function updateCallVariableValues(f9CurrentCallId, cavsToUpdate) {
        const endpointURL = `${base_agents_api_url}/agents/${f9UserId}/interactions/calls/${f9CurrentCallId}/variables_2`;
        console.log(endpointURL);
        const response = await fetch(endpointURL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cavsToUpdate),
            credentials: 'include'
        });
        const updatedCavs = await response.json();
        console.log("CAVs Updated Response");
        console.log(updatedCavs);
        return updatedCavs;
    }

    async function initialize() {
        try {
            const response = await fetch(freedomMetadataURL, { credentials: 'include' });
            const data = await response.json();
            f9OrgId = data.orgId;
            f9UserId = data.userId;
            base_api_url = "https://" + data.metadata.dataCenters[0].apiUrls[0].host + ":" + data.metadata.dataCenters[0].apiUrls[0].port;
            base_agents_api_url = base_api_url + contextPaths.agent_rest;
            base_supervisor_api_url = base_api_url + contextPaths.sup_rest;
            console.log(("user ID: " + data.userId));
            console.log("Base Supervisor API URL: " + base_supervisor_api_url);
            console.log("Base Agent API URL: " + base_agents_api_url);
            console.log(JSON.stringify(data));
            document.querySelector(".metadata").innerHTML = JSON.stringify(data, undefined, 2);
            return data;
        } catch (error) {
            console.log("You must be logged into Five9 in another browser tab for this to work");
            throw error;
        }
    }

    document.getElementById('transferButton').addEventListener('click', async function () {
        try {
            await initialize();
            const calls = await getCurrentCalls();
            const f9CurrentCallId = calls[0].id;
            const domainCavs = await getDomainCallVariables();
            console.log("Domain CAVs:");
            console.log(domainCavs);
            const cavsToUpdate = {};
            cavsToUpdate[domainCavs.Survey.PlaySurvey.id] = false;
            console.log("CAVs to Update:");
            console.log(cavsToUpdate);
            const updateCavsResponse = await updateCallVariableValues(f9CurrentCallId, cavsToUpdate);
            console.log("CAVs Updated Response");
            console.log(updateCavsResponse);
            const transferButton = window.parent.document.querySelector('#CallControlsItem-transfer-button');
            if (transferButton) {
                transferButton.click();
            }
        } catch (error) {
            console.error(error);
        }
    });
});

