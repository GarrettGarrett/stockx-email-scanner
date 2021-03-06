export async function sendWebhookArray(_fineParseArray, webhookUrl) { //handles stockX and Goat
    // stockx = title, style id, order number, total, email type
    // GOAT = title, style id, order number, total, email type

    function removeSizeFromTitle(longUrl){
        let start = longUrl.indexOf("(") - 1
        let end = longUrl.indexOf(")") - 1
        let startString = longUrl.slice(0, start)
        let endString = longUrl.slice(end + 2, longUrl.length)
        let combined = startString + endString
        return combined
    }
   

    function returnEmailType(_fineParse){
        let result = ''
        if (_fineParse?.hasDeliveredEmail) {
            result = "🎉 Delivered"
        } else if  (_fineParse?.isRefund ){
            result = "Refund Issued"
        } else if (_fineParse?.hasConfirmedEmail ) {
            result = "👍 Confirmed"
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
    _fineParseArray.forEach(_fineParse => {
        let adding = `\n\n\nTitle: ${_fineParse.title}\nStyle ID: ${_fineParse.styleID}\nOrder: ########-####${_fineParse.orderNumber.toString().substring(_fineParse.orderNumber.length - 5)}\nTotal: ${_fineParse.totalPayment}\nEmail Type: ${returnEmailType(_fineParse)}`
        let descriptionEdited = description.concat(adding);
        description = descriptionEdited
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

    var myEmbed = {
        author: {
          name: "New StockX Emails Detected",
        },
        // image: {
        //     url: "https://image.goat.com/750/attachments/product_template_pictures/images/035/924/748/original/616017_00.png.png"
        // 
        
        title: `${_fineParseArray.length} New Emails`,
        description: description,
        color: hexToDecimal("#5B9D66"),
        timestamp: new Date()
    }

      var raw = JSON.stringify({
        username: "StockX Importer",
        embeds: [ myEmbed ],
        avatar_url: "https://i.imgur.com/fYrDHMk.png",
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


