define('3rdparty.bundle', [], function () {
    console.log("#### 3rdparty.bundle.js loaded");

    let _five9Metadata = null;
    let _activeCall = null;

    async function getFive9MetaData() {
        try {
            console.info("Script: >>> getFive9MetaData");

            var response = await fetch("https://app.five9.com/appsvcs/rs/svc/auth/metadata", {
                cache: "no-cache",
                credentials: "include", // include, same-origin, *omit
                mode: "cors", // no-cors, cors, *same-origin.
            })

            console.info(`Script: getFive9MetaData returned status ${response.status}`);

            let f9md;
            if (response.status === 200) {
                f9md = await response.json();
            } else {
                throw `getFive9MetaData returned status ${response.status}`;
            }
            _five9Metadata = f9md;

        } catch (err) {
            console.error("Script: getFive9MetaData failed: " + err);
            throw err;
        }

    }

    async function getCallData() {
        console.info("Script: >>> getCallData");
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
            callAccepted: (interactionSubscriptionEvent) => {
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
