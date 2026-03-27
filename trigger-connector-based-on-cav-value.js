console.log('#### HELLO ####');

define('3rdparty.bundle', [], function () {
    console.log("#### 3rdparty.bundle.js loaded");

    let _five9Metadata = null;
    let _activeCall = null;

    
    let freedomMetadataURL = "https://app.five9.com/appsvcs/rs/svc/auth/metadata";
    let contextPaths = {
        "agent_rest": "/appsvcs/rs/svc",
        "agent_str": "/strsvcs/rs/svc",
        "sup_rest": "/supsvcs/rs/svc"
    };
    let base_api_url;
    let base_agents_api_url;
    let f9OrgId;
    let f9UserId;

    async function initialize() {
        try {
            const response = await fetch(freedomMetadataURL, { credentials: 'include' });
            const data = await response.json();
            f9OrgId = data.orgId;
            f9UserId = data.userId;
            base_api_url = "https://" + data.metadata.dataCenters[0].apiUrls[0].host + ":" + data.metadata.dataCenters[0].apiUrls[0].port;
            base_agents_api_url = base_api_url + contextPaths.agent_rest;
            base_supervisor_api_url = base_api_url + contextPaths.sup_rest;
            console.log('####', "user ID: " + data.userId);
            console.log('####', "Base Supervisor API URL: " + base_supervisor_api_url);
            console.log('####', "Base Agent API URL: " + base_agents_api_url);
            console.log('####', JSON.stringify(data));
            document.querySelector(".metadata").innerHTML = JSON.stringify(data, undefined, 2);
            return data;
        } catch (error) {
            console.log('####', "You must be logged into Five9 in another browser tab for this to work");
            throw error;
        }
    }


    async function getDomainCallVariables() {

        console.log('####', "getDomainCallVariables()");
        const endpointURL = `${base_agents_api_url}/orgs/${f9OrgId}/call_variables`;
        console.log('####', endpointURL);
        const response = await fetch(endpointURL, { credentials: 'include' });
        const res = await response.json();
        console.log('####', "Domain CAVs:");
        console.log('####', res);
        const cavs = {};
        res.forEach((cav) => {
            cavs[cav.group] = cavs[cav.group] || {};
            cavs[cav.group][cav.name] = cavs[cav.group][cav.name] || {};
            cavs[cav.group][cav.name]["id"] = cav.id;
            cavs[cav.group][cav.name]["type"] = cav.type;
            cavs[cav.group][cav.name]["restrictions"] = cav.restrictions;
        });
        console.log('####', "Domain CAVs after transformation:");
        console.log('####', cavs);
        return cavs;
    }

    async function getFive9MetaData() {
        try {
            console.info("#### Script: >>> getFive9MetaData");

            var response = await fetch("https://app.five9.com/appsvcs/rs/svc/auth/metadata", {
                cache: "no-cache",
                credentials: "include", // include, same-origin, *omit
                mode: "cors", // no-cors, cors, *same-origin.
            })

            console.info(`#### Script: getFive9MetaData returned status ${response.status}`);

            let f9md;
            if (response.status === 200) {
                f9md = await response.json();
            } else {
                throw `getFive9MetaData returned status ${response.status}`;
            }
            _five9Metadata = f9md;

        } catch (err) {
            console.error("#### Script: getFive9MetaData failed: " + err);
            throw err;
        }

    }

    async function getCallData() {
        console.info("#### Script: >>> getCallData");
        try {

            let response = await fetch(
                "https://" +
                _five9Metadata.metadata.dataCenters[0].apiUrls[0].host +
                "/appsvcs/rs/svc/agents/" +
                _five9Metadata.userId +
                "/interactions/calls",
                {
                    method: "GET",
                    cache: "no-cache",
                    credentials: "include", // include, same-origin, *omit
                    mode: "cors", // no-cors, cors, *same-origin.
                })

            let calls = await response.json();

            console.info(`Script: Got Calls`);
            console.info(calls);

            _activeCall = null;

            if (Array.isArray(calls) && calls.length > 0) {
                _activeCall = calls[0];
            }

            if (_activeCall) {
                console.info(`Script: Found active call`);
                console.dir(_activeCall);
            } else {
                throw "Script: No active call found."
            }

        } catch (err) {
            console.error("Script: getCallData failed: " + err);
            throw err;
        }
    }

    async function handleCallStarted(interactionSubscriptionEvent) {
        try {
            console.log("#### Call Started", interactionSubscriptionEvent);

            await getFive9MetaData();
            await getCallData();

            console.log("#### Finished post-callStarted API flow");
            console.log("#### _five9Metadata:", _five9Metadata);
            console.log("#### _activeCall:", _activeCall);

            // Put your next custom logic here
            // const domainCavs = await getDomainCallVariables();
            // console.log('####', "Domain CAVs: ");
            // console.log('####', domainCavs);
            await initialize();
            // const calls = await getCurrentCalls();
            // const f9CurrentCallId = calls[0].id;
            const domainCavs = await getDomainCallVariables();
            console.log('####', "Domain CAVs:");
            console.log('####', domainCavs);

        } catch (err) {
            console.error("#### handleCallStarted failed:", err);
        }
    }

    function loadSdkInIframe(url, callback) {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        iframe.onload = () => {
            console.log("#### Iframe loaded, injecting script: " + url);
            loadScriptInIframe(iframe, url)
                .then(Five9Sdk => callback(Five9Sdk))
                .catch(error => console.error("#### Error loading Five9 SDK:", error));
        };

        function loadScriptInIframe(iframe, url) {
            return new Promise((resolve, reject) => {
                console.log("#### Loading SDK Script inside iframe: " + url);
                const script = iframe.contentDocument.createElement('script');
                script.type = 'text/javascript';
                script.src = url;
                script.async = true;

                script.onload = () => resolve(iframe.contentWindow.Five9);
                script.onerror = () => reject(new Error("#### Failed to load script: " + url));

                iframe.contentDocument.head.appendChild(script);
            });
        }

        iframe.src = 'about:blank';
    }

    loadSdkInIframe('https://cdn.prod.us.five9.net/stable/crm-sdk-lib/five9.crm.sdk.js', function (Five9Sdk) {
        console.log("#### #### SDK loaded");

        if (!Five9Sdk || !Five9Sdk.CrmSdk) {
            console.error("#### SDK load failed or CrmSdk is undefined");
            return;
        }

        const interactionApi = Five9Sdk.CrmSdk.interactionApi();

        interactionApi.subscribe({
            callStarted: async (interactionSubscriptionEvent) => {
                await handleCallStarted(interactionSubscriptionEvent);

            }
        });
        interactionApi.subscribe({
            callAccepted: async (interactionSubscriptionEvent) => {
                console.log("#### interactionApi.subscribe -> callAccepted");
                console.log("#### Call Accepted", interactionSubscriptionEvent);
                // Add your custom logic here
            }
        });
        interactionApi.subscribe({
            callRejected: (interactionSubscriptionEvent) => {
                console.log("#### Call Rejected", interactionSubscriptionEvent);
                // Add your custom logic here
            }
        });
        interactionApi.subscribe({
            callEnded: (interactionSubscriptionEvent) => {
                console.log("#### Call Ended", interactionSubscriptionEvent);
                // Add your custom logic here
            }
        });
        interactionApi.subscribe({
            callFinished: (interactionSubscriptionEvent) => {
                console.log("#### Call Finished", interactionSubscriptionEvent);
                // Add your custom logic here
            }
        });
    });
});
