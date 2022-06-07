export async function sendWebhookArrayGoat(_fineParseArray, webhookUrl) { //handles stockX and Goat
    // stockx = title, style id, order number, total, email type
    // GOAT = title, style id, order number, total, email type

    function returnEmailType(_fineParse){
        let result = ''
        if (_fineParse?.hasStorageEmail) {
            result = "Your sneakers are being stored"
        } else if  (_fineParse?.hasConfirmedEmail ){
            result = "Confirmed"
        // } else if (_fineParse?.hasConfirmedEmail ) {
        //     result = "👍 Confirmed"
        }
        return result
    }

    function hexToDecimal(hex) {
        return parseInt(hex.replace("#",""), 16)
    }

    function isDeliveredEmail(_fineParse){
        if (_fineParse?.hasDeliveredEmail) {
            return true
        }
        return false
    }

    let description = ""

    // storage emails only contain 
    let allEmbeds = []
    _fineParseArray.forEach(_fineParse => {
        var myEmbed = {
            author: {
              name: "New GOAT Email Detected",
            },
            thumbnail: { url:  _fineParse.image},
            title: _fineParse.title,
            description: _fineParse?.subTotal ? 
                `Style ID: ${_fineParse.styleID}\nOrder: #####${_fineParse.orderNumber.toString().substring(_fineParse.orderNumber.length - 4)}\nSub Total: ${_fineParse.subTotal}\nEmail Type: ${returnEmailType(_fineParse)}` 
                : `Style ID: ${_fineParse.styleID}\nOrder: #####${_fineParse.orderNumber.toString().substring(_fineParse.orderNumber.length - 4)}\nEmail Type: ${returnEmailType(_fineParse)}`,
            color: hexToDecimal("#5C65ED"),
            timestamp: new Date()
        }

        allEmbeds.push(myEmbed)
      
    })   

    console.log("🚀 ~ file: DiscordArray.js ~ line 8 ~ sendWebhook ~ description", description)


    var myHeaders = new Headers();
    myHeaders.append("authority", "discord.com");
    myHeaders.append("accept", "*/*");
    myHeaders.append("accept-language", "en-US,en;q=0.9");
    myHeaders.append("content-type", "application/json");
    myHeaders.append("origin", "https://dev.to");
    myHeaders.append("referer", "https://dev.to/");
    myHeaders.append("sec-ch-ua", "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"100\", \"Google Chrome\";v=\"100\"");
    myHeaders.append("sec-ch-ua-mobile", "?0");
    myHeaders.append("sec-ch-ua-platform", "\"macOS\"");
    myHeaders.append("sec-fetch-dest", "empty");
    myHeaders.append("sec-fetch-mode", "cors");
    myHeaders.append("sec-fetch-site", "cross-site");

    

      var raw = JSON.stringify({
        username: "GOAT Importer",
        embeds: allEmbeds,
        avatar_url: "https://i.imgur.com/TsctGbC.jpg",
    })
    

    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    var messageDiscord =  await fetch("https://discord.com/api/webhooks/" + webhookUrl, requestOptions)

    
        return messageDiscord.status
}


