export async function sendWebhook(_fineParse, webhookUrl) {


    function isDeliveredEmail(_fineParse){
        if (_fineParse?.hasDeliveredEmail) {
            return true
        }
        return false
    }

    function hexToDecimal(hex) {
        return parseInt(hex.replace("#",""), 16)
    }

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
          name: "New Email Detected",
        },
        // image: {
        //     url: "https://image.goat.com/750/attachments/product_template_pictures/images/035/924/748/original/616017_00.png.png"
        // 
        
        title: _fineParse.title,
        description: `Style ID: ${_fineParse.styleID}\nOrder: ########-####${_fineParse.orderNumber.toString().substring(_fineParse.orderNumber.length - 5)}\nTotal: ${_fineParse.totalPayment}\nEmail Type: ${isDeliveredEmail(_fineParse) ? "🎉 Delivered" : "👍 Confirmed"}`,
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


