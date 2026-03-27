define('3rdparty.bundle', [], function () {
    console.log("#### 3rdparty.bundle.js loaded");

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

        // interactionApi.subscribe({
        //     callStarted: async (interactionSubscriptionEvent) => {
        //         await handleCallStarted(interactionSubscriptionEvent);
        //     }
        // });

        interactionApi.subscribe({
            callAccepted: params => {
                interactionApi.getCav({interactionId: params.callData.interactionId, interactionSubType: params.callData.interactionSubType})
                .then(cavList => {
                    // console.debug('#### Interaction API got cavList: ' + JSON.stringify(cavList));

                    // Update the following values as necessary
                    const cavGroup = "Custom";                  // Call Variable Group
                    const cavName = "voice_ai_duration";        // Call Variable Name
                    const durationThreshold = 60;               // Duration threshold required to launch screen pop (in seconds)
                    const connectorId = '300000000000043';      // ID of the connector you'd like launched

                    const voice_ai_duration = cavList.find(
                        x => x.group === "Custom" && x.name === "voice_ai_duration"
                    );
                    console.debug(`#### VoiceIA duration: ${voice_ai_duration}`);
                    const duration = voice_ai_duration?.value * 1;
                    console.debug(`#### ${cavGroup}.${cavName}: ${duration}`);

                    if (duration > durationThreshold) {
                        console.debug(`#### Duration is greater threshold`);
                        // Launch connector
                        const parentDoc = window.parent.document;
                        const connectorLink = parentDoc.getElementById(connectorId);
                        console.debug(connectorLink);
                        connectorLink.click();
                    }

                });
            }
        });
    });
});
