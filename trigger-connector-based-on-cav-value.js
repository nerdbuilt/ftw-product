document.addEventListener('DOMContentLoaded', function() {
    // Update the following values as necessary
    const connectorId = '300000000000043';      // ID of the connector you'd like launched
    const durationInputFieldId = 'duration';    // This is the "id" of the hidden input field containing the CAV's value
    const durationThreshold = 60;               // Duration threshold required to launch screen pop (in seconds)

    // const duration = document.getElementById(durationInputFieldId).value * 1;
    const duration = @Custom.voice_ai_duration@ * 1;
    console.log(`***** VoiceAI duration: ${duration}`);

    if (duration > durationThreshold) {
        // Launch connector
        const parentDoc = window.parent.document;
        const connectorLink = parentDoc.getElementById(connectorId);
        connectorLink.click();
    }
});
