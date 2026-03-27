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
            // callAccepted: async (interactionSubscriptionEvent) => {
            //     console.log("#### interactionApi.subscribe -> callAccepted");
            //     console.log("#### Call Accepted", interactionSubscriptionEvent);
            //     // // Add your custom logic here
            //     await handleCallAccepted(interactionSubscriptionEvent);
            // }
            callAccepted: params => {
                interactionApi.getCav({interactionId: params.callData.interactionId, interactionSubType: params.callData.interactionSubType})
                .then(cavList => {
                    let voice_ai_duration = cavList.find(
                        x => x.group === "Custom" && x.name === "voice_ai_duration"
                    );
                    voice_ai_duration = voice_ai_duration?.value;
                    // console.debug('#### Interaction API got cavList: ' + JSON.stringify(cavList));
                    console.debug('#### voice_ai_duration: ' + voice_ai_duration);
                    alert(voice_ai_duration);
                });
            }
        });
    });
});
